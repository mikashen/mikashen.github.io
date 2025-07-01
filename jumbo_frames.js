// jumbo_frames.js
const canvas = document.getElementById('jumboFramesCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const explanationDiv = document.getElementById('step-explanation');

canvas.width = 800;
canvas.height = 600;

let animationRunning = false;
let packets = [];
let animationQueue = Promise.resolve(); // For sequential animations

const DEVICE_SIZE = 80;
const SWITCH_WIDTH = 200;
const SWITCH_HEIGHT = 150;
const PACKET_SIZE_NORMAL = 20; // Visual size for normal frame
const PACKET_SIZE_JUMBO = 40;  // Visual size for jumbo frame

const devices = {
    pc1: { x: 100, y: canvas.height / 2, label: 'PC 1' },
    pc2: { x: canvas.width - 100, y: canvas.height / 2, label: 'PC 2' },
    switch: { x: canvas.width / 2 - SWITCH_WIDTH / 2, y: canvas.height / 2 - SWITCH_HEIGHT / 2, label: 'Switch' }
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
    ctx.fillText(sw.label, sw.x + SWITCH_WIDTH / 2, sw.y - 10);
}

function drawPacket(packet) {
    ctx.fillStyle = packet.color;
    ctx.fillRect(packet.x, packet.y, packet.size, packet.size);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(packet.x, packet.y, packet.size, packet.size);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '10px Arial';
    ctx.fillText(packet.type, packet.x + packet.size / 2, packet.y + packet.size / 2 + 5);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawDevice(devices.pc1);
    drawDevice(devices.pc2);
    drawSwitch(devices.switch);

    packets.forEach(drawPacket);

    if (animationRunning) {
        requestAnimationFrame(draw);
    }
}

function updateExplanation(text) {
    explanationDiv.textContent = text;
}

async function animatePacket(packet, targetX, targetY, duration) {
    await anime({
        targets: packet,
        x: targetX,
        y: targetY,
        easing: 'linear',
        duration: duration,
        update: draw
    }).finished;
}

async function startAnimation() {
    if (animationRunning) return;
    animationRunning = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;
    updateExplanation('動畫開始：比較標準訊框與巨型訊框的傳輸效率。');

    draw();

    const dataAmount = 9000; // 假設要傳輸 9000 bytes 的資料
    const normalFrameMTU = 1500;
    const jumboFrameMTU = 9000;

    // --- 標準訊框傳輸 --- 
    updateExplanation(`傳輸 ${dataAmount} bytes 資料 (標準訊框，MTU: ${normalFrameMTU} bytes)。`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const normalFramesNeeded = Math.ceil(dataAmount / normalFrameMTU);
    for (let i = 0; i < normalFramesNeeded; i++) {
        const packet = {
            id: `normal-${i}`,
            x: devices.pc1.x,
            y: devices.pc1.y,
            size: PACKET_SIZE_NORMAL,
            color: 'blue',
            type: 'Std'
        };
        packets.push(packet);

        animationQueue = animationQueue.then(async () => {
            updateExplanation(`標準訊框 ${i + 1}/${normalFramesNeeded} 從 PC1 傳輸到 Switch。`);
            await animatePacket(packet, devices.switch.x + SWITCH_WIDTH / 2 - PACKET_SIZE_NORMAL / 2, devices.switch.y + SWITCH_HEIGHT / 2 - PACKET_SIZE_NORMAL / 2, 800);
            updateExplanation(`標準訊框 ${i + 1}/${normalFramesNeeded} 從 Switch 傳輸到 PC2。`);
            await animatePacket(packet, devices.pc2.x - PACKET_SIZE_NORMAL / 2, devices.pc2.y - PACKET_SIZE_NORMAL / 2, 800);
            packets = packets.filter(p => p.id !== packet.id); // Remove packet after it reaches destination
            draw();
            await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between packets
        });
        await new Promise(resolve => setTimeout(resolve, 300)); // Delay for packet generation
    }

    await animationQueue; // Wait for all normal frames to finish
    updateExplanation(`所有 ${normalFramesNeeded} 個標準訊框已傳輸完畢。`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // --- 巨型訊框傳輸 --- 
    updateExplanation(`傳輸 ${dataAmount} bytes 資料 (巨型訊框，MTU: ${jumboFrameMTU} bytes)。`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const jumboFramesNeeded = Math.ceil(dataAmount / jumboFrameMTU);
    for (let i = 0; i < jumboFramesNeeded; i++) {
        const packet = {
            id: `jumbo-${i}`,
            x: devices.pc1.x,
            y: devices.pc1.y,
            size: PACKET_SIZE_JUMBO,
            color: 'red',
            type: 'Jumbo'
        };
        packets.push(packet);

        animationQueue = animationQueue.then(async () => {
            updateExplanation(`巨型訊框 ${i + 1}/${jumboFramesNeeded} 從 PC1 傳輸到 Switch。`);
            await animatePacket(packet, devices.switch.x + SWITCH_WIDTH / 2 - PACKET_SIZE_JUMBO / 2, devices.switch.y + SWITCH_HEIGHT / 2 - PACKET_SIZE_JUMBO / 2, 800);
            updateExplanation(`巨型訊框 ${i + 1}/${jumboFramesNeeded} 從 Switch 傳輸到 PC2。`);
            await animatePacket(packet, devices.pc2.x - PACKET_SIZE_JUMBO / 2, devices.pc2.y - PACKET_SIZE_JUMBO / 2, 800);
            packets = packets.filter(p => p.id !== packet.id); // Remove packet after it reaches destination
            draw();
            await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between packets
        });
        await new Promise(resolve => setTimeout(resolve, 300)); // Delay for packet generation
    }

    await animationQueue; // Wait for all jumbo frames to finish
    updateExplanation(`所有 ${jumboFramesNeeded} 個巨型訊框已傳輸完畢。`);
    updateExplanation(`動畫結束。巨型訊框顯著減少了傳輸的訊框數量，提高了效率！`);
    animationRunning = false;
    startBtn.disabled = false;
}

function resetAnimation() {
    animationRunning = false;
    packets = [];
    animationQueue = Promise.resolve();
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
