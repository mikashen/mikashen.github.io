document.addEventListener('DOMContentLoaded', () => {
    const flowControlStartBtn = document.getElementById('start-flow-control-btn');
    const flowControlResetBtn = document.getElementById('reset-flow-control-btn');
    const flowControlCanvas = document.getElementById('flow-control-animation-canvas');
    const flowControlSvg = document.getElementById('flow-control-topology-svg');
    const flowControlExplanationText = document.getElementById('flow-control-explanation-text');
    

    let flowControlBufferLevel = 0; // 0-100
    let flowControlSending = true;
    let flowControlAnimationInterval = null;
    let flowControlPacketCounter = 0;
    let receiverBufferElement = null; // New: Reference to the buffer element
    let receiverBufferFill; // Make it global

    const flowControlDevices = {
        sender: { name: 'Sender PC', mac: 'AA:AA:AA:AA:AA:AA', x: 10, y: 35 }, // Adjusted Y
        fcSwitch: { name: 'Switch', type: 'switch', x: 50, y: 35 }, // Adjusted Y
        receiver: { name: 'Receiver PC', mac: 'BB:BB:BB:BB:BB:BB', x: 90, y: 35 } // Adjusted Y
    };

    function setupFlowControlScenario() {
        console.log('setupFlowControlScenario called.');
        clearInterval(flowControlAnimationInterval);
        anime.remove('*'); // Stop and remove all active anime.js animations
        flowControlCanvas.querySelectorAll('.device, .packet, .buffer-display').forEach(el => el.remove()); // Also remove buffer
        flowControlSvg.innerHTML = '';
        flowControlStartBtn.disabled = false;
        flowControlBufferLevel = 0;
        flowControlSending = true;
        flowControlPacketCounter = 0;
        
        // Create receiver buffer element dynamically
        receiverBufferElement = document.createElement('div');
        receiverBufferElement.id = 'receiver-buffer';
        receiverBufferElement.className = 'buffer-display';
        receiverBufferElement.innerHTML = '<div class="buffer-fill"></div><div class="buffer-label">Switch Buffer</div>';
        flowControlCanvas.appendChild(receiverBufferElement);

        // Update receiverBufferFill reference
        receiverBufferFill = receiverBufferElement.querySelector('.buffer-fill'); // Assign to global variable
        updateFlowControlBufferUI();

        setFlowControlExplanation('點擊「開始動畫」來觀察流量控制的運作。');

        drawFlowControlDevice(flowControlDevices.sender);
        drawFlowControlDevice(flowControlDevices.fcSwitch);
        drawFlowControlDevice(flowControlDevices.receiver);
        // Add a small delay to allow DOM to render before redrawing lines
        delay(50).then(() => {
            redrawFlowControlElements();
        });
    }

    function redrawFlowControlElements() {
        flowControlSvg.innerHTML = '';
        drawFlowControlLine(flowControlDevices.sender, flowControlDevices.fcSwitch);
        drawFlowControlLine(flowControlDevices.fcSwitch, flowControlDevices.receiver);

        Object.values(flowControlDevices).forEach(device => {
            const el = document.getElementById(device.name.replace(/ /g, '') + '_fc');
            if (el) {
                const { x, y } = getFlowControlPixelCoords(device.x, device.y);
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
            }
        });

        // Position the receiver buffer below the switch
        const fcSwitchElement = document.getElementById(flowControlDevices.fcSwitch.name.replace(/ /g, '') + '_fc');
        if (fcSwitchElement && receiverBufferElement) {
            const canvasRect = flowControlCanvas.getBoundingClientRect();

            // Calculate position relative to the canvas
            const bufferX = canvasRect.width * (flowControlDevices.fcSwitch.x / 100); // Center horizontally below switch
            const bufferY = canvasRect.height * 0.8 * (70 / 100); // 70% down the 80% animation area

            receiverBufferElement.style.left = `${bufferX}px`;
            receiverBufferElement.style.top = `${bufferY}px`;
            receiverBufferElement.style.transform = 'translate(-50%, 0)'; // Center horizontally
        }
    }

    async function startFlowControlAnimation() {
        flowControlStartBtn.disabled = true;
        flowControlResetBtn.disabled = false;
        setFlowControlExplanation('開始傳送資料。接收端緩衝區開始填充。');
        flowControlAnimationInterval = setInterval(runFlowControl, 1000);
    }

    async function runFlowControl() {
        const sender = flowControlDevices.sender;
        const fcSwitch = flowControlDevices.fcSwitch;
        const receiver = flowControlDevices.receiver;

        // Simulate receiver processing data
        if (flowControlBufferLevel > 0) {
            flowControlBufferLevel = Math.max(0, flowControlBufferLevel - 5); // Process 5% per tick
            updateFlowControlBufferUI();
        }

        if (flowControlSending) {
            flowControlPacketCounter++;
            const packet = createFlowControlPacket(`data_packet_${flowControlPacketCounter}`, 'data', sender, receiver);
            await moveFlowControlPacket(packet, sender, fcSwitch);

            // Simulate packet arriving at receiver and filling buffer
            if (flowControlBufferLevel < 100) {
                flowControlBufferLevel = Math.min(100, flowControlBufferLevel + 10); // Each packet fills 10%
                updateFlowControlBufferUI();
            }
            
            await moveFlowControlPacket(packet, fcSwitch, receiver);
            packet.remove();

            if (flowControlBufferLevel >= 70 && flowControlSending) { // High watermark
                setFlowControlExplanation('接收端緩衝區達到高水位 (70%)。Switch發送 Pause Frame 給發送端。');
                flowControlSending = false; // Stop sending data packets
                const pausePacket = createFlowControlPacket('pause_frame', 'pause', fcSwitch, sender);
                await moveFlowControlPacket(pausePacket, fcSwitch, sender);
                pausePacket.remove();
                setFlowControlExplanation('發送端收到 Pause Frame，暫停資料傳送。');
            }
        } else { // Not sending, waiting for buffer to clear
            // Simulate the switch continuing to send packets from its buffer to the receiver
            flowControlPacketCounter++; // Still increment for unique packet ID
            const processingPacket = createFlowControlPacket(`processing_packet_${flowControlPacketCounter}`, 'data', fcSwitch, receiver); // Packet from switch to receiver
            await moveFlowControlPacket(processingPacket, fcSwitch, receiver);
            processingPacket.remove(); // Remove after reaching receiver

            if (flowControlBufferLevel <= 30) { // Low watermark
                setFlowControlExplanation('接收端緩衝區降至低水位 (30%)。發送端恢復資料傳送。');
                flowControlSending = true; // Resume sending data packets
            } else {
                setFlowControlExplanation(`發送端暫停中。接收端緩衝區: ${flowControlBufferLevel.toFixed(0)}%。`);
            }
        }
    }

    function getFlowControlPixelCoords(percentX, percentY) {
        const canvasRect = flowControlCanvas.getBoundingClientRect();
        console.log(`FlowControlCanvas dimensions: width=${canvasRect.width}, height=${canvasRect.height}`);
        if (canvasRect.width === 0 || canvasRect.height === 0) {
            console.warn('FlowControlCanvas has zero width or height. Elements may not be visible.');
        }
        // Calculate Y based on 80% of canvas height (SVG area)
        const svgHeight = canvasRect.height * 0.8;
        return { x: canvasRect.width * (percentX / 100), y: svgHeight * (percentY / 100) };
    }

    function drawFlowControlDevice(device) {
        const el = document.createElement('div');
        el.id = device.name.replace(/ /g, '') + '_fc'; // Unique ID
        el.className = `device ${device.type || 'pc'}`;
        let info = `<div class="icon"></div><div class="device-label">${device.name}</div>`;
        if (device.mac) info += `<div class="device-info">${device.mac}</div>`;
        el.innerHTML = info;
        flowControlCanvas.appendChild(el);
        console.log(`Drawing device: ${el.id} at (${device.x}, ${device.y})`);
    }

    function drawFlowControlLine(from, to) {
        const fromCoords = getFlowControlPixelCoords(from.x, from.y);
        const toCoords = getFlowControlPixelCoords(to.x, to.y);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromCoords.x);
        line.setAttribute('y1', fromCoords.y);
        line.setAttribute('x2', toCoords.x);
        line.setAttribute('y2', toCoords.y);
        line.setAttribute('stroke', '#aaa');
        line.setAttribute('stroke-width', 2);
        line.setAttribute('stroke-dasharray', '5,5');
        flowControlSvg.appendChild(line);
        console.log(`Drawing line from (${from.name}) to (${to.name})`);
    }

    function createFlowControlPacket(id, type, from, to) {
        const packet = document.createElement('div');
        packet.id = id;
        packet.className = `packet ${type}`;
        let content = '';
        if (type === 'data') {
            content = `<div class="packet-header">Data Packet</div><div class="packet-info">
                        <span><span class="label">Src:</span> ${from.name}</span>
                        <span><span class="label">Dst:</span> ${to.name}</span>
                    </div>`;
        }
        else if (type === 'pause') {
            content = `<div class="packet-header">Pause Frame</div><div class="packet-info">
                        <span><span class="label">From:</span> ${from.name}</span>
                        <span><span class="label">To:</span> ${to.name}</span>
                    </div>`;
        }
        packet.innerHTML = content;
        const startPos = getFlowControlPixelCoords(from.x, from.y);
        packet.style.left = `${startPos.x}px`;
        packet.style.top = `${startPos.y}px`;
        flowControlCanvas.appendChild(packet);
        return packet;
    }

    function moveFlowControlPacket(packet, from, to) {
        const startPos = getFlowControlPixelCoords(from.x, from.y);
        const endPos = getFlowControlPixelCoords(to.x, to.y);
        return anime({
            targets: packet,
            left: [startPos.x, endPos.x],
            top: [startPos.y, endPos.y],
            opacity: [0, 1],
            duration: 1000,
            easing: 'easeInOutQuad',
            update: function(anim) {
                packet.style.zIndex = '20';
            },
            complete: (anim) => {
                if (anim.completed && to.type !== 'switch') {
                    // Packet reaches destination, fade out unless it's a pause frame going back to sender
                    if (packet.classList.contains('data') || (packet.classList.contains('pause') && to.name === flowControlDevices.sender.name)) {
                        anime({ targets: packet, opacity: 0, duration: 500, delay: 200, complete: () => anime.remove(packet) });
                    }
                }
            }
        }).finished;
    }

    function updateFlowControlBufferUI() {
        receiverBufferFill.style.height = `${flowControlBufferLevel}%`;
        if (flowControlBufferLevel > 70) {
            receiverBufferFill.style.backgroundColor = '#e74c3c'; // Red for high
        } else if (flowControlBufferLevel > 30) {
            receiverBufferFill.style.backgroundColor = '#f1c40f'; // Yellow for medium
        } else {
            receiverBufferFill.style.backgroundColor = '#2ecc71'; // Green for low
        }
    }

    function setFlowControlExplanation(text) { flowControlExplanationText.innerHTML = text; }

    flowControlStartBtn.addEventListener('click', startFlowControlAnimation);
    flowControlResetBtn.addEventListener('click', setupFlowControlScenario);

    const flowControlResizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            console.log(`FlowControlCanvas ResizeObserver triggered: width=${width}, height=${height}`);
            if (width > 0 && height > 0) {
                redrawFlowControlElements();
            }
        }
    });
    flowControlResizeObserver.observe(flowControlCanvas);

    setupFlowControlScenario();
});