// poe.js
const canvas = document.getElementById('poeCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const explanationDiv = document.getElementById('step-explanation');

canvas.width = 800;
canvas.height = 600;

let animationRunning = false;
let cameraPowered = false;

const poeSwitch = { x: 200, y: 300, width: 150, height: 80, label: 'PoE Switch' };
const ipCamera = { x: 600, y: 300, width: 100, height: 60, label: 'IP Camera' };

function drawDevice(device, color) {
    ctx.fillStyle = color;
    ctx.fillRect(device.x - device.width / 2, device.y - device.height / 2, device.width, device.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '14px Noto Sans TC';
    ctx.fillText(device.label, device.x, device.y + 5);
}

function drawCamera() {
    const color = cameraPowered ? '#2ecc71' : '#95a5a6';
    drawDevice(ipCamera, color);
    // Lens
    ctx.fillStyle = cameraPowered ? '#f1c40f' : '#7f8c8d';
    ctx.beginPath();
    ctx.arc(ipCamera.x, ipCamera.y - 5, 10, 0, Math.PI * 2);
    ctx.fill();
}

function drawConnection() {
    ctx.beginPath();
    ctx.moveTo(poeSwitch.x + poeSwitch.width / 2, poeSwitch.y);
    ctx.lineTo(ipCamera.x - ipCamera.width / 2, ipCamera.y);
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineWidth = 1;
}

function drawPacket(packet) {
    ctx.fillStyle = packet.color;
    ctx.font = packet.font || '20px Noto Sans TC';
    ctx.textAlign = 'center';
    ctx.fillText(packet.label, packet.x, packet.y);
}

function updateExplanation(text) {
    explanationDiv.textContent = text;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDevice(poeSwitch, '#8e44ad');
    drawCamera();
    drawConnection();
}

async function startAnimation() {
    if (animationRunning) return;
    animationRunning = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;
    resetAnimation();

    updateExplanation('1. PoE 交換器透過網路線連接到 IP 攝影機。');
    await new Promise(r => setTimeout(r, 2000));

    updateExplanation('2. 交換器偵測到攝影機支援 PoE，開始透過網路線供電。');
    const powerPacket = { 
        x: poeSwitch.x + poeSwitch.width / 2, 
        y: poeSwitch.y, 
        label: '⚡', 
        color: '#f39c12',
        font: '30px Arial'
    };

    await anime({
        targets: powerPacket,
        x: ipCamera.x - ipCamera.width / 2,
        duration: 1500,
        easing: 'linear',
        update: () => { 
            draw(); 
            drawPacket(powerPacket); 
        }
    }).finished;

    cameraPowered = true;
    draw();
    updateExplanation('3. 攝影機成功開機，鏡頭亮起！');
    await new Promise(r => setTimeout(r, 2000));

    updateExplanation('4. 現在，資料也可以在同一條線上傳輸。');
    const dataPacket = { 
        x: ipCamera.x - ipCamera.width / 2, 
        y: ipCamera.y + 15, 
        label: '[Video Data]', 
        color: '#3498db',
        font: '12px Noto Sans TC'
    };

    await anime({
        targets: dataPacket,
        x: poeSwitch.x + poeSwitch.width / 2,
        duration: 1500,
        easing: 'linear',
        direction: 'alternate',
        loop: 2,
        update: () => { 
            draw(); 
            drawPacket(dataPacket); 
        }
    }).finished;

    updateExplanation('動畫結束。PoE 實現了電力和資料的單線傳輸。');
    animationRunning = false;
    startBtn.disabled = false;
}

function resetAnimation() {
    animationRunning = false;
    anime.remove(canvas);
    cameraPowered = false;
    draw();
    startBtn.disabled = false;
    resetBtn.disabled = true;
    updateExplanation('點擊 "開始動畫"。');
}

startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);

resetAnimation();
