// app.js
const PASSWORD_CONFIG = "admin"; 

// Données
let portfolio = [
    { tick: "AI.PA",  name: "Air Liquide",        sec: "Chimie",     q: 20, pru: 171.18, div: 0.019, eps: 5.90, sps: 53.5 },
    { tick: "SU.PA",  name: "Schneider Electric", sec: "Industrie",  q: 10, pru: 236.99, div: 0.015, eps: 7.50, sps: 63.0 },
    { tick: "TTE.PA", name: "TotalEnergies",      sec: "Energie",    q: 38, pru: 56.97,  div: 0.052, eps: 8.00, sps: 70.0 },
    { tick: "AIR.PA", name: "Airbus",             sec: "Aéro.",      q: 5,  pru: 212.46, div: 0.012, eps: 4.90, sps: 88.0 },
    { tick: "SGO.PA", name: "Saint-Gobain",       sec: "Construct.", q: 7,  pru: 88.15,  div: 0.026, eps: 5.50, sps: 96.0 },
    { tick: "BRES.PA",name: "ETF Basic Res.",     sec: "Matériaux",  q: 6,  pru: 104.84, div: 0.0,   eps: 0,    sps: 0    },
];

let watchlist = [
    { tick: "CJ1.PA", name: "Amundi MSCI Japan", thesis: "Rebond Yen", price: 0, prev: 0 },
    { tick: "AEEM.PA", name: "Amundi Emerging", thesis: "Cycle Bas", price: 0, prev: 0 },
    { tick: "FCX", name: "Freeport-McMoRan", thesis: "Cuivre", price: 0, prev: 0 }
];

// --- 1. BOOT SEQUENCE ANIMATION ---
function startBootSequence() {
    const input = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('loginError');

    if (input.value !== PASSWORD_CONFIG) {
        errorMsg.classList.remove('hidden');
        input.value = '';
        return;
    }

    // Hide Login
    document.getElementById('login-screen').style.display = 'none';
    
    // Show Boot Overlay
    const bootOverlay = document.getElementById('boot-overlay');
    bootOverlay.classList.remove('hidden');
    
    // Logs Animation
    const logs = [
        "Initializing NC-Protocol v1.2.3...",
        "Connecting to secure gateway...",
        "Fetching market data feeds...",
        "Decrypting user profile...",
        "System Ready."
    ];
    
    const logContainer = document.getElementById('boot-log');
    let delay = 0;
    
    logs.forEach((log, index) => {
        setTimeout(() => {
            logContainer.innerHTML += `<div>> ${log}</div>`;
        }, delay);
        delay += 400; // Vitesse des logs
    });

    // Final Reveal
    setTimeout(() => {
        bootOverlay.classList.add('animate-boot-sequence');
        
        setTimeout(() => {
            bootOverlay.style.display = 'none';
            const app = document.getElementById('app-container');
            app.style.display = 'flex';
            app.classList.add('reveal-app');
            initApp();
        }, 2000); // Temps avant reveal final
    }, 2200);
}

// --- NAVIGATION ---
function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + id);
    if(activeBtn) activeBtn.classList.add('active');

    if(id === 'simulation') calculateSim();
    if(id === 'watchlist') updateWatchlist();
    if(id === 'convictions') renderThesisChart();
}

// --- CHARTS & LOGIC ---

// Graphique de Thèse (Statique pour illustrer le cycle)
function renderThesisChart() {
    const ctx = document.getElementById('thesisChart').getContext('2d');
    if(window.thesisChartInstance) window.thesisChartInstance.destroy();

    window.thesisChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2020', '2021', '2022', '2023', '2024', '2025 (Est.)'],
            datasets: [
                {
                    label: 'Tech (Nasdaq)',
                    data: [100, 140, 110, 150, 180, 170],
                    borderColor: '#ef4444', // Rouge
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Real Assets (Energy/Metals)',
                    data: [100, 110, 130, 125, 135, 190], // Cross over
                    borderColor: '#10b981', // Vert
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 4,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } },
            scales: { x: { display: true, grid: {display:false}, ticks: {color:'#666'} }, y: { display: false } }
        }
    });
}

// --- API ENGINE ---
async function fetchPriceRobust(ticker) {
    const proxy = "https://corsproxy.io/?";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d&t=${Date.now()}`;
    try {
        const response = await fetch(proxy + encodeURIComponent(url));
        if (!response.ok) throw new Error("HTTP Error");
        const json = await response.json();
        const res = json.chart.result[0];
        return {
            price: res.meta.regularMarketPrice,
            prev: res.meta.chartPreviousClose,
            meta: res.meta,
            quotes: res.indicators.quote[0].close,
            timestamps: res.timestamp
        };
    } catch (e) { console.error(e); return null; }
}

async function fetchFundamentalsQuote(ticker) {
    const proxy = "https://corsproxy.io/?";
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}&t=${Date.now()}`;
    try {
        const response = await fetch(proxy + encodeURIComponent(url));
        const json = await response.json();
        return json.quoteResponse.result[0];
    } catch(e) { return null; }
}

// --- FEATURES EXISTANTES ---
async function updatePortfolio() {
    let totalVal = 0;
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    for (let stock of portfolio) {
        const data = await fetchPriceRobust(stock.tick);
        if (data) { stock.price = data.price; stock.prev = data.prev; }
        
        const valo = stock.price * stock.q;
        totalVal += valo;
        const perf = ((stock.price - stock.pru) / stock.pru) * 100;
        
        tbody.innerHTML += `
            <tr class="hover:bg-white/5 transition border-b border-white/5">
                <td class="px-6 py-4"><div class="text-white font-bold">${stock.name}</div><div class="text-[10px] text-gray-500">${stock.tick}</div></td>
                <td class="px-6 py-4 text-right font-mono text-white">${stock.price.toFixed(2)} €</td>
                <td class="px-6 py-4 text-right font-mono font-bold ${perf >= 0 ? 'text-green-400' : 'text-red-400'}">${(perf>0?'+':'')+perf.toFixed(2)}%</td>
            </tr>
        `;
    }
    document.getElementById('totalVal').innerText = Math.round(totalVal).toLocaleString() + " €";
    renderSectorChart();
}

function renderSectorChart() {
    if(window.mySectorChart) window.mySectorChart.destroy();
    const ctx = document.getElementById('sectorChart').getContext('2d');
    window.mySectorChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: portfolio.map(s => s.sec), datasets: [{ data: portfolio.map(s => s.price * s.q), backgroundColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#64748b'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', usePointStyle: true } } } }
    });
}

async function updateWatchlist() {
    const tbody = document.getElementById('watchlistBody');
    tbody.innerHTML = '';
    for (let item of watchlist) {
        const data = await fetchPriceRobust(item.tick);
        const price = data ? data.price.toFixed(2) : "...";
        tbody.innerHTML += `
            <tr class="hover:bg-white/5 border-b border-white/5">
                <td class="px-6 py-4 font-bold text-white">${item.name} <span class="text-xs font-normal text-gray-500 block">${item.tick}</span></td>
                <td class="px-6 py-4 text-xs text-blue-300 italic">${item.thesis}</td>
                <td class="px-6 py-4 text-right font-mono text-white">${price}</td>
            </tr>
        `;
    }
}

let searchChartInstance = null;
async function searchTicker() {
    const t = document.getElementById('mainTickerInput').value.toUpperCase();
    if(!t) return;
    document.getElementById('searchLoader').style.display = 'block';
    document.getElementById('resultCard').classList.add('hidden');

    const data = await fetchPriceRobust(t);
    const fund = await fetchFundamentalsQuote(t);
    document.getElementById('searchLoader').style.display = 'none';

    if(data) {
        document.getElementById('resultCard').classList.remove('hidden');
        document.getElementById('res-name').innerText = t;
        document.getElementById('res-symbol').innerText = data.meta.symbol;
        document.getElementById('res-price').innerText = data.price.toFixed(2);
        
        const perf = ((data.price - data.prev)/data.prev)*100;
        document.getElementById('res-perf').innerText = (perf>0?'+':'') + perf.toFixed(2) + "%";
        document.getElementById('res-perf').className = `text-lg font-bold ${perf>=0 ? 'text-green-400' : 'text-red-400'}`;
        
        if(fund) {
            document.getElementById('res-pe').innerText = fund.trailingPE ? fund.trailingPE.toFixed(1) : "-";
            document.getElementById('res-cap').innerText = fund.marketCap ? (fund.marketCap/1000000000).toFixed(1)+"B" : "-";
            document.getElementById('res-vol').innerText = fund.regularMarketVolume ? (fund.regularMarketVolume/1000000).toFixed(1)+"M" : "-";
            document.getElementById('res-rating').innerText = fund.averageAnalystRating ? fund.averageAnalystRating.replace('-', ' ').toUpperCase() : "NEUTRE";
        }

        const ctx = document.getElementById('searchChart').getContext('2d');
        if(searchChartInstance) searchChartInstance.destroy();
        searchChartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: data.timestamps.map(t => new Date(t*1000).getHours()+'h'), datasets: [{ data: data.quotes, borderColor: perf >= 0 ? '#10b981' : '#ef4444', backgroundColor: perf >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', fill: true, pointRadius: 0, tension: 0.3 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display: false} }, scales: { x: {display: false}, y: {grid: {color: '#333'}} } }
        });
    }
}

function calculateSim() {
    const start = parseFloat(document.getElementById('sim-start').value);
    const monthly = parseFloat(document.getElementById('sim-monthly').value);
    const years = 20; const rate = 0.08;
    let labels = [], data = [], capital = start;
    for(let i=0; i<=years; i++) {
        labels.push("An " + i); data.push(capital);
        if(i<years) { for(let m=0; m<12; m++) { capital += monthly; capital *= (1+rate/12); } }
    }
    document.getElementById('sim-result').innerText = Math.round(data[data.length-1]).toLocaleString() + " €";
    const ctx = document.getElementById('simChart').getContext('2d');
    if(window.simChart) window.simChart.destroy();
    window.simChart = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Patrimoine', data, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', fill: true }] }, options: { responsive: true, maintainAspectRatio: false, scales: {y:{grid:{color:'#333'}}}, plugins: {legend:{display:false}} } });
}

function initApp() {
    updatePortfolio();
    setInterval(updatePortfolio, 60000);
}
