// Dark Tetris Game Logic
document.addEventListener('DOMContentLoaded', () => {
    // Canvas Setup
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const nextPieceCanvas = document.createElement('canvas');
    const nextPieceCtx = nextPieceCanvas.getContext('2d');
    document.getElementById('next-piece').appendChild(nextPieceCanvas);

    // Game Constants
    const GRID_SIZE = 30;
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const PREVIEW_SIZE = 4;
    
    // Set canvas dimensions
    canvas.width = GRID_SIZE * BOARD_WIDTH;
    canvas.height = GRID_SIZE * BOARD_HEIGHT;
    nextPieceCanvas.width = GRID_SIZE * 4;
    nextPieceCanvas.height = GRID_SIZE * 4;
    
    // Game Variables
    let board = createEmptyBoard();
    let currentPiece = null;
    let nextPiece = null;
    let gameInterval = null;
    let paused = false;
    let gameOver = true;
    let dropSpeed = 1000; // ms per drop
    let score = 0;
    let level = 1;
    let lines = 0;
    let lastFrameTime = 0;
    let lastMoveDown = 0;
    let ghostPieceEnabled = true;
    let animationFrameId = null;

    // DOM Elements
    const scoreDisplay = document.getElementById('score');
    const levelDisplay = document.getElementById('level');
    const linesDisplay = document.getElementById('lines');
    const startButton = document.getElementById('start-button');
    const resetButton = document.getElementById('reset-button');

    // Tetromino definitions - each piece with its rotations
    const TETROMINOES = {
        I: {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: '#00ffff',
            className: 'piece-I',
            centerOffset: true
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#0000ff',
            className: 'piece-J',
            centerOffset: false
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#ff7700',
            className: 'piece-L',
            centerOffset: false
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#ffff00',
            className: 'piece-O',
            centerOffset: false
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: '#00ff00',
            className: 'piece-S',
            centerOffset: false
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#cc00ff',
            className: 'piece-T',
            centerOffset: false
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: '#ff0000',
            className: 'piece-Z',
            centerOffset: false
        }
    };
    
    const PIECE_TYPES = Object.keys(TETROMINOES);

    // Helper functions
    function createEmptyBoard() {
        return Array.from({ length: BOARD_HEIGHT }, () => 
            Array.from({ length: BOARD_WIDTH }, () => null)
        );
    }
    
    function getRandomPiece() {
        const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        const tetromino = TETROMINOES[type];
        
        return {
            type,
            shape: JSON.parse(JSON.stringify(tetromino.shape)),
            color: tetromino.color,
            className: tetromino.className,
            centerOffset: tetromino.centerOffset,
            x: Math.floor((BOARD_WIDTH - tetromino.shape[0].length) / 2),
            y: 0
        };
    }
    
    function drawBlock(ctx, x, y, color, glow = true) {
        const blockSize = GRID_SIZE - 2;
        ctx.fillStyle = color;
        ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, blockSize, blockSize);
        
        // Inner shadow effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x * GRID_SIZE + 3, y * GRID_SIZE + 3, blockSize - 4, blockSize - 4);
        
        // Highlight effect (top and left edges)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, blockSize, 2);
        ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, 2, blockSize);
        
        // Glow effect - conditionally applied for performance
        if (glow) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.strokeRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, blockSize, blockSize);
            ctx.shadowBlur = 0;
        }
    }
    
    function drawPiece(ctx, piece, offsetX = 0, offsetY = 0, isGhost = false) {
        if (!piece) return;
        
        const ghostColor = 'rgba(255, 255, 255, 0.2)';
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const drawX = piece.x + x + offsetX;
                    const drawY = piece.y + y + offsetY;
                    
                    if (drawX >= 0 && drawX < BOARD_WIDTH && drawY >= 0 && drawY < BOARD_HEIGHT) {
                        if (isGhost) {
                            // Draw ghost piece outline only
                            ctx.strokeStyle = piece.color;
                            ctx.lineWidth = 1;
                            ctx.strokeRect(
                                drawX * GRID_SIZE + 1, 
                                drawY * GRID_SIZE + 1, 
                                GRID_SIZE - 2, 
                                GRID_SIZE - 2
                            );
                            
                            // Fill with translucent color
                            ctx.fillStyle = ghostColor;
                            ctx.fillRect(
                                drawX * GRID_SIZE + 1, 
                                drawY * GRID_SIZE + 1, 
                                GRID_SIZE - 2, 
                                GRID_SIZE - 2
                            );
                        } else {
                            drawBlock(ctx, drawX, drawY, piece.color, !isGhost);
                        }
                    }
                }
            }
        }
    }
    
    function drawNextPiece() {
        nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        nextPieceCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--board-bg').trim();
        nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        
        if (!nextPiece) return;
        
        // Center the piece in the preview area
        const offsetX = Math.floor((PREVIEW_SIZE - nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((PREVIEW_SIZE - nextPiece.shape.length) / 2);
        
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    drawBlock(nextPieceCtx, x + offsetX, y + offsetY, nextPiece.color);
                }
            }
        }
    }
    
    function drawBoard() {
        // Clear canvas with background color
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--board-bg').trim();
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * GRID_SIZE, 0);
            ctx.lineTo(x * GRID_SIZE, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * GRID_SIZE);
            ctx.lineTo(canvas.width, y * GRID_SIZE);
            ctx.stroke();
        }
        
        // Draw placed blocks
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (board[y][x]) {
                    drawBlock(ctx, x, y, board[y][x]);
                }
            }
        }
        
        // Draw ghost piece (preview of where piece will land)
        if (currentPiece && ghostPieceEnabled) {
            const ghostPiece = JSON.parse(JSON.stringify(currentPiece));
            ghostPiece.y = getGhostPiecePosition();
            drawPiece(ctx, ghostPiece, 0, 0, true);
        }
        
        // Draw active piece
        drawPiece(ctx, currentPiece);
    }
    
    function getGhostPiecePosition() {
        if (!currentPiece) return 0;
        
        let tempY = currentPiece.y;
        
        while (!checkCollision(currentPiece.shape, currentPiece.x, tempY + 1)) {
            tempY++;
        }
        
        return tempY;
    }
    
    function drawGameOverScreen() {
        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw game over text
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--neon-pink').trim();
        ctx.font = 'bold 30px Orbitron';
        ctx.textAlign = 'center';
        ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-pink').trim();
        ctx.shadowBlur = 15;
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        
        // Draw instruction
        ctx.font = '16px Orbitron';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fillText('Press START to play again', canvas.width / 2, canvas.height / 2 + 40);
        ctx.shadowBlur = 0;
    }
    
    function checkCollision(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    
                    // Check if out of bounds or colliding with placed blocks
                    if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                        return true;
                    }
                    
                    // Check for collision with existing pieces on the board
                    if (boardY >= 0 && board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    function rotatePiece() {
        if (!currentPiece || paused || gameOver) return;
        
        const originalShape = JSON.parse(JSON.stringify(currentPiece.shape));
        const rows = originalShape.length;
        const cols = originalShape[0].length;
        
        // Create a new rotated matrix
        const rotated = Array.from({ length: cols }, () => 
            Array.from({ length: rows }, () => 0)
        );
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = originalShape[y][x];
            }
        }
        
        // Test rotation, apply if no collision
        const originalX = currentPiece.x;
        const originalShape2 = JSON.parse(JSON.stringify(currentPiece.shape));
        
        currentPiece.shape = rotated;
        
        // Wall kick testing - try different positions if the rotation causes collision
        const kicks = [
            {x: 0, y: 0},   // no offset
            {x: 1, y: 0},   // right
            {x: -1, y: 0},  // left
            {x: 0, y: -1},  // up
            {x: 2, y: 0},   // two right
            {x: -2, y: 0},  // two left
        ];
        
        let validRotationFound = false;
        
        for (const kick of kicks) {
            if (!checkCollision(currentPiece.shape, currentPiece.x + kick.x, currentPiece.y + kick.y)) {
                currentPiece.x += kick.x;
                currentPiece.y += kick.y;
                validRotationFound = true;
                break;
            }
        }
        
        if (!validRotationFound) {
            // Revert if no valid rotation found
            currentPiece.shape = originalShape2;
            currentPiece.x = originalX;
        }
    }
    
    function moveLeft() {
        if (!currentPiece || paused || gameOver) return;
        
        if (!checkCollision(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
            currentPiece.x--;
        }
    }
    
    function moveRight() {
        if (!currentPiece || paused || gameOver) return;
        
        if (!checkCollision(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
            currentPiece.x++;
        }
    }
    
    function moveDown() {
        if (!currentPiece || paused || gameOver) return false;
        
        if (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
            currentPiece.y++;
            return true;
        }
        
        // If can't move down, place the piece on board
        placePiece();
        return false;
    }
    
    function hardDrop() {
        if (!currentPiece || paused || gameOver) return;
        
        // Move piece down until collision
        while (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
            currentPiece.y++;
            score += 2; // Bonus points for hard drop
        }
        
        placePiece();
        updateScore();
    }
    
    function placePiece() {
        if (!currentPiece) return;
        
        // Add current piece to the board
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    const boardX = currentPiece.x + x;
                    const boardY = currentPiece.y + y;
                    
                    // Check if part of the piece is outside the top boundary
                    if (boardY < 0) {
                        gameOver = true;
                        if (gameInterval) clearInterval(gameInterval);
                        if (animationFrameId) cancelAnimationFrame(animationFrameId);
                        drawGameOverScreen();
                        return;
                    }
                    
                    if (boardY >= 0 && boardY < BOARD_HEIGHT) {
                        board[boardY][boardX] = currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        checkLines();
        
        // Generate new piece
        currentPiece = nextPiece || getRandomPiece();
        nextPiece = getRandomPiece();
        drawNextPiece();
        
        // Check if game over
        if (checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            gameOver = true;
            if (gameInterval) clearInterval(gameInterval);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            drawGameOverScreen();
        }
    }
    
    function checkLines() {
        let linesCleared = 0;
        
        // Check each row from bottom to top
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            let isLineComplete = true;
            
            // Check if all columns in this row are filled
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (!board[y][x]) {
                    isLineComplete = false;
                    break;
                }
            }
            
            // If line is complete, clear it and shift rows down
            if (isLineComplete) {
                linesCleared++;
                
                // Flash effect for cleared line
                flashLine(y);
                
                // Remove the line
                board.splice(y, 1);
                
                // Add a new empty line at the top
                board.unshift(Array.from({ length: BOARD_WIDTH }, () => null));
                
                // Check the same row again since we've shifted everything down
                y++;
            }
        }
        
        if (linesCleared > 0) {
            // Update lines and score
            lines += linesCleared;
            
            // Calculate score based on number of lines cleared
            const linePoints = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
            score += linePoints[linesCleared] * level;
            
            // Check for level up (every 10 lines)
            let newLevel = Math.floor(lines / 10) + 1;
            if (newLevel !== level) {
                level = newLevel;
                // Increase game speed with each level
                dropSpeed = Math.max(100, 1000 - (level - 1) * 100); // Min 100ms for max difficulty
            }
            
            updateScore();
        }
    }
    
    function flashLine(lineY) {
        // Visual effect for cleared lines
        const originalColors = [];
        
        // Store original colors
        for (let x = 0; x < BOARD_WIDTH; x++) {
            originalColors.push(board[lineY][x]);
            board[lineY][x] = getComputedStyle(document.documentElement).getPropertyValue('--neon-pink').trim();
        }
        
        // Redraw the board to show the flash
        drawBoard();
        
        // Drawing handled in animation frame so no need to reset here
    }
    
    function updateScore() {
        scoreDisplay.textContent = score;
        levelDisplay.textContent = level;
        linesDisplay.textContent = lines;
    }
    
    function resetGame() {
        // Clear board
        board = createEmptyBoard();
        
        // Reset game variables
        score = 0;
        level = 1;
        lines = 0;
        dropSpeed = 1000;
        paused = false;
        gameOver = false;
        
        // Update displays
        updateScore();
        
        // Generate initial pieces
        currentPiece = getRandomPiece();
        nextPiece = getRandomPiece();
        drawNextPiece();
        
        // Clear any existing game loops
        if (gameInterval) clearInterval(gameInterval);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        // Start game loop
        startGameLoop();
    }
    
    function togglePause() {
        if (gameOver) {
            resetGame();
            return;
        }
        
        paused = !paused;
        
        if (paused) {
            if (gameInterval) clearInterval(gameInterval);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            
            // Draw pause screen
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--neon-blue').trim();
            ctx.font = 'bold 30px Orbitron';
            ctx.textAlign = 'center';
            ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-blue').trim();
            ctx.shadowBlur = 15;
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
            ctx.shadowBlur = 0;
        } else {
            // Resume game loop
            startGameLoop();
        }
    }
    
    function startGameLoop() {
        // Game animation loop using requestAnimationFrame
        let lastTime = 0;
        let dropCounter = 0;
        
        function gameLoop(timestamp) {
            if (paused || gameOver) return;
            
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            
            dropCounter += deltaTime;
            
            if (dropCounter > dropSpeed) {
                moveDown();
                dropCounter = 0;
            }
            
            drawBoard();
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // Event listeners for controls
    document.addEventListener('keydown', (event) => {
        if (gameOver && event.code !== 'KeyP') return;
        
        switch(event.code) {
            case 'ArrowLeft':
                moveLeft();
                break;
            case 'ArrowRight':
                moveRight();
                break;
            case 'ArrowDown':
                if (moveDown()) {
                    score += 1; // Bonus point for soft drop
                    updateScore();
                }
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case 'Space':
                hardDrop();
                break;
            case 'KeyP':
                togglePause();
                break;
        }
    });
    
    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchTimeStart = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        if (gameOver) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchTimeStart = Date.now();
    }, { passive: true });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        if (gameOver) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchDuration = Date.now() - touchTimeStart;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        const minSwipeDistance = 30;
        
        // Quick tap - rotate
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && touchDuration < 300) {
            rotatePiece();
            return;
        }
        
        // Swipe down - hard drop
        if (deltaY > minSwipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
            hardDrop();
            return;
        }
        
        // Swipe left/right
        if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
                moveLeft();
            } else {
                moveRight();
            }
            return;
        }
    }, { passive: true });
    
    // Button controls
    startButton.addEventListener('click', togglePause);
    resetButton.addEventListener('click', resetGame);
    
    // Initialize the game
    drawBoard();
    drawGameOverScreen();
    
    // Add some visual effects to the UI
    function addGlowEffects() {
        const buttons = document.querySelectorAll('button');
        
        buttons.forEach(button => {
            button.addEventListener('mouseover', () => {
                button.style.textShadow = '0 0 15px var(--neon-blue)';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.textShadow = '0 0 5px var(--neon-blue)';
            });
        });
    }
    
    addGlowEffects();
});
