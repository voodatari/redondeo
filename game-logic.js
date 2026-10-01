// --- LÓGICA PRINCIPAL DEL JUEGO ---

// Nuevas variables para el temporizador por pregunta
let questionTimer = null;
let currentQuestionTimeLeft = 0;
let streak = 0; // aciertos seguidos (efecto visual)


function startContest(mode) {
    gameMode = mode;
    score = 0;
    errors = 0;
    totalTimeElapsed = 0;
    startTime = Date.now();
    streak = 0;
    updateStreak(0);
    updatePlayerChip();
    // En modo docente la práctica libre se termina (y se guarda) con este botón
    mainMenuButton.textContent = (isTeacherMode() && currentStudent && mode === 'free')
        ? '✅ Terminar y guardar'
        : 'Volver al Menú Principal';

    rightInfoDisplay.classList.remove('time-warning');
    rightInfoDisplay.style.display = 'inline'; 
    centerTimeDisplay.style.display = 'none'; 
    
    gameContainer.classList.remove('game-content-hidden'); 
    stopFreeModeTimer();
    // Detener temporizador de pregunta si estaba activo
    stopQuestionTimer(); 
    
    modeSelectionModal.style.display = 'none'; 
    timeSelectionModal.style.display = 'none';
    playerNameModal.style.display = 'none';
    rankingModal.style.display = 'none';
    
    stopBGM();

    playSound(startSound);
    gameStarted = true; 
    mainMenuButton.style.display = 'block'; 

    if (gameMode === 'chrono') {
         gameTitleEl.textContent = 'Modo Contrarreloj';
         timeLeft = initialTime;
         rightInfoDisplay.textContent = `Tiempo: ${timeLeft}s`;
         if (nextQuestionButton) nextQuestionButton.style.display = 'none';
         startChronoTimer();
         playBGM('2.mp3'); 
    } else if (gameMode === 'sudden_death') {
         gameTitleEl.textContent = 'Muerte Súbita';
         startTime = Date.now(); 
         rightInfoDisplay.textContent = `Tiempo: 0s`; // Muestra el tiempo total transcurrido
         centerTimeDisplay.style.display = 'block'; // Muestra el tiempo por pregunta
         if (nextQuestionButton) nextQuestionButton.style.display = 'none';
         startSuddenDeathTimer(); // Temporizador que mide el tiempo total de la partida
         playBGM('3.mp3');
    } else { // free
         gameTitleEl.textContent = 'Práctica Libre';
         rightInfoDisplay.textContent = `Errores: ${errors}`;
         if (nextQuestionButton) nextQuestionButton.style.display = 'none'; 
         startFreeModeTimer(); 
         playBGM('1.mp3');
    }
    
    scoreDisplay.textContent = `Puntuación: ${score}`;
    generateNewQuestion();
    enableOptions(true);
}

function handleAnswer(event) {
    if (!gameStarted) return; 
    
    const selectedButton = event.currentTarget;
    const selectedAnswer = parseInt(selectedButton.value);

    enableOptions(false);
    
    // Parar temporizador de pregunta al contestar en Muerte Súbita
    if (gameMode === 'sudden_death') {
        stopQuestionTimer();
    }
    
    if (gameMode === 'free') {
         // stopFreeModeTimer deja el intervalo a null: así endGame no vuelve a sumar este tramo
         if (freeModeTimerInterval && freeModeTimerStartTime > 0) {
            totalTimeElapsed += (Date.now() - freeModeTimerStartTime) / 1000;
         }
         stopFreeModeTimer();
    }

    if (selectedAnswer === correctAnswer) {
        score++;
        streak++;
        playSound(aciertoSound);
        updateFeedback('¡Correcto!', true);
        floatText('+1', selectedButton);
        updateStreak(streak);
        restartAnimation(scoreDisplay, 'score-bump');

        if (gameMode === 'chrono' || gameMode === 'sudden_death') {
            autoAdvanceTimeout = setTimeout(() => {
                if (gameStarted) { 
                    resetOptionStyles();
                    feedbackMessage.style.opacity = '0';
                    generateNewQuestion();
                    enableOptions(true);
                }
            }, 500); 
        } else {
            if (nextQuestionButton) nextQuestionButton.style.display = 'block';
        }

    } else {
        errors++;
        streak = 0;
        playSound(errorSound);
        updateFeedback('Incorrecto.', false);
        updateStreak(0);
        restartAnimation(document.getElementById('options-container'), 'shake');
        const correctBtn = optionButtons.find(btn => parseInt(btn.value) === correctAnswer);
        if (correctBtn) correctBtn.classList.add('correct-answer');
        
        selectedButton.classList.add('incorrect-choice');
        
        if (gameMode === 'sudden_death') {
             // Termina el juego inmediatamente por error.
             if (timerInterval) clearInterval(timerInterval); 
             setTimeout(() => endGame(true), 1500); 
             return; 
        }
        
        if (gameMode === 'chrono') {
            autoAdvanceTimeout = setTimeout(() => {
                if (gameStarted) { 
                    resetOptionStyles();
                    feedbackMessage.style.opacity = '0';
                    generateNewQuestion();
                    enableOptions(true);
                }
            }, 500); 
        }
        
        if (gameMode === 'free') {
            rightInfoDisplay.textContent = `Errores: ${errors}`; 
            if (nextQuestionButton) nextQuestionButton.style.display = 'block';
        }
    }

    selectedButton.classList.add(selectedAnswer === correctAnswer ? 'correct-answer' : 'incorrect-choice');
    scoreDisplay.textContent = `Puntuación: ${score}`;
    
    if (gameMode === 'free' && !correctAnswer) { 
        centerTimeDisplay.textContent = `Tiempo: ${formatTime(totalTimeElapsed)}`;
    }
}

function generateNewQuestion() {
    if (!gameStarted) return; 

    if (gameMode === 'free') startFreeModeTimer(); 

    // Reinicia el temporizador por pregunta si está en Muerte Súbita
    if (gameMode === 'sudden_death') {
        startQuestionTimer(); 
    }

    const units = [10, 100, 1000, 10000];
    const unitNames = {
        10: 'la decena', 100: 'la centena', 1000: 'la unidad de millar', 10000: 'la decena de millar'
    };

    const powerOfTen = units[Math.floor(Math.random() * units.length)];
    currentUnit = unitNames[powerOfTen];

    const minNum = powerOfTen * 5;
    const maxNum = 100000;
    currentNumber = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;

    correctAnswer = Math.round(currentNumber / powerOfTen) * powerOfTen;

    const numStr = currentNumber.toString();
    const unitIndexFromRight = Math.log10(powerOfTen);
    const highlightIndex = numStr.length - 1 - unitIndexFromRight;

    // Cifras agrupadas de tres en tres con punto de miles / millones (si está activado en Opciones)
    let highlightedHtml = '';
    let i = 0;
    Ajustes.gruposDeMiles(currentNumber).forEach((group, g) => {
        if (g > 0) highlightedHtml += '<span class="thousands-dot">.</span>';
        for (const digit of group) {
            highlightedHtml += (i === highlightIndex) ? `<span class="highlighted-digit">${digit}</span>` : `<span>${digit}</span>`;
            i++;
        }
    });
    
    let distractors = new Set();
    while (distractors.size < 2) {
        let offset = (Math.floor(Math.random() * 2) * 2 - 1) * powerOfTen;
        let newDistractor = correctAnswer + offset;
        if (newDistractor !== correctAnswer && newDistractor > 0) distractors.add(newDistractor);
    }
    const allOptions = [correctAnswer, ...Array.from(distractors)];
    allOptions.sort(() => Math.random() - 0.5);

    numberToRoundEl.innerHTML = highlightedHtml;
    roundingUnitEl.textContent = `a ${currentUnit} más cercana.`;
    restartAnimation(numberToRoundEl, 'q-pop');

    optionButtons.forEach((button, index) => {
        button.textContent = Ajustes.formatear(allOptions[index]);
        button.value = allOptions[index];
        restartAnimation(button, 'opt-flip');
    });
}

function endGame(isSuddenDeathError = false) {
    gameStarted = false;
    enableOptions(false);
    
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (autoAdvanceTimeout) { clearTimeout(autoAdvanceTimeout); autoAdvanceTimeout = null; }
    // En práctica libre se suma el tiempo de la pregunta en curso
    if (gameMode === 'free' && freeModeTimerInterval && freeModeTimerStartTime > 0) {
        totalTimeElapsed += (Date.now() - freeModeTimerStartTime) / 1000;
    }
    stopFreeModeTimer();
    stopQuestionTimer(); // Detiene el temporizador de pregunta
    stopBGM();
    if (isMusicOn) playBGM('fin.mp3');

    resetOptionStyles();
    updateStreak(0);
    feedbackMessage.style.opacity = '0';
    feedbackMessage.textContent = ''; 
    numberToRoundEl.textContent = 'Juego Terminado.'; 
    roundingUnitEl.textContent = ''; 
    mainMenuButton.style.display = 'none'; 
    rightInfoDisplay.style.display = 'none'; 
    centerTimeDisplay.style.display = 'none'; 

    // Duración de la partida (en contrarreloj, el tiempo elegido)
    const finalTime = (gameMode === 'chrono') ? initialTime
                    : (gameMode === 'free') ? totalTimeElapsed
                    : (Date.now() - startTime) / 1000;

    // Modo docente: se registra la partida del alumno en Supabase (sin ranking local)
    const teacherResultPromise = (isTeacherMode() && currentStudent)
        ? recordTeacherGame({ mode: gameMode, score, errors, duration: finalTime })
        : null;

    if (gameMode === 'chrono' || gameMode === 'sudden_death') {
         const modeName = gameMode === 'chrono' ? 'Contrarreloj' : 'Muerte Súbita';
         let endGameMessage = '';

         if (gameMode === 'chrono') {
             endGameMessage = '¡Tiempo Agotado!';
         } else { // sudden_death
             if (isSuddenDeathError) {
                 endGameMessage = '¡Error! Muerte Súbita';
             } else {
                 endGameMessage = '¡Tiempo de Pregunta Agotado!';
             }
         }

         endGameTitle.textContent = endGameMessage;
         summaryApsEl.textContent = (finalTime > 0) ? (score / finalTime).toFixed(2) : '0.00';

         if (!teacherResultPromise) {
             samePlayerButton.textContent = `Reintentar (${modeName})`;
             otherPlayerButton.textContent = `Cambiar Jugador (${modeName})`;

             hideTeacherResult();
             saveScore(playerName, score, gameMode);
             displayRanking(playerName, score, gameMode);
             samePlayerButton.style.display = 'block';
             otherPlayerButton.style.display = 'block';
         }
    } else {
         endGameTitle.textContent = '¡Práctica Finalizada!';
         const aps = (totalTimeElapsed > 0) ? (score / totalTimeElapsed).toFixed(2) : '0.00';
         summaryApsEl.textContent = `(${formatTime(totalTimeElapsed)} total) Aciertos/seg: ${aps}`;
         if (!teacherResultPromise) {
             hideTeacherResult();
             displayRanking(null, null, gameMode);
             samePlayerButton.style.display = 'none';
             otherPlayerButton.style.display = 'none';
         }
    }

    summaryTotalEl.textContent = score + errors;
    summaryCorrectEl.textContent = score;
    summaryIncorrectEl.textContent = errors;
    if (teacherResultPromise) showTeacherResult(teacherResultPromise);
    rankingModal.style.display = 'flex';
}

// NUEVAS FUNCIONES DE TEMPORIZADOR POR PREGUNTA (MUERTE SÚBITA)
function startQuestionTimer() {
    // Limpia cualquier temporizador anterior
    if (questionTimer) {
        clearInterval(questionTimer);
        questionTimer = null;
    }
    
    // Si el límite es Infinito, no iniciamos el temporizador
    if (suddenDeathTimeLimit === Infinity || suddenDeathTimeLimit <= 0) {
        // MODIFICACIÓN 1: Texto para el modo "Infinito"
        centerTimeDisplay.textContent = 'Tienes tiempo infinito.'; 
        centerTimeDisplay.classList.remove('time-warning');
        return; 
    }
    
    currentQuestionTimeLeft = suddenDeathTimeLimit;
    
    // MODIFICACIÓN 2: Texto inicial del temporizador
    centerTimeDisplay.textContent = `Tienes ${currentQuestionTimeLeft} s.`;
    
    questionTimer = setInterval(() => {
        currentQuestionTimeLeft--;
        
        // MODIFICACIÓN 3: Texto durante la cuenta atrás
        centerTimeDisplay.textContent = `Tienes ${currentQuestionTimeLeft} s.`;
        
        if (currentQuestionTimeLeft <= 5 && currentQuestionTimeLeft > 0) {
            centerTimeDisplay.classList.add('time-warning');
            playSound(timeWarningSound, 0.7); 
        } else {
            centerTimeDisplay.classList.remove('time-warning');
        }

        if (currentQuestionTimeLeft <= 0) {
            clearInterval(questionTimer);
            questionTimer = null;
            handleTimeout();
        }
    }, 1000);
}

function stopQuestionTimer() {
    if (questionTimer) {
        clearInterval(questionTimer);
        questionTimer = null;
    }
    centerTimeDisplay.classList.remove('time-warning');
}


function handleTimeout() {
    if (gameMode === 'sudden_death') {
        updateFeedback('¡Tiempo agotado! ⌛', false);
        playSound(errorSound);
        enableOptions(false);
        // Llama a endGame con 'false' para indicar que el fin fue por tiempo agotado de la pregunta
        endGame(false); 
    }
}

// --- TEMPORIZADORES Y FORMATO ---

function startChronoTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        rightInfoDisplay.textContent = `Tiempo: ${timeLeft}s`;
        rightInfoDisplay.classList.toggle('time-warning', timeLeft <= 10);
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function startSuddenDeathTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const currentElapsed = (Date.now() - startTime) / 1000;
        rightInfoDisplay.textContent = `Tiempo: ${formatTime(currentElapsed)}`;
    }, 1000); 
}

function startFreeModeTimer() {
    if (freeModeTimerInterval) clearInterval(freeModeTimerInterval);
    centerTimeDisplay.style.display = 'inline';
    freeModeTimerStartTime = Date.now(); 
    centerTimeDisplay.textContent = `Tiempo: ${formatTime(totalTimeElapsed)}`;

    freeModeTimerInterval = setInterval(() => {
        totalTimeElapsed += (Date.now() - freeModeTimerStartTime) / 1000;
        freeModeTimerStartTime = Date.now(); 
        centerTimeDisplay.textContent = `Tiempo: ${formatTime(totalTimeElapsed)}`;
    }, 1000); 
}

function stopFreeModeTimer() {
    if (freeModeTimerInterval) clearInterval(freeModeTimerInterval);
    freeModeTimerInterval = null;
}

function formatTime(totalSeconds) {
    const seconds = Math.floor(totalSeconds);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return (seconds < 60) ? `${seconds}s` : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}