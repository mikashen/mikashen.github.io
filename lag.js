document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('lagCanvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const failLinkBtn = document.getElementById('failLinkBtn');
    const explanation = document.getElementById('step-explanation');

    let animationInterval;
    let packetCounter = 0;

    const switches = {
        'A': { x: 150, y: 300, id: 'A' },
        'B': { x: 650, y: 300, id: 'B' }
    };

    let links = [
        { from: 'A', to: 'B', y_offset: -50, state: 'active' },
        { from: 'A', to: 'B', y_offset: 0, state: 'active' },
        { from: 'A', to: 'B', y_offset: 50, state: 'active' }
    ];

    function drawSwitch(s) {
        ctx.fillStyle = 'lightblue';
        ctx.strokeStyle = 'darkblue';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(s.x - 40, s.y - 80, 80, 160);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Switch ${s.id}`, s.x, s.y);
    }

    function drawLink(link) {
        const from = switches[link.from];
        const to = switches[link.to];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y + link.y_offset);
        ctx.lineTo(to.x, to.y + link.y_offset);

        if (link.state === 'failed') {
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
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        links.forEach(drawLink);
        Object.values(switches).forEach(drawSwitch);
    }

    function reset() {
        clearInterval(animationInterval);
        document.querySelectorAll('.packet').forEach(p => p.remove());
        links.forEach(link => link.state = 'active');
        packetCounter = 0;
        startBtn.disabled = false;
        failLinkBtn.disabled = false;
        explanation.textContent = '點擊「開始動畫」來觀察 LAG 的負載平衡特性。';
        draw();
    }

    function createPacket(id, link) {
        const fromSwitch = switches[link.from];
        const packet = document.createElement('div');
        packet.id = `packet-${id}`;
        packet.className = 'packet data';
        packet.textContent = `Data ${id}`;
        packet.style.left = `${fromSwitch.x}px`;
        packet.style.top = `${fromSwitch.y + link.y_offset + 65}px`; // Adjusted for visual alignment
        canvas.parentElement.appendChild(packet);
        return packet;
    }

    async function movePacket(packet, link) {
        const from = switches[link.from];
        const to = switches[link.to];
        const startPos = { x: from.x, y: from.y + link.y_offset };
        const endPos = { x: to.x, y: to.y + link.y_offset };

        await anime({
            targets: packet,
            left: [`${startPos.x}px`, `${endPos.x}px`],
            top: [`${startPos.y + 65}px`, `${endPos.y + 65}px`],
            duration: 2000,
            easing: 'linear',
            complete: () => {
                packet.remove();
            }
        }).finished;
    }

    function startAnimation() {
        startBtn.disabled = true;
        explanation.textContent = '開始傳送數據封包，流量被平均分配到所有可用的鏈路上。';

        animationInterval = setInterval(() => {
            const activeLinks = links.filter(l => l.state === 'active');
            if (activeLinks.length === 0) {
                explanation.textContent = '所有鏈路都已中斷，無法傳送數據。';
                clearInterval(animationInterval);
                return;
            }

            packetCounter++;
            const linkToUse = activeLinks[packetCounter % activeLinks.length];
            const packet = createPacket(packetCounter, linkToUse);
            movePacket(packet, linkToUse);

        }, 500);
    }

    function failLink() {
        const activeLinks = links.filter(l => l.state === 'active');
        if (activeLinks.length > 0) {
            const linkToFail = activeLinks[0]; // Fail the first active link
            linkToFail.state = 'failed';
            explanation.textContent = `鏈路中斷！流量將自動重新分配到剩餘的健康鏈路上。`;
            draw();
        }
        if (activeLinks.length - 1 === 0) {
            failLinkBtn.disabled = true;
        }
    }

    startBtn.addEventListener('click', startAnimation);
    resetBtn.addEventListener('click', reset);
    failLinkBtn.addEventListener('click', failLink);

    reset(); // Initial state
});