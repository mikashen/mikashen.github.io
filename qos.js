// qos.js
const canvas = document.getElementById('qosCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const explanationDiv = document.getElementById('step-explanation');

canvas.width = 800;
canvas.height = 600;

let animationRunning = false;
let packets = []; // All packets, including those in transit and processed
let queues = {
    high: [],
    medium: [],
    low: []
};
let packetCounter = 0;
let processingInterval = null;

const DEVICE_SIZE = 80;
const SWITCH_WIDTH = 200;
const SWITCH_HEIGHT = 150;
const QUEUE_WIDTH = 30;
const QUEUE_HEIGHT = 100;
const PACKET_SIZE = 20;

const devices = {
    pc1: { x: 100, y: canvas.height / 2 - 150, label: 'PC 1' },
    pc2: { x: 100, y: canvas.height / 2, label: 'PC 2' },
    pc3: { x: 100, y: canvas.height / 2 + 150, label: 'PC 3' },
    pc4: { x: canvas.width - 100, y: canvas.height / 2, label: 'PC 4' }, // New PC4
    switch: { x: canvas.width / 2 - SWITCH_WIDTH / 2, y: canvas.height / 2 - SWITCH_HEIGHT / 2, label: 'Switch' }
};

// Define queue positions relative to the switch
const queuePositions = {
    high: { x: devices.switch.x + 20, y: devices.switch.y + 30 },
    medium: { x: devices.switch.x + 80, y: devices.switch.y + 30 },
    low: { x: devices.switch.x + 140, y: devices.switch.y + 30 }
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
    ctx.fillStyle = 'black'; // Set color for the new text
    ctx.font = '14px Noto Sans TC'; // Adjust font size if needed
    ctx.fillText('Switch Queue', sw.x + SWITCH_WIDTH / 2, sw.y + SWITCH_HEIGHT + 15); // Position below the switch
}

function drawQueue(queuePos, label, color = '#7f8c8d') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(queuePos.x, queuePos.y, QUEUE_WIDTH, QUEUE_HEIGHT);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.font = '12px Noto Sans TC';
    ctx.fillText(label, queuePos.x + QUEUE_WIDTH / 2, queuePos.y - 5);
}

function drawPacket(packet) {
    ctx.fillStyle = packet.color;
    ctx.fillRect(packet.x, packet.y, PACKET_SIZE, PACKET_SIZE);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(packet.x, packet.y, PACKET_SIZE, PACKET_SIZE);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '10px Arial';
    ctx.fillText(packet.priority.substring(0, 1).toUpperCase(), packet.x + PACKET_SIZE / 2, packet.y + PACKET_SIZE / 2 + 5);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw devices
    drawDevice(devices.pc1);
    drawDevice(devices.pc2);
    drawDevice(devices.pc3);
    drawDevice(devices.pc4); // Draw PC4
    drawSwitch(devices.switch);

    // Draw queues
    drawQueue(queuePositions.high, 'High', 'red');
    drawQueue(queuePositions.medium, 'Medium', 'orange');
    drawQueue(queuePositions.low, 'Low', 'green');

    // Draw packets in transit and those being processed
    packets.filter(p => p.status === 'traveling' || p.status === 'processed').forEach(drawPacket);

    // Draw packets in queues (stacked from bottom up)
    for (const priority in queues) {
        queues[priority].forEach((packet, index) => {
            const qPos = queuePositions[priority];
            packet.x = qPos.x + (QUEUE_WIDTH - PACKET_SIZE) / 2;
            packet.y = qPos.y + QUEUE_HEIGHT - (index + 1) * (PACKET_SIZE + 2); // +2 for small gap
            drawPacket(packet);
        });
    }

    if (animationRunning) {
        requestAnimationFrame(draw);
    }
}

function updateExplanation(text) {
    explanationDiv.textContent = text;
}

function createPacket(sourceDevice) {
    packetCounter++;
    const priorities = ['high', 'medium', 'low'];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
    let color;
    switch (randomPriority) {
        case 'high': color = 'red'; break;
        case 'medium': color = 'orange'; break;
        case 'low': color = 'green'; break;
    }

    return {
        id: packetCounter,
        x: sourceDevice.x,
        y: sourceDevice.y,
        priority: randomPriority,
        color: color,
        status: 'traveling', // traveling, in_queue, processed
        sourceLabel: sourceDevice.label // Store source label for explanation
    };
}

async function animatePacketFlow(packet) {
    updateExplanation(`Packet ${packet.id} (Priority: ${packet.priority.toUpperCase()}) generated from ${packet.sourceLabel}.`);

    // Animate from source to switch entrance
    await anime({
        targets: packet,
        x: devices.switch.x + SWITCH_WIDTH / 2,
        y: devices.switch.y + SWITCH_HEIGHT / 2,
        easing: 'linear',
        duration: 1000,
        update: draw // Redraw on each frame of animation
    }).finished;

    updateExplanation(`Packet ${packet.id} arrived at the Switch. It will now be queued based on its priority.`);

    // Add to appropriate queue
    queues[packet.priority].push(packet);
    packet.status = 'in_queue';
    draw(); // Update immediately after adding to queue
}

function startProcessing() {
    if (processingInterval) clearInterval(processingInterval);

    processingInterval = setInterval(async () => {
        let processed = false;
        for (const priority of ['high', 'medium', 'low']) {
            if (queues[priority].length > 0) {
                const packetToProcess = queues[priority].shift(); // Remove from queue
                packetToProcess.status = 'processed';
                updateExplanation(`Packet ${packetToProcess.id} (Priority: ${packetToProcess.priority.toUpperCase()}) is being processed and sent out.`);

                // Animate packet leaving the switch and going to PC4
                await anime({
                    targets: packetToProcess,
                    x: devices.pc4.x - PACKET_SIZE / 2,
                    y: devices.pc4.y - PACKET_SIZE / 2,
                    easing: 'linear',
                    duration: 800,
                    update: draw
                }).finished;
                updateExplanation(`Packet ${packetToProcess.id} (Priority: ${packetToProcess.priority.toUpperCase()}) arrived at ${devices.pc4.label}.`);

                // Remove processed packet from the main packets array
                packets = packets.filter(p => p.id !== packetToProcess.id);
                processed = true;
                break; // Process one packet and then re-evaluate queues
            }
        }

        if (!processed && packets.filter(p => p.status === 'traveling').length === 0) {
            // If no packets to process and no more packets are traveling, stop animation
            if (Object.values(queues).every(q => q.length === 0)) {
                clearInterval(processingInterval);
                processingInterval = null;
                animationRunning = false;
                startBtn.disabled = false;
                updateExplanation('All packets processed. Animation finished.');
            }
        }
    }, 1000); // Process a packet every 1 second
}

async function startAnimation() {
    if (animationRunning) return;
    animationRunning = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;
    updateExplanation('Animation started. Packets will be generated and processed by QoS.');

    draw(); // Start drawing loop

    const sourceDevices = [devices.pc1, devices.pc2, devices.pc3];

    // Simulate packet generation over time
    for (let i = 0; i < 15; i++) { // Generate 15 packets for demonstration
        const randomSource = sourceDevices[Math.floor(Math.random() * sourceDevices.length)];
        const newPacket = createPacket(randomSource);
        packets.push(newPacket);
        animatePacketFlow(newPacket);
        await new Promise(resolve => setTimeout(resolve, 700)); // Wait before generating next packet
    }

    // Start processing packets from queues once generation starts
    startProcessing();
}

function resetAnimation() {
    animationRunning = false;
    if (processingInterval) {
        clearInterval(processingInterval);
        processingInterval = null;
    }
    packets = [];
    queues = { high: [], medium: [], low: [] };
    packetCounter = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw(); // Redraw initial state
    startBtn.disabled = false;
    resetBtn.disabled = true;
    updateExplanation('Animation reset. Click "開始動畫" to start.');
}

// Initial draw
draw();
resetBtn.disabled = true; // Disable reset button initially

startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);