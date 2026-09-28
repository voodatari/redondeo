// --- MODO DOCENTE: INTERFAZ ---

const $ = id => document.getElementById(id);

const teacherLoginButton = $('teacher-login-button');
const teacherInfo = $('teacher-info');
const teacherNameEl = $('teacher-name');
const classSelect = $('class-select');
const modeHint = $('mode-hint');
const playerChip = $('current-player-chip');

const authForm = $('auth-form');
const authUsername = $('auth-username');
const authPassword = $('auth-password');
const authPassword2 = $('auth-password2');
const authError = $('auth-error');
const authSubmit = $('auth-submit');

const studentsClassSelect = $('students-class-select');
const studentsGrid = $('students-grid');
const studentsCount = $('students-count');
const importDrop = $('import-drop');
const pdfInput = $('pdf-input');
const importStatus = $('import-status');

const importGrid = $('import-grid');
const importTarget = $('import-target');
const importNewClassName = $('import-new-class-name');
const importConfirmButton = $('import-confirm');

const pickerGrid = $('picker-grid');
const pickerSearch = $('picker-search');

const teacherResultHeader = $('teacher-result-header');
const teacherResultArea = $('teacher-result-area');
const teacherAgainButton = $('teacher-again-button');
const teacherNextButton = $('teacher-next-button');
const teacherRankingsButton = $('teacher-rankings-button');

const rkContent = $('rk-content');

const TEACHER_MODALS = ['student-picker-modal', 'auth-modal', 'students-modal', 'import-preview-modal', 'student-edit-modal', 'rankings-modal'];

// --- UTILIDADES ---

function openModal(id) { $(id).style.display = 'flex'; }
function closeModal(id) { $(id).style.display = 'none'; }
function isModalOpen(id) { return $(id).style.display === 'flex'; }
function closeTeacherOverlays() { TEACHER_MODALS.forEach(closeModal); }

function normalizeText(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

function modeLabel(mode) {
    return { chrono: 'Contrarreloj', sudden_death: 'Muerte Súbita', free: 'Práctica Libre' }[mode] || mode;
}

function settingLabel(mode, setting) {
    if (mode === 'chrono') {
        return setting >= 60 && setting % 60 === 0 ? `${setting / 60} min` : `${setting} s`;
    }
    if (mode === 'sudden_death') return setting == null ? '∞ por pregunta' : `${setting} s por pregunta`;
    return '';
}

function currentGameSetting(mode) {
    if (mode === 'chrono') return initialTime;
    if (mode === 'sudden_death') return suddenDeathTimeLimit === Infinity ? null : suddenDeathTimeLimit;
    return null;
}

function studentShortName(s) {
    if (!s) return 'Alumno';
    const initial = (s.last_name || '').trim().charAt(0).toUpperCase();
    return initial ? `${s.first_name} ${initial}.` : s.first_name;
}

function studentById(id) {
    return classStudents.find(s => s.id === id) || { id, first_name: 'Alumno', last_name: 'eliminado' };
}

function fmtDateTime(iso, withYear = false) {
    const options = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };
    if (withYear) options.year = 'numeric';
    return new Date(iso).toLocaleString('es-ES', options);
}

function fmtSessionLabel(session) {
    const date = new Date(session.started_at);
    const label = date.toLocaleString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const current = activeSession && activeSession.id === session.id ? ' · actual' : '';
    return `Sesión del ${label}${current}`;
}

function loaderHTML(text) {
    return `<div class="loading-line"><div class="loader"></div> ${esc(text)}</div>`;
}

function reportError(prefix, err) {
    console.error(prefix, err);
    const msg = (err && err.message) || String(err);
    const hint = /does not exist|schema cache|class_ranking/i.test(msg) ? ' ¿Has ejecutado supabase/schema.sql?' : '';
    showToast(`${prefix}: ${msg}${hint}`, 'error', 7000);
}

// --- BARRA DOCENTE DEL MENÚ PRINCIPAL ---

function refreshTeacherBar() {
    if (!teacherUser) {
        teacherLoginButton.style.display = '';
        teacherInfo.style.display = 'none';
        modeHint.textContent = 'Selecciona cómo quieres practicar:';
        return;
    }
    teacherLoginButton.style.display = 'none';
    teacherInfo.style.display = 'flex';
    teacherNameEl.textContent = teacherDisplayName();
    renderClassSelects();
    const cls = activeClass();
    modeHint.innerHTML = cls
        ? `Clase <strong>${esc(cls.name)}</strong> · después elegirás qué alumno juega`
        : 'Importa tu clase desde <strong>🧒 Alumnos</strong> para empezar';
}

function renderClassSelects() {
    const options = teacherClasses.length
        ? teacherClasses.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')
        : '<option value="">Sin clases</option>';
    [classSelect, studentsClassSelect].forEach(select => {
        select.innerHTML = options;
        select.value = activeClassId || '';
        select.disabled = !teacherClasses.length;
    });
}

async function changeActiveClass(classId) {
    try {
        await setActiveClass(classId);
    } catch (err) {
        reportError('No se pudo cargar la clase', err);
    }
    refreshTeacherBar();
    if (isModalOpen('students-modal')) renderStudentsGrid();
}

// --- SESIÓN DEL DOCENTE ---

async function initTeacherMode() {
    if (!sb) return;
    try {
        const { data } = await sb.auth.getSession();
        if (data && data.session) await enterTeacherMode(data.session.user);
    } catch (err) {
        console.warn('No se pudo recuperar la sesión docente:', err);
    }
    sb.auth.onAuthStateChange(event => {
        if (event === 'SIGNED_OUT' && teacherUser) exitTeacherMode();
    });
}

async function enterTeacherMode(user) {
    teacherUser = user;
    refreshTeacherBar();
    try {
        await fetchClasses();
        const stored = lsGet(`rd_active_class_${user.id}`);
        const initial = teacherClasses.some(c => c.id === stored) ? stored : (teacherClasses[0] ? teacherClasses[0].id : null);
        await setActiveClass(initial);
        const sent = await flushPendingGames();
        if (sent) showToast(`☁️ ${sent} partida(s) pendiente(s) sincronizada(s)`, 'success');
    } catch (err) {
        reportError('No se pudieron cargar tus datos', err);
    }
    refreshTeacherBar();
    if (!teacherClasses.length) openStudentsPanel();
}

function exitTeacherMode() {
    teacherUser = null;
    teacherClasses = [];
    activeClassId = null;
    classStudents = [];
    activeSession = null;
    currentStudent = null;
    closeTeacherOverlays();
    refreshTeacherBar();
}

teacherLoginButton.addEventListener('click', () => {
    playSound(clickSound);
    if (!sb) {
        showToast('El modo docente no está configurado: rellena config.js con los datos de Supabase.', 'warn', 6000);
        return;
    }
    setAuthTab('login');
    openModal('auth-modal');
    authUsername.focus();
});

$('logout-button').addEventListener('click', async () => {
    playSound(clickSound);
    if (!await confirmDialog('El juego volverá al modo normal.', { title: '¿Cerrar la sesión docente?', icon: '👋', okText: 'Cerrar sesión' })) return;
    try { await teacherSignOut(); } catch (err) { console.warn(err); }
    exitTeacherMode();
    showToast('Sesión cerrada', 'info');
});

classSelect.addEventListener('change', () => changeActiveClass(classSelect.value));
studentsClassSelect.addEventListener('change', () => changeActiveClass(studentsClassSelect.value));

// --- LOGIN / REGISTRO ---

let authTab = 'login';

function setAuthTab(tab) {
    authTab = tab;
    document.querySelectorAll('#auth-tabs button').forEach(b => b.classList.toggle('active', b.dataset.authTab === tab));
    $('auth-password2-field').style.display = tab === 'signup' ? '' : 'none';
    authPassword2.required = tab === 'signup';
    authPassword.autocomplete = tab === 'signup' ? 'new-password' : 'current-password';
    authSubmit.textContent = tab === 'signup' ? 'Crear cuenta' : 'Entrar';
    authError.textContent = '';
}

document.querySelectorAll('#auth-tabs button').forEach(b => b.addEventListener('click', () => setAuthTab(b.dataset.authTab)));

authForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = authUsername.value.trim();
    const password = authPassword.value;
    authError.textContent = '';

    if (username.length < 3 || !/[a-z0-9]/i.test(username)) { authError.textContent = 'El usuario debe tener al menos 3 caracteres.'; return; }
    if (password.length < 6) { authError.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
    if (authTab === 'signup' && password !== authPassword2.value) { authError.textContent = 'Las contraseñas no coinciden.'; return; }

    authSubmit.disabled = true;
    authSubmit.textContent = 'Un momento…';
    try {
        const user = authTab === 'signup' ? await teacherSignUp(username, password) : await teacherSignIn(username, password);
        closeModal('auth-modal');
        authForm.reset();
        await enterTeacherMode(user);
        showToast(`¡Hola, ${teacherDisplayName()}! 👋`, 'success');
    } catch (err) {
        authError.textContent = translateAuthError(err);
        restartAnimation($('auth-panel'), 'shake');
    } finally {
        authSubmit.disabled = false;
        setAuthTab(authTab);
    }
});

// --- GESTIÓN DE ALUMNOS ---

function openStudentsPanel() {
    importStatus.textContent = '';
    renderClassSelects();
    renderStudentsGrid();
    openModal('students-modal');
}

function renderStudentsGrid() {
    const cls = activeClass();
    $('rename-class-button').disabled = !cls;
    $('delete-class-button').disabled = !cls;
    $('add-student-button').style.display = cls ? '' : 'none';

    if (!cls) {
        studentsCount.textContent = '';
        studentsGrid.innerHTML = `<div class="empty-state">📄 Aún no tienes ninguna clase.<br>Importa el PDF de Séneca con las fotos de tus alumnos o crea una clase vacía.</div>`;
        return;
    }
    studentsCount.textContent = `${classStudents.length} alumno(s) en ${cls.name}`;
    if (!classStudents.length) {
        studentsGrid.innerHTML = `<div class="empty-state">Esta clase no tiene alumnos todavía. Importa el PDF o añádelos a mano.</div>`;
        return;
    }
    studentsGrid.innerHTML = classStudents.map((s, i) => `
        <button class="student-card" data-id="${s.id}" style="--i:${i}" title="Editar">
            ${avatarHTML(s, 'avatar-lg')}
            <span class="student-name">${esc(s.first_name)}</span>
            <small class="student-surname">${esc(s.last_name)}</small>
        </button>`).join('');
}

$('open-students-button').addEventListener('click', () => { playSound(clickSound); openStudentsPanel(); });

studentsGrid.addEventListener('click', e => {
    const card = e.target.closest('.student-card');
    if (card) openStudentEditor(classStudents.find(s => s.id === card.dataset.id));
});

$('add-student-button').addEventListener('click', () => openStudentEditor(null));

$('new-class-button').addEventListener('click', async () => {
    const name = (await promptDialog('Nueva clase', '', { icon: '🏫', placeholder: 'p. ej. 5º A', okText: 'Crear clase' }) || '').trim();
    if (!name) return;
    try {
        const cls = await createClass(name.slice(0, 60));
        await changeActiveClass(cls.id);
        showToast(`Clase "${cls.name}" creada`, 'success');
    } catch (err) { reportError('No se pudo crear la clase', err); }
});

$('rename-class-button').addEventListener('click', async () => {
    const cls = activeClass();
    if (!cls) return;
    const name = (await promptDialog('Renombrar la clase', cls.name, { icon: '✏️', okText: 'Guardar' }) || '').trim();
    if (!name || name === cls.name) return;
    try {
        await renameClass(cls.id, name.slice(0, 60));
        refreshTeacherBar();
        renderStudentsGrid();
    } catch (err) { reportError('No se pudo renombrar', err); }
});

$('delete-class-button').addEventListener('click', async () => {
    const cls = activeClass();
    if (!cls) return;
    if (!await confirmDialog('Se eliminarán sus alumnos, sesiones y TODAS sus partidas (también las del Multiplicador y del Redondeador). No se puede deshacer.', { title: `¿Borrar la clase "${cls.name}"?`, icon: '🗑️', okText: 'Borrar clase', danger: true })) return;
    try {
        await deleteClass(cls.id);
        await changeActiveClass(teacherClasses[0] ? teacherClasses[0].id : null);
        showToast('Clase eliminada', 'info');
    } catch (err) { reportError('No se pudo borrar la clase', err); }
});

// --- EDITOR DE ALUMNO ---

let editingStudent = null;
let editingPhoto = null;

function renderEditingPhoto() {
    $('student-edit-photo').innerHTML = avatarHTML({
        first_name: $('student-first-name').value || '?',
        last_name: $('student-last-name').value,
        photo: editingPhoto
    }, 'avatar-xl');
    $('student-photo-remove').style.display = editingPhoto ? '' : 'none';
}

function openStudentEditor(student) {
    editingStudent = student || null;
    editingPhoto = student ? student.photo : null;
    $('student-edit-title').textContent = student ? 'Editar alumno' : 'Añadir alumno';
    $('student-first-name').value = student ? student.first_name : '';
    $('student-last-name').value = student ? student.last_name : '';
    $('student-delete').style.display = student ? '' : 'none';
    renderEditingPhoto();
    openModal('student-edit-modal');
    $('student-first-name').focus();
}

['student-first-name', 'student-last-name'].forEach(id => $(id).addEventListener('input', () => { if (!editingPhoto) renderEditingPhoto(); }));
$('student-edit-photo').addEventListener('click', () => $('student-photo-input').click());
$('student-photo-change').addEventListener('click', () => $('student-photo-input').click());
$('student-photo-remove').addEventListener('click', () => { editingPhoto = null; renderEditingPhoto(); });

$('student-photo-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
        editingPhoto = await fileToThumbnail(file);
        renderEditingPhoto();
    } catch (err) { showToast(err.message, 'error'); }
});

$('student-save').addEventListener('click', async () => {
    const first = $('student-first-name').value.trim();
    const last = $('student-last-name').value.trim();
    if (!first) { showToast('El nombre es obligatorio', 'warn'); return; }
    const button = $('student-save');
    button.disabled = true;
    try {
        if (editingStudent) {
            const updated = await updateStudent(editingStudent.id, { first_name: first, last_name: last, photo: editingPhoto });
            classStudents = classStudents.map(s => s.id === updated.id ? updated : s);
        } else {
            const position = classStudents.reduce((max, s) => Math.max(max, s.position || 0), 0) + 1;
            const [created] = await insertStudents([{ class_id: activeClassId, first_name: first, last_name: last, photo: editingPhoto, position }]);
            classStudents.push(created);
        }
        closeModal('student-edit-modal');
        renderStudentsGrid();
    } catch (err) {
        reportError('No se pudo guardar el alumno', err);
    } finally {
        button.disabled = false;
    }
});

$('student-delete').addEventListener('click', async () => {
    if (!editingStudent) return;
    if (!await confirmDialog('También se borrarán todas sus partidas (en el Multiplicador y en el Redondeador).', { title: `¿Eliminar a ${editingStudent.first_name} ${editingStudent.last_name}?`, icon: '🗑️', okText: 'Eliminar', danger: true })) return;
    try {
        await deleteStudent(editingStudent.id);
        classStudents = classStudents.filter(s => s.id !== editingStudent.id);
        closeModal('student-edit-modal');
        renderStudentsGrid();
    } catch (err) { reportError('No se pudo eliminar', err); }
});

// --- IMPORTACIÓN DESDE PDF ---

let importData = null;

importDrop.addEventListener('click', () => pdfInput.click());
importDrop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pdfInput.click(); } });
pdfInput.addEventListener('change', () => handlePdfFile(pdfInput.files[0]));
['dragenter', 'dragover'].forEach(type => importDrop.addEventListener(type, e => { e.preventDefault(); importDrop.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => importDrop.addEventListener(type, () => importDrop.classList.remove('dragging')));
importDrop.addEventListener('drop', e => {
    e.preventDefault();
    handlePdfFile(e.dataTransfer.files[0]);
});

async function handlePdfFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
        showToast('El archivo debe ser un PDF', 'error');
        return;
    }
    importDrop.classList.add('busy');
    importStatus.innerHTML = loaderHTML('Cargando lector de PDF…');
    try {
        const result = await extractStudentsFromPdf(file, (page, total) => {
            importStatus.innerHTML = loaderHTML(`Analizando página ${page} de ${total}…`);
        });
        if (!result.students.length) throw new Error('No se han encontrado alumnos en el PDF. ¿Es el listado con fotos de Séneca?');
        importStatus.textContent = '';
        openImportPreview(result);
    } catch (err) {
        console.error(err);
        importStatus.innerHTML = `<p class="form-error">${esc(err.message || err)}</p>`;
    } finally {
        importDrop.classList.remove('busy');
        pdfInput.value = '';
    }
}

function openImportPreview(result) {
    importData = result;
    const total = result.students.length;
    const withPhoto = result.students.filter(s => s.photo).length;
    const group = [result.course, result.unit].filter(Boolean).join(' · ');
    $('import-summary').innerHTML = `Se han detectado <strong>${total}</strong> alumnos (${withPhoto} con foto)` +
        `${group ? ` de <strong>${esc(group)}</strong>` : ''}. Corrige los nombres si hace falta y desmarca a quien no quieras importar.` +
        `${withPhoto < total ? '<br><small>Los alumnos sin foto tendrán un avatar con sus iniciales (podrás añadir la foto más tarde).</small>' : ''}`;

    const matching = teacherClasses.find(c => result.unit && normalizeText(c.name) === normalizeText(result.unit));
    importTarget.innerHTML = teacherClasses.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('') +
        '<option value="__new">➕ Nueva clase…</option>';
    importTarget.value = matching ? matching.id : '__new';
    importNewClassName.value = result.unit || 'Mi clase';
    importNewClassName.style.display = importTarget.value === '__new' ? '' : 'none';

    importGrid.innerHTML = result.students.map((s, i) => `
        <div class="review-card" data-index="${i}" style="--i:${i}">
            <label class="review-check" title="Importar"><input type="checkbox" checked></label>
            ${avatarHTML({ first_name: s.firstName, last_name: s.lastName, photo: s.photo }, 'avatar-lg')}
            <input type="text" class="rv-first" value="${esc(s.firstName)}" placeholder="Nombre" maxlength="80">
            <input type="text" class="rv-last" value="${esc(s.lastName)}" placeholder="Apellidos" maxlength="80">
        </div>`).join('');
    openModal('import-preview-modal');
}

importTarget.addEventListener('change', () => {
    importNewClassName.style.display = importTarget.value === '__new' ? '' : 'none';
});

importGrid.addEventListener('change', e => {
    if (e.target.type === 'checkbox') e.target.closest('.review-card').classList.toggle('excluded', !e.target.checked);
});

$('import-cancel').addEventListener('click', () => closeModal('import-preview-modal'));

importConfirmButton.addEventListener('click', async () => {
    const chosen = [...importGrid.querySelectorAll('.review-card')]
        .filter(card => card.querySelector('input[type=checkbox]').checked)
        .map(card => ({
            first_name: card.querySelector('.rv-first').value.trim(),
            last_name: card.querySelector('.rv-last').value.trim(),
            photo: importData.students[+card.dataset.index].photo || null
        }))
        .filter(s => s.first_name);
    if (!chosen.length) { showToast('No hay alumnos seleccionados', 'warn'); return; }

    importConfirmButton.disabled = true;
    importConfirmButton.textContent = 'Guardando…';
    try {
        let classId = importTarget.value;
        if (classId === '__new') {
            classId = (await createClass((importNewClassName.value.trim() || 'Mi clase').slice(0, 60))).id;
        }
        // Fusión: si el alumno ya existe (mismo nombre y apellidos) solo se actualiza su foto
        const existing = await fetchStudents(classId);
        const keyOf = s => normalizeText(`${s.last_name}|${s.first_name}`);
        const byKey = new Map(existing.map(s => [keyOf(s), s]));
        let position = existing.reduce((max, s) => Math.max(max, s.position || 0), 0);
        const toInsert = [];
        const toUpdate = [];
        chosen.forEach(s => {
            const found = byKey.get(keyOf(s));
            if (!found) toInsert.push({ ...s, class_id: classId, position: ++position });
            else if (s.photo && s.photo !== found.photo) toUpdate.push({ id: found.id, photo: s.photo });
        });
        await insertStudents(toInsert);
        for (const u of toUpdate) await updateStudent(u.id, { photo: u.photo });

        closeModal('import-preview-modal');
        await changeActiveClass(classId);
        const kept = chosen.length - toInsert.length - toUpdate.length;
        showToast(`✅ ${toInsert.length} alumno(s) añadido(s)` +
            (toUpdate.length ? `, ${toUpdate.length} foto(s) actualizada(s)` : '') +
            (kept ? `, ${kept} ya existían` : ''), 'success', 5000);
        launchConfetti(90);
    } catch (err) {
        reportError('Error al guardar los alumnos', err);
    } finally {
        importConfirmButton.disabled = false;
        importConfirmButton.textContent = '💾 Guardar alumnos';
    }
});

// --- SELECTOR DE ALUMNO ---

let pickerMode = null;
let pickerBusy = false;
let pickerSessionStats = new Map();

async function openStudentPicker(mode) {
    pickerMode = mode;
    gameMode = mode;
    [modeSelectionModal, timeSelectionModal, rankingModal, playerNameModal].forEach(m => { m.style.display = 'none'; });
    gameContainer.classList.add('game-content-hidden');

    if (!activeClass() || !classStudents.length) {
        showModeSelection(false);
        showToast(activeClass() ? 'Esta clase no tiene alumnos: importa el PDF primero.' : 'Primero importa o crea una clase.', 'warn', 5000);
        openStudentsPanel();
        return;
    }

    const setting = currentGameSetting(mode);
    $('picker-title').textContent = '¿Quién juega?';
    $('picker-subtitle').textContent = [modeLabel(mode), settingLabel(mode, setting), activeClass().name].filter(Boolean).join(' · ');
    pickerSearch.value = '';
    pickerBusy = false;
    pickerSessionStats = new Map();
    renderPickerGrid(true);
    openModal('student-picker-modal');
    fitPickerGrid();

    if (activeSession) {
        try {
            const rows = await fetchRanking({ mode, setting, anySetting: false, sessionId: activeSession.id });
            rows.forEach(r => pickerSessionStats.set(r.student_id, r));
            decoratePickerCards();
        } catch (err) { console.warn('No se pudieron cargar las partidas de la sesión', err); }
    }
}

function renderPickerGrid(animate) {
    const query = normalizeText(pickerSearch.value);
    const list = classStudents.filter(s => !query || normalizeText(`${s.first_name} ${s.last_name}`).includes(query));
    pickerGrid.classList.toggle('no-anim', !animate);
    pickerGrid.innerHTML = list.map((s, i) => `
        <button class="student-card pick" data-id="${s.id}" style="--i:${i}">
            <span class="played-badge"></span>
            ${avatarHTML(s, 'avatar-lg')}
            <span class="student-name">${esc(studentShortName(s))}</span>
        </button>`).join('') || '<div class="empty-state">Ningún alumno coincide con la búsqueda</div>';
    decoratePickerCards();
}

// Ajusta el tamaño de las tarjetas para que TODA la clase quepa en pantalla sin scroll.
// Prueba cada número de columnas y se queda con el que permite las tarjetas más grandes.
const PICK_MAX = 190;   // tamaño máximo de tarjeta (px)
const PICK_MIN = 84;    // por debajo de esto no se leen los nombres: entonces sí hay scroll

function pickerCardHeight(size) {
    const font = Math.min(18, Math.max(12, size * 0.12));
    return size * 0.85 + font * 1.2 * 2 + 4;   // relleno + foto + hueco + nombre en 2 líneas + borde
}

function fitPickerGrid() {
    if (!isModalOpen('student-picker-modal')) return;
    const count = Math.max(1, classStudents.length);
    const panel = pickerGrid.closest('.panel');
    pickerGrid.classList.remove('scrolls');
    pickerGrid.style.gridTemplateColumns = '';

    // alto libre = ventana - márgenes del modal - lo que ocupa el panel sin la cuadrícula
    const chrome = panel.offsetHeight - pickerGrid.offsetHeight;
    const availH = window.innerHeight - 40 - chrome - 8;
    const availW = pickerGrid.clientWidth;

    let best = null;
    for (let cols = 1; cols <= count; cols++) {
        // ancho = cols·s + huecos (0,09·s) + relleno lateral (0,12·s)
        const size = Math.min(PICK_MAX, availW / (cols + 0.09 * (cols - 1) + 0.12));
        const rows = Math.ceil(count / cols);
        const height = rows * pickerCardHeight(size) + (rows - 1) * 0.09 * size + 0.16 * size;
        if (height <= availH && (!best || size > best.size)) best = { cols, size };
    }

    if (!best || best.size < PICK_MIN) {
        // la clase no cabe ni con tarjetas mínimas (pantalla muy pequeña): cuadrícula con scroll
        // tantas columnas de tamaño mínimo como quepan, estiradas para llenar el ancho
        const cols = Math.max(1, Math.floor(availW / (PICK_MIN * 1.09)));
        best = { cols, size: Math.min(PICK_MAX, availW / (cols + 0.09 * (cols - 1) + 0.12)) };
        pickerGrid.classList.add('scrolls');
    }
    const size = Math.floor(best.size);
    pickerGrid.style.setProperty('--pick', size + 'px');
    pickerGrid.style.gridTemplateColumns = `repeat(${best.cols}, ${size}px)`;
}

window.addEventListener('resize', fitPickerGrid);

function decoratePickerCards() {
    pickerGrid.querySelectorAll('.student-card').forEach(card => {
        const stats = pickerSessionStats.get(card.dataset.id);
        card.classList.toggle('has-played', !!stats);
        const badge = card.querySelector('.played-badge');
        badge.textContent = stats ? `✓ ${stats.best_score}` : '';
        card.title = stats ? `Ya ha jugado ${stats.games_count} vez/veces en esta sesión (mejor: ${stats.best_score})` : '';
    });
}

function selectStudent(id, card) {
    const student = classStudents.find(s => s.id === id);
    if (!student) return;
    pickerBusy = true;
    playSound(clickSound);
    currentStudent = student;
    playerName = studentShortName(student);
    if (card) card.classList.add('chosen');
    setTimeout(() => {
        pickerBusy = false;
        closeModal('student-picker-modal');
        launchGame(pickerMode);
    }, 600);
}

pickerGrid.addEventListener('click', e => {
    const card = e.target.closest('.student-card');
    if (card && !pickerBusy) selectStudent(card.dataset.id, card);
});

pickerSearch.addEventListener('input', () => renderPickerGrid(false));

$('picker-random').addEventListener('click', () => {
    if (pickerBusy) return;
    const cards = [...pickerGrid.querySelectorAll('.student-card')];
    if (!cards.length) return;
    const pending = cards.filter(c => !c.classList.contains('has-played'));
    const pool = pending.length ? pending : cards;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const steps = 18 + Math.floor(Math.random() * 6);
    let step = 0;
    let delay = 60;
    pickerBusy = true;

    const spin = () => {
        cards.forEach(c => c.classList.remove('roulette'));
        if (step >= steps) {
            target.classList.add('roulette');
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            setTimeout(() => selectStudent(target.dataset.id, target), 450);
            return;
        }
        cards[Math.floor(Math.random() * cards.length)].classList.add('roulette');
        playSound(clickSound, 0.3);
        step++;
        delay *= 1.08;
        setTimeout(spin, delay);
    };
    spin();
});

$('picker-back').addEventListener('click', () => {
    if (pickerBusy) return;
    playSound(clickSound);
    closeModal('student-picker-modal');
    showModeSelection(false);
});

// Cabecera de la cuenta atrás: "¡Te toca, Lucía!"
function countdownHeaderHTML() {
    if (!isTeacherMode() || !currentStudent) return '';
    return `<div class="countdown-player">${avatarHTML(currentStudent, 'avatar-xl')}
        <div class="countdown-player-name">¡Te toca, ${esc(currentStudent.first_name)}!</div></div>`;
}

function updatePlayerChip() {
    if (isTeacherMode() && currentStudent) {
        playerChip.innerHTML = `${avatarHTML(currentStudent, 'avatar-sm')}<span>${esc(studentShortName(currentStudent))}</span>`;
        playerChip.style.display = 'inline-flex';
    } else {
        playerChip.style.display = 'none';
    }
}

// --- REGISTRO Y RESULTADO DE LA PARTIDA ---

function recordTeacherGame({ mode, score: finalScore, errors: finalErrors, duration }) {
    const student = currentStudent;
    const game = {
        id: newUuid(),
        student_id: student.id,
        mode,
        setting: currentGameSetting(mode),
        score: finalScore,
        errors: finalErrors,
        duration_seconds: Math.round(duration * 100) / 100,
        played_at: new Date().toISOString()
    };
    if (mode === 'free' && finalScore + finalErrors === 0) return Promise.resolve({ skipped: true, game, student });
    return saveGameResult(game).then(result => ({ ...result, game, student }));
}

function hideTeacherResult() {
    $('ranking-area').classList.remove('teacher-layout');
    teacherResultHeader.style.display = 'none';
    teacherResultArea.style.display = 'none';
    teacherAgainButton.style.display = 'none';
    teacherNextButton.style.display = 'none';
    teacherRankingsButton.style.display = 'none';
    $('guest-ranking-title').style.display = '';
}

async function showTeacherResult(resultPromise) {
    const student = currentStudent;
    // Diseño horizontal en dos columnas y sin el ranking local del modo invitado
    $('ranking-area').classList.add('teacher-layout');
    $('guest-ranking-title').style.display = 'none';
    $('reset-ranking-button').style.display = 'none';
    $('ranking-table').style.display = 'none';
    samePlayerButton.style.display = 'none';
    otherPlayerButton.style.display = 'none';

    teacherResultHeader.innerHTML = `${avatarHTML(student, 'avatar-xl')}
        <div class="result-student-name">${esc(student.first_name)} ${esc(student.last_name)}</div>
        <div class="result-mode">${esc([modeLabel(gameMode), settingLabel(gameMode, currentGameSetting(gameMode))].filter(Boolean).join(' · '))}</div>`;
    teacherResultHeader.style.display = 'flex';
    teacherResultArea.innerHTML = loaderHTML('Guardando resultado…');
    teacherResultArea.style.display = 'block';
    teacherAgainButton.textContent = `🔁 Otra vez con ${student.first_name}`;
    teacherAgainButton.style.display = 'block';
    teacherNextButton.style.display = 'block';
    teacherRankingsButton.style.display = 'block';
    animateCount(summaryCorrectEl, score);

    const r = await resultPromise;
    let html = '';
    if (r.skipped) html += '<div class="result-status muted">No se ha registrado: no hubo respuestas.</div>';
    else if (r.saved) html += `<div class="result-status ok">✅ Partida guardada · ${esc(fmtDateTime(r.game.played_at, true))}</div>`;
    else html += '<div class="result-status warn">⚠️ Sin conexión: el resultado se guardará automáticamente más tarde.</div>';

    const isRecord = r.saved && r.game.score > 0 && (r.prevBest == null || r.game.score > r.prevBest);
    if (isRecord) html += `<div class="record-badge">🏅 ¡Nuevo récord personal!${r.prevBest != null ? ` <small>(antes ${r.prevBest})</small>` : ''}</div>`;
    else if (r.saved && r.prevBest != null) html += `<div class="pb-line">Récord personal: <strong>${r.prevBest}</strong></div>`;

    let position = 0;
    if (r.ranking && r.ranking.length) {
        position = r.ranking.findIndex(row => row.student_id === student.id) + 1;
        html += `<div class="session-pos">Puesto <strong>#${position}</strong> de ${r.ranking.length} en esta sesión</div>`;
        html += miniRankingHTML(r.ranking, student.id);
    }
    teacherResultArea.innerHTML = html;

    if (rankingModal.style.display === 'flex' && (isRecord || (position > 0 && position <= 3 && r.game.score > 0))) {
        launchConfetti(isRecord ? 160 : 100);
    }
}

function miniRankingHTML(rows, highlightId) {
    const top = rows.slice(0, 5);
    const index = rows.findIndex(r => r.student_id === highlightId);
    const rowHTML = (r, pos) => {
        const s = studentById(r.student_id);
        return `<div class="mini-row ${r.student_id === highlightId ? 'me' : ''}" style="--i:${pos}">
            <span class="mini-pos">${pos <= 3 ? ['🥇', '🥈', '🥉'][pos - 1] : pos}</span>
            ${avatarHTML(s, 'avatar-sm')}
            <span class="mini-name">${esc(studentShortName(s))}</span>
            <span class="mini-score">${r.best_score}</span>
        </div>`;
    };
    let html = top.map((r, i) => rowHTML(r, i + 1)).join('');
    if (index >= 5) html += `<div class="mini-gap">…</div>${rowHTML(rows[index], index + 1)}`;
    return `<div class="mini-ranking">${html}</div>`;
}

teacherAgainButton.addEventListener('click', () => {
    playSound(clickSound);
    launchGame(gameMode);
});
teacherNextButton.addEventListener('click', () => {
    playSound(clickSound);
    openStudentPicker(gameMode);
});
teacherRankingsButton.addEventListener('click', () => {
    playSound(clickSound);
    const setting = currentGameSetting(gameMode);
    openRankings({
        tab: gameMode === 'free' ? 'history' : 'session',
        mode: gameMode === 'free' ? rk.mode : gameMode,
        setting: gameMode === 'free' ? rk.setting : (setting == null ? 'inf' : setting)
    });
});

// --- RANKINGS ---

const RK_SETTINGS = {
    chrono: [['all', 'Todos'], [120, '2 min'], [60, '1 min'], [30, '30 s'], [20, '20 s'], [10, '10 s']],
    sudden_death: [['all', 'Todos'], ['inf', '∞'], [5, '5 s'], [4, '4 s'], [3, '3 s'], [2, '2 s'], [1, '1 s']]
};
const HISTORY_PAGE = 50;

const rk = { tab: 'session', mode: 'chrono', setting: 'all', sessionId: null, historyStudent: '', historyOffset: 0 };
let rkSessions = [];
let rkRenderToken = 0;

async function openRankings(options = {}) {
    if (!activeClass()) {
        showToast('Primero importa o crea una clase.', 'warn');
        openStudentsPanel();
        return;
    }
    Object.assign(rk, options);
    $('rk-class-name').textContent = activeClass().name;
    rkContent.innerHTML = loaderHTML('Cargando…');
    openModal('rankings-modal');
    try {
        rkSessions = await fetchSessions(activeClassId);
    } catch (err) {
        rkSessions = [];
        reportError('No se pudieron cargar las sesiones', err);
    }
    if (!options.sessionId) rk.sessionId = activeSession ? activeSession.id : (rkSessions[0] ? rkSessions[0].id : null);
    renderRkControls();
    renderRkContent();
}

function renderRkControls() {
    document.querySelectorAll('#rk-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === rk.tab));
    document.querySelectorAll('#rk-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === rk.mode));

    const isHistory = rk.tab === 'history';
    $('rk-mode').style.display = isHistory ? 'none' : '';
    $('rk-settings').style.display = isHistory ? 'none' : '';
    $('rk-session-row').style.display = rk.tab === 'session' ? '' : 'none';
    $('rk-history-row').style.display = isHistory ? '' : 'none';

    const settings = RK_SETTINGS[rk.mode];
    if (!settings.some(([value]) => String(value) === String(rk.setting))) rk.setting = 'all';
    $('rk-settings').innerHTML = settings.map(([value, label]) =>
        `<button type="button" data-setting="${value}" class="${String(value) === String(rk.setting) ? 'active' : ''}">${label}</button>`).join('');

    const sessionSelect = $('rk-session-select');
    sessionSelect.innerHTML = rkSessions.length
        ? rkSessions.map(s => `<option value="${s.id}">${esc(fmtSessionLabel(s))}</option>`).join('')
        : '<option value="">Todavía no hay sesiones</option>';
    sessionSelect.value = rk.sessionId || '';

    const studentSelect = $('rk-history-student');
    studentSelect.innerHTML = '<option value="">👥 Todos los alumnos</option>' +
        classStudents.map(s => `<option value="${s.id}">${esc(s.first_name)} ${esc(s.last_name)}</option>`).join('');
    studentSelect.value = rk.historyStudent || '';
}

async function renderRkContent() {
    const token = ++rkRenderToken;
    rkContent.innerHTML = loaderHTML('Cargando…');
    try {
        if (rk.tab === 'history') {
            rk.historyOffset = 0;
            const rows = await fetchHistory({ studentId: rk.historyStudent || null, offset: 0, limit: HISTORY_PAGE });
            if (token !== rkRenderToken) return;
            rkContent.innerHTML = rows.length
                ? `<div class="history-wrap"><table class="history-table"><thead><tr>
                    <th>Fecha y hora</th><th>Alumno</th><th>Modo</th><th>Aciertos</th><th>Errores</th><th>Duración</th><th></th>
                   </tr></thead><tbody>${rows.map(historyRowHTML).join('')}</tbody></table></div>
                   ${rows.length === HISTORY_PAGE ? '<button id="rk-more" class="chip-button">Cargar más</button>' : ''}`
                : '<div class="empty-state">📭 Todavía no hay partidas registradas.</div>';
            return;
        }

        if (rk.tab === 'session' && !rk.sessionId) {
            rkContent.innerHTML = '<div class="empty-state">⚡ La sesión se crea automáticamente al jugar la primera partida del día.</div>';
            return;
        }
        const rows = await fetchRanking({
            mode: rk.mode,
            setting: (rk.setting === 'all' || rk.setting === 'inf') ? null : Number(rk.setting),
            anySetting: rk.setting === 'all',
            sessionId: rk.tab === 'session' ? rk.sessionId : null
        });
        if (token !== rkRenderToken) return;
        rkContent.innerHTML = rows.length
            ? rankingBoardHTML(rows)
            : '<div class="empty-state">🏁 Nadie ha jugado todavía con esta configuración.</div>';
    } catch (err) {
        if (token !== rkRenderToken) return;
        rkContent.innerHTML = `<p class="form-error">No se pudo cargar: ${esc(err.message || err)}</p>`;
    }
}

function rankingBoardHTML(rows) {
    const unit = rk.mode === 'sudden_death' ? 'seguidos' : 'aciertos';
    const max = Math.max(1, ...rows.map(r => r.best_score));
    const podium = [[rows[1], 2], [rows[0], 1], [rows[2], 3]].map(([r, place]) => {
        if (!r) return '<div class="podium-slot empty"></div>';
        const s = studentById(r.student_id);
        return `<div class="podium-slot place-${place}">
            <div class="podium-medal">${['🥇', '🥈', '🥉'][place - 1]}</div>
            ${avatarHTML(s, place === 1 ? 'avatar-xl' : 'avatar-lg')}
            <div class="podium-name">${esc(studentShortName(s))}</div>
            <div class="podium-block"><span class="podium-score">${r.best_score}</span><small>${unit}</small></div>
        </div>`;
    }).join('');

    const list = rows.map((r, i) => {
        const s = studentById(r.student_id);
        return `<div class="rk-row ${i < 3 ? 'top' : ''}" style="--i:${i}">
            <span class="rk-pos">${i + 1}</span>
            ${avatarHTML(s, 'avatar-sm')}
            <div class="rk-main">
                <div class="rk-name">${esc(s.first_name)} ${esc(s.last_name)}</div>
                <div class="rk-bar"><div style="--w:${(r.best_score / max * 100).toFixed(1)}%"></div></div>
                <div class="rk-meta">${r.games_count} partida(s) · media ${r.avg_score} · mejor el ${esc(fmtDateTime(r.best_at))}</div>
            </div>
            <span class="rk-score">${r.best_score}</span>
        </div>`;
    }).join('');

    return `<div class="podium">${podium}</div><div class="rk-list">${list}</div>`;
}

function historyRowHTML(g) {
    const s = studentById(g.student_id);
    const setting = g.mode === 'free' ? '' : ` <small>(${esc(settingLabel(g.mode, g.setting))})</small>`;
    const duration = g.duration_seconds != null ? formatTime(Number(g.duration_seconds)) : '—';
    return `<tr data-id="${g.id}">
        <td>${esc(fmtDateTime(g.played_at, true))}</td>
        <td class="h-student">${avatarHTML(s, 'avatar-xs')} ${esc(studentShortName(s))}</td>
        <td>${esc(modeLabel(g.mode))}${setting}</td>
        <td class="h-score">${g.score}</td>
        <td class="h-errors">${g.errors}</td>
        <td>${duration}</td>
        <td><button class="icon-button" data-delete-game="${g.id}" title="Borrar partida">🗑</button></td>
    </tr>`;
}

document.querySelectorAll('#rk-tabs button').forEach(b => b.addEventListener('click', () => {
    playSound(clickSound);
    rk.tab = b.dataset.tab;
    renderRkControls();
    renderRkContent();
}));

document.querySelectorAll('#rk-mode button').forEach(b => b.addEventListener('click', () => {
    rk.mode = b.dataset.mode;
    rk.setting = 'all';
    renderRkControls();
    renderRkContent();
}));

$('rk-settings').addEventListener('click', e => {
    const button = e.target.closest('button[data-setting]');
    if (!button) return;
    rk.setting = button.dataset.setting;
    renderRkControls();
    renderRkContent();
});

$('rk-session-select').addEventListener('change', e => {
    rk.sessionId = e.target.value || null;
    renderRkContent();
});

$('rk-history-student').addEventListener('change', e => {
    rk.historyStudent = e.target.value;
    renderRkContent();
});

$('rk-new-session').addEventListener('click', async () => {
    if (!await confirmDialog('El ranking de la sesión empezará de cero (el ranking total de la clase se mantiene).', { title: '¿Empezar una nueva sesión?', icon: '✨', okText: 'Nueva sesión' })) return;
    try {
        const session = await ensureActiveSession(true);
        rkSessions = await fetchSessions(activeClassId);
        rk.sessionId = session.id;
        rk.tab = 'session';
        renderRkControls();
        renderRkContent();
        showToast('✨ Nueva sesión iniciada', 'success');
    } catch (err) { reportError('No se pudo crear la sesión', err); }
});

rkContent.addEventListener('click', async e => {
    const deleteButton = e.target.closest('[data-delete-game]');
    if (deleteButton) {
        if (!await confirmDialog('Dejará de contar en los rankings.', { title: '¿Borrar esta partida?', icon: '🗑️', okText: 'Borrar', danger: true })) return;
        try {
            await deleteGame(deleteButton.dataset.deleteGame);
            const row = deleteButton.closest('tr');
            row.classList.add('row-out');
            setTimeout(() => row.remove(), 300);
        } catch (err) { reportError('No se pudo borrar', err); }
        return;
    }
    if (e.target.id === 'rk-more') {
        const button = e.target;
        button.disabled = true;
        try {
            rk.historyOffset += HISTORY_PAGE;
            const rows = await fetchHistory({ studentId: rk.historyStudent || null, offset: rk.historyOffset, limit: HISTORY_PAGE });
            rkContent.querySelector('tbody').insertAdjacentHTML('beforeend', rows.map(historyRowHTML).join(''));
            if (rows.length < HISTORY_PAGE) button.remove(); else button.disabled = false;
        } catch (err) {
            button.disabled = false;
            reportError('No se pudo cargar más', err);
        }
    }
});

$('open-rankings-button').addEventListener('click', () => { playSound(clickSound); openRankings(); });

// --- CIERRE DE MODALES ---

document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => {
    playSound(clickSound);
    closeModal(button.dataset.close);
}));

['auth-modal', 'students-modal', 'rankings-modal', 'student-edit-modal'].forEach(id => {
    $(id).addEventListener('mousedown', e => { if (e.target.id === id) closeModal(id); });
});

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = ['student-edit-modal', 'import-preview-modal', 'auth-modal', 'rankings-modal', 'students-modal'].find(isModalOpen);
    if (open) closeModal(open);
});
