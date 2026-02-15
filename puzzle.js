let grid = []; // Will store {val, element} or null
let score = 0;
const rows = 4;
const columns = 4;
let gameActive = false;
let hasWonSession = false; // To send win notice only once per game

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxY5RF8k4NtnI-Hm8ENm2Zn7v4H-Go3c-AvY3BkxzNZ9siGDJp_ILPJC4MxU181dO7p7w/exec';

window.onload = function () {
    const storedName = localStorage.getItem('capIcamPlayerName');
    if (storedName) document.getElementById('playerName').value = storedName;
    const best = localStorage.getItem('cap2048Best');
    if (best) document.getElementById('best-score').innerText = best;
}

function startGame() {
    const name = document.getElementById('playerName').value.trim();
    if (!name || name.split(' ').length < 2) {
        alert("Entrez votre Prénom et NOM complet !");
        return;
    }
    localStorage.setItem('capIcamPlayerName', name);
    document.getElementById('start-screen').style.display = 'none';
    initGame();
}

function initGame() {
    // Clear Container
    document.getElementById('tile-container').innerHTML = "";
    grid = Array.from({ length: rows }, () => Array(columns).fill(null));
    score = 0;
    gameActive = true;
    hasWonSession = false;
    document.getElementById('score').innerText = "0";
    document.getElementById('game-over-screen').style.display = 'none';

    addRandomTile();
    addRandomTile();
}

function addRandomTile() {
    let emptyCells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (!grid[r][c]) emptyCells.push({ r, c });
        }
    }
    if (emptyCells.length > 0) {
        let { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        let val = Math.random() < 0.9 ? 2 : 4;
        grid[r][c] = createTile(r, c, val);
    }
}

function createTile(r, c, val) {
    let el = document.createElement("div");
    el.className = `tile tile-${val}`;
    el.innerText = val;
    positionTile(el, r, c);
    document.getElementById("tile-container").appendChild(el);
    return { val, element: el };
}

function positionTile(el, r, c) {
    el.style.top = (r * 77.5) + "px";
    el.style.left = (c * 77.5) + "px";
}

function updateTileClass(tile) {
    tile.element.className = `tile tile-${tile.val}`;
    tile.element.innerText = tile.val;
}

// Logic for sliding
async function handleMove(direction) {
    if (!gameActive) return;
    let moved = false;

    // We process row by row or col by col depending on direction
    const isVertical = direction === 'up' || direction === 'down';
    const isForward = direction === 'right' || direction === 'down';

    for (let i = 0; i < 4; i++) {
        let line = [];
        for (let j = 0; j < 4; j++) {
            let r = isVertical ? j : i;
            let c = isVertical ? i : j;
            line.push(grid[r][c]);
        }

        if (isForward) line.reverse();

        // Process line
        let newLine = Array(4).fill(null);
        let targetIdx = 0;
        for (let sourceIdx = 0; sourceIdx < 4; sourceIdx++) {
            if (!line[sourceIdx]) continue;

            let current = line[sourceIdx];
            if (targetIdx > 0 && newLine[targetIdx - 1] && newLine[targetIdx - 1].val === current.val && !newLine[targetIdx - 1].merged) {
                // Merge
                let targetTile = newLine[targetIdx - 1];
                targetTile.val *= 2;
                targetTile.merged = true;
                score += targetTile.val;

                // Animate the merging tile to the target position
                animateTileMove(current, i, targetIdx - 1, isVertical, isForward);
                setTimeout(() => current.element.remove(), 100);
                moved = true;
            } else {
                newLine[targetIdx] = current;
                if (targetIdx !== sourceIdx) {
                    animateTileMove(current, i, targetIdx, isVertical, isForward);
                    moved = true;
                }
                targetIdx++;
            }
        }

        if (isForward) newLine.reverse();

        // Update grid
        for (let j = 0; j < 4; j++) {
            let r = isVertical ? j : i;
            let c = isVertical ? i : j;
            grid[r][c] = newLine[j];
        }
    }

    if (moved) {
        // Cleanup merge flags and update visuals
        setTimeout(() => {
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (grid[r][c]) {
                        if (grid[r][c].val === 2048 && !hasWonSession) {
                            hasWonSession = true;
                            // Log Win to Google Sheet
                            const name = localStorage.getItem('capIcamPlayerName');
                            fetch(GOOGLE_SCRIPT_URL + `?action=addPuzzleWin&name=${encodeURIComponent(name)}`, {
                                method: 'POST',
                                mode: 'no-cors'
                            });
                        }
                        if (grid[r][c].merged) {
                            grid[r][c].merged = false;
                            grid[r][c].element.classList.add('tile-merged');
                            setTimeout(() => grid[r][c].element.classList.remove('tile-merged'), 150);
                        }
                        updateTileClass(grid[r][c]);
                    }
                }
            }
            addRandomTile();
            checkGameOver();
            document.getElementById("score").innerText = score;
            updateBestScore();
        }, 100);
    }
}

function animateTileMove(tile, fixedIdx, moveIdx, isVertical, isForward) {
    let r, c;
    if (isVertical) {
        c = fixedIdx;
        r = isForward ? 3 - moveIdx : moveIdx;
    } else {
        r = fixedIdx;
        c = isForward ? 3 - moveIdx : moveIdx;
    }
    positionTile(tile.element, r, c);
}

function updateBestScore() {
    const best = localStorage.getItem('cap2048Best') || 0;
    if (score > best) {
        localStorage.setItem('cap2048Best', score);
        document.getElementById('best-score').innerText = score;
    }
}

function checkGameOver() {
    // Check for empty cells
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (!grid[r][c]) return;
        }
    }
    // Check for merges
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            let val = grid[r][c].val;
            if (r < 3 && grid[r + 1][c].val === val) return;
            if (c < 3 && grid[r][c + 1].val === val) return;
        }
    }
    gameActive = false;
    document.getElementById('final-score').innerText = score;

    // Punchlines de naufrage (les mêmes que FlappyCap)
    const punchlines = [
        "Sombré comme ta moyenne de maths...",
        "Cap'Icam coule ? Jamais ! Toi par contre...",
        "Même le Titanic a fait mieux.",
        "Encore un qui a bu trop de canouche !"
    ];
    document.getElementById('end-punchline').innerText = punchlines[Math.floor(Math.random() * punchlines.length)];

    document.getElementById('game-over-screen').style.display = 'flex';

    const name = localStorage.getItem('capIcamPlayerName');
    fetch(GOOGLE_SCRIPT_URL + `?action=addScore&name=${encodeURIComponent(name)}&score=${score}`, {
        method: 'POST',
        mode: 'no-cors'
    });
}

// Controls
document.addEventListener('keydown', e => {
    if (e.key === "ArrowLeft") handleMove('left');
    if (e.key === "ArrowRight") handleMove('right');
    if (e.key === "ArrowUp") handleMove('up');
    if (e.key === "ArrowDown") handleMove('down');
});

let startX, startY;
document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (!gameActive) return;
    let diffX = e.changedTouches[0].clientX - startX;
    let diffY = e.changedTouches[0].clientY - startY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) direction = diffX > 0 ? 'right' : 'left';
    } else {
        if (Math.abs(diffY) > 30) direction = diffY > 0 ? 'down' : 'up';
    }
    if (typeof direction !== 'undefined') {
        handleMove(direction);
        direction = undefined;
    }
}, { passive: true });
