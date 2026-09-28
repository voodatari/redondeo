// --- EFECTOS VISUALES Y UTILIDADES DE INTERFAZ ---

function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function restartAnimation(el, className) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth; // fuerza reflow para reiniciar la animación
    el.classList.add(className);
}

// --- Avisos flotantes ---
function showToast(message, type = 'info', duration = 3200) {
    let box = document.getElementById('toast-container');
    if (!box) {
        box = document.createElement('div');
        box.id = 'toast-container';
        document.body.appendChild(box);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    box.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// --- Confeti ---
function launchConfetti(amount = 140) {
    const colors = ['#ff4d6d', '#ffd23f', '#3ddc97', '#4f6bff', '#b15cff', '#ff8c42', '#22d3ee'];
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    for (let i = 0; i < amount; i++) {
        const piece = document.createElement('i');
        piece.style.setProperty('--x', (Math.random() * 100).toFixed(2) + 'vw');
        piece.style.setProperty('--drift', (Math.random() * 30 - 15).toFixed(2) + 'vw');
        piece.style.setProperty('--rot', Math.round(Math.random() * 1440 - 720) + 'deg');
        piece.style.setProperty('--delay', (Math.random() * 0.7).toFixed(2) + 's');
        piece.style.setProperty('--dur', (2.2 + Math.random() * 1.8).toFixed(2) + 's');
        piece.style.background = colors[i % colors.length];
        if (i % 3 === 0) piece.style.borderRadius = '50%';
        layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 5000);
}

// --- Cuenta atrás 3, 2, 1, ¡YA! ---
let countdownActive = false;

function showCountdown(onDone, headerHTML = '') {
    if (countdownActive) return;
    countdownActive = true;

    const overlay = document.createElement('div');
    overlay.id = 'countdown-overlay';
    overlay.innerHTML = `${headerHTML}<div class="countdown-number"></div>`;
    document.body.appendChild(overlay);

    const numberEl = overlay.querySelector('.countdown-number');
    const steps = ['3', '2', '1', '¡YA!'];
    let index = 0;

    const tick = () => {
        if (index >= steps.length) {
            overlay.classList.add('countdown-out');
            setTimeout(() => overlay.remove(), 300);
            countdownActive = false;
            onDone();
            return;
        }
        numberEl.textContent = steps[index];
        numberEl.classList.toggle('go', index === steps.length - 1);
        restartAnimation(numberEl, 'count-pop');
        if (index < steps.length - 1) playSound(clickSound, 0.4);
        index++;
        setTimeout(tick, index === steps.length ? 320 : 420);
    };
    tick();
}

// --- Texto flotante (+1) sobre un elemento ---
function floatText(text, anchorEl, className = 'float-good') {
    if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') return;
    const rect = anchorEl.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = `float-text ${className}`;
    el.textContent = text;
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = (rect.top + rect.height / 2) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
}

// --- Contador animado ---
function animateCount(el, to, duration = 900) {
    if (!el) return;
    const start = performance.now();
    const step = now => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(to * eased);
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// --- Racha de aciertos ---
function updateStreak(count) {
    const badge = document.getElementById('streak-badge');
    if (!badge) return;
    if (count >= 3) {
        badge.textContent = `🔥 Racha x${count}`;
        badge.classList.add('visible');
        restartAnimation(badge, 'streak-pop');
    } else {
        badge.classList.remove('visible');
    }
}

// --- Avatares (foto o iniciales) ---
function hashHue(text) {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
    return h;
}

function avatarHTML(student, sizeClass = '') {
    const s = student || {};
    if (s.photo && /^data:image\//.test(s.photo)) {
        return `<img class="avatar ${sizeClass}" src="${esc(s.photo)}" alt="" draggable="false">`;
    }
    const initials = ((s.first_name || '?').trim().charAt(0) + (s.last_name || '').trim().charAt(0)).toUpperCase();
    const hue = hashHue(`${s.first_name || ''}${s.last_name || ''}`);
    return `<div class="avatar avatar-initials ${sizeClass}" style="--hue:${hue}">${esc(initials)}</div>`;
}

// --- Cuadros de diálogo propios (sustituyen a confirm / prompt / alert del navegador) ---
// Devuelven una promesa: confirmDialog → true/false, promptDialog → texto o null, alertDialog → true.
function showDialog({ title = '', message = '', icon = '', okText = 'Aceptar', cancelText = 'Cancelar', danger = false, input = null } = {}) {
    return new Promise(resolve => {
        const previousFocus = document.activeElement;
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog-box" role="dialog" aria-modal="true">
                ${icon ? `<div class="dialog-icon">${icon}</div>` : ''}
                ${title ? `<h3 class="dialog-title">${esc(title)}</h3>` : ''}
                ${message ? `<p class="dialog-message">${esc(message).replace(/\n/g, '<br>')}</p>` : ''}
                ${input ? `<input type="text" class="dialog-input" maxlength="${input.maxLength || 60}" value="${esc(input.value || '')}" placeholder="${esc(input.placeholder || '')}">` : ''}
                <div class="dialog-actions">
                    ${cancelText ? `<button type="button" class="chip-button ghost-dark dialog-cancel">${esc(cancelText)}</button>` : ''}
                    <button type="button" class="mode-button dialog-ok ${danger ? 'btn-sudden' : ''}">${esc(okText)}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const field = overlay.querySelector('.dialog-input');
        const okButton = overlay.querySelector('.dialog-ok');
        const cancelButton = overlay.querySelector('.dialog-cancel');

        const close = value => {
            document.removeEventListener('keydown', onKey, true);
            overlay.classList.add('dialog-out');
            setTimeout(() => overlay.remove(), 200);
            if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
            resolve(value);
        };
        const accept = () => {
            if (field && !field.value.trim()) { restartAnimation(field, 'shake'); field.focus(); return; }
            close(field ? field.value.trim() : true);
        };
        const cancel = () => close(field ? null : !cancelText);

        // Escape y Enter se atienden aquí y no llegan al resto de la página
        function onKey(e) {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
            else if (e.key === 'Enter' && document.activeElement !== cancelButton) { e.preventDefault(); e.stopPropagation(); accept(); }
        }
        document.addEventListener('keydown', onKey, true);
        okButton.addEventListener('click', () => { playSound(clickSound); accept(); });
        if (cancelButton) cancelButton.addEventListener('click', () => { playSound(clickSound); cancel(); });
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) cancel(); });

        setTimeout(() => {
            if (field) { field.focus(); field.select(); } else okButton.focus();
        }, 50);
    });
}

function confirmDialog(message, options = {}) { return showDialog({ message, ...options }); }
function promptDialog(title, value = '', options = {}) {
    return showDialog({ title, input: { value, placeholder: options.placeholder, maxLength: options.maxLength }, ...options });
}
function alertDialog(message, options = {}) { return showDialog({ message, cancelText: '', ...options }); }
