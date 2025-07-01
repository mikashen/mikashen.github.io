document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('stpCanvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const explanation = document.getElementById('step-explanation');

    let animationFrameId;

    const switches = {
        'A': { x: 150, y: 200, id: 'A', bridgeId: '8000.AAAAAAAAAAAA', isRoot: false },
        'B': { x: 400, y: 100, id: 'B', bridgeId: '8000.BBBBBBBBBBBB', isRoot: false },
        'C': { x: 400, y: 300, id: 'C', bridgeId: '8000.CCCCCCCCCCCC', isRoot: false },
        'D': { x: 650, y: 200, id: 'D', bridgeId: '8000.DDDDDDDDDDDD', isRoot: false }
    };

    const links = [
        { from: 'A', to: 'B', state: 'forwarding', fromPort: 'Root', toPort: 'Designated' },
        { from: 'A', to: 'C', state: 'forwarding', fromPort: 'Root', toPort: 'Designated' },
        { from: 'B', to: 'D', state: 'forwarding', fromPort: 'Designated', toPort: 'Root' },
        { from: 'C', to: 'D', state: 'forwarding', fromPort: 'Designated', toPort: 'Root' },
        { from: 'B', to: 'C', state: 'forwarding', fromPort: 'Blocked', toPort: 'Designated' } // Redundant link
    ];

    function drawSwitch(s) {
        ctx.fillStyle = s.isRoot ? 'gold' : 'lightblue';
        ctx.strokeStyle = 'darkblue';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(s.x - 50, s.y - 25, 100, 50);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Switch ${s.id}`, s.x, s.y - 10);
        ctx.font = '10px Arial';
        ctx.fillText(s.bridgeId, s.x, s.y + 10);
    }

    function drawLink(link) {
        const from = switches[link.from];
        const to = switches[link.to];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);

        if (link.state === 'blocked') {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
        } else {
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 4;
            ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw port states
        ctx.fillStyle = 'blue';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        if (link.state !== 'blocked') {
            ctx.fillText(link.fromPort, (from.x + to.x)/2 - 20, (from.y + to.y)/2 - 10);
            ctx.fillText(link.toPort, (from.x + to.x)/2 + 20, (from.y + to.y)/2 + 10);
        }
    }

    function createPacket(id, fromSwitch) {
        const packet = document.createElement('div');
        packet.id = id;
        packet.className = 'packet stp-bpdu';
        packet.innerHTML = `BPDU<br/>Root: ${fromSwitch.bridgeId.slice(5)}`;
        packet.style.left = `${fromSwitch.x + 200}px`;
        packet.style.top = `${fromSwitch.y + 60}px`;
        canvas.parentElement.appendChild(packet);
        return packet;
    }

    async function movePacket(packet, from, to) {
        return new Promise(resolve => {
            const fromPos = { x: from.x + 200, y: from.y + 60 };
            const toPos = { x: to.x + 200, y: to.y + 60 };
            const duration = 1500;
            let startTime = null;

            function animate(time) {
                if (!startTime) startTime = time;
                const progress = (time - startTime) / duration;
                if (progress < 1) {
                    packet.style.left = `${fromPos.x + (toPos.x - fromPos.x) * progress}px`;
                    packet.style.top = `${fromPos.y + (toPos.y - fromPos.y) * progress}px`;
                    requestAnimationFrame(animate);
                } else {
                    packet.style.left = `${toPos.x}px`;
                    packet.style.top = `${toPos.y}px`;
                    resolve();
                }
            }
            requestAnimationFrame(animate);
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        links.forEach(drawLink);
        Object.values(switches).forEach(drawSwitch);
    }

    function reset() {
        if (animationFrameId) clearTimeout(animationFrameId);
        document.querySelectorAll('.stp-bpdu').forEach(p => p.remove());
        links.forEach(link => {
            link.state = 'forwarding';
            link.fromPort = '';
            link.toPort = '';
        });
        Object.values(switches).forEach(s => s.isRoot = false);
        explanation.textContent = '點擊 "Start Animation" 來觀察STP的運作過程。';
        draw();
    }

    async function startAnimation() {
        reset();
        startBtn.disabled = true;

        // Step 1: All switches think they are the root and send BPDUs
        explanation.textContent = '步驟 1: 所有Switch都認為自己是根橋，並開始發送 BPDU。';
        await new Promise(r => setTimeout(r, 1000));

        const initialBPDUs = Object.values(switches).map(s => createPacket(`bpdu_from_${s.id}`, s));
        await Promise.all(links.map(async (link) => {
            const from = switches[link.from];
            const to = switches[link.to];
            const bpdu1 = createPacket(`bpdu_${from.id}_to_${to.id}`, from);
            const bpdu2 = createPacket(`bpdu_${to.id}_to_${from.id}`, to);
            await Promise.all([movePacket(bpdu1, from, to), movePacket(bpdu2, to, from)]);
            bpdu1.remove();
            bpdu2.remove();
        }));
        initialBPDUs.forEach(p => p.remove());

        // Step 2: Elect Root Bridge
        explanation.textContent = '步驟 2: Switch比較收到的 BPDU，擁有最小 Bridge ID 的 Switch A 被選舉為根橋。';
        switches['A'].isRoot = true;
        draw();
        await new Promise(r => setTimeout(r, 2000));

        // Step 3: Determine Port Roles
        explanation.textContent = '步驟 3: 確定埠角色 - 根埠 (Root Port), 指定埠 (Designated Port)。';
        links.forEach(l => {
            if (l.from === 'A' || l.to === 'A') {
                l.fromPort = switches[l.from].isRoot ? 'Designated' : 'Root';
                l.toPort = switches[l.to].isRoot ? 'Designated' : 'Root';
            }
        });
        draw();
        await new Promise(r => setTimeout(r, 2000));

        // Step 4: Block Redundant Link
        explanation.textContent = '步驟 4: 為了防止迴圈，成本最高的冗餘鏈路 (B-C) 將被阻斷。';
        const redundantLink = links.find(l => (l.from === 'B' && l.to === 'C') || (l.from === 'C' && l.to === 'B'));
        if (redundantLink) {
            redundantLink.state = 'blocked';
            redundantLink.fromPort = 'Blocked';
            redundantLink.toPort = 'Designated'; // Or could be the other way around depending on cost
        }
        draw();
        await new Promise(r => setTimeout(r, 2000));

        explanation.textContent = 'STP 收斂完成！網路現在是一個無迴圈的樹狀拓撲。';
        startBtn.disabled = false;
    }

    startBtn.addEventListener('click', startAnimation);
    resetBtn.addEventListener('click', reset);

    reset(); // Initial state
});
