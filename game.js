const ship = document.getElementById('ship');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('finalScore');
const punchlineDisplay = document.getElementById('punchline');
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

// Online Leaderboard URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyJG1Umt06zomtl9rZit_tY7JrGoh5S8WpmYIV2FSp3COI7mMNu0Vv7XxvWca8J9RZhag/exec';

function updateLeaderboard() {
    leaderboardList.innerHTML = '<div class="loading-container"><div class="spinner"></div><span>Recherche des meilleurs marins...</span></div>';

    fetch(GOOGLE_SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            leaderboardList.innerHTML = '';
            // Data is already sorted and limited to top 3 by Google Script
            data.forEach(entry => {
                const div = document.createElement('div');
                div.className = 'score-entry';
                div.innerHTML = `<span>${entry.name}</span><span>${entry.score}</span>`;
                leaderboardList.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Error fetching leaderboard:', error);
            leaderboardList.innerHTML = '<div class="score-entry"><span>Erreur connexion</span><span>❌</span></div>';
        });
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
    createObstacle(window.innerWidth * 0.7); // Create first obstacle already visible at 70% of screen
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

function createObstacle(initialX) {
    const gapHeight = 200; // Gap size for ship to pass
    const obstacleWidth = 60;
    const minHeight = 50;
    const maxHeight = window.innerHeight - gapHeight - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);

    const startX = (initialX !== undefined) ? initialX : window.innerWidth;

    const obstacleTop = document.createElement('div');
    obstacleTop.classList.add('obstacle', 'obstacle-top');
    obstacleTop.style.height = topHeight + 'px';
    obstacleTop.style.left = startX + 'px';

    const obstacleBottom = document.createElement('div');
    obstacleBottom.classList.add('obstacle', 'obstacle-bottom');
    obstacleBottom.style.height = (window.innerHeight - gapHeight - topHeight) + 'px';
    obstacleBottom.style.left = startX + 'px';

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
        if (topRect.right < shipRect.left && !obs.passed) {
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

    // Random Punchline
    const punchlines = [
        "Sombré comme ta moyenne de maths...",
        "Cap'Icam coule ? Jamais ! Toi par contre...",
        "Même le Titanic a fait mieux.",
        "Encore un qui a bu trop de canouche !"
    ];
    punchlineDisplay.innerText = punchlines[Math.floor(Math.random() * punchlines.length)];

    gameOverScreen.style.display = 'flex';

    // Save Score Online
    const name = playerNameInput.value.trim();

    // Send score to Google Sheet
    fetch(GOOGLE_SCRIPT_URL + `?action=addScore&name=${encodeURIComponent(name)}&score=${score}`, {
        method: 'POST',
        mode: 'no-cors' // Important for Google Script
    })
        .then(() => {
            console.log("Score sent!");
            // Refresh leaderboard after sending
            setTimeout(updateLeaderboard, 1000); // Small delay to let Sheet update
        })
        .catch(err => console.error("Error sending score:", err));
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
