// --- MODO DOCENTE: DATOS (SUPABASE) ---

// Cliente de Supabase (null si no está configurado o no cargó la librería → modo invitado)
const sb = (typeof SUPABASE_URL === 'string' && SUPABASE_URL &&
            typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY && window.supabase)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Estado del modo docente
let teacherUser = null;      // usuario autenticado
let teacherClasses = [];     // [{ id, name, created_at }]
let activeClassId = null;
let classStudents = [];      // alumnos de la clase activa
let activeSession = null;    // { id, started_at }
let currentStudent = null;   // alumno que está jugando

const STUDENT_FIELDS = 'id, class_id, first_name, last_name, photo, position';
const PENDING_KEY = 'rd_pending_games';

function isTeacherMode() { return !!teacherUser; }
function activeClass() { return teacherClasses.find(c => c.id === activeClassId) || null; }

// localStorage protegido (puede fallar en modo privado)
function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function lsSet(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* sin almacenamiento */ } }

function newUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function isSameDay(iso) {
    return new Date(iso).toDateString() === new Date().toDateString();
}

// --- AUTENTICACIÓN (usuario + contraseña) ---

function usernameToEmail(username) {
    const clean = username.trim().toLowerCase();
    if (clean.includes('@')) return clean;
    const slug = clean.normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
    return `${slug}@${AUTH_EMAIL_DOMAIN}`;
}

async function teacherSignUp(username, password) {
    const { data, error } = await sb.auth.signUp({
        email: usernameToEmail(username),
        password,
        options: { data: { username: username.trim() } }
    });
    if (error) throw error;
    if (!data.session) throw new Error('CONFIRM_EMAIL_ENABLED');
    return data.user;
}

async function teacherSignIn(username, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email: usernameToEmail(username), password });
    if (error) throw error;
    return data.user;
}

async function teacherSignOut() {
    await sb.auth.signOut();
}

function teacherDisplayName() {
    if (!teacherUser) return '';
    return (teacherUser.user_metadata && teacherUser.user_metadata.username) || teacherUser.email.split('@')[0];
}

function translateAuthError(error) {
    const msg = (error && error.message) || String(error);
    if (msg === 'CONFIRM_EMAIL_ENABLED') return 'Cuenta creada, pero Supabase exige confirmar el email. Desactiva "Confirm email" en Authentication → Sign In / Providers → Email y vuelve a intentarlo.';
    if (/invalid login credentials/i.test(msg)) return 'Usuario o contraseña incorrectos.';
    if (/already registered|already exists/i.test(msg)) return 'Ese nombre de usuario ya existe.';
    if (/password/i.test(msg) && /(at least|weak|short)/i.test(msg)) return 'La contraseña es demasiado débil (mínimo 6 caracteres).';
    if (/email not confirmed/i.test(msg)) return 'Cuenta sin confirmar. Desactiva "Confirm email" en Supabase (ver instrucciones).';
    if (/email/i.test(msg) && /invalid/i.test(msg)) return 'Nombre de usuario no válido. Usa letras y números.';
    if (/rate limit|too many/i.test(msg)) return 'Demasiados intentos. Espera un momento.';
    if (/fetch|network/i.test(msg)) return 'No hay conexión con el servidor.';
    return msg;
}

// --- CLASES ---

async function fetchClasses() {
    const { data, error } = await sb.from('classes').select('id, name, created_at').order('created_at');
    if (error) throw error;
    teacherClasses = data || [];
    return teacherClasses;
}

async function createClass(name) {
    const { data, error } = await sb.from('classes').insert({ name }).select('id, name, created_at').single();
    if (error) throw error;
    teacherClasses.push(data);
    return data;
}

async function renameClass(id, name) {
    const { error } = await sb.from('classes').update({ name }).eq('id', id);
    if (error) throw error;
    const cls = teacherClasses.find(c => c.id === id);
    if (cls) cls.name = name;
}

async function deleteClass(id) {
    const { error } = await sb.from('classes').delete().eq('id', id);
    if (error) throw error;
    teacherClasses = teacherClasses.filter(c => c.id !== id);
}

async function setActiveClass(classId) {
    activeClassId = classId || null;
    classStudents = [];
    activeSession = null;
    if (!activeClassId) return;
    lsSet(`rd_active_class_${teacherUser.id}`, activeClassId);
    classStudents = await fetchStudents(activeClassId);
    await loadStoredSession();
}

// --- ALUMNOS ---

async function fetchStudents(classId) {
    const { data, error } = await sb.from('students').select(STUDENT_FIELDS)
        .eq('class_id', classId).order('position').order('last_name');
    if (error) throw error;
    return data || [];
}

async function insertStudents(rows) {
    if (!rows.length) return [];
    const { data, error } = await sb.from('students').insert(rows).select(STUDENT_FIELDS);
    if (error) throw error;
    return data || [];
}

async function updateStudent(id, fields) {
    const { data, error } = await sb.from('students').update(fields).eq('id', id).select(STUDENT_FIELDS).single();
    if (error) throw error;
    return data;
}

async function deleteStudent(id) {
    const { error } = await sb.from('students').delete().eq('id', id);
    if (error) throw error;
}

// --- SESIONES ---
// Una sesión agrupa las partidas de un día de clase. Se crea automáticamente con la
// primera partida del día y el docente puede empezar una nueva cuando quiera.

async function loadStoredSession() {
    activeSession = null;
    const storedId = lsGet(`rd_session_${activeClassId}`);
    if (!storedId) return null;
    const { data } = await sb.from('sessions').select('id, started_at').eq('id', storedId).eq('game', GAME_ID).maybeSingle();
    if (data && isSameDay(data.started_at)) activeSession = data;
    return activeSession;
}

async function ensureActiveSession(forceNew = false) {
    if (!forceNew && activeSession && isSameDay(activeSession.started_at)) return activeSession;
    const { data, error } = await sb.from('sessions').insert({ class_id: activeClassId, game: GAME_ID }).select('id, started_at').single();
    if (error) throw error;
    activeSession = data;
    lsSet(`rd_session_${activeClassId}`, data.id);
    return data;
}

async function fetchSessions(classId) {
    const { data, error } = await sb.from('sessions').select('id, started_at')
        .eq('class_id', classId).eq('game', GAME_ID).order('started_at', { ascending: false }).limit(40);
    if (error) throw error;
    return data || [];
}

// --- PARTIDAS ---

async function fetchPersonalBest(game) {
    let query = sb.from('games').select('score').eq('student_id', game.student_id).eq('game', GAME_ID).eq('mode', game.mode);
    query = game.setting == null ? query.is('setting', null) : query.eq('setting', game.setting);
    const { data, error } = await query.order('score', { ascending: false }).limit(1);
    if (error) throw error;
    return data && data.length ? data[0].score : null;
}

// Guarda una partida. Si no hay conexión la deja en cola local y se reintenta más tarde.
async function saveGameResult(game) {
    const result = { saved: false, queued: false, prevBest: null, ranking: [], sessionId: null };
    const classId = activeClassId;
    try {
        await flushPendingGames();
        const session = await ensureActiveSession();
        result.sessionId = session.id;
        result.prevBest = await fetchPersonalBest(game);
        const { error } = await sb.from('games').insert({ ...game, game: GAME_ID, class_id: classId, session_id: session.id });
        if (error) throw error;
        result.saved = true;
        result.ranking = await fetchRanking({ mode: game.mode, setting: game.setting, anySetting: false, sessionId: session.id });
    } catch (err) {
        console.error('Error guardando la partida:', err);
        if (!result.saved) {
            queuePendingGame({ ...game, game: GAME_ID, class_id: classId, session_id: result.sessionId || (activeSession && activeSession.id) || null });
            result.queued = true;
        }
    }
    return result;
}

function readPending() {
    try { return JSON.parse(lsGet(PENDING_KEY) || '[]'); } catch (e) { return []; }
}

function queuePendingGame(row) {
    const list = readPending();
    list.push({ ...row, _teacher: teacherUser.id });
    lsSet(PENDING_KEY, JSON.stringify(list));
}

async function flushPendingGames() {
    const list = readPending();
    if (!list.length || !teacherUser) return 0;
    const keep = [];
    let sent = 0;
    for (const item of list) {
        if (item._teacher !== teacherUser.id) { keep.push(item); continue; }
        const { _teacher, ...row } = item;
        const { error } = await sb.from('games').insert(row);
        if (!error || error.code === '23505') sent++;          // 23505: ya estaba guardada
        else if (error.code !== '23503') keep.push(item);       // 23503: alumno borrado → se descarta
    }
    lsSet(PENDING_KEY, JSON.stringify(keep));
    return sent;
}

async function fetchRanking({ mode, setting = null, anySetting = true, sessionId = null }) {
    const { data, error } = await sb.rpc('class_ranking', {
        p_class_id: activeClassId,
        p_mode: mode,
        p_setting: setting,
        p_any_setting: anySetting,
        p_session_id: sessionId,
        p_game: GAME_ID
    });
    if (error) throw error;
    return data || [];
}

async function fetchHistory({ studentId = null, offset = 0, limit = 50 }) {
    let query = sb.from('games')
        .select('id, student_id, session_id, mode, setting, score, errors, duration_seconds, played_at')
        .eq('class_id', activeClassId)
        .eq('game', GAME_ID);
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query.order('played_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    return data || [];
}

async function deleteGame(id) {
    const { error } = await sb.from('games').delete().eq('id', id);
    if (error) throw error;
}
