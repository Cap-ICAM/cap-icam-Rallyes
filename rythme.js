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
let tileSpeed = 5; // Pixels per frame
let tiles = [];

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

    // We generate a few tiles based on a loose rhythm
    // real rhythm games use a JSON map of timestamps.
    // Here we generate randomly but on a grid to feel "musical"
    const randomTrack = Math.floor(Math.random() * 4);
    createTile(randomTrack);

    // Spawn next tile between 400ms and 800ms
    const nextSpawn = Math.random() * 400 + 300;
    setTimeout(spawnTiles, nextSpawn);
}

function createTile(trackIndex) {
    const tileDiv = document.createElement('div');
    tileDiv.className = 'tile';
    tileDiv.style.top = '-100px';
    tracks[trackIndex].appendChild(tileDiv);

    tiles.push({
        element: tileDiv,
        track: trackIndex,
        top: -100,
        hit: false
    });
}

function update() {
    if (!gameActive) return;

    const hitLineY = window.innerHeight - 120 - 4; // bottom - hit-line height

    tiles.forEach((tile, index) => {
        tile.top += tileSpeed;
        tile.element.style.top = tile.top + 'px';

        // Auto-fail if tile passes hit line
        if (tile.top > hitLineY + 20 && !tile.hit) {
            endGame("Tu as manqué une note ! Naufrage...");
            return;
        }
    });

    // End game if music finished
    if (audio.ended) {
        endGame();
    }
}

function hit(trackIndex) {
    if (!gameActive) return;

    const hitLineY = window.innerHeight - 120 - 4;

    // Find tiles in the current track close to hit line
    const activeTiles = tiles.filter(t => t.track === trackIndex && !t.hit);

    let hitFound = false;

    activeTiles.forEach(tile => {
        // Distance between tile bottom and hit line
        const distance = Math.abs((tile.top + 80) - (hitLineY));

        if (distance < 60) { // Hit window
            tile.hit = true;
            tile.element.classList.add('tile-hit');

            // Calculate precision
            let points = 0;
            if (distance < 15) {
                points = 100; // Perfect
                showFloatingText("PERFECT!", tracks[trackIndex]);
            } else if (distance < 35) {
                points = 50;  // Good
            } else {
                points = 20;  // OK
            }

            score += points;
            combo++;
            if (combo > maxCombo) maxCombo = combo;

            scoreDisplay.innerText = score;
            comboDisplay.innerText = `COMBO x${combo}`;

            hitFound = true;

            // Remove element after animation
            setTimeout(() => {
                tile.element.remove();
                tiles = tiles.filter(t => t !== tile);
            }, 200);
        }
    });

    if (!hitFound) {
        // Punish for clicking empty track? 
        // miss(); // Optional: too hard for casuals
    }
}

function miss() {
    combo = 0;
    comboDisplay.innerText = `COMBO x0`;
    // Maybe a visual effect for miss
}

function showFloatingText(text, parent) {
    const ft = document.createElement('div');
    ft.style.position = 'absolute';
    ft.style.bottom = '150px';
    ft.style.width = '100%';
    ft.style.textAlign = 'center';
    ft.style.color = '#fff';
    ft.style.fontWeight = '800';
    ft.style.animation = 'vanish 0.5s forwards';
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
