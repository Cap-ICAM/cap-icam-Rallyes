const GRID_SIZE = 10;
const SHIP_TYPES = [
    { name: "L'Amirauté Cap'Icam", size: 5 },
    { name: "Le Galion de l'Équipage", size: 4 },
    { name: "Le Brick du BDA", size: 3 },
    { name: "La Chaloupe du Mousse", size: 3 },
    { name: "Le Canot du Capitaine", size: 2 }
];

let playerGrid = [];
let computerGrid = [];
let playerShips = [];
let computerShips = [];
let gameStarted = false;
let turn = 'player'; // 'player' or 'computer'
let gameOver = false;

// AI State
let aiTargetStack = [];
let aiHits = [];

const playerGridElement = document.getElementById('player-grid');
const computerGridElement = document.getElementById('computer-grid');
const statusText = document.getElementById('status-text');
const startBtn = document.getElementById('start-btn');
const mortarBtn = document.getElementById('mortar-btn');
const mortarCountText = document.getElementById('mortar-count');
const resetBtn = document.getElementById('reset-btn');

let mortarCharges = 2;
let mortarActive = false;

function init() {
    createGrid(playerGridElement, 'player');
    createGrid(computerGridElement, 'computer');
    resetGame();
}

function createGrid(element, type) {
    element.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            if (type === 'computer') {
                cell.addEventListener('click', () => handlePlayerAttack(r, c));
            }
            element.appendChild(cell);
        }
    }
}

function resetGame() {
    playerGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    computerGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    playerShips = [];
    computerShips = [];
    gameStarted = false;
    gameOver = false;
    turn = 'player';
    aiTargetStack = [];
    aiHits = [];

    randomPlaceShips('player');
    randomPlaceShips('computer');
    updateVisualGrids();
    renderShipLists();
    
    statusText.innerText = "Préparez votre flotte ! Abordez les navires ennemis.";
    startBtn.disabled = false;
    resetBtn.style.display = 'none';
    startBtn.style.display = 'flex';
    mortarBtn.style.display = 'none';
    mortarCharges = 2;
    mortarActive = false;
    mortarCountText.innerText = mortarCharges;
}

function randomPlaceShips(type) {
    const grid = type === 'player' ? playerGrid : computerGrid;
    const ships = type === 'player' ? playerShips : computerShips;
    ships.length = 0;

    SHIP_TYPES.forEach(shipType => {
        let placed = false;
        while (!placed) {
            const horizontal = Math.random() < 0.5;
            const r = Math.floor(Math.random() * (horizontal ? GRID_SIZE : GRID_SIZE - shipType.size + 1));
            const c = Math.floor(Math.random() * (horizontal ? GRID_SIZE - shipType.size + 1 : GRID_SIZE));

            let canPlace = true;
            for (let i = 0; i < shipType.size; i++) {
                const row = horizontal ? r : r + i;
                const col = horizontal ? c + i : c;
                if (grid[row][col] !== null) {
                    canPlace = false;
                    break;
                }
            }

            if (canPlace) {
                const shipObj = { 
                    name: shipType.name, 
                    size: shipType.size, 
                    hits: 0, 
                    coords: [],
                    sunk: false
                };
                for (let i = 0; i < shipType.size; i++) {
                    const row = horizontal ? r : r + i;
                    const col = horizontal ? c + i : c;
                    grid[row][col] = shipObj;
                    shipObj.coords.push({ r: row, c: col });
                }
                ships.push(shipObj);
                placed = true;
            }
        }
    });
}

function updateVisualGrids() {
    // Player Grid
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = playerGridElement.querySelector(`[data-r='${r}'][data-c='${c}']`);
            cell.className = 'cell';
            if (playerGrid[r][c] !== null) {
                cell.classList.add('ship');
            }
        }
    }
    // Computer Grid (Hidden)
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = computerGridElement.querySelector(`[data-r='${r}'][data-c='${c}']`);
            cell.className = 'cell';
        }
    }
}

function renderShipLists() {
    renderList('player-ship-list', playerShips);
    renderList('computer-ship-list', computerShips, true);
}

function renderList(id, ships, hidden = false) {
    const container = document.getElementById(id);
    container.innerHTML = '';
    ships.forEach(ship => {
        const div = document.createElement('div');
        div.className = `ship-item ${ship.sunk ? 'sunk' : ''}`;
        
        const name = document.createElement('span');
        name.innerText = ship.name;
        
        const indicators = document.createElement('div');
        indicators.className = 'ship-indicators';
        for (let i = 0; i < ship.size; i++) {
            const step = document.createElement('div');
            step.className = 'indicator';
            // Only show hits for computer if ship is sunk, OR if it's the player's own list
            if (!hidden) {
                if (i < ship.hits) step.classList.add('hit');
                else step.classList.add('filled');
            } else {
                if (ship.sunk) step.classList.add('hit');
            }
            indicators.appendChild(step);
        }
        
        div.appendChild(name);
        div.appendChild(indicators);
        container.appendChild(div);
    });
}

function handlePlayerAttack(r, c) {
    if (!gameStarted || gameOver || turn !== 'player') return;

    if (mortarActive) {
        handleMortarStrike(r, c);
        return;
    }

    const cell = computerGridElement.querySelector(`[data-r='${r}'][data-c='${c}']`);
    if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

    const ship = computerGrid[r][c];
    if (ship) {
        cell.classList.add('hit');
        createExplosion(cell);
        ship.hits++;
        statusText.innerText = "TOUCHÉ !";
        if (ship.hits === ship.size) {
            ship.sunk = true;
            markSunkShip(computerGridElement, ship);
            statusText.innerText = `COULÉ ! Vous avez coulé ${ship.name} !`;
        }
        checkGameOver();
        if (!gameOver) {
            // Player gets another turn if they hit? Usually no in Battleship, but some versions do.
            // Traditional: turn changes. Let's stick to tradition but with a delay.
            turn = 'computer';
            setTimeout(computerTurn, 1000);
        }
    } else {
        cell.classList.add('miss');
        statusText.innerText = "DANS L'EAU... L'ennemi prépare sa riposte.";
        turn = 'computer';
        setTimeout(computerTurn, 1000);
    }
    renderShipLists();
}

function handleMortarStrike(r, c) {
    if (mortarCharges <= 0) return;

    mortarCharges--;
    mortarCountText.innerText = mortarCharges;
    mortarActive = false;
    mortarBtn.classList.remove('active');
    computerGridElement.classList.remove('mortar-mode');

    // Calculate 2x2 area (ensure it stays within bounds)
    let startR = r;
    let startC = c;
    if (r === GRID_SIZE - 1) startR--;
    if (c === GRID_SIZE - 1) startC--;

    const targetCoords = [
        { r: startR, c: startC },
        { r: startR + 1, c: startC },
        { r: startR, c: startC + 1 },
        { r: startR + 1, c: startC + 1 }
    ];

    // Mortar Animation
    const centerCell = computerGridElement.querySelector(`[data-r='${startR}'][data-c='${startC}']`);
    const anim = document.createElement('div');
    anim.className = 'mortar-animation';
    centerCell.appendChild(anim);

    let hitAny = false;
    let shipsSunkOnce = [];

    setTimeout(() => {
        targetCoords.forEach(coord => {
            const cell = computerGridElement.querySelector(`[data-r='${coord.r}'][data-c='${coord.c}']`);
            if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

            const ship = computerGrid[coord.r][coord.c];
            if (ship) {
                cell.classList.add('hit');
                createExplosion(cell);
                ship.hits++;
                hitAny = true;
                if (ship.hits === ship.size) {
                    ship.sunk = true;
                    shipsSunkOnce.push(ship.name);
                    markSunkShip(computerGridElement, ship);
                }
            } else {
                cell.classList.add('miss');
            }
        });

        if (hitAny) {
            statusText.innerText = shipsSunkOnce.length > 0 
                ? `FRAPPE RÉUSSIE ! Vous avez coulé : ${shipsSunkOnce.join(', ')} !` 
                : "FRAPPE RÉUSSIE ! Plusieurs cibles touchées !";
        } else {
            statusText.innerText = "FRAPPE DANS LE VIDE... Le mortier n'a rien trouvé.";
        }

        checkGameOver();
        renderShipLists();
        
        if (!gameOver) {
            turn = 'computer';
            setTimeout(computerTurn, 1000);
        }
    }, 600);
}

function computerTurn() {
    if (gameOver) return;

    let r, c;
    if (aiTargetStack.length > 0) {
        const target = aiTargetStack.pop();
        r = target.r;
        c = target.c;
    } else {
        do {
            r = Math.floor(Math.random() * GRID_SIZE);
            c = Math.floor(Math.random() * GRID_SIZE);
        } while (isAlreadyAttacked(playerGridElement, r, c));
    }

    const cell = playerGridElement.querySelector(`[data-r='${r}'][data-c='${c}']`);
    const ship = playerGrid[r][c];

    if (ship) {
        cell.classList.add('hit');
        createExplosion(cell);
        ship.hits++;
        statusText.innerText = `L'ennemi a touché votre ${ship.name} !`;
        
        if (ship.hits === ship.size) {
            ship.sunk = true;
            markSunkShip(playerGridElement, ship);
            statusText.innerText = `CATASTROPHE ! Votre ${ship.name} a été COULÉ !`;
            aiTargetStack = []; // Clear stack for new search if sunk
        } else {
            // Add neighbors to stack
            const neighbors = [
                { r: r-1, c }, { r: r+1, c }, { r: r, c: c-1 }, { r: r, c: c+1 }
            ];
            neighbors.forEach(n => {
                if (n.r >= 0 && n.r < GRID_SIZE && n.c >= 0 && n.c < GRID_SIZE && !isAlreadyAttacked(playerGridElement, n.r, n.c)) {
                    // Check if already in stack
                    if (!aiTargetStack.some(t => t.r === n.r && t.c === n.c)) {
                        aiTargetStack.push(n);
                    }
                }
            });
        }
        checkGameOver();
        if (!gameOver) setTimeout(computerTurn, 1000);
    } else {
        cell.classList.add('miss');
        statusText.innerText = "L'ennemi a tiré dans l'eau. À vous !";
        turn = 'player';
    }
    renderShipLists();
}

function isAlreadyAttacked(gridElem, r, c) {
    const cell = gridElem.querySelector(`[data-r='${r}'][data-c='${c}']`);
    return cell.classList.contains('hit') || cell.classList.contains('miss');
}

function markSunkShip(gridElem, ship) {
    ship.coords.forEach(coord => {
        const cell = gridElem.querySelector(`[data-r='${coord.r}'][data-c='${coord.c}']`);
        cell.classList.add('sunk');
    });
}

function createExplosion(parent) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    parent.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);
}

function checkGameOver() {
    const playerAllSunk = playerShips.every(s => s.sunk);
    const computerAllSunk = computerShips.every(s => s.sunk);

    if (playerAllSunk) {
        gameOver = true;
        document.getElementById('lose-overlay').classList.add('show');
    } else if (computerAllSunk) {
        gameOver = true;
        document.getElementById('win-overlay').classList.add('show');
    }

    if (gameOver) {
        startBtn.style.display = 'none';
        mortarBtn.style.display = 'none';
        resetBtn.style.display = 'flex';
    }
}

mortarBtn.addEventListener('click', () => {
    if (mortarCharges <= 0 || turn !== 'player') return;
    mortarActive = !mortarActive;
    
    if (mortarActive) {
        mortarBtn.classList.add('active');
        computerGridElement.classList.add('mortar-mode');
        statusText.innerText = "MODE MORTIER ACTIVÉ : Visez une zone de 2x2 !";
    } else {
        mortarBtn.classList.remove('active');
        computerGridElement.classList.remove('mortar-mode');
        statusText.innerText = "La bataille continue...";
    }
});

startBtn.addEventListener('click', () => {
    gameStarted = true;
    startBtn.disabled = true;
    mortarBtn.style.display = 'flex';
    statusText.innerText = "La bataille commence ! Cliquez sur la grille ennemie pour tirer.";
});

// Retiré randomize-btn event listener


resetBtn.addEventListener('click', () => {
    location.reload();
});

init();
