-- =====================================================================
--  MULTIPLICADOR y REDONDEADOR · Esquema de base de datos para el modo docente
--  Los dos juegos comparten el mismo proyecto de Supabase: cuenta docente, clases
--  y alumnos son comunes; las sesiones y partidas llevan la columna "game".
--  Ejecuta este script completo en Supabase → SQL Editor → New query → Run
--  (se puede ejecutar varias veces sin problemas y no borra datos)
-- =====================================================================

-- ---------- TABLAS ----------

-- Clases (grupos) de cada docente. Ej: "5º A"
create table if not exists public.classes (
    id          uuid primary key default gen_random_uuid(),
    teacher_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
    name        text not null check (char_length(name) between 1 and 60),
    created_at  timestamptz not null default now()
);

-- Alumnos. La foto se guarda como miniatura JPEG (data URL) protegida por RLS.
create table if not exists public.students (
    id          uuid primary key default gen_random_uuid(),
    teacher_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
    class_id    uuid not null references public.classes(id) on delete cascade,
    first_name  text not null check (char_length(first_name) between 1 and 80),
    last_name   text not null default '' check (char_length(last_name) <= 80),
    photo       text check (photo is null or (photo like 'data:image/%' and char_length(photo) < 400000)),
    position    integer not null default 0,
    created_at  timestamptz not null default now()
);

-- Sesiones de juego (una clase / un día de práctica de un juego)
create table if not exists public.sessions (
    id          uuid primary key default gen_random_uuid(),
    game        text not null default 'multiplicador',
    teacher_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
    class_id    uuid not null references public.classes(id) on delete cascade,
    started_at  timestamptz not null default now()
);

-- Partidas jugadas
--   game     : 'multiplicador' o 'redondeo'
--   mode     : 'chrono' (contrarreloj), 'sudden_death' (muerte súbita), 'free' (práctica libre)
--   setting  : chrono → segundos totales; sudden_death → segundos por pregunta (NULL = infinito); free → NULL
--   score    : aciertos
create table if not exists public.games (
    id               uuid primary key default gen_random_uuid(),
    game             text not null default 'multiplicador',
    teacher_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
    class_id         uuid not null references public.classes(id) on delete cascade,
    student_id       uuid not null references public.students(id) on delete cascade,
    session_id       uuid references public.sessions(id) on delete set null,
    mode             text not null check (mode in ('chrono', 'sudden_death', 'free')),
    setting          integer,
    score            integer not null check (score >= 0),
    errors           integer not null default 0 check (errors >= 0),
    duration_seconds numeric(8,2),
    played_at        timestamptz not null default now()
);

-- Columna "game" en bases de datos creadas antes de compartirse entre juegos
-- (las partidas y sesiones que ya existían quedan como del Multiplicador)
alter table public.sessions add column if not exists game text not null default 'multiplicador';
alter table public.games    add column if not exists game text not null default 'multiplicador';

-- ---------- ÍNDICES ----------
drop index if exists public.sessions_class_idx;
drop index if exists public.games_class_mode_idx;
drop index if exists public.games_student_idx;
drop index if exists public.games_played_idx;
create index if not exists classes_teacher_idx       on public.classes (teacher_id);
create index if not exists students_class_idx        on public.students (class_id, position);
create index if not exists sessions_class_game_idx   on public.sessions (class_id, game, started_at desc);
create index if not exists games_class_game_mode_idx on public.games (class_id, game, mode, setting);
create index if not exists games_session_idx         on public.games (session_id);
create index if not exists games_student_game_idx    on public.games (student_id, game, mode, setting, score desc);
create index if not exists games_class_played_idx    on public.games (class_id, game, played_at desc);

-- ---------- SEGURIDAD (Row Level Security) ----------
-- Cada docente solo puede ver y modificar sus propios datos.
alter table public.classes  enable row level security;
alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.games    enable row level security;

drop policy if exists classes_owner  on public.classes;
drop policy if exists students_owner on public.students;
drop policy if exists sessions_owner on public.sessions;
drop policy if exists games_owner    on public.games;

create policy classes_owner on public.classes
    for all to authenticated
    using (teacher_id = (select auth.uid()))
    with check (teacher_id = (select auth.uid()));

create policy students_owner on public.students
    for all to authenticated
    using (teacher_id = (select auth.uid()))
    with check (
        teacher_id = (select auth.uid())
        and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
    );

create policy sessions_owner on public.sessions
    for all to authenticated
    using (teacher_id = (select auth.uid()))
    with check (
        teacher_id = (select auth.uid())
        and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
    );

create policy games_owner on public.games
    for all to authenticated
    using (teacher_id = (select auth.uid()))
    with check (
        teacher_id = (select auth.uid())
        and exists (select 1 from public.students s where s.id = student_id and s.teacher_id = (select auth.uid()))
    );

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.classes, public.students, public.sessions, public.games to authenticated;

-- ---------- RANKING ----------
-- Mejor puntuación de cada alumno de una clase para un juego y un modo.
--   p_any_setting = true  → mezcla todas las configuraciones de tiempo
--   p_any_setting = false → solo la configuración p_setting (NULL = infinito)
--   p_session_id  = NULL  → ranking total de la clase; si no, solo esa sesión
--   p_game        = juego ('multiplicador' por defecto, para versiones antiguas del juego)
drop function if exists public.class_ranking(uuid, text, integer, boolean, uuid);
create or replace function public.class_ranking(
    p_class_id    uuid,
    p_mode        text,
    p_setting     integer default null,
    p_any_setting boolean default true,
    p_session_id  uuid    default null,
    p_game        text    default 'multiplicador'
)
returns table (
    student_id  uuid,
    best_score  integer,
    games_count bigint,
    avg_score   numeric,
    best_at     timestamptz,
    last_played timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
    select g.student_id,
           max(g.score)                                                      as best_score,
           count(*)                                                          as games_count,
           round(avg(g.score), 1)                                            as avg_score,
           (array_agg(g.played_at order by g.score desc, g.played_at asc))[1] as best_at,
           max(g.played_at)                                                  as last_played
    from public.games g
    where g.class_id = p_class_id
      and g.game = p_game
      and g.mode = p_mode
      and (p_session_id is null or g.session_id = p_session_id)
      and (p_any_setting or g.setting is not distinct from p_setting)
    group by g.student_id
    order by 2 desc, 5 asc;
$$;

revoke execute on function public.class_ranking(uuid, text, integer, boolean, uuid, text) from public, anon;
grant execute on function public.class_ranking(uuid, text, integer, boolean, uuid, text) to authenticated;
