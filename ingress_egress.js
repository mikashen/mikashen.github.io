// ingress_egress.js
const canvas = document.getElementById('ingressEgressCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const explanationDiv = document.getElementById('step-explanation');

canvas.width = 800;
canvas.height = 600;

let animationRunning = false;
let packet = null;

const DEVICE_SIZE = 80;
const SWITCH_WIDTH = 200;
const SWITCH_HEIGHT = 150;
const PORT_SIZE = 20;
const PACKET_SIZE = 30;

const devices = {
    pc1: { x: canvas.width / 2 - SWITCH_WIDTH / 2 - 150, y: canvas.height / 2, label: 'PC 1' }, // Adjust PC1 position
    switch: { x: canvas.width / 2 - SWITCH_WIDTH / 2, y: canvas.height / 2 - SWITCH_HEIGHT / 2, label: 'Switch' },
    pc2: { x: canvas.width / 2 + SWITCH_WIDTH / 2 + 150, y: canvas.height / 2, label: 'PC 2' }  // Adjust PC2 position
};

const ports = {
    ingress: { x: devices.switch.x, y: devices.switch.y + SWITCH_HEIGHT / 2, label: 'Ingress Port' },
    egress: { x: devices.switch.x + SWITCH_WIDTH, y: devices.switch.y + SWITCH_HEIGHT / 2, label: 'Egress Port' }
};

function drawDevice(device, color = '#3498db') {
    ctx.fillStyle = color;
    ctx.fillRect(device.x - DEVICE_SIZE / 2, device.y - DEVICE_SIZE / 2, DEVICE_SIZE, DEVICE_SIZE);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '14px Noto Sans TC';
    ctx.fillText(device.label, device.x, device.y + 5);
}

function drawSwitch(sw, color = '#2c3e50') {
    ctx.fillStyle = color;
    ctx.fillRect(sw.x, sw.y, SWITCH_WIDTH, SWITCH_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '16px Noto Sans TC';
    ctx.fillText(sw.label, sw.x + SWITCH_WIDTH / 2, sw.y + SWITCH_HEIGHT / 2 + 5);
}

function drawPort(port, color = '#f39c12') {
    ctx.fillStyle = color;
    ctx.fillRect(port.x - PORT_SIZE / 2, port.y - PORT_SIZE / 2, PORT_SIZE, PORT_SIZE);
    ctx.fillStyle = 'blue'; // Changed text color to blue
    ctx.textAlign = 'center';
    ctx.font = '12px Noto Sans TC'; // Increased font size
    ctx.fillText(port.label, port.x, port.y + PORT_SIZE + 10);
}

function drawPacket(p) {
    if (!p) return;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x, p.y, p.size, p.size);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillText('Data', p.x + p.size / 2, p.y + p.size / 2 + 5);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawDevice(devices.pc1);
    drawDevice(devices.pc2);
    drawSwitch(devices.switch);
    drawPort(ports.ingress, '#3498db');
    drawPort(ports.egress, '#2ecc71');

    drawPacket(packet);

    if (animationRunning) {
        requestAnimationFrame(draw);
    }
}

function updateExplanation(text) {
    explanationDiv.textContent = text;
}

async function animatePacketFlow() {
    packet = {
        x: devices.pc1.x - PACKET_SIZE / 2,
        y: devices.pc1.y - PACKET_SIZE / 2,
        size: PACKET_SIZE,
        color: 'purple'
    };

    // Phase 1: PC1 to Ingress Port
    updateExplanation('資料包從 PC1 發送到Switch的 Ingress Port。');
    await anime({
        targets: packet,
        x: ports.ingress.x - PACKET_SIZE / 2,
        y: ports.ingress.y - PACKET_SIZE / 2,
        easing: 'linear',
        duration: 1000,
        update: draw
    }).finished;

    // Phase 2: Ingress Processing
    updateExplanation('資料包進入 Ingress 階段：進行檢查、分類和處理。');
    await anime({
        targets: packet,
        x: devices.switch.x + SWITCH_WIDTH / 2 - PACKET_SIZE / 2,
        y: devices.switch.y + SWITCH_HEIGHT / 2 - PACKET_SIZE / 2,
        easing: 'linear',
        duration: 1500,
        update: draw,
        backgroundColor: '#f1c40f' // Change color during processing
    }).finished;

    // Phase 3: Egress Processing
    updateExplanation('資料包進入 Egress 階段：準備從 Egress Port 發送。');
    await anime({
        targets: packet,
        x: ports.egress.x - PACKET_SIZE / 2,
        y: ports.egress.y - PACKET_SIZE / 2,
        easing: 'linear',
        duration: 1000,
        update: draw,
        backgroundColor: '#2ecc71' // Change color for egress
    }).finished;

    // Phase 4: Egress Port to PC2
    updateExplanation('資料包從 Egress Port 發送到 PC2。');
    await anime({
        targets: packet,
        x: devices.pc2.x - PACKET_SIZE / 2,
        y: devices.pc2.y - PACKET_SIZE / 2,
        easing: 'linear',
        duration: 1000,
        update: draw
    }).finished;

    updateExplanation('動畫結束：資料包已成功從 Ingress 到 Egress。');
    animationRunning = false;
    startBtn.disabled = false;
}

async function startAnimation() {
    if (animationRunning) return;
    animationRunning = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;
    updateExplanation('動畫開始：展示資料包的 Ingress 和 Egress 過程。');

    draw();
    await animatePacketFlow();
}

function resetAnimation() {
    animationRunning = false;
    packet = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw();
    startBtn.disabled = false;
    resetBtn.disabled = true;
    updateExplanation('動畫已重設。點擊 "開始動畫" 開始。');
}

// Initial draw
draw();
resetBtn.disabled = true;

startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);
