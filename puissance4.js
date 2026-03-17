const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER = 1; // Red
const AI = 2;     // Yellow

const WIN_SCORE = 1000000;

let board = [];
let gameOver = false;
let isPlayerTurn = true;

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const restartBtn = document.getElementById('restart-btn');

function initBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    gameOver = false;
    isPlayerTurn = true;
    statusElement.innerText = "À vous de jouer ! (Rouge)";
    statusElement.style.color = "white";
    renderBoard();
}

function createCells() {
    boardElement.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            cell.addEventListener('click', () => handleHumanMove(c));
            cell.addEventListener('mouseenter', () => handleMouseEnter(c));
            cell.addEventListener('mouseleave', () => handleMouseLeave(c));
            
            boardElement.appendChild(cell);
        }
    }
}

function handleMouseEnter(col) {
    if (gameOver || !isPlayerTurn) return;
    const r = getValidRow(board, col);
    if (r !== -1) {
        const cell = document.querySelector(`.cell[data-r='${r}'][data-c='${col}']`);
        if (cell) cell.classList.add('hover-p1');
    }
}

function handleMouseLeave(col) {
    document.querySelectorAll('.hover-p1').forEach(c => c.classList.remove('hover-p1'));
}

function renderBoard() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.querySelector(`.cell[data-r='${r}'][data-c='${c}']`);
            cell.classList.remove('p1', 'p2', 'hover-p1');
            if (board[r][c] === PLAYER) cell.classList.add('p1');
            else if (board[r][c] === AI) cell.classList.add('p2');
        }
    }
}

function getValidRow(boardState, col) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (boardState[r][col] === EMPTY) return r;
    }
    return -1;
}

function dropPiece(boardState, row, col, piece) {
    boardState[row][col] = piece;
}

function isValidLocation(boardState, col) {
    return boardState[0][col] === EMPTY;
}

function getValidLocations(boardState) {
    const validLocations = [];
    const colOrder = [3, 2, 4, 1, 5, 0, 6]; 
    for (let c of colOrder) {
        if (isValidLocation(boardState, c)) {
            validLocations.push(c);
        }
    }
    return validLocations;
}

function winningMove(boardState, piece) {
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 0; r < ROWS; r++) {
            if (boardState[r][c] === piece && boardState[r][c+1] === piece && boardState[r][c+2] === piece && boardState[r][c+3] === piece) return true;
        }
    }
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (boardState[r][c] === piece && boardState[r+1][c] === piece && boardState[r+2][c] === piece && boardState[r+3][c] === piece) return true;
        }
    }
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (boardState[r][c] === piece && boardState[r+1][c+1] === piece && boardState[r+2][c+2] === piece && boardState[r+3][c+3] === piece) return true;
        }
    }
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 3; r < ROWS; r++) {
            if (boardState[r][c] === piece && boardState[r-1][c+1] === piece && boardState[r-2][c+2] === piece && boardState[r-3][c+3] === piece) return true;
        }
    }
    return false;
}

function isTerminalNode(boardState) {
    return winningMove(boardState, PLAYER) || winningMove(boardState, AI) || getValidLocations(boardState).length === 0;
}

function evaluateWindow(window, piece) {
    let score = 0;
    const oppPiece = piece === PLAYER ? AI : PLAYER;
    let pieceCount = 0;
    let emptyCount = 0;
    let oppCount = 0;

    for (const cell of window) {
        if (cell === piece) pieceCount++;
        else if (cell === EMPTY) emptyCount++;
        else if (cell === oppPiece) oppCount++;
    }

    if (pieceCount === 4) {
        score += 100;
    } else if (pieceCount === 3 && emptyCount === 1) {
        score += 5;
    } else if (pieceCount === 2 && emptyCount === 2) {
        score += 2;
    }

    if (oppCount === 3 && emptyCount === 1) {
        score -= 4;
    }

    return score;
}

function scorePosition(boardState, piece) {
    let score = 0;

    const centerArray = [];
    for (let r = 0; r < ROWS; r++) {
        centerArray.push(boardState[r][Math.floor(COLS/2)]);
    }
    const centerCount = centerArray.filter(cell => cell === piece).length;
    score += centerCount * 3;

    for (let r = 0; r < ROWS; r++) {
        const rowArray = boardState[r];
        for (let c = 0; c < COLS - 3; c++) {
            const window = rowArray.slice(c, c + 4);
            score += evaluateWindow(window, piece);
        }
    }

    for (let c = 0; c < COLS; c++) {
        const colArray = [];
        for (let r = 0; r < ROWS; r++) {
            colArray.push(boardState[r][c]);
        }
        for (let r = 0; r < ROWS - 3; r++) {
            const window = colArray.slice(r, r + 4);
            score += evaluateWindow(window, piece);
        }
    }

    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [boardState[r][c], boardState[r+1][c+1], boardState[r+2][c+2], boardState[r+3][c+3]];
            score += evaluateWindow(window, piece);
        }
    }

    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [boardState[r+3][c], boardState[r+2][c+1], boardState[r+1][c+2], boardState[r][c+3]];
            score += evaluateWindow(window, piece);
        }
    }

    return score;
}

function minimax(boardState, depth, alpha, beta, maximizingPlayer) {
    const validLocations = getValidLocations(boardState);
    const isTerminal = isTerminalNode(boardState);

    if (depth === 0 || isTerminal) {
        if (isTerminal) {
            if (winningMove(boardState, AI)) {
                return { column: null, score: WIN_SCORE };
            } else if (winningMove(boardState, PLAYER)) {
                return { column: null, score: -WIN_SCORE };
            } else {
                return { column: null, score: 0 };
            }
        } else {
            return { column: null, score: scorePosition(boardState, AI) };
        }
    }

    if (maximizingPlayer) {
        let value = -Infinity;
        let bestCol = validLocations[Math.floor(Math.random() * validLocations.length)];
        for (const col of validLocations) {
            const row = getValidRow(boardState, col);
            const boardCopy = boardState.map(arr => [...arr]);
            dropPiece(boardCopy, row, col, AI);
            const newScore = minimax(boardCopy, depth - 1, alpha, beta, false).score;
            if (newScore > value) {
                value = newScore;
                bestCol = col;
            }
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        return { column: bestCol, score: value };
    } else {
        let value = Infinity;
        let bestCol = validLocations[Math.floor(Math.random() * validLocations.length)];
        for (const col of validLocations) {
            const row = getValidRow(boardState, col);
            const boardCopy = boardState.map(arr => [...arr]);
            dropPiece(boardCopy, row, col, PLAYER);
            const newScore = minimax(boardCopy, depth - 1, alpha, beta, true).score;
            if (newScore < value) {
                value = newScore;
                bestCol = col;
            }
            beta = Math.min(beta, value);
            if (alpha >= beta) break;
        }
        return { column: bestCol, score: value };
    }
}

async function handleHumanMove(col) {
    if (gameOver || !isPlayerTurn || !isValidLocation(board, col)) return;

    handleMouseLeave(col);

    const row = getValidRow(board, col);
    dropPiece(board, row, col, PLAYER);
    renderBoard();

    if (winningMove(board, PLAYER)) {
        gameOver = true;
        statusElement.innerText = "Wow ! Vous avez gagné !";
        statusElement.style.color = "var(--p1-color)";
        return;
    }

    if (getValidLocations(board).length === 0) {
        gameOver = true;
        statusElement.innerText = "Match Nul !";
        return;
    }

    isPlayerTurn = false;
    statusElement.innerText = "L'IA Atlanticam réfléchit (Attention, elle est très forte)...";
    statusElement.style.color = "white";

    setTimeout(() => makeAIMove(), 500);
}

function makeAIMove() {
    const DEPTH = 7; 
    
    let col;
    let validLocs = getValidLocations(board);
    
    const piecesCount = board.flat().filter(p => p !== EMPTY).length;
    
    if (piecesCount === 1) {
        if (isValidLocation(board, 3) && board[5][3] !== PLAYER) col = 3;
        else col = 2 + Math.floor(Math.random() * 3);
    } else {
        const result = minimax(board, DEPTH, -Infinity, Infinity, true);
        col = result.column;
    }

    if (col === null || col === undefined || !isValidLocation(board, col)) {
        col = validLocs[Math.floor(Math.random() * validLocs.length)];
    }

    const row = getValidRow(board, col);
    dropPiece(board, row, col, AI);
    renderBoard();

    if (winningMove(board, AI)) {
        gameOver = true;
        statusElement.innerText = "L'IA Atlanticam a gagné ! Essaie encore.";
        statusElement.style.color = "var(--p2-color)";
        showLoseAnimation();
        return;
    }

    if (getValidLocations(board).length === 0) {
        gameOver = true;
        statusElement.innerText = "Match Nul !";
        return;
    }

    isPlayerTurn = true;
    statusElement.innerText = "À vous de jouer ! (Rouge)";
    statusElement.style.color = "white";
}

function showLoseAnimation() {
    const board = document.getElementById('board');
    board.classList.add('lose-shake');
    
    const overlay = document.createElement('div');
    overlay.id = 'lose-overlay';
    overlay.innerHTML = `
        <div class="lose-content">
            <h2 class="lose-title">OUPS...</h2>
            <p>L'IA Atlanticam a triomphé !</p>
            <div class="funny-face">🤡</div>
            <p>Cap'Icam compte sur toi pour la revanche !</p>
            <button onclick="closeLoseOverlay()">Retenter l'impossible</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.classList.add('show');
    }, 100);
}

function closeLoseOverlay() {
    const overlay = document.getElementById('lose-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 500);
    }
    initBoard();
}

restartBtn.addEventListener('click', () => {
    closeLoseOverlay();
    initBoard();
});

createCells();
initBoard();
