// --- CONFIGURACIÓN DEL MODO DOCENTE (SUPABASE) ---
// Es el MISMO proyecto de Supabase que usa el Multiplicador: la cuenta docente,
// las clases y los alumnos se comparten entre los dos juegos.
// La clave "anon" / "publishable" es pública por diseño: la seguridad la garantizan
// las políticas RLS de supabase/schema.sql. NUNCA pongas aquí la clave "service_role" / "secret".
// Si se dejan vacías, el juego funciona igual que siempre, sin modo docente.

const SUPABASE_URL = 'https://kibkldtotocefvtzlgza.supabase.co';        // ej: 'https://abcdefghijk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_LoT60n6ml9hmUrRyiT652Q_vErXXJbY';   // ej: 'eyJhbGciOi...' o 'sb_publishable_...'

// Supabase Auth necesita un email: el nombre de usuario se convierte en
// "usuario@<este dominio>". No se envía ningún correo (hay que desactivar "Confirm email").
// Debe ser el mismo dominio que en el Multiplicador para que las cuentas coincidan.
const AUTH_EMAIL_DOMAIN = 'multiplicador.app';

// Identificador de este juego en la base de datos compartida: separa sus partidas,
// sesiones y rankings de los del resto de juegos.
const GAME_ID = 'redondeo';
