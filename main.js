// --- ESTADO GLOBAL Y PUNTO DE ENTRADA ---

// Variables de Estado del Juego
let score = 0;
let errors = 0; 
let correctAnswer = 0;
let currentNumber = 0;
let currentUnit = '';
let gameMode = null; // 'chrono', 'sudden_death', 'free'
let gameStarted = false; 
let initialTime = 60; 
let timeLeft = 60; 
let timerInterval = null; 
let playerName = '';
let autoAdvanceTimeout = null; 
let startTime = 0; 
// NUEVA VARIABLE PARA MUERTE SÚBITA
let suddenDeathTimeLimit = Infinity; 

// Timers y estados de modo libre
let freeModeTimerInterval = null; 
let totalTimeElapsed = 0; 
let freeModeTimerStartTime = 0; 

// --- ASIGNACIÓN DE EVENT LISTENERS ---

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    showModeSelection(true); 
    updateMuteButton();
    setupCanvas();
    initTeacherMode(); // recupera la sesión docente si existe (Supabase)
});

// Menú principal y selección de modo
muteToggleButton.addEventListener('click', () => { playSound(clickSound); toggleMusic(); });
modeChronoButton.addEventListener('click', () => { playSound(clickSound); showTimeSelection('chrono'); });
// MODIFICACIÓN: Llamar a la nueva función de selección de tiempo
modeSuddenDeathButton.addEventListener('click', () => { playSound(clickSound); showSuddenDeathTimeSelection(); }); 
modeFreeButton.addEventListener('click', () => { playSound(clickSound); showFreeSelection(); });

// Selección de tiempo y nombre
// ELIMINAR EL LISTENER ORIGINAL, ahora se maneja en ui-manager.js porque el contenido es dinámico.
// timeButtons.forEach(button => {
//     button.addEventListener('click', () => { 
//         playSound(clickSound);
//         initialTime = parseInt(button.getAttribute('data-time'));
//         timeLeft = initialTime;
//         showPlayerNameModal('chrono');
//     });
// });

function setPlayerName() {
    if (!playerNameInput.value.trim()) {
        restartAnimation(playerNameInput, 'shake');
        showToast('Escribe tu nombre para empezar', 'warn');
        playerNameInput.focus();
        return;
    }
    playerName = playerNameInput.value.trim().substring(0, 15);
    playerNameModal.style.display = 'none';
    launchGame(gameMode);
}
setNameButton.addEventListener('click', setPlayerName);
playerNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') setPlayerName(); });

// Controles durante el juego
optionButtons.forEach(button => { button.addEventListener('click', handleAnswer); });
nextQuestionButton.addEventListener('click', () => {
    if (!gameStarted) return;
    playSound(clickSound);
    resetOptionStyles();
    feedbackMessage.style.opacity = '0';
    generateNewQuestion();
    enableOptions(true);
    nextQuestionButton.style.display = 'none'; 
});
mainMenuButton.addEventListener('click', async () => {
    playSound(clickSound);
    if (isTeacherMode() && currentStudent && gameStarted) {
        // Práctica libre del modo docente: terminar = guardar la partida
        if (gameMode === 'free') { endGame(); return; }
        const leave = await confirmDialog('El resultado no se guardará.', { title: '¿Abandonar la partida?', icon: '🚪', okText: 'Abandonar', cancelText: 'Seguir jugando', danger: true });
        // si la partida terminó mientras el diálogo estaba abierto, ya se muestra su resultado
        if (!leave || !gameStarted) return;
    }
    showModeSelection(false);
});

// Controles post-partida (ranking)
modeSelectButton.addEventListener('click', () => { playSound(clickSound); showModeSelection(false); });
samePlayerButton.addEventListener('click', () => {
    rankingModal.style.display = 'none';
    stopBGM();
    launchGame(gameMode);
});
otherPlayerButton.addEventListener('click', () => {
    playSound(clickSound);
    rankingModal.style.display = 'none';
    playerName = ''; 
    playerNameInput.value = ''; 
    showPlayerNameModal(gameMode); 
    playerNameInput.focus();
});