// 获取游戏元素
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScore = document.getElementById('final-score');
const highScore = document.getElementById('high-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// 设置画布尺寸
canvas.width = 320;
canvas.height = 480;

// 游戏状态
let gameState = {
    current: 'start', // start, playing, over
    gravity: 0.5,
    speed: 2,
    score: 0,
    highScore: localStorage.getItem('flappyHighScore') || 0
};

// 背景对象
const background = {
    draw: function() {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制云朵
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(80, 80, 20, 0, Math.PI * 2);
        ctx.arc(100, 70, 25, 0, Math.PI * 2);
        ctx.arc(120, 85, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(250, 100, 20, 0, Math.PI * 2);
        ctx.arc(270, 90, 25, 0, Math.PI * 2);
        ctx.arc(290, 105, 15, 0, Math.PI * 2);
        ctx.fill();
    }
};

// 地面对象
const ground = {
    y: canvas.height - 80,
    draw: function() {
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, this.y, canvas.width, 80);
        
        // 绘制草地
        ctx.fillStyle = '#33a653';
        ctx.fillRect(0, this.y, canvas.width, 15);
    }
};

// 小鸟对象
const bird = {
    x: 50,
    y: 150,
    width: 34,
    height: 24,
    radius: 12,
    gravity: 0.25,
    jump: 4.6,
    speed: 0,
    rotation: 0,
    
    draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 绘制小鸟身体
        ctx.fillStyle = '#f8c548';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制小鸟眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(5, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制小鸟瞳孔
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(6, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制小鸟嘴巴
        ctx.fillStyle = '#f48c06';
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(this.radius + 10, 0);
        ctx.lineTo(this.radius, 5);
        ctx.fill();
        
        // 绘制小鸟翅膀
        ctx.fillStyle = '#f8c548';
        ctx.beginPath();
        ctx.ellipse(0, 5, 8, 12, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    update: function() {
        // 游戏开始前小鸟轻微上下浮动
        if(gameState.current === 'start') {
            this.y = 150 + Math.sin(Date.now()/300) * 10;
            return;
        }
        
        // 游戏结束后不更新
        if(gameState.current === 'over') return;
        
        // 应用重力
        this.speed += this.gravity;
        this.y += this.speed;
        
        // 碰到地面游戏结束
        if(this.y + this.radius >= ground.y) {
            this.y = ground.y - this.radius;
            if(gameState.current === 'playing') {
                gameState.current = 'over';
                gameOver();
            }
        }
        
        // 碰到顶部边界
        if(this.y - this.radius <= 0) {
            this.y = this.radius;
            this.speed = 0;
        }
        
        // 根据速度设置旋转角度
        if(this.speed >= this.jump) {
            this.rotation = Math.PI/4;
        } else {
            this.rotation = -Math.PI/6;
        }
    },
    
    flap: function() {
        this.speed = -this.jump;
    },
    
    reset: function() {
        this.x = 50;
        this.y = 150;
        this.speed = 0;
        this.rotation = 0;
    }
};

// 管道对象
const pipes = {
    position: [],
    top: {
        height: 150
    },
    bottom: {
        height: 150
    },
    width: 52,
    gap: 100,
    initialGap: 100,  // 初始间隙值
    minGap: 70,       // 最小间隙值
    maxYPos: -40,     // 修改为更低的位置（从-80改为-40）
    initialMaxYPos: -40, // 修改为更低的初始位置（从-80改为-40）
    minMaxYPos: -100,     // 最小的最大Y位置（从-150改为-100，减少极端位置）
    dx: 2,
    initialSpawnInterval: 150, // 初始生成间隔（帧数）
    minSpawnInterval: 90,      // 最小生成间隔（帧数）
    spawnInterval: 150,        // 当前生成间隔
    difficultyIncreaseRate: 0.0005, // 难度增加速率
    
    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            // 上管道
            ctx.fillStyle = '#33a653';
            ctx.fillRect(p.x, p.y, this.width, p.height);
            
            // 上管道边缘
            ctx.fillStyle = '#2e8047';
            ctx.fillRect(p.x - 2, p.y + p.height - 10, this.width + 4, 10);
            
            // 下管道
            let bottomPipeY = p.y + p.height + p.gap; // 使用管道特定的间隙
            ctx.fillStyle = '#33a653';
            ctx.fillRect(p.x, bottomPipeY, this.width, canvas.height - bottomPipeY);
            
            // 下管道边缘
            ctx.fillStyle = '#2e8047';
            ctx.fillRect(p.x - 2, bottomPipeY, this.width + 4, 10);
        }
    },
    
    update: function() {
        if(gameState.current !== 'playing') return;
        
        // 根据游戏进行时间增加难度
        let difficulty = Math.min(1, frames * this.difficultyIncreaseRate);
        
        // 动态调整间隙大小（随时间减小）
        this.gap = this.initialGap - (this.initialGap - this.minGap) * difficulty;
        
        // 动态调整管道生成位置（使位置更极端）
        this.maxYPos = this.initialMaxYPos - (this.initialMaxYPos - this.minMaxYPos) * difficulty;
        
        // 动态调整生成频率（随时间增加）
        this.spawnInterval = this.initialSpawnInterval - (this.initialSpawnInterval - this.minSpawnInterval) * difficulty;
        
        // 每X帧添加一对新管道，X随时间减小
        if(frames % Math.floor(this.spawnInterval) === 0) {
            this.position.push({
                x: canvas.width,
                y: this.maxYPos * (Math.random() + 0.6), // 修改随机因子，使水管高度更合理
                height: this.top.height,
                gap: this.gap // 为每个管道存储当前的间隙值
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            // 移动管道
            p.x -= this.dx;
            
            // 管道移出屏幕后移除
            if(p.x + this.width <= 0) {
                this.position.shift();
                // 通过管道后加分
                gameState.score++;
                scoreDisplay.textContent = gameState.score;
            }
            
            // 碰撞检测
            // 上管道碰撞
            if(
                bird.x + bird.radius > p.x && 
                bird.x - bird.radius < p.x + this.width && 
                bird.y - bird.radius < p.y + p.height && 
                bird.y + bird.radius > p.y
            ) {
                gameState.current = 'over';
                gameOver();
            }
            
            // 下管道碰撞
            let bottomPipeY = p.y + p.height + p.gap; // 使用管道特定的间隙
            if(
                bird.x + bird.radius > p.x && 
                bird.x - bird.radius < p.x + this.width && 
                bird.y + bird.radius > bottomPipeY && 
                bird.y - bird.radius < canvas.height
            ) {
                gameState.current = 'over';
                gameOver();
            }
        }
    },
    
    reset: function() {
        this.position = [];
        this.gap = this.initialGap;
        this.maxYPos = this.initialMaxYPos;
        this.spawnInterval = this.initialSpawnInterval;
    }
};

// 游戏结束处理
function gameOver() {
    // 更新最高分
    if(gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('flappyHighScore', gameState.highScore);
    }
    
    // 显示游戏结束界面
    finalScore.textContent = gameState.score;
    highScore.textContent = gameState.highScore;
    gameOverScreen.classList.remove('hidden');
}

// 重置游戏
function resetGame() {
    gameState.current = 'start';
    gameState.score = 0;
    scoreDisplay.textContent = 0;
    bird.reset();
    pipes.reset();
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

// 开始游戏
function startGame() {
    gameState.current = 'playing';
    startScreen.classList.add('hidden');
}

// 事件监听
canvas.addEventListener('click', function() {
    switch(gameState.current) {
        case 'start':
            startGame();
            bird.flap();
            break;
        case 'playing':
            bird.flap();
            break;
    }
});

document.addEventListener('keydown', function(e) {
    if(e.code === 'Space') {
        switch(gameState.current) {
            case 'start':
                startGame();
                bird.flap();
                break;
            case 'playing':
                bird.flap();
                break;
        }
    }
});

startButton.addEventListener('click', function() {
    startGame();
    bird.flap();
});

restartButton.addEventListener('click', resetGame);

// 显示初始高分
highScore.textContent = gameState.highScore;

// 帧计数器
let frames = 0;

// 游戏循环
function loop() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    background.draw();
    
    // 绘制管道
    pipes.draw();
    
    // 绘制地面
    ground.draw();
    
    // 绘制小鸟
    bird.draw();
    
    // 更新小鸟位置
    bird.update();
    
    // 更新管道位置
    pipes.update();
    
    // 增加帧计数
    frames++;
    
    // 请求下一帧
    requestAnimationFrame(loop);
}

// 开始游戏循环
loop();