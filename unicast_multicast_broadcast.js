document.addEventListener('DOMContentLoaded', () => {
    // --- Unicast/Multicast/Broadcast Animation DOM Elements ---
    const umbScenarioSelect = document.getElementById('umb-scenario');
    const umbStartBtn = document.getElementById('start-umb-btn');
    const umbResetBtn = document.getElementById('reset-umb-btn');
    const umbCanvas = document.getElementById('unicast-multicast-broadcast-animation-canvas');
    const umbSvg = document.getElementById('unicast-multicast-broadcast-topology-svg');
    const umbExplanationText = document.getElementById('umb-explanation-text');

    // --- State Variables ---
    let currentUmbScenarioKey = 'unicast';

    const umbDevices = {
        umb_pc1: { name: 'PC-1', mac: '00:00:00:00:00:01', x: 10, y: 25 },
        umb_pc2: { name: 'PC-2', mac: '00:00:00:00:00:02', x: 10, y: 75 },
        umb_pc3: { name: 'PC-3', mac: '00:00:00:00:00:03', x: 90, y: 25 },
        umb_pc4: { name: 'PC-4', mac: '00:00:00:00:00:04', x: 90, y: 75 },
        umb_switch: { name: 'Switch', type: 'switch', x: 50, y: 50 }
    };

    const umbScenarios = {
        unicast: {
            title: '單播 (Unicast)',
            devices: ['umb_pc1', 'umb_pc2', 'umb_pc3', 'umb_pc4', 'umb_switch'],
            from: 'umb_pc1',
            to: 'umb_pc3',
            switch: 'umb_switch',
            prefill: { mac: { '00:00:00:00:00:03': {port: 3, vlan: 0} } } // Assume switch knows PC3's MAC
        },
        multicast: {
            title: '多播 (Multicast)',
            devices: ['umb_pc1', 'umb_pc2', 'umb_pc3', 'umb_pc4', 'umb_switch'],
            from: 'umb_pc1',
            to: 'multicast_group', // Special destination
            switch: 'umb_switch',
            multicastGroup: ['umb_pc2', 'umb_pc4'] // PCs in the multicast group
        },
        broadcast: {
            title: '廣播 (Broadcast)',
            devices: ['umb_pc1', 'umb_pc2', 'umb_pc3', 'umb_pc4', 'umb_switch'],
            from: 'umb_pc1',
            to: 'broadcast_all', // Special destination
            switch: 'umb_switch'
        }
    };

    function setUmbExplanation(text) { umbExplanationText.innerHTML = text; }

    function setupUmbScenario(scenarioKey) {
        currentUmbScenarioKey = scenarioKey;
        umbCanvas.querySelectorAll('.device, .packet').forEach(el => el.remove());
        umbSvg.innerHTML = '';
        umbStartBtn.disabled = false;
        setUmbExplanation('請選擇一個場景並點擊「開始動畫」。');

        const scenario = umbScenarios[scenarioKey];
        scenario.devices.forEach(key => drawUmbDevice(umbDevices[key]));
        redrawUmbElements();
    }

    function redrawUmbElements() {
        const scenario = umbScenarios[currentUmbScenarioKey];
        umbSvg.innerHTML = '';
        scenario.devices.forEach(key => {
            const device = umbDevices[key];
            const el = document.getElementById(device.name + '_umb');
            if (el) {
                const { x, y } = getUmbPixelCoords(device.x, device.y);
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
            }
        });

        scenario.devices.filter(k => umbDevices[k].type !== 'switch').forEach(key => {
            drawUmbLine(umbDevices[key], umbDevices.umb_switch);
        });
    }

    async function startUmbAnimation() {
        umbStartBtn.disabled = true;
        const scenario = umbScenarios[umbScenarioSelect.value];
        switch (umbScenarioSelect.value) {
            case 'unicast': await runUnicast(scenario); break;
            case 'multicast': await runMulticast(scenario); break;
            case 'broadcast': await runBroadcast(scenario); break;
        }
    }

    async function runUnicast({ from, to, switch: sw }) {
        const source = umbDevices[from], dest = umbDevices[to], umbSwitch = umbDevices[sw];
        setUmbExplanation('1. PC-1 傳送一個單播封包給 PC-3。交換器查詢 MAC 表，找到 PC-3 對應的埠。');
        const packet = createUmbPacket('umb_p1', 'data', source, dest);
        await moveUmbPacket(packet, source, umbSwitch);
        await delay(1000);
        await moveUmbPacket(packet, umbSwitch, dest);
        setUmbExplanation('2. 封包精準地傳送到 PC-3。只有 PC-3 會接收此封包。單播完成。');
    }

    async function runMulticast({ from, to, switch: sw, multicastGroup }) {
        const source = umbDevices[from], umbSwitch = umbDevices[sw];
        setUmbExplanation('1. PC-1 傳送一個多播封包。多播封包的目的 MAC 位址是一個特殊的組播 MAC 位址。');
        const packet = createUmbPacket('umb_p1', 'data', source, { name: 'Multicast Group', mac: '01:00:5E:XX:XX:XX' });
        await moveUmbPacket(packet, source, umbSwitch);
        await delay(1000);

        setUmbExplanation('2. 交換器將多播封包轉發給所有加入該多播組的成員 (PC-2 和 PC-4)。');
        packet.remove();
        const promises = multicastGroup.map(memberKey => {
            const member = umbDevices[memberKey];
            const clone = createUmbPacket('umb_p_multi_' + member.name, 'data', source, member);
            umbCanvas.appendChild(clone);
            return moveUmbPacket(clone, umbSwitch, member);
        });
        await Promise.all(promises);
        setUmbExplanation('3. 只有多播組成員 (PC-2 和 PC-4) 接收到封包。多播完成。');
    }

    async function runBroadcast({ from, to, switch: sw }) {
        const source = umbDevices[from], umbSwitch = umbDevices[sw];
        setUmbExplanation('1. PC-1 傳送一個廣播封包。廣播封包的目的 MAC 位址是 FF:FF:FF:FF:FF:FF。');
        const packet = createUmbPacket('umb_p1', 'data', source, { name: 'Broadcast All', mac: 'FF:FF:FF:FF:FF:FF' });
        await moveUmbPacket(packet, source, umbSwitch);
        await delay(1000);

        setUmbExplanation('2. 交換器將廣播封包從除了來源埠以外的所有埠送出。');
        packet.remove();
        const allPcs = ['umb_pc1', 'umb_pc2', 'umb_pc3', 'umb_pc4'].map(key => umbDevices[key]);
        const floodTargets = allPcs.filter(pc => pc.name !== source.name);
        const promises = floodTargets.map(pc => {
            const clone = createUmbPacket('umb_p_broadcast_' + pc.name, 'data', source, pc);
            umbCanvas.appendChild(clone);
            return moveUmbPacket(clone, umbSwitch, pc);
        });
        await Promise.all(promises);
        setUmbExplanation('3. 所有連接到交換器的設備都接收到廣播封包。廣播完成。');
    }

    // --- Unicast/Multicast/Broadcast Animation Helpers ---
    function getUmbPixelCoords(percentX, percentY) {
        const canvasRect = umbCanvas.getBoundingClientRect();
        // Calculate Y based on 80% of canvas height
        const animationHeight = canvasRect.height * 0.8;
        return { x: canvasRect.width * (percentX / 100), y: animationHeight * (percentY / 100) };
    }

    function drawUmbDevice(device) {
        const el = document.createElement('div');
        el.id = device.name + '_umb'; // Unique ID for UMB devices
        el.className = `device ${device.type || 'pc'}`;
        let info = `<div class="icon"></div><div class="device-label">${device.name}</div>`;
        if (device.ip) info += `<div class="device-info">${device.ip}</div>`;
        if (device.mac) info += `<div class="device-info">${device.mac}</div>`;
        el.innerHTML = info;
        umbCanvas.appendChild(el);
    }

    function drawUmbLine(from, to) {
        const fromCoords = getUmbPixelCoords(from.x, from.y);
        const toCoords = getUmbPixelCoords(to.x, to.y);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromCoords.x);
        line.setAttribute('y1', fromCoords.y);
        line.setAttribute('x2', toCoords.x);
        line.setAttribute('y2', toCoords.y);
        line.setAttribute('stroke', '#aaa');
        line.setAttribute('stroke-width', 2);
        line.setAttribute('stroke-dasharray', '5,5');
        umbSvg.appendChild(line);
    }

    function createUmbPacket(id, type, from, to, options = {}) {
        const packet = document.createElement('div');
        packet.id = id;
        packet.className = `packet ${type}`;
        updateUmbPacketInfo(packet, { ...options, srcMac: from.mac, destMac: to.mac, srcIp: from.ip, destIp: to.ip });
        const startPos = getUmbPixelCoords(from.x, from.y);
        packet.style.left = `${startPos.x}px`;
        packet.style.top = `${startPos.y}px`;
        umbCanvas.appendChild(packet);
        return packet;
    }

    function updateUmbPacketInfo(packet, { type, srcMac, destMac, srcIp, destIp, targetIp }) {
        let content = '';
        if (packet.classList.contains('data')) {
            content = `<div class="packet-header">Data Packet</div><div class="packet-info">
                <span><span class="label">Src MAC:</span> ${srcMac}</span>
                <span><span class="label">Dst MAC:</span> ${destMac}</span>
                <span><span class="label">Src IP:</span> ${srcIp || 'N/A'}</span>
                <span><span class="label">Dst IP:</span> ${destIp || 'N/A'}</span>
            </div>`;
        } else if (packet.classList.contains('arp')) {
            content = `<div class="packet-header">ARP ${type}</div><div class="packet-info">
                ${type === 'Request' ? `<span>Who has ${targetIp}?</span>` : `<span>${srcIp} is at ${srcMac}</span>`}
            </div>`;
        }
        packet.innerHTML = content;
    }

    function moveUmbPacket(packet, from, to) {
        const startPos = getUmbPixelCoords(from.x, from.y);
        const endPos = getUmbPixelCoords(to.x, to.y);
        return anime({
            targets: packet,
            left: [startPos.x, endPos.x],
            top: [startPos.y, endPos.y],
            opacity: [0, 1],
            duration: 1500,
            easing: 'easeInOutQuad',
            update: function(anim) {
                packet.style.zIndex = '20';
            },
            complete: (anim) => {
                if (anim.completed && to.type !== 'switch' && to.name !== 'Broadcast All' && to.name !== 'Multicast Group') {
                    anime({ targets: packet, opacity: 0, duration: 500, delay: 500 });
                }
            }
        }).finished;
    }

    // --- Event Listeners ---
    umbScenarioSelect.addEventListener('change', () => setupUmbScenario(umbScenarioSelect.value));
    umbStartBtn.addEventListener('click', startUmbAnimation);
    umbResetBtn.addEventListener('click', () => setupUmbScenario(umbScenarioSelect.value));

    // --- Resize Observers ---
    const umbResizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            redrawUmbElements();
        }
    });
    umbResizeObserver.observe(umbCanvas);

    // --- Initial Setup ---
    setupUmbScenario(currentUmbScenarioKey);
});