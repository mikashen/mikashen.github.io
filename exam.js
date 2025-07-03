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
const NUM_MCQ = 9; // Number of Multiple Choice Questions to select
const NUM_TF = 4;  // Number of True/False Questions to select
const NUM_OPEN = 2; // Number of Open-ended Questions to select

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
        { q: '以下哪種傳輸模式是「一對多」的？', options: ['單播 (Unicast)', '多播 (Multicast)', '廣播 (Broadcast)', '任播 (Anycast)'], ans: '多播 (Multicast)' },
        { q: '以下哪種傳輸模式是「一對所有」的？', options: ['單播 (Unicast)', '多播 (Multicast)', '廣播 (Broadcast)', '任播 (Anycast)'], ans: '廣播 (Broadcast)' },
        { q: '以下哪項是 STP 的主要功能？', options: ['路由', '防止網路迴圈', 'DHCP 伺服器', 'NAT 轉換'], ans: '防止網路迴圈' },
        { q: '以下哪項是 VLAN 的主要功能？', options: ['路由', '隔離廣播域', 'DHCP 伺服器', 'NAT 轉換'], ans: '隔離廣播域' },
        { q: '以下哪項是 LAG 的主要功能？', options: ['路由', '增加頻寬', 'DHCP 伺服器', 'NAT 轉換'], ans: '增加頻寬' },
        { q: '以下哪項是 QoS 的主要功能？', options: ['路由', '優先處理關鍵應用流量', 'DHCP 伺服器', 'NAT 轉換'], ans: '優先處理關鍵應用流量' },
        { q: '以下哪項是 Jumbo Frames 的主要功能？', options: ['路由', '提高網路傳輸效率', 'DHCP 伺服器', 'NAT 轉換'], ans: '提高網路傳輸效率' },
        { q: '以下哪項是 Flow Control 的主要功能？', options: ['路由', '防止接收端緩衝區溢出', 'DHCP 伺服器', 'NAT 轉換'], ans: '防止接收端緩衝區溢出' },
        { q: '以下哪項是 MMU 的主要功能？', options: ['路由', '管理封包緩衝區', 'DHCP 伺服器', 'NAT 轉換'], ans: '管理封包緩衝區' },
        { q: '以下哪項是 ARP 的主要功能？', options: ['路由', '解析 IP 到 MAC', 'DHCP 伺服器', 'NAT 轉換'], ans: '解析 IP 到 MAC' },
		{ "q": "相較於集線器 (Hub)，L2 交換器最主要的分隔功能是分隔了哪個域？", "options": ["廣播域", "碰撞域", "管理域", "安全域"], "ans": "碰撞域" },
		{ "q": "哪種交換轉發模式會等到接收完整個訊框並檢查其正確性後才進行轉發，延遲最高但最可靠？", "options": ["直通式 (Cut-Through)", "儲存轉發式 (Store-and-Forward)", "無碎片式 (Fragment-Free)", "快速轉發式 (Fast-Forward)"], "ans": "儲存轉發式 (Store-and-Forward)" },
		{ "q": "一個標準的 MAC 位址長度是多少位元？", "options": ["32 位元", "48 位元", "64 位元", "128 位元"], "ans": "48 位元" },
		{ "q": "在 STP 中，哪個埠口狀態既不學習 MAC 位址也不轉發資料訊框，但會接收並處理 BPDU？", "options": ["轉發 (Forwarding)", "學習 (Learning)", "監聽 (Listening)", "阻斷 (Blocking)"], "ans": "阻斷 (Blocking)" },
		{ "q": "當交換器埠口啟用 Port Security 並設定了違規模式為 'shutdown' 時，一旦偵測到未經授權的 MAC 位址，該埠口會發生什麼事？", "options": ["僅丟棄該封包", "發出警報並繼續運作", "將埠口置於錯誤停用 (err-disabled) 狀態", "自動學習該新位址"], "ans": "將埠口置於錯誤停用 (err-disabled) 狀態" },
		{ "q": "IEEE 802.1Q 標準是在乙太網路訊框的哪個部分插入 VLAN 標籤的？", "options": ["前導碼之後", "目的 MAC 之後", "來源 MAC 與類型/長度欄位之間", "資料承載之後"], "ans": "來源 MAC 與類型/長度欄位之間" },
		{ "q": "以下哪個協定是 IEEE 標準的鏈路聚合控制協定 (Link Aggregation Control Protocol)？", "options": ["PAgP", "VTP", "DTP", "LACP"], "ans": "LACP" },
		{ "q": "在 STP 選舉過程中，決定根橋 (Root Bridge) 的優先順序是什麼？", "options": ["最小的 MAC 位址優先", "最小的 Bridge ID 優先", "最大的 IP 位址優先", "最大的埠口數量優先"], "ans": "最小的 Bridge ID 優先" },
		{ "q": "DHCP Snooping 的主要防禦目標是？", "options": ["防止未經授權的 DHCP 伺服器", "防止病毒傳播", "加密網路流量", "防止 MAC 欺騙"], "ans": "防止未經授權的 DHCP 伺服器" },
		{ "q": "啟用 PortFast 的主要目的是什麼？", "options": ["提高埠口安全性", "防止網路迴圈", "加速終端設備接入網路的速度", "啟用巨型訊框"], "ans": "加速終端設備接入網路的速度" },
		{ "q": "在交換器上，Access Port 和 Trunk Port 的主要區別是什麼？", "options": ["傳輸速度不同", "支援的線材不同", "處理 VLAN 標籤的能力不同", "供電能力不同"], "ans": "處理 VLAN 標籤的能力不同" },
		{ "q": "以下哪項功能可以將多台實體交換器虛擬化成一台邏輯交換器來統一管理？", "options": ["VLAN", "堆疊 (Stacking)", "路由", "埠口鏡像"], "ans": "堆疊 (Stacking)" },
		{ "q": "相較於 Telnet，使用 SSH 管理交換器有何主要優點？", "options": ["速度更快", "指令更簡單", "傳輸過程加密", "不需密碼"], "ans": "傳輸過程加密" },
		{ "q": "在 802.1Q Trunk 中，原生 VLAN (Native VLAN) 的流量有何特點？", "options": ["流量被加密", "預設不帶 VLAN 標籤", "擁有最高優先級", "只能是 VLAN 1"], "ans": "預設不帶 VLAN 標籤" },
		{ "q": "MAC 位址表中的條目如果長時間未使用，會發生什麼事？", "options": ["被永久保留", "被標記為不安全", "根據老化時間 (Aging Time) 被移除", "被轉移到 Flash 記憶體"], "ans": "根據老化時間 (Aging Time) 被移除" },
		{ "q": "以下哪個 L2 安全功能可以防止 ARP 欺騙攻擊？", "options": ["Port Security", "DHCP Snooping", "Dynamic ARP Inspection (DAI)", "Storm Control"], "ans": "Dynamic ARP Inspection (DAI)" },
		{ "q": "埠口鏡像 (Port Mirroring/SPAN) 的主要用途是什麼？", "options": ["增加埠口頻寬", "備份埠口設定", "監控和分析特定埠口的流量", "隔離故障埠口"], "ans": "監控和分析特定埠口的流量" },
		{ "q": "在 RSTP (802.1w) 中，取代了 STP 的阻斷、監聽和停用狀態的是哪個單一狀態？", "options": ["學習 (Learning)", "備用 (Alternate)", "丟棄 (Discarding)", "轉發 (Forwarding)"], "ans": "丟棄 (Discarding)" },
		{ "q": "Auto-MDI/MDIX 功能解決了什麼問題？", "options": ["自動協商速度與雙工模式", "自動選擇使用直通線或跳線", "自動分配 IP 位址", "自動關閉未使用的埠口"], "ans": "自動選擇使用直通線或跳線" },
		{ "q": "以下哪種是廣播 MAC 位址？", "options": ["00:00:00:00:00:00", "FF:FF:FF:FF:FF:FF", "01:00:5E:00:00:01", "FE:80:00:00:00:00"], "ans": "FF:FF:FF:FF:FF:FF" },
		{ "q": "風暴控制 (Storm Control) 功能主要用來緩解哪種問題？", "options": ["電源突波", "網路延遲過高", "過量的廣播或多播流量", "未經授權的存取"], "ans": "過量的廣播或多播流量" },
		{ "q": "哪種技術可以讓 L2 交換器智慧地轉發多播流量，僅發送到需要該流量的埠口？", "options": ["IGMP Snooping", "STP", "CDP", "SNMP"], "ans": "IGMP Snooping" },
		{ "q": "BPDU (橋接協定資料單元) 是哪種協定使用的訊息？", "options": ["ARP", "ICMP", "STP", "DHCP"], "ans": "STP" },
		{ "q": "PoE 標準 IEEE 802.3at 通常被稱為什麼？", "options": ["PoE", "PoE+", "UPoE", "PoE++"], "ans": "PoE+" },
		{ "q": "當不同 VLAN 的主機需要通訊時，通常需要哪種設備的介入？", "options": ["集線器 (Hub)", "L2 交換器", "L3 交換器或路由器", "中繼器 (Repeater)"], "ans": "L3 交換器或路由器" },
		{ "q": "在交換器上設定『Sticky MAC』是屬於哪項安全功能的一部分？", "options": ["VLAN", "QoS", "Port Security", "STP"], "ans": "Port Security" },
		{ "q": "L2 交換器運作在 OSI 模型的哪一層？", "options": ["物理層 (Physical Layer)", "資料連結層 (Data Link Layer)", "網路層 (Network Layer)", "傳輸層 (Transport Layer)"], "ans": "資料連結層 (Data Link Layer)" },
		{ "q": "在 STP 中，非根橋上離根橋路徑成本最低的埠口稱為什麼？", "options": ["指定埠 (Designated Port)", "根埠 (Root Port)", "備用埠 (Alternate Port)", "管理埠 (Management Port)"], "ans": "根埠 (Root Port)" },
		{ "q": "下列何者是 L2 交換器不會處理的資訊？", "options": ["來源 MAC 位址", "目的 MAC 位址", "VLAN 標籤", "目的 IP 位址"], "ans": "目的 IP 位址" },
		{ "q": "若要將交換器的設定檔儲存起來，以避免重啟後遺失，通常會將 running-config 複製到何處？", "options": ["Flash Memory", "RAM", "NVRAM (startup-config)", "TFTP Server"], "ans": "NVRAM (startup-config)" },
		{ "q": "在全雙工 (Full-duplex) 模式下，網路通訊的特點是什麼？", "options": ["可能發生碰撞", "同一時間只能發送或接收", "可以同時發送和接收資料", "頻寬減半"], "ans": "可以同時發送和接收資料" },
		{ "q": "以下哪個選項最能描述『對稱交換』(Symmetric Switching)？", "options": ["所有埠口速度都相同", "來源和目的埠口速度不同", "只處理單向流量", "所有流量都經過 CPU"], "ans": "所有埠口速度都相同" },
		{ "q": "BPDU Guard 功能通常應用在哪種類型的埠口上，以防止未經授權的交換器接入？", "options": ["Trunk Port", "Uplink Port", "啟用 PortFast 的 Access Port", "Console Port"], "ans": "啟用 PortFast 的 Access Port" },
		{ "q": "交換器的轉發表 (Forwarding Table) 通常儲存在哪種高速記憶體中？", "options": ["DRAM", "Flash", "ROM", "TCAM (或 CAM)"], "ans": "TCAM (或 CAM)" },
		{ "q": "IEEE 802.1x 是一種什麼標準？", "options": ["無線網路標準", "基於埠的網路存取控制標準", "VLAN 標籤標準", "鏈路聚合標準"], "ans": "基於埠的網路存取控制標準" }
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
		{ "q": "L2 Switch 的每個埠都代表一個獨立的碰撞域 (Collision Domain)。 (是/否)", "ans": "是" },
		{ "q": "一台未設定 VLAN 的 24 埠 L2 Switch 預設情況下構成一個單一的廣播域。 (是/否)", "ans": "是" },
		{ "q": "當 Switch 的 MAC 位址表滿了之後，它會將所有收到的訊框全部丟棄。 (是/否)", "ans": "否" },
		{ "q": "在 STP 協定中，Bridge ID 值越大的交換器越有可能成為根橋 (Root Bridge)。 (是/否)", "ans": "否" },
		{ "q": "所有交換器都會主動發送 BPDU 封包來參與 STP 的運算。 (是/否)", "ans": "是" },
		{ "q": "RSTP (802.1w) 的收斂速度比傳統 STP (802.1D) 更快。 (是/否)", "ans": "是" },
		{ "q": "802.1Q Trunk 上的原生 VLAN (Native VLAN) 流量預設是不帶標籤 (Untagged) 的。 (是/否)", "ans": "是" },
		{ "q": "屬於不同 VLAN 的裝置，若要互相通訊，僅需一台 L2 Switch 即可完成。 (是/否)", "ans": "否" },
		{ "q": "鏈路聚合 (Link Aggregation) 的主要目的之一是提供線路備援。 (是/否)", "ans": "是" },
		{ "q": "直通式 (Cut-Through) 交換模式會檢查整個訊框的 FCS (Frame Check Sequence) 才轉發。 (是/否)", "ans": "否" },
		{ "q": "啟用 PortFast 的埠口會立即進入轉發狀態，並跳過 STP 的學習和監聽狀態。 (是/否)", "ans": "是" },
		{ "q": "埠口安全 (Port Security) 功能可以限制單一埠口允許學習的 MAC 位址數量。 (是/否)", "ans": "是" },
		{ "q": "LACP 是一種 IEEE 標準的鏈路聚合協定。 (是/否)", "ans": "是" },
		{ "q": "DHCP Snooping 功能主要用來防止網路中的 ARP 欺騙攻擊。 (是/否)", "ans": "否" },
		{ "q": "風暴控制 (Storm Control) 可以限制廣播、多播及未知單播流量的速率。 (是/否)", "ans": "是" },
		{ "q": "埠口鏡像 (Port Mirroring) 會將來源埠的流量複製一份到目的埠，同時中斷來源埠的正常通訊。 (是/否)", "ans": "否" },
		{ "q": "MAC 位址表中的動態條目有老化時間 (Aging Time)，過期後會自動被移除。 (是/否)", "ans": "是" },
		{ "q": "Auto-MDI/MDIX 功能可以自動偵測對接設備的線路類型，無需使用跳線 (Crossover Cable)。 (是/否)", "ans": "是" },
		{ "q": "PoE+ (802.3at) 提供的功率比標準 PoE (802.3af) 更高。 (是/否)", "ans": "是" },
		{ "q": "Telnet 是一種安全的遠端管理交換器的方式，因為它有加密傳輸過程。 (是/否)", "ans": "否" },
		{ "q": "堆疊式交換器 (Stackable Switch) 可以將多台實體交換器虛擬化成一台邏輯交換器進行管理。 (是/否)", "ans": "是" },
		{ "q": "全雙工 (Full-duplex) 模式下，網路埠可以同時發送和接收資料，因此不會發生碰撞。 (是/否)", "ans": "是" },
		{ "q": "BPDU Guard 功能是用來防止未經授權的交換器加入網路並影響 STP 拓撲。 (是/否)", "ans": "是" },
		{ "q": "L2 Switch 轉發訊框時，會修改訊框中的來源 MAC 位址。 (是/否)", "ans": "否" },
		{ "q": "所有 L2 交換器都支援 Jumbo Frames。 (是/否)", "ans": "否" },
		{ "q": "IGMP Snooping 功能可以讓 L2 Switch 學習哪個埠需要接收特定的多播流量，以避免不必要的廣播。 (是/否)", "ans": "是" },
		{ "q": "Access Port 只能屬於一個 VLAN。 (是/否)", "ans": "是" },
		{ "q": "在 STP 中，根埠 (Root Port) 是交換器上離根橋路徑成本最低的埠。 (是/否)", "ans": "是" },
		{ "q": "靜態 MAC 位址條目不會被老化時間機制移除。 (是/否)", "ans": "是" },
		{ "q": "L2 Switch 運作在 OSI 模型的網路層 (Network Layer)。 (是/否)", "ans": "否" }
    ],
    open: [
        { q: '請解釋單播、多播和廣播三種傳輸模式的區別。', ans: '' },
        { q: '請說明 PoE 技術在實際網路部署中的兩個主要優勢。', ans: '' },
        { q: '請說明 VLAN 如何實現廣播域隔離。', ans: '' },
        { q: '請說明巨型訊框 (Jumbo Frames) 如何提高網路傳輸效率。', ans: '' },
        { q: '請說明您認為網路流量控制的重要性。', ans: '' },
        { q: '請簡述 L2 Switch 學習 MAC 位址的過程。', ans: '' },
        { q: '請簡述 QoS 在網路中的作用。', ans: '' },
        { q: '請簡述 STP 協定如何防止網路迴圈。', ans: '' },
        { q: '請簡述 Switch 的 CLI 管理方式與 Web 介面管理方式的優缺點。', ans: '' },
        { q: '請簡述您對 MMU (Memory Management Unit) 在 Switch 中的作用理解。', ans: '' },
        { q: '請簡述 Switch 的 CLI 管理方式與 Web 介面管理方式的優缺點。', ans: '' },
		{ "q": "當 L2 Switch 在其 MAC 位址表中找不到目的地位址時，它會如何處理該訊框 (Frame)？", "ans": "" },
		{ "q": "請解釋碰撞域 (Collision Domain) 與廣播域 (Broadcast Domain) 的差異，並說明 L2 Switch 如何影響這兩者。", "ans": "" },
		{ "q": "請說明 MAC 位址表 (MAC Address Table) 在 L2 Switch 中的主要功能是什麼？", "ans": "" },
		{ "q": "請解釋 802.1Q Trunk Port 的主要用途是什麼？", "ans": "" },
		{ "q": "請說明在 802.1Q Trunk 中，原生 VLAN (Native VLAN) 的作用是什麼？", "ans": "" },
		{ "q": "請簡述交換器上 Access Port 與 Trunk Port 的功能差異。", "ans": "" },
		{ "q": "在 STP (Spanning Tree Protocol) 中，根橋 (Root Bridge) 扮演什麼角色？", "ans": "" },
		{ "q": "請說明 STP 中的 PortFast 功能有何用途？為什麼它能加速網路收斂？", "ans": "" },
		{ "q": "相較於傳統的 STP (802.1D)，RSTP (802.1w) 做了哪些主要改進以加快收斂速度？", "ans": "" },
		{ "q": "請說明鏈路聚合 (Link Aggregation) 的主要目的，並舉出其兩項優點。", "ans": "" },
		{ "q": "請解釋交換器上的埠口安全 (Port Security) 功能如何運作及其主要目的。", "ans": "" },
		{ "q": "請說明 DHCP Snooping (DHCP 窺探) 的功能，以及它如何防止網路攻擊。", "ans": "" },
		{ "q": "請簡述風暴控制 (Storm Control) 在交換器上的作用。", "ans": "" },
		{ "q": "請比較直通式 (Cut-Through) 和儲存轉發式 (Store-and-Forward) 這兩種交換模式的優缺點。", "ans": "" },
		{ "q": "請說明流量控制 (Flow Control, IEEE 802.3x) 在交換器中的作用機制。", "ans": "" },
		{ "q": "請解釋 Auto-MDI/MDIX 功能的作用，它解決了什麼問題？", "ans": "" },
		{ "q": "請說明埠口鏡像 (Port Mirroring/SPAN) 的功能，並舉出一個適合使用它的情境。", "ans": "" },
		{ "q": "請簡述 SNMP 協定在管理和監控交換器時扮演的角色。", "ans": "" },
		{ "q": "請說明 PoE (802.3af) 與 PoE+ (802.3at) 在供電能力上的主要差異。", "ans": "" },
		{ "q": "請解釋什麼是堆疊式交換器 (Stackable Switch)，以及使用堆疊技術的主要優勢為何？", "ans": "" }
	],
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
