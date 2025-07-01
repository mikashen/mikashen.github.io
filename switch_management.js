// switch_management.js
const canvas = document.getElementById('switchManagementCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const explanationDiv = document.getElementById('step-explanation');

canvas.width = 800;
canvas.height = 600;

let animationRunning = false;
let currentAnimation = null;

const DEVICE_SIZE = 80;
const SWITCH_WIDTH = 200;
const SWITCH_HEIGHT = 150;
const ICON_SIZE = 40;

const devices = {
    admin: { x: 100, y: canvas.height / 2, label: '管理員' },
    switch: { x: canvas.width / 2 - SWITCH_WIDTH / 2, y: canvas.height / 2 - SWITCH_HEIGHT / 2, label: 'Switch' }
};

// Define management interface positions after 'devices' is initialized
devices.cli = { x: devices.switch.x + SWITCH_WIDTH / 2, y: devices.switch.y - 80, label: 'CLI' };
devices.web = { x: devices.switch.x + SWITCH_WIDTH + 80, y: devices.switch.y + SWITCH_HEIGHT / 2, label: 'Web 介面' };
devices.snmp = { x: devices.switch.x + SWITCH_WIDTH / 2, y: devices.switch.y + SWITCH_HEIGHT + 80, label: 'SNMP' };

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

function drawIcon(icon, color = '#f39c12') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(icon.x, icon.y, ICON_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '12px Noto Sans TC';
    ctx.fillText(icon.label, icon.x, icon.y + 5);
}

function draw() {
    console.log('draw called'); // Debug message
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawDevice(devices.admin);
    drawSwitch(devices.switch);

    // Draw management interfaces as icons
    drawIcon(devices.cli, '#e74c3c');
    drawIcon(devices.web, '#2ecc71');
    drawIcon(devices.snmp, '#9b59b6');

    if (animationRunning) {
        requestAnimationFrame(draw);
    }
}

function updateExplanation(text) {
    explanationDiv.textContent = text;
}

async function animateInteraction(startDevice, endDevice, label, color) {
    const tempIcon = {
        x: startDevice.x,
        y: startDevice.y,
        label: label,
        color: color
    };
    
    // Animate from start to end
    await anime({
        targets: tempIcon,
        x: endDevice.x,
        y: endDevice.y,
        easing: 'linear',
        duration: 1500,
        update: () => {
            draw();
            drawIcon(tempIcon, tempIcon.color);
        }
    }).finished;
}

async function startAnimation() {
    if (animationRunning) return;
    animationRunning = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;
    updateExplanation('動畫開始：展示Switch不同的管理方式。');

    draw();

    // CLI Interaction
    updateExplanation('透過 CLI (命令列介面) 管理Switch。');
    await animateInteraction(devices.admin, devices.cli, 'CLI 命令', '#e74c3c');
    await animateInteraction(devices.cli, devices.switch, '配置指令', '#e74c3c');
    updateExplanation('CLI 管理完成。');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Web Interface Interaction
    updateExplanation('透過 Web 介面管理Switch。');
    await animateInteraction(devices.admin, devices.web, 'Web 請求', '#2ecc71');
    await animateInteraction(devices.web, devices.switch, 'GUI 操作', '#2ecc71');
    updateExplanation('Web 介面管理完成。');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // SNMP Interaction
    updateExplanation('透過 SNMP (簡易網路管理協定) 監控Switch。');
    await animateInteraction(devices.admin, devices.snmp, 'SNMP Get', '#9b59b6');
    await animateInteraction(devices.snmp, devices.switch, 'SNMP Response', '#9b59b6');
    updateExplanation('SNMP 監控完成。');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateExplanation('所有管理方式展示完畢。');
    animationRunning = false;
    startBtn.disabled = false;
}

function resetAnimation() {
    animationRunning = false;
    if (currentAnimation) {
        currentAnimation.pause();
    }
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
