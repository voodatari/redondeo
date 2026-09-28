// --- LÓGICA DE RANKING (LOCALSTORAGE) ---
let scores = []; 

function loadRanking(mode) {
    if (!mode || mode === 'free') {
        scores = [];
        return;
    }
    try {
        const rankingKey = `redondeoRanking_${mode}`;
        const storedScores = localStorage.getItem(rankingKey);
        scores = storedScores ? JSON.parse(storedScores) : [];
    } catch (e) {
        console.error(`Error leyendo ranking para el modo ${mode}:`, e);
        scores = [];
    }
}

function saveScore(name, finalScore, mode) {
    if (!mode || mode === 'free') {
        return;
    }
    loadRanking(mode);
    const sanitizedName = (name && name.trim()) ? name.trim().substring(0, 15) : 'Anon.';

    scores.push({ name: sanitizedName, score: finalScore, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);

    scores = scores.slice(0, 10); 

    try {
        const rankingKey = `redondeoRanking_${mode}`;
        localStorage.setItem(rankingKey, JSON.stringify(scores));
    } catch (e) {
        console.error(`Error guardando ranking para el modo ${mode}:`, e);
    }
}

function displayRanking(currentPlayerName, currentPlayerScore, mode) {
    const rankingTable = document.getElementById('ranking-table');
    const rankingTitle = document.querySelector('#ranking-modal h3');
    const resetRankingButton = document.getElementById('reset-ranking-button'); // Añadido

    if (mode === 'free') {
        if (rankingTable) rankingTable.style.display = 'none';
        if (rankingTitle) rankingTitle.style.display = 'none';
        if (resetRankingButton) resetRankingButton.style.display = 'none'; // Añadido
        return;
    }
    
    if (rankingTable) rankingTable.style.display = 'table';
    if (rankingTitle) rankingTitle.style.display = 'block';

    loadRanking(mode);
    
    // --- INICIO CÓDIGO AÑADIDO ---
    if (resetRankingButton) {
        if (!scores || scores.length === 0) {
            resetRankingButton.style.display = 'none';
        } else {
            resetRankingButton.style.display = 'block'; 
            const newButton = resetRankingButton.cloneNode(true);
            resetRankingButton.parentNode.replaceChild(newButton, resetRankingButton);
            newButton.addEventListener('click', () => resetRanking(mode));
        }
    }
    // --- FIN CÓDIGO AÑADIDO ---
    
    rankingTableBody.innerHTML = '';

    if (!scores || scores.length === 0) {
        const modeName = mode === 'chrono' ? 'Contrarreloj' : 'Muerte Súbita';
        rankingTableBody.innerHTML = `<tr><td colspan="3">No hay puntajes para el modo ${modeName}.</td></tr>`;
        return;
    }
    
    let highlighted = false;
    scores.slice(0, 5).forEach((player, index) => { 
        const row = rankingTableBody.insertRow();
        
        const isCurrentPlayer = !highlighted &&
                              currentPlayerName &&
                              currentPlayerScore !== null &&
                              player.name === currentPlayerName &&
                              player.score === currentPlayerScore;
        
        if (isCurrentPlayer) {
            row.classList.add('you-score');
            highlighted = true;
        }

        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = player.name;
        row.insertCell().textContent = player.score;
    });
}

// --- INICIO FUNCIÓN AÑADIDA ---
async function resetRanking(mode) {
    if (!mode || mode === 'free') return;

    const modeName = mode === 'chrono' ? 'Contrarreloj' : 'Muerte Súbita';
    if (await confirmDialog('Se borrarán todas las puntuaciones guardadas en este dispositivo.', { title: `¿Borrar el ranking de ${modeName}?`, icon: '🗑️', okText: 'Borrar', danger: true })) {
        try {
            const rankingKey = `redondeoRanking_${mode}`;
            localStorage.removeItem(rankingKey);
            displayRanking(null, null, mode);
        } catch (e) {
            console.error(`Error reseteando el ranking para el modo ${mode}:`, e);
            showToast('No se pudo borrar el ranking.', 'error');
        }
    }
}
// --- FIN FUNCIÓN AÑADIDA ---