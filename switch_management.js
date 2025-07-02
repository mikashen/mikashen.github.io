// switch_management.js
const canvas = document.getElementById('switchManagementCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const explanationDiv = document.getElementById('step-explanation');

canvas.width = 800;
canvas.height = 600;

let animationRunning = false;
let currentStep = 0;
let animeInstance = null;

// --- Asset Positions (Simple & Hardcoded) ---
const adminPC = { x: 150, y: 300, width: 120, height: 80, label: '管理員電腦', color: '#3498db' };
const networkSwitch = { x: 600, y: 300, width: 180, height: 100, label: 'Switch', color: '#e67e22' };
const nmsServer = { x: 150, y: 120, width: 120, height: 80, label: 'NMS 伺服器', color: '#9b59b6' };

const switchPorts = {
    console: { x: networkSwitch.x - 40, y: networkSwitch.y + networkSwitch.height / 2 },
    ethernet1: { x: networkSwitch.x, y: networkSwitch.y + networkSwitch.height / 2 },
    ethernet2: { x: networkSwitch.x + 40, y: networkSwitch.y + networkSwitch.height / 2 },
};

// --- Drawing Functions (Simple & Robust) ---
function drawTitle(title) {
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 24px Noto Sans TC';
    ctx.textAlign = 'left';
    ctx.fillText(title, 20, 40);
    ctx.textAlign = 'center'; // Reset for other functions
}

function drawRectDevice(device) {
    ctx.fillStyle = device.color;
    ctx.fillRect(device.x - device.width / 2, device.y - device.height / 2, device.width, device.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '14px Noto Sans TC';
    ctx.fillText(device.label, device.x, device.y + 5);
}

function drawSwitchPorts() {
    // Port rectangles
    ctx.fillStyle = '#34495e';
    ctx.fillRect(switchPorts.console.x - 5, switchPorts.console.y, 10, 10); // Console
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(switchPorts.ethernet1.x - 5, switchPorts.ethernet1.y, 10, 10); // Eth1
    ctx.fillRect(switchPorts.ethernet2.x - 5, switchPorts.ethernet2.y, 10, 10); // Eth2

    // Port labels
    ctx.fillStyle = 'black';
    ctx.font = '12px Noto Sans TC';
    ctx.textAlign = 'center';
    ctx.fillText('Console', switchPorts.console.x, switchPorts.console.y + 25);
    ctx.fillText('Eth1', switchPorts.ethernet1.x, switchPorts.ethernet1.y + 25);
    ctx.fillText('Eth2', switchPorts.ethernet2.x, switchPorts.ethernet2.y + 25);
}

// Using simple straight lines
function drawCable(start, end, color = '#7f8c8d') {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

function drawPacket(packet) {
    ctx.fillStyle = packet.color;
    ctx.beginPath();
    ctx.arc(packet.x, packet.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '10px Noto Sans TC';
    ctx.textAlign = 'center';
    ctx.fillText(packet.label, packet.x, packet.y + 4);
}

function drawTerminal(pc) {
    const termWidth = 200;
    const termHeight = 50;
    const termX = pc.x;
    const termY = pc.y - pc.height / 2 - termHeight - 10;

    ctx.fillStyle = 'black';
    ctx.fillRect(termX - termWidth / 2, termY, termWidth, termHeight);
    ctx.fillStyle = '#2ecc71';
    ctx.font = '12px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`> vlan 10`, termX - termWidth / 2 + 10, termY + 30);
    ctx.textAlign = 'center';
}

function drawBrowser(pc) {
    const browserWidth = 200;
    const browserHeight = 120;
    const browserX = pc.x;
    const browserY = pc.y - pc.height / 2 - browserHeight - 10;

    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(browserX - browserWidth / 2, browserY, browserWidth, browserHeight);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(browserX - browserWidth / 2, browserY, browserWidth, 20);
    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 12px Noto Sans TC';
    ctx.textAlign = 'center';
    ctx.fillText('Web 管理介面', browserX, browserY + 75);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateExplanation(text) {
    explanationDiv.innerHTML = text;
}

// --- Animation Steps ---
const animationSteps = [
    { part: 'cli', title: 'CLI 管理模式', text: "<b>第一步：CLI (命令列介面) 管理</b><br>這是最直接的管理方式，通常用於初次設定。" },
    { part: 'cli', title: 'CLI 管理模式', text: "我們需要一條 Console 線，將管理員電腦連接到 Switch 的 Console 埠。" },
    { part: 'cli', title: 'CLI 管理模式', text: "連接後，管理員就能透過終端機軟體下達指令。" },
    { part: 'cli', title: 'CLI 管理模式', text: "例如，我們可以傳送一個建立 VLAN 的指令。", isAnimated: true },
    { part: 'web', title: 'Web 介面模式', text: "<b>第二步：Web 介面管理</b><br>當 Switch 連上網路後，就可以用更方便的 Web 介面。" },
    { part: 'web', title: 'Web 介面模式', text: "這次我們使用一般的網路線，連接到 Switch 的乙太網路埠。" },
    { part: 'web', title: 'Web 介面模式', text: "管理員打開瀏覽器，就能看到圖形化的設定畫面。" },
    { part: 'web', title: 'Web 介面模式', text: "所有設定都透過點擊按鈕和填寫表單完成，非常直觀。", isAnimated: true },
    { part: 'snmp', title: 'SNMP 監控模式', text: "<b>第三步：SNMP (簡易網路管理協定)</b><br>適用於大規模網路的集中監控。" },
    { part: 'snmp', title: 'SNMP 監控模式', text: "一台 NMS (網路管理站) 伺服器會連接到網路中。" },
    { part: 'snmp', title: 'SNMP 監控模式', text: "NMS 會定期發送 'Get' 請求，來查詢 Switch 的流量、CPU使用率等狀態。", isAnimated: true, packet: { type: 'Get' } },
    { part: 'snmp', title: 'SNMP 監控模式', text: "Switch 收到後，會回傳對應的狀態資訊。", isAnimated: true, packet: { type: 'Resp' } },
    { part: 'snmp', title: 'SNMP 監控模式', text: "如果發生緊急事件 (如埠斷線)，Switch 會主動發送 'Trap' 警報給 NMS。", isAnimated: true, packet: { type: 'Trap' } },
    { part: 'end', title: '動畫結束', text: "所有管理方式展示完畢！" },
];

function drawCurrentScene(stepIndex) {
    clearCanvas();
    const step = animationSteps[stepIndex];
    const part = step.part;

    drawTitle(step.title || '');

    drawRectDevice(adminPC);
    drawRectDevice(networkSwitch);
    drawSwitchPorts();

    if (part === 'cli') {
        if (stepIndex >= 1) drawCable({ x: adminPC.x, y: adminPC.y }, switchPorts.console, '#34495e');
        if (stepIndex >= 2) drawTerminal(adminPC);
    } else if (part === 'web') {
        if (stepIndex >= 5) drawCable({ x: adminPC.x, y: adminPC.y }, switchPorts.ethernet1, '#27ae60');
        if (stepIndex >= 6) drawBrowser(adminPC);
    } else if (part === 'snmp' || part === 'end') {
        drawRectDevice(nmsServer);
        if (stepIndex >= 9) drawCable({ x: nmsServer.x, y: nmsServer.y }, switchPorts.ethernet2, '#27ae60');
        if (step.packet?.type === 'Trap') {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(switchPorts.ethernet1.x - 7, switchPorts.ethernet1.y, 14, 14);
        }
    }
}

async function animatePacket(packetType) {
    let start, end, label, color;
    switch (packetType) {
        case 'CLI':
            start = { x: adminPC.x, y: adminPC.y }; end = { x: networkSwitch.x, y: networkSwitch.y }; label = 'conf t'; color = '#c0392b';
            break;
        case 'Web':
            start = { x: adminPC.x, y: adminPC.y }; end = { x: networkSwitch.x, y: networkSwitch.y }; label = 'HTTP'; color = '#2980b9';
            break;
        case 'Get':
            start = { x: nmsServer.x, y: nmsServer.y }; end = { x: networkSwitch.x, y: networkSwitch.y }; label = 'Get'; color = '#8e44ad';
            break;
        case 'Resp':
            start = { x: networkSwitch.x, y: networkSwitch.y }; end = { x: nmsServer.x, y: nmsServer.y }; label = 'Resp'; color = '#8e44ad';
            break;
        case 'Trap':
            start = { x: networkSwitch.x, y: networkSwitch.y }; end = { x: nmsServer.x, y: nmsServer.y }; label = 'Trap!'; color = '#e74c3c';
            break;
    }

    const packet = { x: start.x, y: start.y, label, color };
    animeInstance = anime({
        targets: packet,
        x: end.x,
        y: end.y,
        duration: 1500,
        easing: 'easeInOutSine',
        update: () => {
            drawCurrentScene(currentStep);
            drawPacket(packet);
        }
    });
    await animeInstance.finished;
}

async function startAnimation() {
    if (animationRunning) return;
    animationRunning = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;

    for (currentStep = 0; currentStep < animationSteps.length; currentStep++) {
        const step = animationSteps[currentStep];
        updateExplanation(step.text);
        drawCurrentScene(currentStep);
        if (step.isAnimated) {
            let packetType = '';
            if (step.part === 'cli') packetType = 'CLI';
            else if (step.part === 'web') packetType = 'Web';
            else if (step.part === 'snmp') packetType = step.packet.type;
            await animatePacket(packetType);
        } else {
            await new Promise(r => setTimeout(r, 2000));
        }
        if (!animationRunning) break;
    }
    
    if (animationRunning) {
        updateExplanation('所有管理方式展示完畢。點擊 "重設" 重新觀看。');
        startBtn.style.display = 'none';
        resetBtn.style.display = 'inline-block';
    }
    animationRunning = false;
}

function resetAnimation() {
    animationRunning = false;
    if (animeInstance) anime.remove(animeInstance.targets);
    currentStep = 0;
    startBtn.disabled = false;
    resetBtn.disabled = true;
    startBtn.style.display = 'inline-block';
    drawCurrentScene(0);
    updateExplanation('此動畫將展示三種 Switch 管理方式。<br>點擊 "開始動畫" 觀看。');
}

// --- Initialization ---
startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);
resetAnimation();
