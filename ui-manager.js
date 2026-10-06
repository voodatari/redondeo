// --- MANEJADOR DE INTERFAZ (MODALES Y PANTALLAS) ---

function showModeSelection(isInitialLoad) {
    resetGameStats();
    playerNameInput.value = '';
    playerName = '';
    currentStudent = null;
    closeTeacherOverlays();
    refreshTeacherBar();

    gameContainer.classList.add('game-content-hidden');
    gameTitleEl.textContent = 'Práctica de Redondeo'; 

    timeSelectionModal.style.display = 'none';
    playerNameModal.style.display = 'none';
    rankingModal.style.display = 'none';
    mainMenuButton.style.display = 'none'; 
    
    modeSelectionModal.style.display = 'flex';
    
    numberToRoundEl.textContent = 'Elige tu modo de juego.';
    roundingUnitEl.textContent = '';
    scoreDisplay.textContent = `Puntuación: 0`;
    rightInfoDisplay.style.display = 'none'; 
    centerTimeDisplay.style.display = 'none'; 
    
    if (isMusicOn && (!isInitialLoad || modeSelectionModal.style.display === 'flex')) {
        if (!currentBGM || currentBGM.src.indexOf('titulo.mp3') === -1) {
             playBGM('titulo.mp3'); 
        }
    }
}

function showTimeSelection(mode) {
    gameMode = mode;
    modeSelectionModal.style.display = 'none';
    rankingModal.style.display = 'none'; 
    timeSelectionModal.style.display = 'flex';
    
    // Contenido dinámico para modo Contrarreloj (Tiempo total)
    const timeArea = document.getElementById('time-selection-area');
    timeArea.innerHTML = `
        <h2>Selecciona el Tiempo Total</h2>
        <p>¿Cuánto quieres que dure el desafío?</p>
        <button class="mode-button time-button" data-time="120">2 Minutos</button>
        <button class="mode-button time-button" data-time="60">1 Minuto</button>
        <button class="mode-button time-button" data-time="30">30 Segundos</button>
        <button class="mode-button time-button" data-time="20">20 Segundos</button>
        <button class="mode-button time-button" data-time="10">10 Segundos</button>
        ${timeFooterHTML('btn-chrono')}
    `;
    addTimeSelectionBackButton();

    // Reasignar listeners para los botones de Contrarreloj
    document.querySelectorAll('#time-selection-area .time-button').forEach(button => {
        button.addEventListener('click', (e) => {
            playSound(clickSound);
            // Uso de variables globales (initialTime, timeLeft) de main.js
            initialTime = parseInt(e.currentTarget.getAttribute('data-time'));
            timeLeft = initialTime;
            showPlayerNameModal('chrono');
        });
    });
}

// NUEVA FUNCIÓN PARA MUERTE SÚBITA
function showSuddenDeathTimeSelection() {
    gameMode = 'sudden_death_time_select'; // Modo temporal para la selección
    modeSelectionModal.style.display = 'none';
    rankingModal.style.display = 'none'; 
    timeSelectionModal.style.display = 'flex';
    
    // Reconfigura el contenido del modal de selección de tiempo
    const timeArea = document.getElementById('time-selection-area');
    timeArea.innerHTML = `
        <h2>Selecciona el Límite</h2>
        <p>¿Cuántos segundos tienes para contestar cada pregunta?</p>
        <button class="mode-button time-button" data-time="inf">Infinito</button>
        <button class="mode-button time-button" data-time="5">5s</button>
        <button class="mode-button time-button" data-time="4">4s</button>
        <button class="mode-button time-button" data-time="3">3s</button>
        <button class="mode-button time-button" data-time="2">2s</button>
        <button class="mode-button time-button" data-time="1">1s</button>
        ${timeFooterHTML('btn-sudden')}
    `;
    addTimeSelectionBackButton();

    // Reasignar listeners para los botones de Muerte Súbita
    document.querySelectorAll('#time-selection-area .time-button').forEach(button => {
        button.addEventListener('click', (e) => {
            playSound(clickSound);
            
            // Uso de la variable global (suddenDeathTimeLimit) de main.js
            const timeValue = e.currentTarget.getAttribute('data-time');
            if (timeValue === 'inf') {
                suddenDeathTimeLimit = Infinity;
            } else {
                suddenDeathTimeLimit = parseInt(timeValue);
            }
            
            // Pasa al modal de nombre con el modo final
            showPlayerNameModal('sudden_death');
        });
    });
}


// Práctica libre: no tiene tiempo que elegir, pero sí la misma pantalla previa
// para poder cambiar la dificultad en «Más opciones» antes de empezar.
function showFreeSelection() {
    gameMode = 'free';
    modeSelectionModal.style.display = 'none';
    rankingModal.style.display = 'none';
    timeSelectionModal.style.display = 'flex';

    const timeArea = document.getElementById('time-selection-area');
    timeArea.innerHTML = `
        <h2>Práctica Libre</h2>
        <p>Sin tiempo y sin ranking: a tu ritmo. Puedes cambiar la dificultad en «Más opciones».</p>
        <button class="mode-button time-button btn-free free-start-button">🎯 Empezar</button>
        ${timeFooterHTML('btn-violet')}
    `;
    addTimeSelectionBackButton();

    document.querySelector('#time-selection-area .free-start-button').addEventListener('click', () => {
        playSound(clickSound);
        timeSelectionModal.style.display = 'none';
        if (isTeacherMode()) openStudentPicker('free');
        else launchGame('free');
    });
}

// Pie de la selección de tiempo: Volver · dificultad elegida · Más opciones
// colorMode: color del botón «Más opciones», el del modo en el menú principal
function timeFooterHTML(colorMode) {
    return `<div class="time-footer">
            <button class="chip-button ghost-dark back-button">← Volver</button>
            <span class="time-variant" id="time-variant"></span>
            <button class="chip-button more-button ${colorMode}">⚙️ Más opciones</button>
        </div>`;
}

function paintTimeVariant() {
    const el = document.getElementById('time-variant');
    if (!el) return;
    const ranked = Opciones.puntua();
    const free = gameMode === 'free';   // la práctica libre nunca tiene ranking
    el.className = 'time-variant ' + (free ? 'neutral' : ranked ? 'ranked' : 'unranked');
    el.textContent = Opciones.etiqueta();
    el.title = free ? 'Dificultad elegida' : ranked ? 'Cuenta para el ranking' : 'A medida: se guarda, pero no cuenta para el ranking';
}

function addTimeSelectionBackButton() {
    document.querySelector('#time-selection-area .back-button').addEventListener('click', () => {
        playSound(clickSound);
        showModeSelection(false);
    });
    document.querySelector('#time-selection-area .more-button').addEventListener('click', () => {
        playSound(clickSound);
        Opciones.abrir(paintTimeVariant);
    });
    paintTimeVariant();
}

function showPlayerNameModal(mode) {
    gameMode = mode;
    playerNameTitle.textContent = (mode === 'chrono') ? '¡Modo Contrarreloj!' : '¡Muerte Súbita!';
    modeSelectionModal.style.display = 'none';
    timeSelectionModal.style.display = 'none';
    rankingModal.style.display = 'none';

    // Modo docente: en lugar de pedir el nombre se elige al alumno
    if (isTeacherMode()) {
        openStudentPicker(mode);
        return;
    }

    playerNameModal.style.display = 'flex';
    playerNameInput.focus();
}

// Cuenta atrás y comienzo de la partida
function launchGame(mode) {
    gameMode = mode;
    [modeSelectionModal, timeSelectionModal, playerNameModal, rankingModal].forEach(m => { m.style.display = 'none'; });
    gameContainer.classList.add('game-content-hidden');
    showCountdown(() => startContest(mode), countdownHeaderHTML());
}

function updateFeedback(message, isCorrect) {
    feedbackMessage.textContent = message;
    feedbackMessage.classList.remove('feedback-correct', 'feedback-incorrect');
    feedbackMessage.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
    feedbackMessage.style.opacity = '1';
}

function enableOptions(enable) {
    optionButtons.forEach(button => {
        button.disabled = !enable;
    });
}

function resetOptionStyles() {
    optionButtons.forEach(button => {
        button.classList.remove('correct-answer', 'incorrect-choice');
    });
}

function resetGameStats() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (autoAdvanceTimeout) { clearTimeout(autoAdvanceTimeout); autoAdvanceTimeout = null; }
    stopFreeModeTimer(); 
    
    // Limpieza del temporizador de pregunta
    if (typeof stopQuestionTimer === 'function') { 
        stopQuestionTimer(); 
    }
    
    gameStarted = false;
    rightInfoDisplay.classList.remove('time-warning');
    
    feedbackMessage.style.opacity = '0';
    feedbackMessage.textContent = ''; 
    resetOptionStyles(); 

}