const SECRET_WORD = "POMME";
const WORD_LIST = {
    // Top 1000 - Absolute Core (99%+)
    "pomme": 10000,
    "pommier": 9990,
    "fruit": 9980,
    "reinette": 9975,
    "gala": 9970,
    "fuji": 9965,
    "golden": 9960,
    "granny": 9955,
    "pink-lady": 9950,
    "jonagold": 9945,
    "verger": 9900,
    "fruitier": 9880,
    
    // Top 500 - Related Fruits & Food (90-98%)
    "poire": 9700,
    "peche": 9650,
    "abricot": 9640,
    "cerise": 9630,
    "prune": 9620,
    "fraise": 9610,
    "raisin": 9600,
    "banane": 9580,
    "orange": 9560,
    "citron": 9540,
    "manger": 9500,
    "croquer": 9480,
    "croquant": 9460,
    "sucre": 9440,
    "sucree": 9420,
    "acide": 9400,
    "acidule": 9380,
    "jus": 9350,
    "cidre": 9340,
    "compote": 9330,
    "tarte": 9320,
    "crumble": 9310,
    "gateau": 9300,
    "dessert": 9280,
    "vitamine": 9260,
    "sante": 9240,
    "pepin": 9200,
    "trognon": 9180,
    "peau": 9160,
    "eplucher": 9140,
    "quartier": 9120,
    
    // Top 200 - Nature & Garden (70-89%)
    "jardin": 8900,
    "arbre": 8880,
    "branche": 8860,
    "feuille": 8840,
    "fleur": 8820,
    "nature": 8800,
    "terre": 8780,
    "recolte": 8760,
    "cueillir": 8740,
    "panier": 8720,
    "rouge": 8500,
    "vert": 8480,
    "jaune": 8460,
    "colore": 8440,
    
    // Culture & History (50-69%)
    "newton": 6900,
    "gravite": 6880,
    "apple": 6850,
    "macintosh": 6840,
    "iphone": 6830,
    "steve": 6800,
    "jobs": 6780,
    "blanche-neige": 6700,
    "poison": 6680,
    "sorciere": 6660,
    "nain": 6640,
    "adam": 6600,
    "eve": 6580,
    "paradis": 6560,
    "serpent": 6540,
    "tentation": 6520,
    "peche": 6500, // Homonyme but fits both sets
};

let history = [];
let trialCounter = 0;

const form = document.getElementById('guessForm');
const input = document.getElementById('guessInput');
const listElement = document.getElementById('guessesList');
const victoryScreen = document.getElementById('victory-screen');
const lastMeterArea = document.getElementById('last-guess-meter');
const lastMeterFill = document.getElementById('last-meter-fill');
const lastWordText = document.getElementById('last-word-text');
const lastScoreText = document.getElementById('last-score-text');
const tempText = document.getElementById('temperature-text');

function normalize(word) {
    if (!word) return "";
    return word.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function stemWord(word) {
    let w = normalize(word);
    if (w.length <= 3) return w;
    if (w.endsWith('s')) w = w.slice(0, -1);
    if (w.endsWith('x')) w = w.slice(0, -1);
    if (w.endsWith('es')) w = w.slice(0, -2);
    return w;
}

async function isWordValid(word) {
    const norm = normalize(word);
    if (WORD_LIST[norm]) return true;
    if (WORD_LIST[stemWord(norm)]) return true;
    try {
        const response = await fetch(`https://fr.wiktionary.org/w/api.php?action=query&origin=*&format=json&titles=${encodeURIComponent(word)}`);
        const data = await response.json();
        return !data.query.pages["-1"];
    } catch (e) {
        return true; 
    }
}

function calculateScore(word) {
    const norm = normalize(word);
    if (WORD_LIST[norm]) return WORD_LIST[norm];
    const stemmed = stemWord(norm);
    if (WORD_LIST[stemmed]) return WORD_LIST[stemmed] - 5;
    for (let key in WORD_LIST) {
        if (key.startsWith(norm) && norm.length > 3) return WORD_LIST[key] - 10;
        if (norm.startsWith(key) && key.length > 3) return WORD_LIST[key] - 10;
    }
    let score = 0;
    const target = normalize(SECRET_WORD);
    const shared = [...new Set(norm)].filter(c => target.includes(c)).length;
    score += (shared / target.length) * 400;
    const lenDiff = Math.abs(norm.length - target.length);
    score += Math.max(0, 400 - (lenDiff * 80));
    return Math.floor(score / 5);
}

async function addGuess(word) {
    const norm = normalize(word);
    if (!norm) return;
    if (history.find(h => h.word === norm)) {
        renderTable(norm);
        updateLastMeter(history.find(h => h.word === norm));
        return;
    }
    const btn = form.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "...";
    btn.disabled = true;
    const valid = await isWordValid(word);
    btn.innerText = originalText;
    btn.disabled = false;
    if (!valid) {
        alert(`Désolé, je ne connais pas le mot "${word}".`);
        return;
    }
    trialCounter++;
    const score = calculateScore(norm);
    const newGuess = { word: norm, score: score, trial: trialCounter };
    history.push(newGuess);
    updateLastMeter(newGuess);
    history.sort((a, b) => b.score - a.score);
    renderTable(norm);
    if (score === 10000) handleVictory();
}

function getTempColor(score) {
    if (score >= 10000) return '#4ade80';
    if (score >= 9950) return '#ef4444';
    if (score >= 9500) return '#f97316';
    if (score >= 9000) return '#f59e0b';
    if (score >= 7000) return '#fbbf24';
    if (score >= 3000) return '#60a5fa';
    return '#94a3b8';
}

function getTempLabel(score) {
    if (score >= 10000) return "VITAMINE TROUVÉE ! 🍎";
    if (score >= 9950) return "BRÛLANT ! 🔥🔥🔥";
    if (score >= 9800) return "TRÈS CHAUD ! 🔥🔥";
    if (score >= 9000) return "CHAUD ! 🔥";
    if (score >= 7000) return "TIÈDE ! ⛅";
    if (score >= 3000) return "FRAIS... 🧊";
    return "GLACIAL... ❄️";
}

function updateLastMeter(guess) {
    lastMeterArea.style.display = 'flex';
    lastWordText.innerText = guess.word;
    const percentage = (guess.score / 100).toFixed(2);
    lastScoreText.innerText = percentage + "%";
    tempText.innerText = getTempLabel(guess.score);
    tempText.style.color = getTempColor(guess.score);
    lastMeterFill.style.width = '0%';
    lastMeterFill.style.backgroundColor = getTempColor(guess.score);
    setTimeout(() => { lastMeterFill.style.width = percentage + '%'; }, 50);
}

function renderTable(lastWord) {
    listElement.innerHTML = '';
    history.forEach((g) => {
        const row = document.createElement('div');
        row.className = 'guess-row' + (normalize(g.word) === normalize(lastWord) ? ' newest' : '');
        const percentage = (g.score / 100).toFixed(2);
        const color = getTempColor(g.score);
        row.innerHTML = `
            <span style="opacity: 0.5">${g.trial}</span>
            <span style="text-transform: uppercase">${g.word}</span>
            <span style="color: ${color}">${percentage}%</span>
            <div class="row-bar">
                <div class="row-fill" style="width: ${percentage}%; background-color: ${color}"></div>
            </div>
        `;
        listElement.appendChild(row);
    });
}

function handleVictory() {
    victoryScreen.style.display = 'block';
    document.getElementById('reveal-word').innerText = SECRET_WORD;
    form.style.display = 'none';
    lastMeterArea.style.display = 'none';
    confetti({ particleCount: 250, spread: 160, origin: { y: 0.6 }, colors: ['#4ade80', '#ef4444', '#fbbf24'] });
}

form.onsubmit = (e) => { e.preventDefault(); const val = input.value; input.value = ''; addGuess(val); };
window.onload = () => { input.focus(); };
