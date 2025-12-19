# 🦋 Samsa Prediction Markets

A modern prediction markets platform where users can trade on the outcomes of real-world events across politics, sports, technology, finance, and more.

![Samsa Logo](Logo-Title.png)

## ✨ Features

### 📊 Markets
- **Browse Markets** - Explore prediction markets across multiple categories
- **Trending Slideshow** - Featured markets with live probability charts
- **Category Filtering** - Filter by Politics, Sports, Crypto, Technology, Finance, Entertainment, Climate, Science, and more
- **Search** - Find markets by keywords

### 💹 Trading
- **LMSR Pricing** - Logarithmic Market Scoring Rule for fair, automated market making
- **Binary & Multi-Outcome** - Support for Yes/No markets and multiple choice markets
- **Real-time Odds** - Prices update based on trading activity
- **Rebated Risk Model** - Partial refunds on losing trades based on odds at time of trade

### 👤 Dashboard
- **Portfolio Overview** - Track your positions and performance
- **Buying Power** - Manage your wallet balance
- **Watchlist** - Save markets to follow
- **Recent Activity** - View your trading history

### 🎯 Interests
- **Follow Topics** - Subscribe to categories and topics you care about
- **Personalized Feed** - Get market recommendations based on your interests
- **Sports Leagues** - Detailed pages for major sports leagues (NBA, NFL, Premier League, etc.)

### 🔔 Notifications
- Slide-out notification panel
- Trade confirmations and market updates
- Resolution alerts

## 🚀 Quick Start

### Option 1: One-Click Start (Windows)
Simply double-click `start-samsa.bat` to:
- Install dependencies automatically
- Start the API server
- Open the app in your browser

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

### Option 3: Static Mode (No Backend)
Open `index.html` using a local web server (like VS Code Live Server). Markets will load from local JSON files.

## 📁 Project Structure

```
samsa/
├── index.html              # Main HTML file
├── server.js               # Express.js API server
├── start-samsa.bat         # Windows startup script
├── package.json            # Node.js dependencies
│
├── js/
│   ├── samsa-core.js       # Core configuration & state
│   ├── core/
│   │   ├── app.js          # App initialization
│   │   └── lmsr-engine.js  # LMSR pricing engine
│   ├── features/
│   │   ├── markets/        # Markets listing & detail views
│   │   ├── trading/        # Prediction/trading forms
│   │   ├── portfolio/      # Dashboard & portfolio
│   │   ├── interests/      # Interests & categories
│   │   ├── navigation/     # View navigation
│   │   └── wallet/         # Deposit/withdraw
│   └── utils/
│       └── icons.js        # Icon utilities
│
├── css/
│   └── styles.css          # Custom styles
│
├── data/
│   ├── markets.json        # Market data
│   ├── predictions.json    # User predictions
│   ├── users.json          # User accounts
│   └── transactions.json   # Wallet transactions
│
├── lib/
│   ├── datastore.js        # JSON file read/write
│   └── lmsr.py             # Python LMSR implementation
│
└── Entities/               # Data schemas
    ├── Market.json
    ├── Prediction.json
    └── ...
```

## 🔌 API Endpoints

### Markets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/markets` | List all markets |
| GET | `/api/markets/:id` | Get market details |
| POST | `/api/markets` | Create new market |
| GET | `/api/markets/trending` | Get trending markets |
| GET | `/api/markets/category/:category` | Filter by category |
| POST | `/api/markets/:id/resolve` | Resolve a market |

### Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/predictions` | List predictions |
| POST | `/api/predictions` | Place a prediction |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id/balance` | Get user balance |
| POST | `/api/users/:id/deposit` | Deposit funds |
| POST | `/api/users/:id/withdraw` | Withdraw funds |
| GET | `/api/users/:id/transactions` | Transaction history |

## 🎨 Tech Stack

- **Frontend**: Vanilla JavaScript, Tailwind CSS, HTML5
- **Backend**: Node.js, Express.js
- **Data**: JSON file storage
- **Pricing**: LMSR (Logarithmic Market Scoring Rule)

## 📈 Market Categories

| Category | Icon | Description |
|----------|------|-------------|
| Politics | 🏛️ | Elections, legislation, government |
| Sports | ⚽ | Championships, games, tournaments |
| Crypto | ₿ | Bitcoin, Ethereum, crypto prices |
| Technology | 💻 | AI, product launches, tech companies |
| Finance | 📈 | Markets, interest rates, economy |
| Entertainment | 🎬 | Awards, movies, music |
| Climate | 🌡️ | Climate events, temperature records |
| Science | 🔬 | Space, discoveries, research |
| International | 🌍 | Global events, treaties, conflicts |

## 🧮 How LMSR Works

Samsa uses the **Logarithmic Market Scoring Rule (LMSR)** for automated market making:

- Prices between 0¢ and 100¢ represent probability estimates
- Buying shares increases the price; selling decreases it
- **If you win**: Profit = Stake × (1 - probability) - 1% fee
- **If you lose**: Refund = Stake × probability (rebated risk)

This ensures you never lose your entire stake—you always get back a portion based on the odds.

## 📄 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Samsa** - *Trade on what you believe* 🦋

