# Samsa Project Structure

This document describes the reorganized project structure for the Samsa Prediction Markets application.

## Directory Structure

```
Samsa/
├── backend/                    # Backend server and API
│   ├── server.js              # Main Express server
│   ├── server.py              # Python server (alternative)
│   ├── .env                   # Environment variables
│   ├── engine/                # Rust prediction engine
│   ├── lib/                   # Backend utilities and database
│   │   ├── datastore.js       # Data storage utilities
│   │   ├── database/          # Database models and schema
│   │   ├── lmsr.py           # LMSR pricing algorithm
│   │   └── ...
│   ├── providers/             # External API providers
│   ├── data/                  # JSON data files
│   │   ├── markets.json
│   │   ├── users.json
│   │   └── ...
│
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MarketCard.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ExplorePage.jsx
│   │   │   ├── NewsPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── hooks/             # Custom React hooks
│   │   ├── api/               # API client
│   │   ├── store/             # State management
│   │   └── lib/               # Frontend utilities
│   ├── public/                # Static assets
│   │   ├── Logo.png
│   │   └── Logo-Title.png
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── docs/                      # Documentation
│   ├── README.md
│   ├── BACKEND_ROADMAP.md
│   ├── BACKEND_SETUP.md
│   └── DATABASE_SETUP_INSTRUCTIONS.md
│
├── archive/                   # Archived old versions
│   ├── original-html/         # Original HTML/CSS/JS version
│   ├── web-old/               # Old web version
│   └── mobile/                # React Native mobile app
│
├── scripts/                   # Build and deployment scripts
├── tests/                     # Test files
├── package.json               # Root package.json (monorepo)
├── .gitignore
└── PROJECT_STRUCTURE.md       # This file
```

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Sequelize ORM)
- **Authentication**: Supabase
- **Payments**: Stripe
- **Prediction Engine**: Rust (LMSR algorithm)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State**: React Hooks + Context API

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (for production)
- Rust (for building the prediction engine)

### Installation

1. **Install dependencies**:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies (if needed separately)
   cd ../backend
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `backend/.env`
   - Configure Supabase, Stripe, and database credentials

3. **Build the frontend**:
   ```bash
   npm run build
   ```

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Frontend only (Vite dev server on port 5173)
npm run frontend:dev

# Backend only (Express server on port 3001)
npm run backend:dev
```

### Production

Build and start the production server:
```bash
npm run start:prod
```

This will:
1. Build the frontend (creates `frontend/dist/`)
2. Start the backend server (serves the built frontend)

## Available Scripts

From the root directory:

- `npm run dev` - Run both frontend and backend in development mode
- `npm run build` - Build the frontend for production
- `npm run start` - Start the backend server
- `npm run start:prod` - Build frontend and start production server
- `npm run frontend:dev` - Run frontend dev server only
- `npm run frontend:build` - Build frontend only
- `npm run backend:dev` - Run backend dev server only
- `npm run backend:start` - Start backend server only
- `npm run test` - Run tests
- `npm run build:engine` - Build the Rust prediction engine

## Key Changes from Previous Structure

1. **Separated concerns**: Backend and frontend are now in separate directories
2. **Archived old versions**: Original HTML, old web, and mobile versions moved to `archive/`
3. **Centralized documentation**: All `.md` files moved to `docs/`
4. **Cleaner root**: Root directory now only contains configuration and organizational files
5. **Monorepo structure**: Single root `package.json` with scripts to manage both frontend and backend

## Notes

- The backend serves the built frontend from `frontend/dist/`
- Logo files are stored in `frontend/public/`
- The Rust prediction engine is in `backend/engine/`
- All data files (JSON) are in `backend/data/`
- Database models and schema are in `backend/lib/database/`

## Migration from Old Structure

If you have old references to paths, update them as follows:
- `web-react/` → `frontend/`
- `lib/` → `backend/lib/`
- `engine/` → `backend/engine/`
- `data/` → `backend/data/`
- `server.js` → `backend/server.js`
