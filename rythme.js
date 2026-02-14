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

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwu82VkAcq3SeWYSEMj4g_-18EDcQGFvlPLFysaOYXiiAO2oszk_W9GR70ohCz4eMZCXw/exec';

let score = 0;
let perfectCombo = 0;
let maxPerfectCombo = 0;
let gameActive = false;
let gameLoop;
let tileSpeed = 6;
let tiles = [];
let isHoldingTrack = [false, false, false, false];
let activeHoldTile = [null, null, null, null];

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
    perfectCombo = 0;
    maxPerfectCombo = 0;
    tiles = [];

    audio.currentTime = 0;
    audio.play();

    gameLoop = setInterval(update, 20);
    spawnTiles();
}

function spawnTiles() {
    if (!gameActive) return;

    // Filter tracks: only pick tracks that don't have a tile in the top 300px
    const safeTracks = [0, 1, 2, 3].filter(tIdx => {
        const tilesOnTrack = tiles.filter(t => t.track === tIdx);
        if (tilesOnTrack.length === 0) return true;

        // Find the top-most part of any tile on this track
        const topMost = Math.min(...tilesOnTrack.map(t => t.top - (t.length || 0)));
        return topMost > 150; // Ensure at least 150px gap from the top spawn point (-100)
    });

    if (safeTracks.length > 0) {
        // Limit to 1 long tile on screen at a time
        const hasLongTile = tiles.some(t => t.length > 0);
        // Increase probability slightly to 30% if no long tile exists
        const wantLong = !hasLongTile && Math.random() < 0.3;

        let trackIndex;
        let isLong = false;

        if (wantLong) {
            // Check availability of Left (0) and Right (3) explicitly
            const canLeft = safeTracks.includes(0);
            const canRight = safeTracks.includes(3);

            if (canLeft && canRight) {
                // Strictly 50/50 chance
                trackIndex = Math.random() < 0.5 ? 0 : 3;
                isLong = true;
            } else if (canLeft) {
                trackIndex = 0;
                isLong = true;
            } else if (canRight) {
                trackIndex = 3;
                isLong = true;
            }
            // If neither is available, we fall through to normal tile selection
        }

        // Fallback: Normal tile on any safe track
        if (trackIndex === undefined) {
            trackIndex = safeTracks[Math.floor(Math.random() * safeTracks.length)];
            isLong = false;
        }

        createTile(trackIndex, isLong ? 300 : 0);
    }

    const intensity = Math.min(score / 10000, 1);
    const minDelay = 400 - (intensity * 150);
    const maxDelay = 800 - (intensity * 300);

    const nextSpawn = Math.random() * (maxDelay - minDelay) + minDelay;
    setTimeout(spawnTiles, nextSpawn);

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
        remainingLength: length,
        hit: false,
        fullyProcessed: false
    });
}

function update() {
    if (!gameActive) return;

    const hitLineY = window.innerHeight - 120 - 4;

    for (let i = tiles.length - 1; i >= 0; i--) {
        const tile = tiles[i];

        if (tile.length > 0 && tile.hit && !tile.fullyProcessed) {
            // PIN HEAD TO HIT LINE WHILE HOLDING
            tile.element.style.top = (hitLineY - 20) + 'px';

            if (isHoldingTrack[tile.track]) {
                const headMultiplier = 1 + (perfectCombo * 0.05);
                score += Math.floor(2 * headMultiplier);
                scoreDisplay.innerText = score;

                // Shrink tail
                tile.remainingLength -= tileSpeed;
                tile.element.style.setProperty('--tail-len', Math.max(0, tile.remainingLength) + 'px');

                if (Math.random() > 0.7) createParticles(tracks[tile.track], hitLineY);

                // If tail is finished
                if (tile.remainingLength <= 0) {
                    tile.fullyProcessed = true;
                    tile.element.classList.remove('holding');
                    tile.element.style.display = 'none';
                }
            } else {
                // PLAYER RELEASED EARLY - Check if they were close enough to the end
                if (tile.remainingLength > 60) {
                    endGame("Note longue relâchée trop tôt ! 🐙");
                    return;
                } else {
                    tile.fullyProcessed = true;
                    tile.element.classList.remove('holding');
                    tile.element.style.display = 'none';
                }
            }
        } else {
            // NORMAL TILE OR LONG TILE NOT YET HIT
            tile.top += tileSpeed;
            tile.element.style.top = tile.top + 'px';
        }

        // Auto-fail if head passes too far before being hit
        if (tile.top > hitLineY + 30 && !tile.hit) {
            endGame("Note manquée ! Naufrage...");
            return;
        }

        // Cleanup tiles that are far gone
        if (tile.top > window.innerHeight + 500) {
            tile.element.remove();
            tiles.splice(i, 1);
        }
    }

    if (audio.ended) endGame();
}

function hit(trackIndex) {
    if (!gameActive) return;
    isHoldingTrack[trackIndex] = true;

    const hitLineY = window.innerHeight - 120 - 4;
    const activeTiles = tiles.filter(t => t.track === trackIndex && !t.hit);

    let hitFound = false;

    activeTiles.forEach(tile => {
        // For long tiles, the head is small (top part), for normal tiles it's the whole block
        const checkPos = tile.top + (tile.length > 0 ? 20 : 40);
        const distance = Math.abs(checkPos - hitLineY);

        if (distance < 80) {
            tile.hit = true;
            createParticles(tracks[trackIndex], hitLineY);

            if (tile.length > 0) {
                activeHoldTile[trackIndex] = tile;
                tile.element.classList.add('holding');
            } else {
                tile.element.classList.add('tile-hit');
            }

            let points = 0;
            let precisionText = "";

            if (distance < 25) {
                points = 100;
                perfectCombo++;
                if (perfectCombo > maxPerfectCombo) maxPerfectCombo = perfectCombo;
                precisionText = "PERFECT!";
            } else {
                points = 50;
                perfectCombo = 0;
                precisionText = distance < 50 ? "BIEN" : "OK";
            }

            const multiplier = 1 + (perfectCombo * 0.1);
            score += Math.floor(points * multiplier);

            scoreDisplay.innerText = score;
            comboDisplay.innerText = perfectCombo > 1 ? `PERFECT x${perfectCombo}` : "";
            comboDisplay.style.color = perfectCombo > 5 ? "#ffcc00" : "#fff";

            showFloatingText(precisionText, tracks[trackIndex], hitLineY);
            hitFound = true;

            if (tile.length === 0) {
                setTimeout(() => {
                    tile.element.remove();
                    tiles = tiles.filter(t => t !== tile);
                }, 200);
            }
        }
    });

    // If no tile hit, it's just a click (no penalty for now to keep it fun)
}

function release(trackIndex) {
    isHoldingTrack[trackIndex] = false;
    activeHoldTile[trackIndex] = null;
}

function createParticles(parent, y) {
    for (let i = 0; i < 4; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 40 + 10;
        p.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');
        p.style.left = '50%';
        p.style.top = y + 'px';
        p.style.animation = 'particle-fade 0.3s forwards';
        parent.appendChild(p);
        setTimeout(() => p.remove(), 300);
    }
}

function showFloatingText(text, parent, y) {
    const ft = document.createElement('div');
    ft.className = 'floating-score';
    ft.style.top = (y - 60) + 'px';
    ft.innerText = text;
    if (text === "PERFECT!") ft.style.color = "#ffcc00";
    parent.appendChild(ft);
    setTimeout(() => ft.remove(), 500);
}

function endGame(reason = "Concert fini !") {
    if (!gameActive) return;
    gameActive = false;
    clearInterval(gameLoop);
    audio.pause();

    const titleElement = document.getElementById('game-over-title');
    const statsElement = document.getElementById('final-stats');

    if (reason === "Concert fini !") {
        titleElement.innerText = "CONCERT FINI ! ⚓";
        statsElement.innerHTML = `Score: <b>${score}</b><br><br><span style="color: #c8b273; font-size: 1.1rem; display: block; padding: 10px; background: rgba(200, 178, 115, 0.1); border-radius: 10px;">🎁 Bravo ! Viens chercher ton lot au stand <b>Cap'Icam</b> avec cette preuve de réussite !</span>`;

        // Save Success to Google Sheet
        const name = playerNameInput.value.trim();
        fetch(GOOGLE_SCRIPT_URL + `?action=addRythme&name=${encodeURIComponent(name)}&score=${score}`, {
            method: 'POST',
            mode: 'no-cors'
        }).catch(err => console.error("Error logging success:", err));

    } else {
        titleElement.innerText = "NAUFRAGE ! 🐙";
        statsElement.innerText = reason + " (Score: " + score + ")";
    }

    gameOverScreen.style.display = 'flex';
}

window.addEventListener('keydown', (e) => {
    const keys = { 's': 0, 'd': 1, 'k': 2, 'l': 3 };
    const idx = keys[e.key.toLowerCase()];
    if (idx !== undefined) hit(idx);
});

window.addEventListener('keyup', (e) => {
    const keys = { 's': 0, 'd': 1, 'k': 2, 'l': 3 };
    const idx = keys[e.key.toLowerCase()];
    if (idx !== undefined) release(idx);
});

document.querySelectorAll('.touch-zone').forEach((zone, index) => {
    zone.addEventListener('touchstart', (e) => { e.preventDefault(); hit(index); }, { passive: false });
    zone.addEventListener('touchend', (e) => { e.preventDefault(); release(index); }, { passive: false });
});
