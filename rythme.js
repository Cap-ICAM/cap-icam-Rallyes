const tracks = [
    document.getElementById('track-0'),
    document.getElementById('track-1'),
    document.getElementById('track-2'),
    document.getElementById('track-3')
];
const audio = document.getElementById('audio-player');
const scoreDisplay = document.getElementById('score-display');
const comboDisplay = document.getElementById('combo-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const playerNameInput = document.getElementById('playerName');

let score = 0;
let combo = 0;
let maxCombo = 0;
let gameActive = false;
let gameLoop;
let tileSpeed = 6; // Pixels per frame
let tiles = [];
let isHoldingTrack = [false, false, false, false];
let activeHoldTile = [null, null, null, null];

// Pre-fill name from localStorage
const storedName = localStorage.getItem('capIcamPlayerName');
if (storedName) playerNameInput.value = storedName;

function startGame() {
    const name = playerNameInput.value.trim();
    if (!name || name.split(' ').length < 2) {
        alert("Entre ton Prénom et ton NOM pour jouer !");
        return;
    }
    localStorage.setItem('capIcamPlayerName', name);

    startScreen.style.display = 'none';
    gameActive = true;
    score = 0;
    combo = 0;
    maxCombo = 0;

    // Start Audio
    audio.currentTime = 0;
    audio.play();

    // Start Game Loop
    gameLoop = setInterval(update, 20);

    // Initial tile generator (simulated rhythm)
    spawnTiles();
}

function spawnTiles() {
    if (!gameActive) return;

    const randomTrack = Math.floor(Math.random() * 4);

    // 20% chance for a long tile
    const isLong = Math.random() < 0.2;
    createTile(randomTrack, isLong ? 250 : 0);

    // Spawn timing based on combo (intensity)
    const intensity = Math.min(combo / 50, 1);
    const minDelay = 400 - (intensity * 150);
    const maxDelay = 800 - (intensity * 300);

    const nextSpawn = Math.random() * (maxDelay - minDelay) + minDelay;
    setTimeout(spawnTiles, nextSpawn);

    // Update wave speed based on intensity in background
    document.querySelectorAll('.parallax > use').forEach(u => {
        u.style.animationDuration = (10 - (intensity * 6)) + 's';
    });
}

function createTile(trackIndex, length = 0) {
    const tileDiv = document.createElement('div');
    tileDiv.className = length > 0 ? 'tile long-tile' : 'tile';
    tileDiv.style.top = '-100px';

    if (length > 0) {
        tileDiv.style.height = '40px';
        const tail = document.createElement('div');
        tail.className = 'long-tile-tail';
        tail.style.setProperty('--tail-len', length + 'px');
        tileDiv.appendChild(tail);
    }

    tracks[trackIndex].appendChild(tileDiv);

    tiles.push({
        element: tileDiv,
        track: trackIndex,
        top: -100,
        length: length,
        hit: false,
        fullyProcessed: false
    });
}

function update() {
    if (!gameActive) return;

    const hitLineY = window.innerHeight - 120 - 4; // bottom - hit-line height

    tiles.forEach((tile, index) => {
        tile.top += tileSpeed;
        tile.element.style.top = tile.top + 'px';

        // Long tile processing
        if (tile.length > 0 && tile.hit && !tile.fullyProcessed) {
            // Check if player still holding
            if (isHoldingTrack[tile.track]) {
                score += 2; // Small points for holding
                scoreDisplay.innerText = score;
                createParticles(tracks[tile.track], hitLineY);
            } else {
                // Let go too early!
                tile.fullyProcessed = true;
                tile.element.classList.remove('holding');
            }
        }

        // Auto-fail if tile head or tail passes hit line
        const tailEnd = tile.length > 0 ? tile.top + 80 + tile.length : tile.top + 80;
        if (tile.top > hitLineY + 20 && !tile.hit) {
            endGame("Tu as manqué une note ! Naufrage...");
            return;
        }

        // Remove tile when tail is fully gone
        if (tile.top > window.innerHeight) {
            tile.element.remove();
            tiles.splice(index, 1);
        }
    });

    // End game if music finished
    if (audio.ended) {
        endGame();
    }
}

function hit(trackIndex) {
    if (!gameActive) return;
    isHoldingTrack[trackIndex] = true;

    const hitLineY = window.innerHeight - 120 - 4;
    const activeTiles = tiles.filter(t => t.track === trackIndex && !t.hit);
    let hitFound = false;

    activeTiles.forEach(tile => {
        const headPos = tile.top + (tile.length > 0 ? 40 : 80);
        const distance = Math.abs(headPos - hitLineY);

        if (distance < 70) {
            tile.hit = true;
            createParticles(tracks[trackIndex], hitLineY);

            if (tile.length > 0) {
                activeHoldTile[trackIndex] = tile;
                tile.element.classList.add('holding');
            } else {
                tile.element.classList.add('tile-hit');
            }

            let points = 0;
            if (distance < 20) {
                points = 100;
                showFloatingText("PERFECT!", tracks[trackIndex], hitLineY);
            } else if (distance < 40) {
                points = 50;
                showFloatingText("BIEN!", tracks[trackIndex], hitLineY);
            } else {
                points = 20;
            }

            score += points;
            combo++;
            if (combo > maxCombo) maxCombo = combo;

            scoreDisplay.innerText = score;
            comboDisplay.innerText = `COMBO x${combo}`;
            hitFound = true;

            if (tile.length === 0) {
                setTimeout(() => {
                    tile.element.remove();
                    tiles = tiles.filter(t => t !== tile);
                }, 200);
            }
        }
    });
}

function release(trackIndex) {
    isHoldingTrack[trackIndex] = false;
    const tile = activeHoldTile[trackIndex];
    if (tile) {
        tile.fullyProcessed = true;
        tile.element.classList.remove('holding');
        activeHoldTile[trackIndex] = null;
    }
}

function createParticles(parent, y) {
    for (let i = 0; i < 5; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 50 + 20;
        p.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');
        p.style.left = '50%';
        p.style.top = y + 'px';
        p.style.animation = 'particle-fade 0.4s forwards';
        parent.appendChild(p);
        setTimeout(() => p.remove(), 400);
    }
}

function showFloatingText(text, parent, y) {
    const ft = document.createElement('div');
    ft.className = 'floating-score';
    ft.style.top = (y - 50) + 'px';
    ft.innerText = text;
    parent.appendChild(ft);
    setTimeout(() => ft.remove(), 500);
}

function endGame(reason = "Concert fini !") {
    gameActive = false;
    clearInterval(gameLoop);
    audio.pause();

    const titleObj = document.getElementById('game-over-title');
    const statsObj = document.getElementById('final-stats');

    if (titleObj) titleObj.innerText = reason === "Concert fini !" ? "CONCERT FINI ! ⚓" : "OH NON ! 🐙";
    if (statsObj) statsObj.innerText = reason + " (Score: " + score + ")";

    gameOverScreen.style.display = 'flex';
}

// Key Listeners
window.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case 's': hit(0); break;
        case 'd': hit(1); break;
        case 'k': hit(2); break;
        case 'l': hit(3); break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
        case 's': release(0); break;
        case 'd': release(1); break;
        case 'k': release(2); break;
        case 'l': release(3); break;
    }
});

// Mobile Touch Listeners
document.querySelectorAll('.touch-zone').forEach((zone, index) => {
    zone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        hit(index);
    }, { passive: false });

    zone.addEventListener('touchend', (e) => {
        e.preventDefault();
        release(index);
    }, { passive: false });

    // Also support mouse for PC debugging
    zone.addEventListener('mousedown', (e) => {
        hit(index);
    });
    zone.addEventListener('mouseup', (e) => {
        release(index);
    });
});
