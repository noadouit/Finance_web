from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
# Ceci permet à ton fichier HTML de discuter avec ce script Python
CORS(app)

@app.route('/api/quote')
def get_quote():
    # On récupère le ticker envoyé par le site (ex: AI.PA)
    symbol = request.args.get('symbol')
    if not symbol:
        return jsonify({"error": "No symbol"}), 400
    
    try:
        # On interroge Yahoo Finance proprement
        ticker = yf.Ticker(symbol)
        
        # On récupère les infos fast_info (plus rapide et fiable)
        # Si fast_info manque, on tente history
        price = 0
        prev_close = 0
        try:
            price = ticker.fast_info['last_price']
            prev_close = ticker.fast_info['previous_close']
        except:
            # Plan B si fast_info bug
            hist = ticker.history(period="1d")
            if not hist.empty:
                price = hist['Close'].iloc[-1]
                prev_close = price # Pas idéal mais évite le crash
        
        info = ticker.info
        
        # On construit la réponse propre pour ton site
        data = {
            "symbol": symbol,
            "shortName": info.get('shortName', symbol),
            "currency": info.get('currency', 'EUR'),
            "exchange": info.get('exchange', 'Market'),
            "regularMarketPrice": price,
            "previousClose": prev_close,
            "open": ticker.fast_info.get('open', 0),
            "dayHigh": ticker.fast_info.get('day_high', 0),
            "dayLow": ticker.fast_info.get('day_low', 0),
            "volume": info.get('volume', 0),
            "marketCap": info.get('marketCap', 0),
            # Indicateurs
            "trailingPE": info.get('trailingPE', 0),
            "beta": info.get('beta', 1)
        }
        return jsonify(data)

    except Exception as e:
        print(f"Erreur sur {symbol}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Moteur Noa Capital démarré !")
    print("Laisse cette fenêtre ouverte et lance ton fichier index.html")
    app.run(debug=True, port=5000)
