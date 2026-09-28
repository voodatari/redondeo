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
        <button class="chip-button ghost-dark back-button">← Volver</button>
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
        <button class="chip-button ghost-dark back-button">← Volver</button>
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


function addTimeSelectionBackButton() {
    document.querySelector('#time-selection-area .back-button').addEventListener('click', () => {
        playSound(clickSound);
        showModeSelection(false);
    });
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
    if (!enable && gameMode === 'free' && nextQuestionButton) {
         nextQuestionButton.style.display = 'none';
    }
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

    if (nextQuestionButton) nextQuestionButton.style.display = 'none';
}