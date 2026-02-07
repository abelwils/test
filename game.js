const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const textElement = document.getElementById('level-text');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const bgMusic = document.getElementById('bgMusic');
const finalMusic = document.getElementById('finalMusic');
const creditsLayer = document.getElementById('credits-layer');

canvas.width = 800;
canvas.height = 400;

// Asset Loading
const images = {};
const assetNames = [
    'front', 'back', 'walk1', 'walk2', 'heart', 'flower',
    'male_idle', 'male_left', 'male_right', 'male_looking_left'
];

assetNames.forEach(name => {
    images[name] = new Image();
    images[name].src = `assets/${name}.png`;
});

let currentLevel = 0;
let frameCount = 0;
let levelTimer = 0;
let sunriseOpacity = 0;
let cinematicStage = 0; 
const GROUND_Y = 315; // Locked ground position for the end

const player = {
    x: 50, y: 300, w: 45, h: 65,
    dx: 0, dy: 0,
    maxSpeed: 2.8, acceleration: 0.3, friction: 0.85,
    jump: -12.2, grounded: false, facing: 'front'
};

const male = {
    x: 850, y: GROUND_Y, w: 45, h: 65, 
    active: false, dx: 0, facing: 'male_left'
};

const levels = [
    { text: "Just start. I’m with you ❤️", type: "platform", platforms: [{x:0, y:380, w:800, h:20}], hearts: [] },
    { text: "See? You’re doing great 💕", type: "platform", platforms: [{x:0, y:380, w:400, h:20}, {x:480, y:310, w:320, h:20}], hearts: [] },
    { text: "Reach for the love you give 💖", type: "collect", platforms: [{x:0, y:380, w:200, h:20}, {x:300, y:280, w:200, h:20}, {x:600, y:200, w:200, h:20}], hearts: [{x:380, y:220}, {x:680, y:140}] },
    { text: "Even on quiet days… I choose you.", type: "memory", platforms: [{x:0, y:380, w:800, h:20}], duration: 250 },
    { text: "Sometimes things feel out of reach...", type: "collect", platforms: [{x:0, y:380, w:180, h:20}, {x:240, y:300, w:120, h:20}, {x:420, y:350, w:120, h:20}, {x:600, y:240, w:200, h:20}], hearts: [{x:280, y:240}, {x:680, y:180}] },
    { text: "But you never give up, and I admire that.", type: "platform", platforms: [{x:0, y:380, w:150, h:20}, {x:250, y:310, w:120, h:20}, {x:450, y:240, w:120, h:20}, {x:650, y:180, w:150, h:20}], hearts: [] },
    { text: "Collect these moments, they belong to us.", type: "collect", platforms: [{x:0, y:380, w:200, h:20}, {x:300, y:240, w:200, h:20}, {x:600, y:380, w:200, h:20}], hearts: [{x:380, y:180}, {x:100, y:320}, {x:700, y:320}] },
    { text: "Patience is just another word for love.", type: "timing", platforms: [{x:0, y:380, w:250, h:20}, {x:400, y:380, w:150, h:20}, {x:650, y:380, w:150, h:20}], hearts: [] },
    { text: "I'll always be waiting at the end for you.", type: "memory", platforms: [{x:0, y:380, w:800, h:20}], duration: 200 },
    { text: "Almost there, my love...", type: "platform", platforms: [{x:0, y:380, w:250, h:20}, {x:350, y:300, w:150, h:20}, {x:600, y:380, w:200, h:20}], hearts: [] },
    { text: "Every step you took… was for us.", type: "walk", platforms: [{x:0, y:380, w:800, h:20}], hearts: [] },
    { text: "Happy Valentine's Day ❤️\nI built this journey for you.", type: "final", platforms: [{x:0, y:380, w:800, h:20}], hearts: [] }
];

const keys = {};
window.onkeydown = e => keys[e.code] = true;
window.onkeyup = e => keys[e.code] = false;

// Mobile Event Listeners
document.getElementById('leftBtn').ontouchstart = (e) => { e.preventDefault(); keys['ArrowLeft'] = true; };
document.getElementById('leftBtn').ontouchend = () => { keys['ArrowLeft'] = false; };
document.getElementById('rightBtn').ontouchstart = (e) => { e.preventDefault(); keys['ArrowRight'] = true; };
document.getElementById('rightBtn').ontouchend = () => { keys['ArrowRight'] = false; };
document.getElementById('jumpBtn').ontouchstart = (e) => { e.preventDefault(); keys['Space'] = true; };
document.getElementById('jumpBtn').ontouchend = () => { keys['Space'] = false; };

startBtn.onclick = () => {
    startScreen.style.display = 'none';
    bgMusic.play();
    gameLoop();
};

function playEndSequence() {
    creditsLayer.style.display = 'flex';
    creditsLayer.innerHTML = `
        <div class="credit-content">
            ❤️ UNTUKMU SELAMANYA ❤️<br><br>
            Kamu adalah segalanya bagiku.<br>
            Kebahagiaanku bermula dan berakhir padamu.<br>
            Setiap detik bersamamu adalah anugerah terindah.<br><br>
            Aku mencintaimu lebih dari kata-kata yang bisa kuucapkan.<br>
            Kamu adalah rumah, tempatku pulang dan berlabuh.<br>
            Terima kasih telah menjadi alasan di balik setiap senyumku.<br><br>
            Aku berjanji akan menjagamu dan mencintaimu selamanya.<br>
            Sampai nafas terakhir, hanya kamu di hatiku.<br><br>
            Kamu adalah duniaku, cahayaku, dan masa depanku.<br>
            Selamat Hari Valentine, Sayangku. ❤️<br><br>
            Selamanya Milikmu.
        </div>
    `;
}

function initLevel(index) {
    currentLevel = index;
    player.x = 30; player.y = 200;
    player.dx = 0; player.dy = 0;
    levelTimer = 0;
    textElement.innerText = levels[index].text;
    if (levels[index].type === 'final') {
        bgMusic.pause();
        finalMusic.play();
        male.active = true;
        male.x = 850;
        male.y = GROUND_Y;
        male.facing = 'male_left';
        player.x = 250; 
        player.y = GROUND_Y; // Force Hijab girl to the ground
        cinematicStage = 0;
    }
}

function update() {
    const lvl = levels[currentLevel];
    
    if (lvl.type === 'final') {
        // DISABLE PHYSICS FOR THE END SCENE
        player.dy = 0;
        player.y = GROUND_Y; 
        
        if (cinematicStage === 0) { // Male walks from RIGHT to her
            male.dx = -1.2;
            male.x += male.dx;
            male.facing = 'male_left';
            player.facing = 'front'; // Keep her idle while he approaches
            if (male.x <= player.x + 55) {
                male.dx = 0;
                cinematicStage = 1;
                levelTimer = 0;
            }
        } else if (cinematicStage === 1) { // Standing together
            male.facing = 'male_looking_left'; 
            player.facing = 'front'; // Stable idle while getting flowers
            levelTimer++;
            if (sunriseOpacity < 1) sunriseOpacity += 0.003; 
            if (levelTimer > 350) cinematicStage = 2; 
        } else if (cinematicStage === 2) { // both walk out left together
            male.dx = -0.8;
            player.dx = -0.8;
            male.x += male.dx;
            player.x += player.dx;
            male.facing = 'male_left';
            player.facing = 'back'; // Animation walking left
            if (player.x < -100) {
                cinematicStage = 3;
                playEndSequence();
            }
        }
    } else {
        // Normal Gameplay Controls
        if (keys['ArrowLeft'] || keys['KeyA']) {
            player.dx -= player.acceleration;
            if (player.dx < -player.maxSpeed) player.dx = -player.maxSpeed;
            player.facing = 'back';
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            player.dx += player.acceleration;
            if (player.dx > player.maxSpeed) player.dx = player.maxSpeed;
            player.facing = 'walk';
        } else {
            player.dx *= player.friction; 
            player.facing = 'front';
        }
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.grounded) {
            player.dy = player.jump;
            player.grounded = false;
        }

        player.dy += 0.55; 
        player.x += player.dx;
        player.y += player.dy;

        player.grounded = false;
        lvl.platforms.forEach(p => {
            if (player.x + player.w > p.x && player.x < p.x + p.w &&
                player.y + player.h > p.y && player.y + player.h < p.y + p.h + player.dy + 1) {
                player.y = p.y - player.h;
                player.dy = 0;
                player.grounded = true;
            }
        });
    }

    if (lvl.hearts) {
        lvl.hearts = lvl.hearts.filter(h => {
            return !(player.x < h.x + 30 && player.x + player.w > h.x &&
                     player.y < h.y + 30 && player.y + player.h > h.y);
        });
    }

    if (player.x > canvas.width && lvl.type !== 'final') {
        if (currentLevel < levels.length - 1) initLevel(currentLevel + 1);
    }
    if (player.y > canvas.height) { player.x = 30; player.y = 200; }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const lvl = levels[currentLevel];

    if (sunriseOpacity > 0) {
        let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, `rgba(255, 94, 0, ${sunriseOpacity * 0.6})`); 
        grad.addColorStop(0.5, `rgba(255, 204, 0, ${sunriseOpacity * 0.4})`); 
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "rgba(255, 192, 203, 0.75)";
    lvl.platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(p.x, p.y, p.w, 3);
        ctx.fillStyle = "rgba(255, 192, 203, 0.75)";
    });

    if (lvl.hearts) {
        lvl.hearts.forEach(h => ctx.drawImage(images.heart, h.x, h.y, 35, 35));
    }

    // DRAW HIJAB GIRL
    let img = images.front;
    if (player.facing === 'back' || player.facing === 'walk') {
        img = (Math.floor(frameCount / 12) % 2 === 0) ? images.walk1 : images.walk2;
    }
    ctx.drawImage(img, player.x, player.y, player.w, player.h);

    // DRAW MALE CHARACTER
    if (male.active) {
        let mImg = images.male_idle;
        if (male.facing === 'male_left') {
            mImg = (Math.floor(frameCount / 12) % 2 === 0) ? images.male_left : images.male_idle;
        } else {
            mImg = images.male_looking_left;
        }
        ctx.drawImage(mImg, male.x, male.y, male.w, male.h);
        
        // Flower placement
        ctx.drawImage(images.flower, male.x - 15, male.y + 15, 35, 35);
    }
    
    frameCount++;
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
initLevel(0);