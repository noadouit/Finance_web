// ... (Tout le code précédent reste identique) ...

// --- NEWS TICKER LOGIC (NOUVEAU) ---
function startNewsTicker() {
    const tickerContainer = document.getElementById('news-ticker-content');
    if (!tickerContainer) return;

    // Liste des news "Fake" mais réalistes
    const newsItems = [
        { text: "BREAKING: LA BCE MAINTIENT SES TAUX À 4.5% - L'INFLATION RESTE LA PRIORITÉ", type: "neutral" },
        { text: "ALERT: LE CUIVRE TOUCHE UN PLUS HAUT DE 52 SEMAINES SUR DÉFICIT D'OFFRE", type: "up" },
        { text: "MARKET: LE NASDAQ RECULE DE 1.2% ALORS QUE LES RENDEMENTS OBLIGATAIRES MONTENT", type: "down" },
        { text: "ENERGY: TOTALENERGIES LANCE UN NOUVEAU PROJET LNG AU QATAR", type: "up" },
        { text: "MACRO: L'INDE DÉPASSE LE JAPON EN PIB NOMINAL (ESTIMATION FMI)", type: "neutral" },
        { text: "METAL: RIO TINTO PRÉVOIT UNE PÉNURIE DE MINERAI DE FER POUR 2026", type: "up" },
        { text: "TECH: NVIDIA ANNONCE UNE NOUVELLE PUCE IA, LE TITRE PREND 3%", type: "up" },
        { text: "FOREX: L'EURO FAIBLIT FACE AU DOLLAR (1.08) SUITE AUX CHIFFRES ALLEMANDS", type: "down" }
    ];

    let htmlContent = "";
    
    // On génère le HTML
    newsItems.forEach(item => {
        // On génère une heure réaliste (heure actuelle - quelques minutes)
        const now = new Date();
        const mins = Math.floor(Math.random() * 59);
        const timeStr = `${now.getHours()}:${mins < 10 ? '0'+mins : mins}`;
        
        let colorClass = "text-gray-400";
        if (item.type === "up") colorClass = "ticker-up";
        if (item.type === "down") colorClass = "ticker-down";

        htmlContent += `
            <div class="ticker-item">
                <span class="text-gray-600 mr-2">[${timeStr}]</span>
                <span class="${colorClass}">${item.text}</span>
            </div>
        `;
    });

    // On injecte
    tickerContainer.innerHTML = htmlContent;
}

// MODIFIE LA FONCTION INITAPP POUR LANCER LE TICKER
function initApp() {
    updatePortfolio();
    setInterval(updatePortfolio, 60000);
    startNewsTicker(); // <--- AJOUTE ÇA
}
