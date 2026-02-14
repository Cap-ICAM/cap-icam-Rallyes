const ship = document.getElementById('ship');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('finalScore');
const playerNameInput = document.getElementById('playerName');
const leaderboardList = document.getElementById('leaderboard-list');

let shipY = window.innerHeight / 2;
let velocity = 0;
let gravity = 0.6;
let lift = -10; // Jump strength
let isGameRunning = false;
let score = 0;
let obstacles = [];
let gameLoop;
let obstacleLoop;

// Local Storage for High Scores (Simulated Leaderboard)
// In a real app, this would fetch from a database (Google Sheets/Firebase)
let highScores = JSON.parse(localStorage.getItem('capIcamScores')) || [
    { name: "Cap'tain Gus", score: 12 },
    { name: "Chaton", score: 8 },
    { name: "Zbeulix", score: 5 }
];

function updateLeaderboard() {
    // Sort by score descending
    highScores.sort((a, b) => b.score - a.score);
    // Keep top 3
    highScores = highScores.slice(0, 3);

    leaderboardList.innerHTML = '';
    highScores.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'score-entry';
        div.innerHTML = `<span>${entry.name}</span><span>${entry.score}</span>`;
        leaderboardList.appendChild(div);
    });

    localStorage.setItem('capIcamScores', JSON.stringify(highScores));
}

// Initial leaderboard render
updateLeaderboard();

// Auto-fill player name
const storedName = localStorage.getItem('capIcamPlayerName');
if (storedName) {
    playerNameInput.value = storedName;
}

function startGame() {
    const name = playerNameInput.value.trim();
    if (!name || name.split(' ').length < 2) {
        alert("Entrez votre Prénom et NOM complet pour valider votre participation aux lots !");
        return;
    }

    // Save name for next time
    localStorage.setItem('capIcamPlayerName', name);

    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    isGameRunning = true;
    score = 0;
    scoreDisplay.innerText = 0;
    shipY = window.innerHeight / 2;
    velocity = 0;
    obstacles = [];

    // Clear existing obstacles
    document.querySelectorAll('.obstacle').forEach(e => e.remove());

    // Game Loops
    gameLoop = setInterval(updateGame, 20);
    obstacleLoop = setInterval(createObstacle, 2000); // New obstacle every 2s
}

function updateGame() {
    // Gravity
    velocity += gravity;
    shipY += velocity;
    ship.style.top = shipY + 'px';

    // Ship Rotation based on velocity
    ship.style.transform = `rotate(${velocity * 2}deg)`;

    // Boundaries Collision
    if (shipY > window.innerHeight - 40 || shipY < 0) {
        endGame();
    }

    // Obstacles Logic
    moveObstacles();
}

function createObstacle() {
    const gapHeight = 200; // Gap size for ship to pass
    const obstacleWidth = 60;
    const minHeight = 50;
    const maxHeight = window.innerHeight - gapHeight - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);

    const obstacleTop = document.createElement('div');
    obstacleTop.classList.add('obstacle', 'obstacle-top');
    obstacleTop.style.height = topHeight + 'px';
    obstacleTop.style.left = window.innerWidth + 'px';

    const obstacleBottom = document.createElement('div');
    obstacleBottom.classList.add('obstacle', 'obstacle-bottom');
    obstacleBottom.style.height = (window.innerHeight - gapHeight - topHeight) + 'px';
    obstacleBottom.style.left = window.innerWidth + 'px';

    gameContainer.appendChild(obstacleTop);
    gameContainer.appendChild(obstacleBottom);

    obstacles.push({ top: obstacleTop, bottom: obstacleBottom, passed: false });
}

function moveObstacles() {
    obstacles.forEach((obs, index) => {
        let obsLeft = parseInt(obs.top.style.left);
        obsLeft -= 5; // Speed
        obs.top.style.left = obsLeft + 'px';
        obs.bottom.style.left = obsLeft + 'px';

        // Collision Detection
        const shipRect = ship.getBoundingClientRect();
        const topRect = obs.top.getBoundingClientRect();
        const bottomRect = obs.bottom.getBoundingClientRect();

        // Shrink ship hitbox slightly to be forgiving
        const hitMargin = 10;

        if (
            (shipRect.right - hitMargin > topRect.left && shipRect.left + hitMargin < topRect.right &&
                shipRect.top + hitMargin < topRect.bottom) ||
            (shipRect.right - hitMargin > bottomRect.left && shipRect.left + hitMargin < bottomRect.right &&
                shipRect.bottom - hitMargin > bottomRect.top)
        ) {
            endGame();
        }

        // Score Update
        if (obsLeft + 60 < shipRect.left && !obs.passed) {
            score++;
            scoreDisplay.innerText = score;
            obs.passed = true;
        }

        // Remove off-screen obstacles
        if (obsLeft < -60) {
            obs.top.remove();
            obs.bottom.remove();
            obstacles.splice(index, 1);
        }
    });
}

function jump() {
    if (!isGameRunning) return;
    velocity = lift;
}

function endGame() {
    isGameRunning = false;
    clearInterval(gameLoop);
    clearInterval(obstacleLoop);

    finalScoreDisplay.innerText = score;
    gameOverScreen.style.display = 'flex';

    // Save Score
    const name = playerNameInput.value.trim();
    highScores.push({ name: name, score: score });
    updateLeaderboard();
}

function resetGame() {
    startGame();
}

// Controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
});

window.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    jump();
});

window.addEventListener('click', jump);

// --- Music Player Logic ---
const musicBtn = document.getElementById('music-btn');
const audioPlayer = document.getElementById('audio-player');

if (musicBtn && audioPlayer) {
    musicBtn.addEventListener('click', (e) => {
        // Prevent click from triggering jump
        e.stopPropagation();

        if (audioPlayer.paused) {
            audioPlayer.play().then(() => {
                musicBtn.textContent = '⏸️'; // Change icon to Pause
                musicBtn.classList.add('music-playing');
            }).catch(error => {
                console.log("Lecture bloquée : " + error);
            });
        } else {
            audioPlayer.pause();
            musicBtn.textContent = '🎵'; // Change icon back to Music Note
            musicBtn.classList.remove('music-playing');
        }
    });

    // Handle touch on button specifically to prevent jump
    musicBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });
}
