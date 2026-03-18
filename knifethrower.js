const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('score-val');
const coinVal = document.getElementById('coin-val');
const stageVal = document.getElementById('stage-val');
const knifeStack = document.getElementById('knife-stack');
const startScreen = document.getElementById('start-screen');
const shopScreen = document.getElementById('shop-screen');
const shopGrid = document.getElementById('shop-grid');
const shopCoinVal = document.getElementById('shop-coin-val');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreVal = document.getElementById('final-score-val');

// Game constants
let TARGET_Y = 250;
let KNIFE_START_Y = 650;
const KNIFE_SPEED = 25;
const TARGET_RADIUS = 100;
const KNIFE_WIDTH = 20;
const KNIFE_HEIGHT = 80;
const COLLISION_TOLERANCE = 0.25;

// Game state
let gameRunning = false;
let score = 0;
let coins = parseInt(localStorage.getItem('knife_coins')) || 0;
let unlockedSkins = JSON.parse(localStorage.getItem('knife_unlocked')) || ['default'];
let currentSkinId = localStorage.getItem('knife_current_skin') || 'default';
let stage = 1;
let rotation = 0;
let rotationDirection = 1;
let knivesToThrow = 6;
let knivesRemaining = 6;
let stuckKnives = [];
let currentKnife = null;
let particles = [];
let targetShake = 0;
let flashOpacity = 0;

// Rotation Pattern State
let movePhase = 0;
let phaseDuration = 100;
let baseSpeed = 0.018;
let currentPattern = 'steady';

const targetImg = new Image();
targetImg.src = 'assets/logo.jpg';

const SKINS = {
    default: { name: 'Acier Basique', price: 0, blade: '#94a3b8', handle: '#451a03', guard: '#c8b273' },
    icam: { name: 'L\'Icamien', price: 200, blade: '#f8fafc', handle: '#1e3a8a', guard: '#fbbf24' },
    pirate: { name: 'Le Flibustier', price: 500, blade: '#475569', handle: '#000000', guard: '#94a3b8' },
    royal: { name: 'Le Royal', price: 1000, blade: '#fbbf24', handle: '#f8fafc', guard: '#fbbf24' },
    neon: { name: 'Cyber Icam', price: 1500, blade: '#22d3ee', handle: '#1e293b', guard: '#22d3ee' },
    blood: { name: 'La Rage', price: 2000, blade: '#ef4444', handle: '#450a0a', guard: '#000000' }
};

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    KNIFE_START_Y = canvas.height - 150;
    TARGET_Y = canvas.height * 0.3;
    coinVal.innerText = coins;
}

window.addEventListener('resize', init);
init();

function throwKnife() {
    if (!gameRunning || currentKnife !== null || knivesRemaining <= 0) return;
    currentKnife = { y: KNIFE_START_Y, x: canvas.width / 2 };
    knivesRemaining--;
    updateKnifeStack();
}

window.addEventListener('mousedown', (e) => {
    if (e.target.closest('.ui-panel') || e.target.closest('.overlay')) return;
    throwKnife();
});
window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.ui-panel') || e.target.closest('.overlay')) return;
    e.preventDefault();
    throwKnife();
}, { passive: false });
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); throwKnife(); }
});

class Particle {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        const skin = SKINS[currentSkinId];
        this.color = Math.random() > 0.5 ? skin.blade : skin.handle;
        this.size = Math.random() * 4 + 2;
    }
    update() { this.x += this.vx; this.y += this.vy; this.vy += 0.2; this.life -= 0.02; }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function update() {
    if (!gameRunning) return;
    movePhase++;
    if (movePhase > phaseDuration) { movePhase = 0; selectNewPattern(); }

    let actualSpeed = baseSpeed;
    if (currentPattern === 'jerky') {
        if (movePhase % 60 < 20) actualSpeed = 0;
        else if (movePhase % 60 < 40) actualSpeed = baseSpeed * 2.5;
    } else if (currentPattern === 'swing') {
        actualSpeed = baseSpeed * (1 + Math.sin(movePhase * 0.05));
    } else if (currentPattern === 'accelerating') {
        actualSpeed = baseSpeed * (0.5 + (movePhase / phaseDuration) * 2);
    }

    rotation += actualSpeed * rotationDirection;
    if (stage >= 3 && movePhase === 0 && Math.random() < 0.3) rotationDirection *= -1;

    if (currentKnife) {
        currentKnife.y -= KNIFE_SPEED;
        if (currentKnife.y <= TARGET_Y + TARGET_RADIUS) handleHit();
    }

    if (targetShake > 0) targetShake *= 0.8;
    if (flashOpacity > 0) flashOpacity -= 0.05;

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function handleHit() {
    let hitAngle = -rotation;
    let failed = false;
    for (let angle of stuckKnives) {
        let diff = Math.abs(angle - hitAngle);
        while (diff > Math.PI * 2) diff -= Math.PI * 2;
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < COLLISION_TOLERANCE) { failed = true; break; }
    }

    if (failed) {
        endGame();
    } else {
        stuckKnives.push(hitAngle);
        currentKnife = null;
        score += 10;
        scoreVal.innerText = score;
        targetShake = 15;
        flashOpacity = 0.4;
        for (let i = 0; i < 15; i++) particles.push(new Particle(canvas.width / 2, TARGET_Y + TARGET_RADIUS));
        if (knivesRemaining === 0) setTimeout(nextStage, 500);
    }
}

function selectNewPattern() {
    if (stage < 3) { currentPattern = 'steady'; phaseDuration = 200; return; }
    const patterns = ['steady', 'jerky', 'swing', 'accelerating'];
    currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
    phaseDuration = 100 + Math.random() * 150;
    if (stage >= 3) baseSpeed = Math.min(0.018 + (stage * 0.003), 0.05);
}

function nextStage() {
    stage++;
    stageVal.innerText = stage;
    knivesToThrow = 6 + Math.floor(stage / 2);
    knivesRemaining = knivesToThrow;
    stuckKnives = [];
    baseSpeed = 0.015 + (stage * 0.003);
    selectNewPattern();
    updateKnifeStack();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const shakeOffsetX = (Math.random() - 0.5) * targetShake;
    const shakeOffsetY = (Math.random() - 0.5) * targetShake;

    const bgGrad = ctx.createRadialGradient(centerX, TARGET_Y, TARGET_RADIUS * 0.5, centerX, TARGET_Y, TARGET_RADIUS * 4);
    bgGrad.addColorStop(0, '#1e293b'); bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => p.draw());

    stuckKnives.forEach(angle => {
        ctx.save();
        ctx.translate(centerX + shakeOffsetX, TARGET_Y + shakeOffsetY);
        ctx.rotate(rotation + angle);
        drawKnifeSprite(0, TARGET_RADIUS - 5, true);
        ctx.restore();
    });

    ctx.save();
    ctx.translate(centerX + shakeOffsetX, TARGET_Y + shakeOffsetY);
    ctx.rotate(rotation);
    ctx.lineWidth = 8; ctx.strokeStyle = '#2d3345';
    ctx.beginPath(); ctx.arc(0, 0, TARGET_RADIUS + 4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(200, 178, 115, 0.4)';
    ctx.beginPath(); ctx.arc(0, 0, TARGET_RADIUS, 0, Math.PI * 2); ctx.clip();
    try { ctx.drawImage(targetImg, -TARGET_RADIUS, -TARGET_RADIUS, TARGET_RADIUS * 2, TARGET_RADIUS * 2); } catch(e) {}
    const highlight = ctx.createRadialGradient(-30, -30, 10, 0, 0, TARGET_RADIUS);
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); highlight.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = highlight; ctx.beginPath(); ctx.arc(0, 0, TARGET_RADIUS, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (currentKnife) {
        drawKnifeSprite(currentKnife.x, currentKnife.y, false);
    } else if (knivesRemaining > 0 && gameRunning) {
        drawKnifeSprite(centerX, KNIFE_START_Y, false);
    }

    if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawKnifeSprite(x, y, fromCenter) {
    const skin = SKINS[currentSkinId];
    ctx.save();
    ctx.translate(x, y);
    
    // Handle
    ctx.fillStyle = skin.handle;
    ctx.shadowBlur = 5; ctx.shadowColor = 'black';
    ctx.fillRect(-KNIFE_WIDTH/4, 20, KNIFE_WIDTH/2, 40);
    
    // Guard
    ctx.fillStyle = skin.guard;
    ctx.fillRect(-KNIFE_WIDTH/2, 20, KNIFE_WIDTH, 5);
    
    // Blade
    const bladeGrad = ctx.createLinearGradient(-KNIFE_WIDTH/2, 0, KNIFE_WIDTH/2, 0);
    bladeGrad.addColorStop(0, skin.blade);
    bladeGrad.addColorStop(0.5, '#ffffff'); // Center shine
    bladeGrad.addColorStop(1, skin.blade);
    ctx.fillStyle = bladeGrad;
    
    ctx.beginPath(); ctx.moveTo(-KNIFE_WIDTH/2, 20); ctx.lineTo(KNIFE_WIDTH/2, 20); ctx.lineTo(0, -20); ctx.closePath(); ctx.fill();
    ctx.restore();
}

function updateKnifeStack() {
    knifeStack.innerHTML = '';
    const skin = SKINS[currentSkinId];
    for (let i = 0; i < knivesToThrow; i++) {
        const icon = document.createElement('div');
        icon.className = 'knife-icon';
        if (i < knivesRemaining) {
            icon.classList.add('active');
            icon.style.background = `linear-gradient(to top, ${skin.handle}, ${skin.guard} 40%, ${skin.blade} 40%)`;
        }
        knifeStack.appendChild(icon);
    }
}

function startGame() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    const oldMsg = document.getElementById('reward-msg');
    if (oldMsg) oldMsg.remove();
    
    score = 0; stage = 1; knivesRemaining = 6; knivesToThrow = 6;
    stuckKnives = []; currentKnife = null; baseSpeed = 0.018; rotationDirection = 1;
    currentPattern = 'steady'; movePhase = 0; phaseDuration = 200;
    scoreVal.innerText = '0'; stageVal.innerText = '1'; updateKnifeStack();
    gameRunning = true;
}

function endGame() {
    gameRunning = false;
    gameOverScreen.style.display = 'flex';
    finalScoreVal.innerText = score;
    
    // Reward coins
    const gained = Math.floor(score / 5) + (stage * 5);
    coins += gained;
    localStorage.setItem('knife_coins', coins);
    coinVal.innerText = coins;
    
    const rewardMsg = document.createElement('div');
    rewardMsg.id = 'reward-msg';
    rewardMsg.innerHTML = `<i class="fas fa-coins" style="color: #fbbf24;"></i> +${gained} pièces`;
    rewardMsg.style.marginTop = '10px';
    rewardMsg.style.fontSize = '1.2rem';
    gameOverScreen.insertBefore(rewardMsg, gameOverScreen.querySelector('p').nextSibling);
}

function openShop() {
    startScreen.style.display = 'none';
    shopScreen.style.display = 'flex';
    shopCoinVal.innerText = coins;
    renderShop();
}

function closeShop() {
    shopScreen.style.display = 'none';
    startScreen.style.display = 'flex';
}

function renderShop() {
    shopGrid.innerHTML = '';
    Object.keys(SKINS).forEach(id => {
        const skin = SKINS[id];
        const isLocked = !unlockedSkins.includes(id);
        const card = document.createElement('div');
        card.className = `skin-card ${isLocked ? 'locked' : ''} ${currentSkinId === id ? 'selected' : ''}`;
        
        // Preview Canvas or HTML
        card.innerHTML = `
            <div class="skin-preview" style="background: linear-gradient(to top, ${skin.handle}, ${skin.guard} 40%, ${skin.blade} 40%); width: 10px; height: 30px; border-radius: 2px;"></div>
            <div style="font-weight: bold; margin-bottom: 5px;">${skin.name}</div>
            ${isLocked ? `<div class="skin-price"><i class="fas fa-coins"></i> ${skin.price}</div>` : (currentSkinId === id ? '<span style="color: #22c55e;">Équipé</span>' : '<span>Débloqué</span>')}
        `;
        
        card.onclick = () => {
            if (isLocked) {
                if (coins >= skin.price) {
                    coins -= skin.price;
                    unlockedSkins.push(id);
                    localStorage.setItem('knife_coins', coins);
                    localStorage.setItem('knife_unlocked', JSON.stringify(unlockedSkins));
                    shopCoinVal.innerText = coins;
                    coinVal.innerText = coins;
                    renderShop();
                } else {
                    alert('Pas assez de pièces !');
                }
            } else {
                currentSkinId = id;
                localStorage.setItem('knife_current_skin', id);
                renderShop();
            }
        };
        shopGrid.appendChild(card);
    });
}

function restartGame() { startGame(); }

function mainLoop() {
    update();
    draw();
    requestAnimationFrame(mainLoop);
}

window.onload = () => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(mainLoop);
    coinVal.innerText = coins;
};
