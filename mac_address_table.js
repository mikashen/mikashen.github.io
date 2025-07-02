// mac_address_table.js
const canvas = document.getElementById('macTableCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const explanationDiv = document.getElementById('step-explanation');

canvas.width = 800;
canvas.height = 600;

let animationRunning = false;
let macTable = {};

const switchDevice = { x: 420, y: 200, width: 200, height: 100, label: 'Switch' };
const devices = [
    { x: 150, y: 450, label: 'PC-A', mac: 'AA:AA', port: 1 },
    { x: 400, y: 450, label: 'PC-B', mac: 'BB:BB', port: 2 },
    { x: 650, y: 450, label: 'PC-C', mac: 'CC:CC', port: 3 },
];



function drawDevice(device) {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(device.x - 40, device.y - 20, 80, 40);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(device.label, device.x, device.y + 5);
    ctx.fillStyle = 'black';
    ctx.fillText(device.mac, device.x, device.y + 20);
}

function drawSwitch() {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(switchDevice.x - switchDevice.width / 2, switchDevice.y - switchDevice.height / 2, switchDevice.width, switchDevice.height);
    ctx.fillStyle = 'white';
    ctx.fillText(switchDevice.label, switchDevice.x, switchDevice.y);
}

function drawConnections() {
    // PC-A to Console Port
    ctx.beginPath();
    ctx.moveTo(devices[0].x, devices[0].y - 20); // Start from PC-A
    ctx.lineTo(switchPorts.console.x, switchPorts.console.y); // End at Console Port
    ctx.stroke();

    // PC-B to Ethernet1 Port
    ctx.beginPath();
    ctx.moveTo(devices[1].x, devices[1].y - 20); // Start from PC-B
    ctx.lineTo(switchPorts.ethernet1.x, switchPorts.ethernet1.y); // End at Ethernet1 Port
    ctx.stroke();

    // PC-C to Ethernet2 Port
    ctx.beginPath();
    ctx.moveTo(devices[2].x, devices[2].y - 20); // Start from PC-C
    ctx.lineTo(switchPorts.ethernet2.x, switchPorts.ethernet2.y); // End at Ethernet2 Port
    ctx.stroke();
}

function drawMacTable() {
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(50, 50, 200, 100);
    ctx.fillStyle = 'black';
    ctx.font = '14px Noto Sans TC';
    ctx.fillText('MAC Address Table', 150, 70);
    ctx.font = '12px Noto Sans TC';
    let yPos = 90;
    for (const [mac, port] of Object.entries(macTable)) {
        ctx.fillText(`${mac} -> Port ${port}`, 150, yPos);
        yPos += 20;
    }
}

function drawPacket(packet) {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(packet.x, packet.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = '10px Noto Sans TC';
    ctx.fillText(`To: ${packet.to}`, packet.x, packet.y + 5);
}

function updateExplanation(text) {
    explanationDiv.textContent = text;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSwitch();
    devices.forEach(drawDevice);
    drawConnections();
    drawMacTable();
}

async function animatePacket(fromDevice, toDevice) {
    const packet = { x: fromDevice.x, y: fromDevice.y - 30, from: fromDevice.mac, to: toDevice.mac };
    
    // Animate to switch
    await anime({
        targets: packet,
        x: switchDevice.x,
        y: switchDevice.y,
        duration: 1000,
        easing: 'linear',
        update: () => { draw(); drawPacket(packet); }
    }).finished;

    // Switch logic
    updateExplanation(`Switch 收到來自 ${fromDevice.label} 的封包。學習 MAC: ${fromDevice.mac} 在 Port ${fromDevice.port}`);
    macTable[fromDevice.mac] = fromDevice.port;
    draw();
    await new Promise(r => setTimeout(r, 2000));

    if (macTable[toDevice.mac]) {
        // Forwarding
        const targetPort = devices.find(d => d.port === macTable[toDevice.mac]);
        updateExplanation(`在 MAC 表中找到 ${toDevice.mac} 在 Port ${targetPort.port}。進行轉發 (Forwarding)。`);
        await anime({
            targets: packet,
            x: targetPort.x,
            y: targetPort.y - 30,
            duration: 1000,
            easing: 'linear',
            update: () => { draw(); drawPacket(packet); }
        }).finished;
    } else {
        // Flooding
        updateExplanation(`在 MAC 表中找不到 ${toDevice.mac}。進行廣播 (Flooding)。`);
        devices.forEach(async (device) => {
            if (device.port !== fromDevice.port) {
                const p = { ...packet, x: switchDevice.x, y: switchDevice.y };
                await anime({
                    targets: p,
                    x: device.x,
                    y: device.y - 30,
                    duration: 1000,
                    easing: 'linear',
                    update: () => { draw(); drawPacket(p); }
                }).finished;
            }
        });
    }
    await new Promise(r => setTimeout(r, 1000));
}

async function startAnimation() {
    if (animationRunning) return;
    animationRunning = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;

    resetAnimation();

    // Step 1: A to B (Flooding)
    updateExplanation('1. PC-A 發送封包給 PC-B。');
    await new Promise(r => setTimeout(r, 1500));
    await animatePacket(devices[0], devices[1]);

    // Step 2: B to A (Forwarding)
    updateExplanation('2. PC-B 回應封包給 PC-A。');
    await new Promise(r => setTimeout(r, 1500));
    await animatePacket(devices[1], devices[0]);

    updateExplanation('動畫結束。');
    animationRunning = false;
    startBtn.disabled = false;
}

function resetAnimation() {
    animationRunning = false;
    anime.remove(canvas);
    macTable = {};
    draw();
    startBtn.disabled = false;
    resetBtn.disabled = true;
    updateExplanation('點擊 "開始動畫"。');
}

startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);

resetAnimation();
