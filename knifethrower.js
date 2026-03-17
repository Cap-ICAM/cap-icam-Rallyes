const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('score-val');
const stageVal = document.getElementById('stage-val');
const knifeStack = document.getElementById('knife-stack');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreVal = document.getElementById('final-score-val');

// Game constants
// Game constants
let TARGET_Y = 250;
let KNIFE_START_Y = 650;
const KNIFE_SPEED = 25;
const TARGET_RADIUS = 100;
const KNIFE_WIDTH = 20;
const KNIFE_HEIGHT = 80;
const COLLISION_TOLERANCE = 0.25; // Roughly 15 degrees in radians

// Game state
let gameRunning = false;
let score = 0;
let stage = 1;
let rotation = 0;
let rotationSpeed = 0.03;
let rotationDirection = 1;
let knivesToThrow = 6;
let knivesRemaining = 6;
let stuckKnives = []; // Array of angles
let currentKnife = null;
let particles = [];
let targetShake = 0;
let flashOpacity = 0;

const targetImg = new Image();
targetImg.src = 'assets/logo.jpg';

// Initialize
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    KNIFE_START_Y = canvas.height - 150;
    TARGET_Y = canvas.height * 0.3;
}

window.addEventListener('resize', init);
init();

// Input
function throwKnife() {
    if (!gameRunning || currentKnife !== null || knivesRemaining <= 0) return;
    
    currentKnife = {
        y: KNIFE_START_Y,
        x: canvas.width / 2
    };
    knivesRemaining--;
    updateKnifeStack();
}

window.addEventListener('mousedown', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') throwKnife();
});
window.addEventListener('touchstart', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
        e.preventDefault();
        throwKnife();
    }
}, { passive: false });

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = Math.random() > 0.5 ? '#c8b273' : '#ffffff';
        this.size = Math.random() * 4 + 2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function update() {
    if (!gameRunning) return;

    // Target rotation
    rotation += rotationSpeed * rotationDirection;
    
    // Rotation logic (random changes in later stages)
    if (stage > 2 && Math.random() < 0.01) rotationDirection *= -1;
    if (stage > 4 && Math.random() < 0.02) rotationSpeed = Math.random() * 0.04 + 0.02;

    // Knife movement
    if (currentKnife) {
        currentKnife.y -= KNIFE_SPEED;

        // Check collision with target
        if (currentKnife.y <= TARGET_Y + TARGET_RADIUS) {
            handleHit();
        }
    }

    // Shake & Flash decay
    if (targetShake > 0) targetShake *= 0.8;
    if (flashOpacity > 0) flashOpacity -= 0.05;

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function handleHit() {
    // Current angle of hit relative to target rotation
    // The top of the target is -Math.PI/2. 
    // We adjust by current total rotation to find fixed spot on the target wheel.
    let hitAngle = -rotation;

    // Check if hit another knife
    let failed = false;
    for (let angle of stuckKnives) {
        let diff = Math.abs(angle - hitAngle);
        while (diff > Math.PI * 2) diff -= Math.PI * 2;
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff < COLLISION_TOLERANCE) {
            failed = true;
            break;
        }
    }

    if (failed) {
        endGame();
    } else {
        stuckKnives.push(hitAngle);
        currentKnife = null;
        score += 10;
        scoreVal.innerText = score;
        
        // Effects
        targetShake = 15;
        flashOpacity = 0.4;
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(canvas.width / 2, TARGET_Y + TARGET_RADIUS));
        }

        // Check stage win
        if (knivesRemaining === 0) {
            setTimeout(nextStage, 500);
        }
    }
}

function nextStage() {
    stage++;
    stageVal.innerText = stage;
    knivesToThrow = 6 + Math.floor(stage / 2);
    knivesRemaining = knivesToThrow;
    stuckKnives = [];
    rotationSpeed = 0.03 + (stage * 0.005);
    updateKnifeStack();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const shakeOffsetX = (Math.random() - 0.5) * targetShake;
    const shakeOffsetY = (Math.random() - 0.5) * targetShake;

    // Background Glow
    const bgGrad = ctx.createRadialGradient(centerX, TARGET_Y, TARGET_RADIUS * 0.5, centerX, TARGET_Y, TARGET_RADIUS * 4);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Particles underneath
    particles.forEach(p => p.draw());

    // Stuck Knives
    stuckKnives.forEach(angle => {
        ctx.save();
        ctx.translate(centerX + shakeOffsetX, TARGET_Y + shakeOffsetY);
        ctx.rotate(rotation + angle);
        
        drawKnifeSprite(0, TARGET_RADIUS - 5, true);
        ctx.restore();
    });

    // Target (Rotating Logo)
    ctx.save();
    ctx.translate(centerX + shakeOffsetX, TARGET_Y + shakeOffsetY);
    ctx.rotate(rotation);
    
    // Outer Ring
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#2d3345';
    ctx.beginPath();
    ctx.arc(0, 0, TARGET_RADIUS + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Wood/Metal texture effect
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(200, 178, 115, 0.4)';
    
    ctx.beginPath();
    ctx.arc(0, 0, TARGET_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw Logo
    try {
        ctx.drawImage(targetImg, -TARGET_RADIUS, -TARGET_RADIUS, TARGET_RADIUS * 2, TARGET_RADIUS * 2);
    } catch(e) {}
    
    // Highlight Overlay
    const highlight = ctx.createRadialGradient(-30, -30, 10, 0, 0, TARGET_RADIUS);
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    highlight.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(0, 0, TARGET_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Flying Knife
    if (currentKnife) {
        drawKnifeSprite(currentKnife.x, currentKnife.y, false);
    } else if (knivesRemaining > 0 && gameRunning) {
        // Ready Knife at bottom
        drawKnifeSprite(centerX, KNIFE_START_Y, false);
    }

    // Flash Effect
    if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

function drawKnifeSprite(x, y, fromCenter) {
    ctx.save();
    if (!fromCenter) {
        ctx.translate(x, y);
    } else {
        ctx.translate(x, y);
    }

    // Handle (Brown)
    ctx.fillStyle = '#451a03';
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'black';
    ctx.fillRect(-KNIFE_WIDTH/4, 20, KNIFE_WIDTH/2, 40);
    
    // Guard (Gold)
    ctx.fillStyle = '#c8b273';
    ctx.fillRect(-KNIFE_WIDTH/2, 20, KNIFE_WIDTH, 5);

    // Blade (Steel)
    const bladeGrad = ctx.createLinearGradient(-KNIFE_WIDTH/2, 0, KNIFE_WIDTH/2, 0);
    bladeGrad.addColorStop(0, '#94a3b8');
    bladeGrad.addColorStop(0.5, '#f8fafc');
    bladeGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bladeGrad;
    
    ctx.beginPath();
    ctx.moveTo(-KNIFE_WIDTH/2, 20);
    ctx.lineTo(KNIFE_WIDTH/2, 20);
    ctx.lineTo(0, -20);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function updateKnifeStack() {
    knifeStack.innerHTML = '';
    for (let i = 0; i < knivesToThrow; i++) {
        const icon = document.createElement('div');
        icon.className = 'knife-icon';
        if (i < knivesRemaining) icon.classList.add('active');
        knifeStack.appendChild(icon);
    }
}

function startGame() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    score = 0;
    stage = 1;
    knivesRemaining = 6;
    knivesToThrow = 6;
    stuckKnives = [];
    currentKnife = null;
    rotationSpeed = 0.03;
    scoreVal.innerText = '0';
    stageVal.innerText = '1';
    updateKnifeStack();
    draw();
}

function endGame() {
    gameRunning = false;
    gameOverScreen.style.display = 'flex';
    finalScoreVal.innerText = score;
}

function restartGame() {
    startGame();
}

// Initial draw for background
window.onload = () => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};
