document.addEventListener('DOMContentLoaded', () => {
    // --- VLAN Animation DOM Elements ---
    const vlanScenarioSelect = document.getElementById('vlan-scenario');
    const vlanStartBtn = document.getElementById('start-vlan-btn');
    const vlanResetBtn = document.getElementById('reset-vlan-btn');
    const vlanCanvas = document.getElementById('vlan-animation-canvas');
    const vlanSvg = document.getElementById('vlan-topology-svg');
    const vlanExplanationText = document.getElementById('vlan-explanation-text');
    const vlanMacTableBody = document.querySelector('#vlan-mac-table tbody');

    // --- State Variables ---
    let vlanMacTable = {};
    let currentVlanScenarioKey = 'vlan_broadcast';

    // --- VLAN Animation Definitions (Percentage-based Coordinates) ---
    const vlanDevices = {
        pc_vlan10_1: { name: 'PC-A', ip: '192.168.10.10', mac: 'AA:..:A1', vlan: 10, port: 1, x: 10, y: 20 }, // Adjusted Y
        pc_vlan10_2: { name: 'PC-B', ip: '192.168.10.20', mac: 'AA:..:A2', vlan: 10, port: 2, x: 10, y: 70 }, // Adjusted Y
        pc_vlan20_1: { name: 'PC-C', ip: '192.168.20.10', mac: 'BB:..:B1', vlan: 20, port: 3, x: 90, y: 20 }, // Adjusted Y
        pc_vlan20_2: { name: 'PC-D', ip: '192.168.20.20', mac: 'BB:..:B2', vlan: 20, port: 4, x: 90, y: 70 }, // Adjusted Y
        vlanSwitch: { name: 'VLAN-Switch', type: 'switch', x: 50, y: 45 } // Adjusted Y
    };

    const vlanScenarios = {
        vlan_broadcast: { title: 'VLAN 廣播隔離', switch: 'vlanSwitch', devices: ['pc_vlan10_1', 'pc_vlan10_2', 'pc_vlan20_1', 'pc_vlan20_2', 'vlanSwitch'], from: 'pc_vlan10_1', to: 'pc_vlan10_2' },
        vlan_inter_vlan: { title: 'VLAN 間通訊 (失敗)', switch: 'vlanSwitch', devices: ['pc_vlan10_1', 'pc_vlan10_2', 'pc_vlan20_1', 'pc_vlan20_2', 'vlanSwitch'], from: 'pc_vlan10_1', to: 'pc_vlan20_1' }
    };

    function setupVlanScenario(scenarioKey) {
        currentVlanScenarioKey = scenarioKey;
        vlanCanvas.querySelectorAll('.device, .packet, .vlan-container').forEach(el => el.remove());
        vlanSvg.innerHTML = '';
        vlanMacTableBody.innerHTML = '';
        vlanMacTable = {};
        vlanStartBtn.disabled = false;
        setVlanExplanation('請選擇一個場景並點擊「開始動畫」。');

        const scenario = vlanScenarios[scenarioKey];
        
        // Draw VLAN containers
        drawVlanContainerVlan('vlan10', 'VLAN 10', 25, 50, 40, 90);
        drawVlanContainerVlan('vlan20', 'VLAN 20', 75, 50, 40, 90);

        // Draw devices
        scenario.devices.forEach(key => drawVlanDevice(vlanDevices[key]));
        redrawVlanElements();
    }

    function redrawVlanElements() {
        const scenario = vlanScenarios[currentVlanScenarioKey];
        vlanSvg.innerHTML = '';
        scenario.devices.forEach(key => {
            const device = vlanDevices[key];
            const el = document.getElementById(device.name + '_vlan'); // Unique ID for VLAN devices
            if (el) {
                const { x, y } = getVlanPixelCoords(device.x, device.y);
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
            }
        });

        scenario.devices.filter(k => vlanDevices[k].type !== 'switch').forEach(key => {
            drawVlanLine(vlanDevices[key], vlanDevices.vlanSwitch);
        });

        const fixedAnimationHeight = 400; // Use fixed height

        document.querySelectorAll('#vlan-animation .vlan-container').forEach(el => {
            const className = el.classList.contains('vlan10') ? 'vlan10' : 'vlan20';
            const coords = (className === 'vlan10') ? [25, 50, 25, 90] : [75, 50, 25, 90]; // centerX, centerY, percentW, percentH
            const centerX = coords[0];
            const centerY = coords[1];
            const percentW = coords[2];
            const percentH = coords[3];

            const canvasRect = vlanCanvas.getBoundingClientRect();

            const width = canvasRect.width * (percentW / 100);
            const height = fixedAnimationHeight * (percentH / 100);

            const pixelX = canvasRect.width * (centerX / 100) - (width / 2);
            const pixelY = fixedAnimationHeight * (centerY / 100) - (height / 2);

            el.style.left = `${pixelX}px`;
            el.style.top = `${pixelY}px`;
            el.style.width = `${width}px`;
            el.style.height = `${height}px`;
        });
    }

    async function startVlanAnimation() {
        vlanStartBtn.disabled = true;
        const scenario = vlanScenarios[vlanScenarioSelect.value];
        switch (vlanScenarioSelect.value) {
            case 'vlan_broadcast': await runVlanBroadcast(scenario); break;
            case 'vlan_inter_vlan': await runVlanInterVlan(scenario); break;
        }
    }

    async function runVlanBroadcast({ from, to, switch: sw }) {
        const source = vlanDevices[from], dest = vlanDevices[to], vlanSwitch = vlanDevices[sw];
        setVlanExplanation('1. PC-A (VLAN 10) 準備傳送資料到 PC-B (VLAN 10)。它建立一個資料幀。');
        const packet = createVlanPacket('p_vlan_1', 'data', source, dest);
        await moveVlanPacket(packet, source, vlanSwitch);

        setVlanExplanation('2. 交換器收到來自 Port 1 的幀，學習來源 MAC (PC-A)，並記錄其 VLAN (VLAN 10)。');
        learnVlanMac(source);
        await delay(2000);

        setVlanExplanation('3. 交換器查詢 MAC 表，尋找目的 MAC (PC-B)。表中沒有紀錄。');
        await delay(2000);

        setVlanExplanation('4. 交換器執行「廣播」，但只會將幀從屬於 VLAN 10 的 Port 送出。');
        packet.remove();
        const floodTargets = vlanScenarios.vlan_broadcast.devices.filter(d => vlanDevices[d].vlan === source.vlan && d !== from && vlanDevices[d].type !== 'switch');
        const promises = floodTargets.map(targetKey => {
            const clone = createVlanPacket('p_vlan_flood_' + targetKey, 'data', source, vlanDevices[targetKey]);
            return moveVlanPacket(clone, vlanSwitch, vlanDevices[targetKey]);
        });
        await Promise.all(promises);

        setVlanExplanation('5. PC-B 收到幀，確認 MAC 位址相符，成功接收。PC-C 和 PC-D (VLAN 20) 不會收到此廣播。VLAN 成功隔離了廣播域。');
    }

    async function runVlanInterVlan({ from, to, switch: sw }) {
        const source = vlanDevices[from], dest = vlanDevices[to], vlanSwitch = vlanDevices[sw];
        setVlanExplanation('1. PC-A (VLAN 10) 嘗試傳送資料到 PC-C (VLAN 20)。它建立一個資料幀。');
        const packet = createVlanPacket('p_vlan_inter', 'data', source, dest);
        await moveVlanPacket(packet, source, vlanSwitch);

        setVlanExplanation('2. 交換器收到來自 Port 1 的幀，學習來源 MAC (PC-A)，並記錄其 VLAN (VLAN 10)。');
        learnVlanMac(source);
        await delay(2000);

        setVlanExplanation('3. 交換器查詢 MAC 表，尋找目的 MAC (PC-C)。表中沒有紀錄。');
        await delay(2000);

        setVlanExplanation('4. 交換器嘗試廣播尋找 PC-C，但 PC-C 屬於 VLAN 20。交換器不會將屬於 VLAN 10 的廣播幀轉發到 VLAN 20。');
        packet.remove(); // Remove original packet
        const floodTargets = vlanScenarios.vlan_inter_vlan.devices.filter(d => vlanDevices[d].vlan === source.vlan && d !== from && vlanDevices[d].type !== 'switch');
        const promises = floodTargets.map(targetKey => {
            const clone = createVlanPacket('p_vlan_flood_fail_' + targetKey, 'data', source, vlanDevices[targetKey], vlanSwitch);
            return moveVlanPacket(clone, vlanSwitch, vlanDevices[targetKey]);
        });
        await Promise.all(promises);

        setVlanExplanation('5. PC-C 不會收到此幀。PC-A 無法直接與 PC-C 通訊。這證明了 VLAN 之間的隔離性。L2 交換器無法在不同 VLAN 間轉發資料。若要實現跨 VLAN 通訊，必須透過具備路由功能的 Layer 3 設備（如 L3 交換器或路由器）進行。');
    }

    // --- VLAN Animation Helpers ---
    function getVlanPixelCoords(percentX, percentY) {
        const canvasRect = vlanCanvas.getBoundingClientRect();
        // Use a fixed animation height based on min-height of canvas (500px * 0.8)
        const fixedAnimationHeight = 400; 
        const x = canvasRect.width * (percentX / 100);
        const y = fixedAnimationHeight * (percentY / 100);
        return { x, y };
    }

    function drawVlanDevice(device) {
        const el = document.createElement('div');
        el.id = device.name + '_vlan'; // Unique ID
        el.className = `device ${device.type || 'pc'}`;
        let info = `<div class="icon"></div><div class="device-label">${device.name}</div>`;
        if (device.ip) info += `<div class="device-info">${device.ip}</div>`;
        if (device.mac) info += `<div class="device-info">${device.mac}</div>`;
        el.innerHTML = info;

        const { x, y } = getVlanPixelCoords(device.x, device.y);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        vlanCanvas.appendChild(el);
    }

    function drawVlanLine(from, to) {
        const fromCoords = getVlanPixelCoords(from.x, from.y);
        const toCoords = getVlanPixelCoords(to.x, to.y);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromCoords.x);
        line.setAttribute('y1', fromCoords.y);
        line.setAttribute('x2', toCoords.x);
        line.setAttribute('y2', toCoords.y);
        line.setAttribute('stroke', '#aaa');
        line.setAttribute('stroke-width', 2);
        line.setAttribute('stroke-dasharray', '5,5');
        vlanSvg.appendChild(line);
    }

    function drawVlanContainerVlan(className, label, centerX, centerY, percentW, percentH) {
        const el = document.createElement('div');
        el.className = `vlan-area ${className}`;
        el.innerHTML = `<div class="vlan-label">${label}</div>`;

        const canvasRect = vlanCanvas.getBoundingClientRect();
        const fixedAnimationHeight = 400; // Use fixed height

        const width = canvasRect.width * (percentW / 100);
        const height = fixedAnimationHeight * (percentH / 100);

        const pixelX = canvasRect.width * (centerX / 100) - (width / 2);
        const pixelY = fixedAnimationHeight * (centerY / 100) - (height / 2);

        el.style.left = `${pixelX}px`;
        el.style.top = `${pixelY}px`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        
        // Set inline styles for visibility
        if (className === 'vlan10') {
            el.style.backgroundColor = 'rgba(52, 152, 219, 0.5)'; // Blue with transparency
            el.style.border = '2px dashed #3498db';
        } else if (className === 'vlan20') {
            el.style.backgroundColor = 'rgba(231, 76, 60, 0.5)'; // Red with transparency
            el.style.border = '2px dashed #e74c3c';
        }

        vlanCanvas.appendChild(el);
    }

    function createVlanPacket(id, type, from, to, options = {}) {
        const packet = document.createElement('div');
        packet.id = id;
        packet.className = `packet ${type}`;
        updateVlanPacketInfo(packet, { ...options, srcMac: from.mac, destMac: to.mac, srcIp: from.ip, destIp: to.ip });
        const startPos = getVlanPixelCoords(from.x, from.y);
        packet.style.left = `${startPos.x}px`;
        packet.style.top = `${startPos.y}px`;
        vlanCanvas.appendChild(packet);
        return packet;
    }

    function updateVlanPacketInfo(packet, { type, srcMac, destMac, srcIp, destIp, targetIp }) {
        let content = '';
        if (packet.classList.contains('data')) {
            content = `<div class="packet-header">Data Packet</div><div class="packet-info">
                <span><span class="label">Src MAC:</span> ${srcMac}</span>
                <span><span class="label">Dst MAC:</span> ${destMac}</span>
                <span><span class="label">Src IP:</span> ${srcIp}</span>
                <span><span class="label">Dst IP:</span> ${destIp}</span>
            </div>`;
        } else if (packet.classList.contains('arp')) {
            content = `<div class="packet-header">ARP ${type}</div><div class="packet-info">
                ${type === 'Request' ? `<span>Who has ${targetIp}?</span>` : `<span>${srcIp} is at ${srcMac}</span>`}
            </div>`;
        }
        packet.innerHTML = content;
    }

    function moveVlanPacket(packet, from, to) {
        const startPos = getVlanPixelCoords(from.x, from.y);
        const endPos = getVlanPixelCoords(to.x, to.y);
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
                if (anim.completed && to.type !== 'switch' && to.name !== 'Broadcast') {
                    anime({ targets: packet, opacity: 0, duration: 500, delay: 500 });
                }
            }
        }).finished;
    }

    function learnVlanMac(device) {
        if (!vlanMacTable[device.mac]) {
            vlanMacTable[device.mac] = { port: device.port, vlan: device.vlan };
            updateVlanMacTableUI();
        }
    }

    function updateVlanMacTableUI() {
        vlanMacTableBody.innerHTML = '';
        for (const [mac, info] of Object.entries(vlanMacTable)) {
            const row = vlanMacTableBody.insertRow();
            row.innerHTML = `<td>${mac}</td><td>${info.port}</td><td>${info.vlan}</td>`;
        }
    }

    function setVlanExplanation(text) { vlanExplanationText.innerHTML = text; }

    // --- Event Listeners ---
    vlanScenarioSelect.addEventListener('change', () => setupVlanScenario(vlanScenarioSelect.value));
    vlanStartBtn.addEventListener('click', startVlanAnimation);
    vlanResetBtn.addEventListener('click', () => setupVlanScenario(vlanScenarioSelect.value));

    

    // --- Initial Setup ---
    setupVlanScenario(currentVlanScenarioKey);
});