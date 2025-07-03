// exam.js

const studentInfoSection = document.getElementById('student-info-section');
const examSection = document.getElementById('exam-section');
const resultSection = document.getElementById('result-section');
const startExamBtn = document.getElementById('start-exam-btn');
const submitExamBtn = document.getElementById('submit-exam-btn');
const examForm = document.getElementById('exam-form');
const scoreDisplay = document.getElementById('score-display');
const submissionStatus = document.getElementById('submission-status');

// --- Configuration ---
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbw4ICZ40Q3AdWgkOVsy3I0QejLNVdskYiQFCpYycDFNE1D5LVJT5hzU9vMaeYtcII9f/exec';
const NUM_MCQ = 8; // Number of Multiple Choice Questions to select
const NUM_TF = 4;  // Number of True/False Questions to select
const NUM_OPEN = 3; // Number of Open-ended Questions to select

// --- Question Pool ---
const questionPool = {
    mcq: [
        { q: '以下哪項是 L2 Switch 的主要功能？', options: ['路由', 'MAC 位址學習', 'DHCP 伺服器', 'NAT 轉換'], ans: 'MAC 位址學習' },
        { q: 'STP 協定的主要目的是什麼？', options: ['增加頻寬', '防止網路迴圈', '加密資料', '分配 IP 位址'], ans: '防止網路迴圈' },
        { q: 'PoE 的全稱是什麼？', options: ['Power over Ethernet', 'Protocol over Exchange', 'Packet over Encryption', 'Port over Everything'], ans: 'Power over Ethernet' },
        { q: 'Ingress 在網路設備中代表什麼方向？', options: ['離開設備', '進入設備', '內部處理', '外部監控'], ans: '進入設備' },
        { q: '以下哪種記憶體在 Switch 中主要用於儲存作業系統映像？', options: ['DRAM', 'SRAM', 'Flash Memory', 'Cache'], ans: 'Flash Memory' },
        { q: '乙太網路中，標準的 MTU (最大傳輸單元) 是多少位元組？', options: ['576', '1500', '9000', '65535'], ans: '1500' },
        { q: 'VLAN 的主要作用是什麼？', options: ['增加網路速度', '隔離廣播域', '提供 IP 位址', '加密資料傳輸'], ans: '隔離廣播域' },
        { q: 'LAG (Link Aggregation) 的主要優勢不包括以下哪項？', options: ['增加頻寬', '提供鏈路備援', '簡化 IP 位址管理', '負載平衡'], ans: '簡化 IP 位址管理' },
        { q: 'QoS 的主要目的是什麼？', options: ['確保所有流量公平傳輸', '優先處理關鍵應用流量', '減少網路設備功耗', '自動分配 IP 位址'], ans: '優先處理關鍵應用流量' },
        { q: 'ARP 協定用於解析哪兩種位址之間的關係？', options: ['IP 到 Port', 'MAC 到 Port', 'IP 到 MAC', 'MAC 到 IP'], ans: 'IP 到 MAC' },
        { q: '以下哪種埠口類型通常用於 Switch 的初次配置？', options: ['Ethernet Port', 'Fiber Port', 'Console Port', 'Uplink Port'], ans: 'Console Port' },
        { q: '當 Switch 的 MAC 位址表中沒有目的 MAC 位址的記錄時，它會怎麼做？', options: ['丟棄封包', '發送 ARP 請求', '進行廣播 (Flooding)', '發送 ICMP 錯誤訊息'], ans: '進行廣播 (Flooding)' },
        { q: '以下哪項不是 PoE 的優勢？', options: ['節省佈線成本', '安裝靈活', '提供更高頻寬', '集中電源管理'], ans: '提供更高頻寬' },
        { q: 'Flow Control (流量控制) 主要透過哪種 Frame 來實現？', options: ['ARP Request', 'ICMP Echo', 'Pause Frame', 'BPDU'], ans: 'Pause Frame' },
        { q: '以下哪種技術可以將多個實體鏈路捆綁成一個邏輯通道？', options: ['VLAN', 'STP', 'LAG', 'QoS'], ans: 'LAG' },
        { q: '在 STP 中，哪個角色負責轉發流量並防止迴圈？', options: ['Root Bridge', 'Root Port', 'Designated Port', 'Blocking Port'], ans: 'Designated Port' },
        { q: '以下哪種介面模組支援 100 Gbps 的速度？', options: ['SFP', 'SFP+', 'QSFP+', 'QSFP28'], ans: 'QSFP28' },
        { q: 'Switch ASIC 的主要功能是什麼？', options: ['運行作業系統', '處理控制平面流量', '高速資料轉發', '提供電源'], ans: '高速資料轉發' },
        { q: '以下哪項是 L2 Switch 學習 MAC 位址的依據？', options: ['目的 MAC 位址', '來源 MAC 位址', '目的 IP 位址', '來源 IP 位址'], ans: '來源 MAC 位址' },
        { q: '當網路中存在迴圈時，可能導致的現象不包括以下哪項？', options: ['廣播風暴', 'MAC 表不穩定', '網路速度提升', '重複封包'], ans: '網路速度提升' },
        { q: '以下哪種協定用於網路管理系統 (NMS) 監控網路設備？', options: ['HTTP', 'FTP', 'SNMP', 'Telnet'], ans: 'SNMP' },
        { q: '巨型訊框 (Jumbo Frames) 通常支援的最大 MTU 是多少位元組？', options: ['1500', '4000', '9000', '16000'], ans: '9000' },
        { q: '以下哪種技術可以將一個物理網路劃分為多個邏輯網路？', options: ['LAG', 'STP', 'VLAN', 'PoE'], ans: 'VLAN' },
        { q: '在乙太網路中，資料是以什麼形式傳輸的？', options: ['Packet', 'Segment', 'Frame', 'Datagram'], ans: 'Frame' },
        { q: '以下哪種傳輸模式是「一對一」的？', options: ['單播 (Unicast)', '多播 (Multicast)', '廣播 (Broadcast)', '任播 (Anycast)'], ans: '單播 (Unicast)' },
    ],
    tf: [
        { q: 'L2 Switch 能夠直接根據 IP 位址轉發封包。 (是/否)', ans: '否' },
        { q: 'VLAN 可以有效隔離廣播域。 (是/否)', ans: '是' },
        { q: 'Jumbo Frames 可以提高網路傳輸效率。 (是/否)', ans: '是' },
        { q: 'STP 協定主要用於防止網路中的迴圈。 (是/否)', ans: '是' },
        { q: 'PoE 技術允許網路線同時傳輸資料和電力。 (是/否)', ans: '是' },
        { q: 'MMU 在 Switch 中主要負責 CPU 的運算。 (是/否)', ans: '否' },
        { q: 'Ingress 埠是指資料包離開網路設備的埠。 (是/否)', ans: '否' },
        { q: 'ARP 請求是一種單播封包。 (是/否)', ans: '否' },
        { q: 'QoS 可以保證所有網路流量的傳輸速度都一樣快。 (是/否)', ans: '否' },
        { q: 'LAG 可以增加網路的總頻寬。 (是/否)', ans: '是' },
        { q: 'Switch 的 MAC 位址表是靜態的，不會自動更新。 (是/否)', ans: '否' },
        { q: 'SNMP 只能用於監控網路設備，不能用於配置。 (是/否)', ans: '否' },
        { q: 'Flow Control 主要用於防止接收端緩衝區溢出。 (是/否)', ans: '是' },
        { q: '多播 (Multicast) 是一種「一對所有」的傳輸模式。 (是/否)', ans: '否' },
        { q: 'Console Port 通常用於 Switch 的遠端管理。 (是/否)', ans: '否' },
    ],
    open: [
        { q: '請簡述您對 MMU (Memory Management Unit) 在 Switch 中的作用理解。', ans: '' },
        { q: '請說明您認為網路流量控制的重要性。', ans: '' },
        { q: '請簡述 L2 Switch 學習 MAC 位址的過程。', ans: '' },
        { q: '請說明 PoE 技術在實際網路部署中的兩個主要優勢。', ans: '' },
        { q: '請解釋單播、多播和廣播三種傳輸模式的區別。', ans: '' },
        { q: '請簡述 STP 協定如何防止網路迴圈。', ans: '' },
        { q: '請說明 VLAN 如何實現廣播域隔離。', ans: '' },
        { q: '請簡述 QoS 在網路中的作用。', ans: '' },
        { q: '請說明巨型訊框 (Jumbo Frames) 如何提高網路傳輸效率。', ans: '' },
        { q: '請簡述 Switch 的 CLI 管理方式與 Web 介面管理方式的優缺點。', ans: '' },
    ]
};

let selectedQuestions = [];

// --- Functions ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateExamQuestions() {
    selectedQuestions = [];

    // Select MCQ
    const mcqShuffled = shuffleArray([...questionPool.mcq]);
    selectedQuestions.push(...mcqShuffled.slice(0, NUM_MCQ));

    // Select T/F
    const tfShuffled = shuffleArray([...questionPool.tf]);
    selectedQuestions.push(...tfShuffled.slice(0, NUM_TF));

    // Select Open-ended
    const openShuffled = shuffleArray([...questionPool.open]);
    selectedQuestions.push(...openShuffled.slice(0, NUM_OPEN));

    // Shuffle all selected questions to mix types
    selectedQuestions = shuffleArray(selectedQuestions);

    examForm.innerHTML = ''; // Clear previous questions
    selectedQuestions.forEach((qData, index) => {
        const qElement = document.createElement('div');
        qElement.classList.add('question-section');
        qElement.dataset.index = index; // Store original index for submission

        let questionHtml = `<h3>Q${index + 1}. ${qData.q}</h3><div class="options">`;

        if (qData.options) { // Multiple Choice
            qData.options.forEach(option => {
                questionHtml += `
                    <label>
                        <input type="radio" name="q${index}" value="${option}">
                        ${option}
                    </label>
                `;
            });
        } else if (qData.ans !== undefined && (qData.ans === '是' || qData.ans === '否')) { // True/False
            questionHtml += `
                <label>
                    <input type="radio" name="q${index}" value="是">
                    是
                </label>
                <label>
                    <input type="radio" name="q${index}" value="否">
                    否
                </label>
            `;
        } else { // Open-ended
            questionHtml += `<textarea name="q${index}" placeholder="請在此輸入您的答案"></textarea>`;
        }
        questionHtml += `</div>`;
        qElement.innerHTML = questionHtml;
        examForm.appendChild(qElement);
    });
}

function calculateScore() {
    let score = 0;
    const studentAnswers = {};

    selectedQuestions.forEach((qData, index) => {
        const qName = `q${index}`;
        let studentAnswer = '';

        if (qData.options || (qData.ans !== undefined && (qData.ans === '是' || qData.ans === '否'))) { // MCQ or T/F
            const selectedOption = examForm.querySelector(`input[name="${qName}"]:checked`);
            if (selectedOption) {
                studentAnswer = selectedOption.value;
            }
            if (studentAnswer === qData.ans) {
                score++;
            }
        } else { // Open-ended
            const textarea = examForm.querySelector(`textarea[name="${qName}"]`);
            if (textarea) {
                studentAnswer = textarea.value.trim();
            }
            // Open-ended questions are not auto-scored here, assume 0 or manual grading
        }
        studentAnswers[qName] = studentAnswer;
    });
    return { score, studentAnswers };
}

async function submitExam(event) {
    event.preventDefault();
    console.log('提交按鈕被點擊。');

    const studentName = document.getElementById('student-name').value.trim();
    const studentEmail = document.getElementById('student-email').value.trim();

    if (!studentName || !studentEmail) {
        alert('請輸入您的姓名和電子郵件！');
        console.log('姓名或電子郵件為空。');
        return;
    }

    const { score, studentAnswers } = calculateScore();
    scoreDisplay.textContent = `您的分數是：${score} / ${selectedQuestions.length}`; // Display score for objective questions

    submissionStatus.textContent = '正在提交結果...';
    resultSection.classList.remove('hidden');
    examSection.classList.add('hidden');

    const examData = {
        timestamp: new Date().toLocaleString(),
        studentName: studentName,
        studentEmail: studentEmail,
        score: score,
        totalQuestions: selectedQuestions.length,
        questions: selectedQuestions.map((qData, index) => ({
            questionText: qData.q,
            studentAnswer: studentAnswers[`q${index}`] || '',
            correctAnswer: qData.ans || 'N/A' // N/A for open-ended
        }))
    };

    console.log('準備提交的資料:', examData);

    try {
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script Web App
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(examData),
        });
        console.log('Fetch 請求已發送。');
        // Since mode is 'no-cors', response.ok will always be true. 
        // We rely on the Apps Script to log success/failure.
        submissionStatus.textContent = '結果已提交！感謝您的參與。';
        console.log('提交成功訊息已顯示。');
    } catch (error) {
        console.error('提交失敗:', error);
        submissionStatus.textContent = '提交失敗，請稍後再試。';
    }
}

// --- Event Listeners ---
startExamBtn.addEventListener('click', () => {
    const studentName = document.getElementById('student-name').value.trim();
    const studentEmail = document.getElementById('student-email').value.trim();

    if (!studentName || !studentEmail) {
        alert('請輸入您的姓名和電子郵件！');
        return;
    }
    studentInfoSection.classList.add('hidden');
    examSection.classList.remove('hidden');
    generateExamQuestions();
});

submitExamBtn.addEventListener('click', submitExam);

// Initial state
// Note: Navigation will be updated by a separate script or manually.
