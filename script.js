const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Progress (LocalStorage so it saves on phone)
let unlockedLevel = parseInt(localStorage.getItem('unlockedLevel')) || 1;
let currentLvl = 1;
let coins = 0;
let timeLeft = 180;
let isRunning = false;
let speed = 0;
let lineOffset = 0;

let player = { x: 0, y: 0, w: 50, h: 90, targetX: 0, ease: 0.15 };
let enemies = [];
let roadCoins = [];

function initMenu() {
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';
    for(let i=1; i<=50; i++) {
        const div = document.createElement('div');
        let status = (i <= unlockedLevel) ? 'unlocked' : 'locked';
        div.className = `lvl-card ${status}`;
        div.innerText = i;
        div.onclick = () => {
            if(i <= unlockedLevel) {
                currentLvl = i;
                startLevel(i);
            }
        };
        grid.appendChild(div);
    }
}

function startLevel(n) {
    document.getElementById('levelMenu').classList.add('hidden');
    document.getElementById('gameOverPopup').classList.add('hidden');
    document.getElementById('winPopup').classList.add('hidden');
    document.getElementById('lvlDisplay').innerText = n;
    
    player.x = canvas.width / 2 - 25;
    player.targetX = player.x;
    player.y = canvas.height - 150;
    
    enemies = []; roadCoins = []; coins = 0;
    document.getElementById('coinDisplay').innerText = "0";
    timeLeft = 180;
    isRunning = true;

    // MEDIUM SPEED LOGIC (Slowed down as per request)
    speed = 6 + (n * 0.3); 
    
    requestAnimationFrame(animate);
    startTimer();
}

function startTimer() {
    let timer = setInterval(() => {
        if(!isRunning) { clearInterval(timer); return; }
        timeLeft--;
        let m = Math.floor(timeLeft/60);
        let s = timeLeft%60;
        document.getElementById('timerDisplay').innerText = `${m}:${s<10?'0'+s:s}`;
        
        if(timeLeft <= 0) {
            clearInterval(timer);
            winLevel();
        }
    }, 1000);
}

// Touch controls
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    let rect = canvas.getBoundingClientRect();
    player.targetX = (e.touches[0].clientX - rect.left) - player.w/2;
}, {passive: false});

function drawRoad() {
    ctx.fillStyle = "#111"; // Real dark road
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    // Road Markings (Side lines)
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 10;
    ctx.strokeRect(20, -10, canvas.width-40, canvas.height+20);

    // Center Dashed Line
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.setLineDash([40, 60]);
    ctx.lineDashOffset = -lineOffset;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();
    lineOffset += speed;
}

function animate() {
    if(!isRunning) return;
    ctx.clearRect(0,0, canvas.width, canvas.height);
    drawRoad();

    player.x += (player.targetX - player.x) * player.ease;
    if(player.x < 30) player.x = 30;
    if(player.x > canvas.width - 80) player.x = canvas.width - 80;

    // Player Car
    ctx.fillStyle = "#00d2ff";
    ctx.shadowBlur = 20; ctx.shadowColor = "#00d2ff";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    // Spawn Enemies (LESS FREQUENT: 0.01)
    if(Math.random() < 0.01) {
        enemies.push({x: 40 + Math.random()*(canvas.width-120), y: -100});
    }
    // Coins
    if(Math.random() < 0.015) {
        roadCoins.push({x: 50 + Math.random()*(canvas.width-100), y: -50, a: 0});
    }

    // Traffic Update
    enemies.forEach((en, i) => {
        en.y += speed * 0.7; // Enemies move slower than road
        ctx.fillStyle = "#ff004c";
        ctx.fillRect(en.x, en.y, 50, 90);
        
        // COLLISION
        if(Math.abs(player.x - en.x) < 42 && Math.abs(player.y - en.y) < 82) gameOver();
        if(en.y > canvas.height) enemies.splice(i, 1);
    });

    // Coins Update
    roadCoins.forEach((c, i) => {
        c.y += speed;
        c.a += 0.1;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(Math.sin(c.a), 1);
        ctx.fillStyle = "#ffd700";
        ctx.beginPath(); ctx.arc(0,0, 12, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        if(Math.abs(player.x+25-c.x) < 35 && Math.abs(player.y+40-c.y) < 40) {
            coins += 10;
            document.getElementById('coinDisplay').innerText = coins;
            roadCoins.splice(i, 1);
        }
    });

    document.getElementById('speedText').innerText = Math.floor(speed * 12);
    requestAnimationFrame(animate);
}

function gameOver() {
    isRunning = false;
    document.getElementById('gameOverPopup').classList.remove('hidden');
}

function retryLevel() {
    startLevel(currentLvl);
}

function winLevel() {
    isRunning = false;
    if(currentLvl == unlockedLevel) {
        unlockedLevel++;
        localStorage.setItem('unlockedLevel', unlockedLevel);
    }
    document.getElementById('winCoins').innerText = coins;
    document.getElementById('winPopup').classList.remove('hidden');
    
    document.getElementById('nextLvlBtn').onclick = () => {
        currentLvl++;
        startLevel(currentLvl);
    };
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
initMenu();

