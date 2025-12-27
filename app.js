// --- CONFIGURATION ---
const PASSWORD_CONFIG = "admin"; 

// Données du Portefeuille (Ton contenu original)
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

const commos = [
    { id: 'HG=F', name: 'Cuivre' }, 
    { id: 'GC=F', name: 'Or' },     
    { id: 'CL=F', name: 'Pétrole' },
    { id: 'SI=F', name: 'Argent' }  
];

// --- LOGIN LOGIC ---
function checkLogin() {
    const input = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('loginError');

    if (input.value === PASSWORD_CONFIG) {
        document.getElementById('login-screen').style.transition = 'opacity 0.6s ease';
        document.getElementById('login-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            initApp();
        }, 600);
    } else {
        errorMsg.classList.remove('hidden');
        input.value = '';
    }
}

// --- NAVIGATION ---
function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Gérer les boutons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + id);
    if(activeBtn) activeBtn.classList.add('active');

    // Trigger spécifique par page
    if(id === 'simulation') calculateSim();
    if(id === 'watchlist') updateWatchlist();
    if(id === 'commodities') fetchCommodities();
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

// --- FEATURES ---

// 1. Dashboard Portefeuille
async function updatePortfolio() {
    let totalVal = 0;
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    for (let stock of portfolio) {
        const data = await fetchPriceRobust(stock.tick);
        if (data) {
            stock.price = data.price;
            stock.prev = data.prev;
        }
        
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
    const data = portfolio.map(s => s.price * s.q);
    const labels = portfolio.map(s => s.sec);
    
    window.mySectorChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#64748b'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', usePointStyle: true } } } }
    });
}

// 2. Watchlist
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

// 3. Search Engine
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
            data: {
                labels: data.timestamps.map(t => new Date(t*1000).getHours()+'h'),
                datasets: [{ 
                    data: data.quotes, 
                    borderColor: perf >= 0 ? '#10b981' : '#ef4444', 
                    backgroundColor: perf >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    fill: true, pointRadius: 0, tension: 0.3 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display: false} }, scales: { x: {display: false}, y: {grid: {color: '#333'}} } }
        });
    }
}

// 4. Commodities Page (NEW)
async function fetchCommodities() {
    for(let c of commos) {
        const data = await fetchPriceRobust(c.id);
        if(data) {
            const elP = document.getElementById(`price-${c.id}`);
            const elV = document.getElementById(`var-${c.id}`);
            if(elP && elV) {
                const vari = ((data.price - data.prev)/data.prev)*100;
                elP.innerText = data.price.toLocaleString();
                elV.innerText = (vari>0?'+':'') + vari.toFixed(2) + '%';
                elV.className = `text-xs font-bold mt-1 ${vari>=0 ? 'text-green-400' : 'text-red-400'}`;
            }
        }
    }
    // Graph comparatif Cuivre vs Or
    const cu = await fetchPriceRobust('HG=F');
    const au = await fetchPriceRobust('GC=F');
    if(cu && au) {
        const ctx = document.getElementById('commoditiesChart').getContext('2d');
        if(window.commoChart) window.commoChart.destroy();
        
        // Normalisation simple base 0
        const norm = (arr) => { const start = arr.find(v=>v) || 1; return arr.map(v => v ? (v/start-1)*100 : null); }
        
        window.commoChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: cu.timestamps.map(t => new Date(t*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})),
                datasets: [
                    { label: 'Cuivre %', data: norm(cu.quotes), borderColor: '#f97316', borderWidth: 2, pointRadius: 0 },
                    { label: 'Or %', data: norm(au.quotes), borderColor: '#fbbf24', borderWidth: 2, pointRadius: 0 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, interaction: {mode:'index', intersect:false}, scales: {x:{display:false}, y:{grid:{color:'#333'}}}, plugins: {legend:{labels:{color:'white'}}} }
        });
    }
}

// 5. Simulation
let simChart = null;
function calculateSim() {
    const start = parseFloat(document.getElementById('sim-start').value);
    const monthly = parseFloat(document.getElementById('sim-monthly').value);
    const years = 20; const rate = 0.08;
    
    let labels = [], data = [], capital = start;
    for(let i=0; i<=years; i++) {
        labels.push("An " + i);
        data.push(capital);
        if(i<years) { for(let m=0; m<12; m++) { capital += monthly; capital *= (1+rate/12); } }
    }
    
    document.getElementById('sim-result').innerText = Math.round(data[data.length-1]).toLocaleString() + " €";
    
    const ctx = document.getElementById('simChart').getContext('2d');
    if(simChart) simChart.destroy();
    simChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Patrimoine', data, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', fill: true }] },
        options: { responsive: true, maintainAspectRatio: false, scales: {y:{grid:{color:'#333'}}}, plugins: {legend:{display:false}} }
    });
}

function initApp() {
    // Lance les processus de fond une fois connecté
    updatePortfolio();
    setInterval(updatePortfolio, 60000);
}
