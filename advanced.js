document.addEventListener('DOMContentLoaded', () => {
    // --- Advanced Animation DOM Elements ---
    const advancedScenarioSelect = document.getElementById('scenario');
    const advancedStartBtn = document.getElementById('start-btn');
    const advancedResetBtn = document.getElementById('reset-btn');
    const advancedCanvas = document.getElementById('animation-canvas');
    const advancedSvg = document.getElementById('topology-svg');
    const advancedExplanationText = document.getElementById('explanation-text');
    const advancedMacTableBody = document.querySelector('#mac-table tbody');
    const advancedArpTableBody = document.querySelector('#arp-table tbody');
    const advancedSwitchNameSpan = document.getElementById('switch-name');

    // --- State Variables ---
    let advancedMacTable = {};
    let advancedArpTable = {};
    let advancedActiveSwitch = 'l2switch';
    let currentAdvancedScenarioKey = 'arl_table_operation'; // Default to new scenario

    // --- Advanced Animation Definitions (Percentage-based Coordinates) ---
    const advancedDevices = {
        pc1: { name: 'PC-1', ip: '192.168.1.10', mac: 'AA:..:10', vlan: 10, port: 1, x: 10, y: 20 }, // Adjusted Y
        pc2: { name: 'PC-2', ip: '192.168.1.20', mac: 'AA:..:20', vlan: 10, port: 2, x: 10, y: 70 }, // Adjusted Y
        pc3: { name: 'PC-3', ip: '192.168.2.30', mac: 'BB:..:30', vlan: 20, port: 3, x: 90, y: 20 }, // Adjusted Y
        pc4: { name: 'PC-4', ip: '192.168.2.40', mac: 'BB:..:40', vlan: 20, port: 4, x: 90, y: 70 }, // Adjusted Y
        l2switch: { name: 'L2-Switch', type: 'switch', x: 50, y: 45 }, // Adjusted Y
        l3switch: { name: 'L3-Switch', type: 'switch', x: 50, y: 45, vlans: { 10: '192.168.1.1', 20: '192.168.2.1' } } // Adjusted Y
    };

    const advancedScenarios = {
        arl_table_operation: { title: 'ARL Table 運作演示', switch: 'l2switch', devices: ['pc1', 'pc2', 'pc3', 'pc4', 'l2switch'], from: 'pc1', to: 'pc2' }, // Using all PCs for flooding demo
        l2_flood: { title: 'L2 首次通訊', switch: 'l2switch', devices: ['pc1', 'pc2', 'l2switch'], from: 'pc1', to: 'pc2' },
        l2_unicast: { title: 'L2 後續通訊', switch: 'l2switch', devices: ['pc1', 'pc2', 'l2switch'], from: 'pc2', to: 'pc1', prefill: { mac: { 'AA:..:10': {port: 1, vlan: 10} } } },
        l3_arp: { title: 'L3 跨網段通訊', switch: 'l3switch', devices: ['pc1', 'pc2', 'pc3', 'pc4', 'l3switch'], from: 'pc1', to: 'pc4' }
    };

    function setupAdvancedScenario(scenarioKey) {
        currentAdvancedScenarioKey = scenarioKey;
        advancedCanvas.querySelectorAll('.device, .packet, .vlan-container').forEach(el => el.remove());
        advancedSvg.innerHTML = '';
        advancedMacTableBody.innerHTML = '';
        advancedArpTableBody.innerHTML = '';
        advancedMacTable = {};
        advancedArpTable = {};
        advancedStartBtn.disabled = false;
        setAdvancedExplanation('請選擇一個場景並點擊「開始動畫」。');

        const scenario = advancedScenarios[scenarioKey];
        advancedActiveSwitch = scenario.switch;
        advancedSwitchNameSpan.textContent = advancedDevices[advancedActiveSwitch].name;

        document.getElementById('arp-table-container').style.display = (advancedActiveSwitch === 'l3switch') ? 'block' : 'none';

        if (scenario.prefill?.mac) {
            advancedMacTable = JSON.parse(JSON.stringify(scenario.prefill.mac));
            updateAdvancedMacTableUI();
        }

        if (advancedActiveSwitch === 'l3switch') {
            drawAdvancedVlanContainer('vlan10', 'VLAN 10', 25, 50, 23, 90);
            drawAdvancedVlanContainer('vlan20', 'VLAN 20', 75, 50, 23, 90);
        }

        scenario.devices.forEach(key => drawAdvancedDevice(advancedDevices[key]));
        redrawAdvancedElements();
    }

    function redrawAdvancedElements() {
        const scenario = advancedScenarios[currentAdvancedScenarioKey];
        advancedSvg.innerHTML = '';
        scenario.devices.forEach(key => {
            const device = advancedDevices[key];
            const el = document.getElementById(device.name);
            if (el) {
                const { x, y } = getAdvancedPixelCoords(device.x, device.y);
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
            }
        });

        scenario.devices.filter(k => advancedDevices[k].type !== 'switch').forEach(key => {
            drawAdvancedLine(advancedDevices[key], advancedDevices[advancedActiveSwitch]);
        });
        
        if (advancedActiveSwitch === 'l3switch') {
            document.querySelectorAll('#advanced-animation .vlan-container').forEach(el => {
                const className = el.classList.contains('vlan10') ? 'vlan10' : 'vlan20';
                const coords = (className === 'vlan10') ? [25, 50, 23, 90] : [75, 50, 23, 90];
                const { x, y } = getAdvancedPixelCoords(coords[0], coords[1]);
                const width = advancedCanvas.clientWidth * (coords[2] / 100);
                const height = advancedCanvas.clientHeight * (coords[3] / 100);
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                el.style.width = `${width}px`;
                el.style.height = `${height}px`;
            });
        }
    }

    async function startAdvancedAnimation() {
        advancedStartBtn.disabled = true;
        const scenario = advancedScenarios[advancedScenarioSelect.value];
        switch (advancedScenarioSelect.value) {
            case 'arl_table_operation': await runArlTableOperation(scenario); break; // New case
            case 'l2_flood': await runL2Flood(scenario); break;
            case 'l2_unicast': await runL2Unicast(scenario); break; 
            case 'l3_arp': await runL3Arp(scenario); break;
        }
    }

    // --- New ARL Table Operation Animation ---
    async function runArlTableOperation({ from, to, switch: sw }) {
        const source = advancedDevices[from];
        const dest = advancedDevices[to];
        const l2switch = advancedDevices[sw];
        const allPcs = ['pc1', 'pc2', 'pc3', 'pc4'].map(key => advancedDevices[key]);

        // Step 1: PC1 sends to PC2 (unknown MAC) - Learning and Flooding
        setAdvancedExplanation('1. PC-1 (Port 1) 傳送資料到 PC-2。交換器收到幀，學習來源 MAC (AA:..:10)。');
        let packet = createAdvancedPacket('p1', 'data', source, dest);
        await moveAdvancedPacket(packet, source, l2switch);
        learnAdvancedMac(source);
        highlightMacTableRow(source.mac);
        await delay(2000);

        setAdvancedExplanation('2. 交換器查詢 MAC 表，發現沒有 PC-2 (AA:..:20) 的紀錄。');
        unhighlightMacTableRows();
        await delay(2000);

        setAdvancedExplanation('3. 交換器執行「廣播 (Flooding)」，將幀從除了來源 Port 1 以外的所有埠送出。');
        packet.remove(); // Remove original packet
        const floodPromises = allPcs.filter(pc => pc.name !== source.name).map(pc => {
            const clone = createAdvancedPacket('p_flood_' + pc.name, 'data', source, dest);
            advancedCanvas.appendChild(clone);
            return moveAdvancedPacket(clone, l2switch, pc);
        });
        await Promise.all(floodPromises);
        setAdvancedExplanation('4. 只有 PC-2 接收幀，其他 PC 丟棄。');
        await delay(2000);

        // Step 5: PC2 replies to PC1 (now known MAC) - Learning and Unicast
        setAdvancedExplanation('5. PC-2 (Port 2) 回應資料給 PC-1。交換器收到幀，學習來源 MAC (AA:..:20)。');
        packet = createAdvancedPacket('p2', 'data', dest, source);
        await moveAdvancedPacket(packet, dest, l2switch);
        learnAdvancedMac(dest);
        highlightMacTableRow(dest.mac);
        await delay(2000);

        setAdvancedExplanation('6. 交換器查詢 MAC 表，找到 PC-1 (AA:..:10) 對應 Port 1。');
        unhighlightMacTableRows();
        highlightMacTableRow(source.mac);
        await delay(2000);

        setAdvancedExplanation('7. 交換器執行「單播 (Unicast)」，將幀精準地只從 Port 1 送出。');
        await moveAdvancedPacket(packet, l2switch, source);
        setAdvancedExplanation('8. PC-1 成功收到資料。ARL Table 運作演示完成。');
        unhighlightMacTableRows();
    }

    async function runL2Flood({ from, to, switch: sw }) {
        const source = advancedDevices[from], dest = advancedDevices[to], l2switch = advancedDevices[sw];
        setAdvancedExplanation('1. PC-1 準備傳送資料到 PC-2。它建立一個資料幀，包含目的 MAC (AA:..:20) 和來源 MAC (AA:..:10)。');
        const packet = createAdvancedPacket('p1', 'data', source, dest);
        await moveAdvancedPacket(packet, source, l2switch);
        setAdvancedExplanation('2. 交換器收到來自 Port 1 的幀，學習來源 MAC 位址，將 `AA:..:10 -> Port 1` 寫入 MAC 表。');
        learnAdvancedMac(source);
        await delay(2000);
        setAdvancedExplanation('3. 交換器查詢 MAC 表，尋找目的 MAC (AA:..:20)。表中沒有紀錄。');
        await delay(2000);
        setAdvancedExplanation('4. 由於找不到對應 Port，交換器執行「Flooding」，將幀從除了來源 Port 以外的所有 Port 送出。');
        packet.remove();
        const floodPacket1 = createAdvancedPacket('p2', 'data', source, dest, l2switch);
        await moveAdvancedPacket(floodPacket1, l2switch, dest);
        setAdvancedExplanation('5. PC-2 收到幀，確認 MAC 位址相符，成功接收。動畫結束。');
    }

    async function runL2Unicast({ from, to, switch: sw }) {
        const source = advancedDevices[from], dest = advancedDevices[to], l2switch = advancedDevices[sw];
        setAdvancedExplanation('1. (前情提要: 交換器已學習過 PC-1 的 MAC) PC-2 準備回應資料給 PC-1。');
        await delay(2000);
        setAdvancedExplanation('2. PC-2 建立資料幀 (目的 MAC: AA:..:10, 來源 MAC: AA:..:20) 並送往交換器。');
        const packet = createAdvancedPacket('p1', 'data', source, dest);
        await moveAdvancedPacket(packet, source, l2switch);
        setAdvancedExplanation('3. 交換器收到來自 Port 2 的幀，學習來源 MAC 位址 `AA:..:20 -> Port 2`。');
        learnAdvancedMac(source);
        await delay(2000);
        setAdvancedExplanation('4. 交換器查詢 MAC 表，找到目的 MAC (AA:..:10) 對應 Port 1。');
        await delay(2000);
        setAdvancedExplanation('5. 交換器執行「Unicast」，將幀精準地只從 Port 1 送出。');
        await moveAdvancedPacket(packet, l2switch, dest);
        setAdvancedExplanation('6. PC-1 成功收到資料，通訊完成。');
    }

    async function runL3Arp({ from, to, switch: sw }) {
        const source = advancedDevices[from], dest = advancedDevices[to], l3switch = advancedDevices[sw];
        setAdvancedExplanation('1. PC-1 (VLAN 10) 要傳送資料到 PC-4 (VLAN 20)。因為是跨網段，封包的目的 MAC 會是「預設閘道」的 MAC。');
        await delay(3000);
        setAdvancedExplanation('2. 假設 PC-1 已知閘道 MAC，它將封包 (目的 IP: 192.168.2.40) 送到 L3 交換器。');
        const dataPacket = createAdvancedPacket('p_data', 'data', source, dest, { destMac: 'L3-SW-MAC' });
        await moveAdvancedPacket(dataPacket, source, l3switch);
        learnAdvancedMac(source);
        setAdvancedExplanation('3. L3 交換器收到封包，檢查目的 IP (192.168.2.40)，判斷需路由到 VLAN 20。');
        await delay(2500);
        setAdvancedExplanation('4. 交換器查詢 ARP 表，尋找 192.168.2.40 的 MAC 位址。發現沒有紀錄。');
        dataPacket.style.opacity = 0.5;
        await delay(2500);
        setAdvancedExplanation('5. L3 交換器在 VLAN 20 內廣播「ARP 請求」：誰是 192.168.2.40？');
        const arpRequest = createAdvancedPacket('p_arp_req', 'arp', l3switch, { name: 'Broadcast' }, { type: 'Request', targetIp: dest.ip });
        const floodTargets = advancedScenarios.l3_arp.devices.filter(d => advancedDevices[d].vlan === 20 && d !== 'l3switch');
        const promises = floodTargets.map(targetKey => {
            const clone = createAdvancedPacket('p_arp_req_clone_' + targetKey, 'arp', l3switch, advancedDevices[targetKey], { type: 'Request', targetIp: dest.ip });
            return moveAdvancedPacket(clone, l3switch, advancedDevices[targetKey]);
        });
        await Promise.all(promises);
        arpRequest.remove();
        setAdvancedExplanation('6. PC-4 收到 ARP 請求，以「ARP 回應」單播回覆自己的 MAC 位址 (BB:..:40)。');
        const arpReply = createAdvancedPacket('p_arp_rep', 'arp', dest, l3switch, { type: 'Reply', sourceMac: dest.mac, sourceIp: dest.ip });
        await moveAdvancedPacket(arpReply, dest, l3switch);
        setAdvancedExplanation('7. L3 交換器收到 ARP 回應，將 `192.168.2.40 -> BB:..:40` 寫入 ARP 表。');
        learnAdvancedArp(dest.ip, dest.mac);
        await delay(2000);
        setAdvancedExplanation('8. 現在可以傳送原始資料了。交換器重寫幀的 MAC (來源:L3-SW, 目的:PC-4) 並送出。');
        dataPacket.style.opacity = 1;
        updateAdvancedPacketInfo(dataPacket, { srcMac: 'L3-SW-MAC', destMac: dest.mac });
        await moveAdvancedPacket(dataPacket, l3switch, dest);
        setAdvancedExplanation('9. PC-4 成功收到資料。跨網段通訊完成。');
    }

    // --- Advanced Animation Helpers ---
    function getAdvancedPixelCoords(percentX, percentY) {
        const canvasRect = advancedCanvas.getBoundingClientRect();
        // Calculate Y based on 80% of canvas height (SVG area)
        const animationHeight = canvasRect.height * 0.8;
        return { x: canvasRect.width * (percentX / 100), y: animationHeight * (percentY / 100) };
    }

    function drawAdvancedDevice(device) {
        const el = document.createElement('div');
        el.id = device.name;
        el.className = `device ${device.type || 'pc'}`;
        let info = `<div class="icon"></div><div class="device-label">${device.name}</div>`;
        if (device.ip) info += `<div class="device-info">${device.ip}</div>`;
        if (device.mac) info += `<div class="device-info">${device.mac}</div>`;
        el.innerHTML = info;
        advancedCanvas.appendChild(el);
    }

    function drawAdvancedLine(from, to) {
        const fromCoords = getAdvancedPixelCoords(from.x, from.y);
        const toCoords = getAdvancedPixelCoords(to.x, to.y);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromCoords.x);
        line.setAttribute('y1', fromCoords.y);
        line.setAttribute('x2', toCoords.x);
        line.setAttribute('y2', toCoords.y);
        line.setAttribute('stroke', '#aaa');
        line.setAttribute('stroke-width', 2);
        line.setAttribute('stroke-dasharray', '5,5');
        advancedSvg.appendChild(line);
    }

    function drawAdvancedVlanContainer(className, label, x, y, w, h) {
        const el = document.createElement('div');
        el.className = `vlan-container ${className}`;
        el.innerHTML = `<div class="vlan-label">${label}</div>`;
        advancedCanvas.appendChild(el);
    }

    function createAdvancedPacket(id, type, from, to, options = {}) {
        const packet = document.createElement('div');
        packet.id = id;
        packet.className = `packet ${type}`;
        updateAdvancedPacketInfo(packet, { ...options, srcMac: from.mac, destMac: to.mac, srcIp: from.ip, destIp: to.ip });
        const startPos = getAdvancedPixelCoords(from.x, from.y);
        packet.style.left = `${startPos.x}px`;
        packet.style.top = `${startPos.y}px`;
        advancedCanvas.appendChild(packet);
        return packet;
    }

    function updateAdvancedPacketInfo(packet, { type, srcMac, destMac, srcIp, destIp, targetIp }) {
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

    function moveAdvancedPacket(packet, from, to) {
        const startPos = getAdvancedPixelCoords(from.x, from.y);
        const endPos = getAdvancedPixelCoords(to.x, to.y);
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

    function learnAdvancedMac(device) {
        if (!advancedMacTable[device.mac]) {
            advancedMacTable[device.mac] = { port: device.port, vlan: device.vlan };
            updateAdvancedMacTableUI();
        }
    }

    function learnAdvancedArp(ip, mac) {
        if (!advancedArpTable[ip]) {
            advancedArpTable[ip] = mac;
            updateAdvancedArpTableUI();
        }
    }

    function updateAdvancedMacTableUI(highlightMac = null) {
        advancedMacTableBody.innerHTML = '';
        for (const [mac, info] of Object.entries(advancedMacTable)) {
            const row = advancedMacTableBody.insertRow();
            row.innerHTML = `<td>${mac}</td><td>${info.port}</td><td>${info.vlan}</td>`;
            if (mac === highlightMac) {
                row.classList.add('highlight');
            }
        }
    }

    function unhighlightMacTableRows() {
        advancedMacTableBody.querySelectorAll('tr').forEach(row => {
            row.classList.remove('highlight');
        });
    }

    function highlightMacTableRow(mac) {
        unhighlightMacTableRows();
        const rows = advancedMacTableBody.querySelectorAll('tr');
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].cells[0].textContent === mac) {
                rows[i].classList.add('highlight');
                break;
            }
        }
    }

    function updateAdvancedArpTableUI() {
        advancedArpTableBody.innerHTML = '';
        for (const [ip, mac] of Object.entries(advancedArpTable)) {
            const row = advancedArpTableBody.insertRow();
            row.innerHTML = `<td>${ip}</td><td>${mac}</td>`;
        }
    }

    function setAdvancedExplanation(text) { advancedExplanationText.innerHTML = text; }

    // --- Event Listeners ---
    advancedScenarioSelect.addEventListener('change', () => setupAdvancedScenario(advancedScenarioSelect.value));
    advancedStartBtn.addEventListener('click', startAdvancedAnimation);
    advancedResetBtn.addEventListener('click', () => setupAdvancedScenario(advancedScenarioSelect.value));

    // --- Resize Observers ---
    const advancedResizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            redrawAdvancedElements();
        }
    });
    advancedResizeObserver.observe(advancedCanvas);

    // --- Initial Setup ---
    setupAdvancedScenario(currentAdvancedScenarioKey);
});