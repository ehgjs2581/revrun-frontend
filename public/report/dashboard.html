<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>REVRUN | 광고 성과 리포트</title>
  <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --cream: #faf8f5;
      --light-cream: #f5f3ef;
      --warm-beige: #e8e3db;
      --medium-brown: #8b7355;
      --dark-brown: #5d4a3a;
      --deep-brown: #3a2f23;
      --accent-green: #5d8a66;
    }

    body {
      font-family: 'Manrope', -apple-system, sans-serif;
      background: var(--cream);
      color: var(--deep-brown);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container {
      max-width: 1360px;
      margin: 0 auto;
      padding: 72px 56px 100px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 80px;
      padding-bottom: 40px;
      border-bottom: 1px solid var(--warm-beige);
      animation: fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .logo-symbol {
      width: 90px;
      height: 64px;
    }

    .logo-symbol svg {
      width: 100%;
      height: 100%;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .wordmark {
      font-family: 'Cormorant', serif;
      font-size: 36px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--deep-brown);
    }

    .tagline {
      font-family: 'Manrope', sans-serif;
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--medium-brown);
    }

    .divider {
      width: 1px;
      height: 48px;
      background: var(--warm-beige);
    }

    .page-title {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--dark-brown);
      line-height: 1.3;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .period {
      font-size: 14px;
      font-weight: 600;
      color: var(--dark-brown);
      letter-spacing: 0.01em;
    }

    .date {
      font-size: 13px;
      font-weight: 500;
      color: var(--medium-brown);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--dark-brown);
      letter-spacing: 0.01em;
    }

    .btn-logout {
      padding: 12px 28px;
      border: 1px solid var(--deep-brown);
      background: transparent;
      color: var(--deep-brown);
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: 'Manrope', sans-serif;
    }

    .btn-logout:hover {
      background: var(--deep-brown);
      color: var(--cream);
    }

    /* Main Grid - 2 Columns */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 60px;
    }

    /* Card */
    .card {
      background: white;
      border: 1px solid var(--warm-beige);
      padding: 40px;
      animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card:nth-child(1) { animation-delay: 0.1s; }
    .card:nth-child(2) { animation-delay: 0.2s; }

    .card-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--warm-beige);
    }

    .card-title {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--dark-brown);
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Big Number Display */
    .big-metric {
      text-align: center;
      padding: 48px 0;
      border-bottom: 1px solid var(--warm-beige);
      margin-bottom: 36px;
    }

    .big-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--medium-brown);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 16px;
    }

    .big-value {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: 56px;
      font-weight: 800;
      color: var(--deep-brown);
      letter-spacing: -0.03em;
      margin-bottom: 12px;
    }

    .big-change {
      font-size: 14px;
      font-weight: 600;
      color: var(--accent-green);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Progress Bar */
    .progress-section {
      margin-bottom: 32px;
    }

    .progress-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--dark-brown);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 16px;
    }

    .progress-bar-wrapper {
      background: var(--warm-beige);
      height: 48px;
      position: relative;
      overflow: hidden;
      display: flex;
    }

    .progress-segment {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: white;
      transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .progress-male {
      background: var(--dark-brown);
    }

    .progress-female {
      background: var(--medium-brown);
    }

    /* Age Chart */
    .age-chart {
      margin-bottom: 32px;
    }

    .age-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .age-label {
      width: 60px;
      font-size: 13px;
      font-weight: 600;
      color: var(--dark-brown);
    }

    .age-bar-bg {
      flex: 1;
      height: 32px;
      background: var(--warm-beige);
      position: relative;
      overflow: hidden;
    }

    .age-bar-fill {
      height: 100%;
      background: var(--dark-brown);
      transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .age-percent {
      width: 50px;
      text-align: right;
      font-size: 13px;
      font-weight: 700;
      color: var(--deep-brown);
    }

    /* Stats List */
    .stats-list {
      list-style: none;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid var(--warm-beige);
    }

    .stat-item:last-child {
      border-bottom: none;
    }

    .stat-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--dark-brown);
    }

    .stat-value {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--deep-brown);
    }

    /* Full Width Sections */
    .section {
      margin-bottom: 60px;
      animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }

    .section:nth-child(3) { animation-delay: 0.3s; }
    .section:nth-child(4) { animation-delay: 0.4s; }

    .section-header {
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--warm-beige);
    }

    .section-title {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--dark-brown);
      letter-spacing: -0.01em;
    }

    /* Chart */
    .chart-box {
      background: white;
      border: 1px solid var(--warm-beige);
      padding: 48px 40px;
      height: 400px;
    }

    /* Insights List */
    .insights {
      background: white;
      border: 1px solid var(--warm-beige);
      padding: 40px;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .insight {
      padding: 24px 0 24px 40px;
      border-left: 2px solid var(--warm-beige);
      color: var(--dark-brown);
      font-size: 15px;
      line-height: 1.85;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .insight::before {
      content: '';
      position: absolute;
      left: -2px;
      top: 0;
      width: 2px;
      height: 0;
      background: var(--deep-brown);
      transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .insight:hover {
      padding-left: 48px;
      color: var(--deep-brown);
    }

    .insight:hover::before {
      height: 100%;
    }

    .empty {
      text-align: center;
      padding: 80px 40px;
      color: var(--medium-brown);
      font-size: 13px;
      font-style: italic;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .main-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 44px 24px 72px;
      }

      .header {
        flex-direction: column;
        gap: 36px;
        margin-bottom: 56px;
      }

      .logo-container {
        gap: 20px;
      }

      .wordmark {
        font-size: 28px;
      }

      .page-title {
        font-size: 24px;
      }

      .big-value {
        font-size: 44px;
      }

      .card {
        padding: 32px 28px;
      }

      .section {
        margin-bottom: 48px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    
    <div class="header">
      <div class="brand">
        <div class="logo-container">
          <div class="logo-symbol">
            <svg viewBox="0 0 90 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="rGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#5d4a3a;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#3a2f23;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="vGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#8b7355;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#5d4a3a;stop-opacity:1" />
                </linearGradient>
                <filter id="letterShadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
                  <feOffset dx="0" dy="2" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.25"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#letterShadow)" transform="translate(30, 0)">
                <path d="M2 12 L14 12 L24 52 L12 52 Z" fill="url(#vGrad)"/>
                <path d="M26 12 L38 12 L28 52 L16 52 Z" fill="url(#vGrad)"/>
                <path d="M2 12 L14 12 L14 16 L6 16 Z" fill="#8b7355" opacity="0.3"/>
              </g>
              <g filter="url(#letterShadow)">
                <path d="M6 12 L6 52 L16 52 L16 36 L24 36 L32 52 L44 52 L34 34 C39 32 42 28 42 20 C42 10 36 12 26 12 Z M16 22 L26 22 C30 22 32 23 32 26 C32 29 30 30 26 30 L16 30 Z" fill="url(#rGrad)"/>
                <path d="M16 22 L26 22 C28 22 29 22.5 29 23.5 L16 23.5 Z" fill="#8b7355" opacity="0.35"/>
              </g>
              <line x1="6" y1="56" x2="78" y2="56" stroke="#e8e3db" stroke-width="1.5" opacity="0.4"/>
            </svg>
          </div>
          <div class="logo-text">
            <div class="wordmark">REVRUN</div>
            <div class="tagline">ADVERTISING ANALYTICS</div>
          </div>
          <div class="divider"></div>
          <h1 class="page-title" id="clientName">성과 리포트</h1>
        </div>
        <div class="meta-row">
          <span class="period" id="period">최근 7일</span>
          <span class="date" id="date"></span>
        </div>
      </div>
      <div class="header-actions">
        <span class="user-name" id="userName"></span>
        <button class="btn-logout" id="logoutBtn">로그아웃</button>
      </div>
    </div>

    <!-- 2열 그리드 -->
    <div class="main-grid">
      
      <!-- 왼쪽: 광고 수익 -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">광고 수익</h2>
        </div>

        <div class="big-metric">
          <div class="big-label">총 수익</div>
          <div class="big-value" id="mainMetric">-</div>
          <div class="big-change">▲ 전월 대비 증가</div>
        </div>

        <ul class="stats-list" id="leftStats"></ul>
      </div>

      <!-- 오른쪽: 고객 분석 -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">고객 분석</h2>
        </div>

        <div class="progress-section">
          <div class="progress-label">남녀 비율</div>
          <div class="progress-bar-wrapper" id="genderBar">
            <div class="progress-segment progress-male" style="width: 50%">남성 50%</div>
            <div class="progress-segment progress-female" style="width: 50%">여성 50%</div>
          </div>
        </div>

        <div class="age-chart">
          <div class="progress-label">연령대별</div>
          <div id="ageChart"></div>
        </div>
      </div>

    </div>

    <!-- 전체 너비: 그래프 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">일별 추이</h2>
      </div>
      <div class="chart-box">
        <canvas id="kpiChart"></canvas>
      </div>
    </div>

    <!-- 전체 너비: 잘된 점 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">잘된 점</h2>
      </div>
      <ul class="insights" id="highlights"></ul>
    </div>

    <!-- 전체 너비: 개선할 점 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">개선할 점</h2>
      </div>
      <ul class="insights" id="actions"></ul>
    </div>

  </div>

  <script>
    async function api(path, opts = {}) {
      const res = await fetch(path, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...opts
      });
      return res.json();
    }

    function renderMainMetric(kpis) {
      const mainEl = document.getElementById('mainMetric');
      if (kpis && kpis.length > 0) {
        mainEl.textContent = kpis[0].value || '-';
      }
    }

    function renderLeftStats(kpis) {
      const statsEl = document.getElementById('leftStats');
      if (!kpis || kpis.length <= 1) return;
      
      const stats = kpis.slice(1, 5);
      statsEl.innerHTML = stats.map(k => `
        <li class="stat-item">
          <span class="stat-label">${k.label || '-'}</span>
          <span class="stat-value">${k.value || '-'}</span>
        </li>
      `).join('');
    }

    function renderGenderBar() {
      const male = 76;
      const female = 24;
      
      document.getElementById('genderBar').innerHTML = `
        <div class="progress-segment progress-male" style="width: ${male}%">남성 ${male}%</div>
        <div class="progress-segment progress-female" style="width: ${female}%">여성 ${female}%</div>
      `;
    }

    function renderAgeChart() {
      const ages = [
        { label: '18-24세', percent: 4 },
        { label: '25-34세', percent: 55 },
        { label: '35-44세', percent: 30 },
        { label: '45-54세', percent: 11 }
      ];

      const html = ages.map(age => `
        <div class="age-row">
          <div class="age-label">${age.label}</div>
          <div class="age-bar-bg">
            <div class="age-bar-fill" style="width: ${age.percent}%"></div>
          </div>
          <div class="age-percent">${age.percent}%</div>
        </div>
      `).join('');

      document.getElementById('ageChart').innerHTML = html;
    }

    function renderList(id, items) {
      const el = document.getElementById(id);
      if (!items || items.length === 0) {
        el.innerHTML = '<div class="empty">데이터가 없습니다</div>';
        return;
      }
      el.innerHTML = items.map(item => `<li class="insight">${item}</li>`).join('');
    }

    let chart;
    function renderChart(kpis) {
      const ctx = document.getElementById("kpiChart");
      if (chart) chart.destroy();

      const labels = (kpis || []).map(k => k.label);
      const values = (kpis || []).map(k => {
        const num = String(k.value).replace(/[^0-9.]/g, '');
        return parseFloat(num) || 0;
      });

      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "",
            data: values,
            borderColor: "#3a2f23",
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "#3a2f23",
            pointHoverBorderColor: "#faf8f5",
            pointHoverBorderWidth: 3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "#e8e3db",
                drawBorder: false,
              },
              ticks: { 
                color: "#8b7355",
                font: { family: 'Manrope', weight: '600', size: 11 },
                padding: 10
              }
            },
            x: {
              grid: { display: false },
              ticks: { 
                color: "#8b7355",
                font: { family: 'Manrope', weight: '600', size: 11 },
                padding: 10
              }
            }
          }
        }
      });
    }

    async function boot() {
      const me = await api("/api/me");
      if (!me?.user) {
        location.href = "/report/login.html";
        return;
      }
      document.getElementById("userName").textContent = me.user.username;

      const data = await api("/api/report");
      if (!data.ok) {
        document.getElementById("clientName").textContent = "로드 실패";
        return;
      }

      const r = data.report || {};
      document.getElementById("clientName").textContent = r.clientName || '고객 리포트';
      document.getElementById("period").textContent = r.period || '최근 7일';
      
      if (r._meta?.created_at) {
        const d = new Date(r._meta.created_at);
        document.getElementById("date").textContent = 
          `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 업데이트`;
      }

      renderMainMetric(r.kpis || []);
      renderLeftStats(r.kpis || []);
      renderGenderBar();
      renderAgeChart();
      renderChart(r.kpis || []);
      renderList("highlights", r.highlights || []);
      renderList("actions", r.actions || []);
    }

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await api("/api/logout", { method: "POST" });
      location.href = "/report/login.html";
    });

    boot();
  </script>
</body>
</html>