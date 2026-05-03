# Samsa Data Flow Architecture

## Overview
The application is fully data-driven, with no hardcoded market data in the frontend.

## Data Flow

```
Backend Data Source (markets.json)
         ↓
Backend API Server (Express on port 3001)
         ↓
API Endpoints (/api/markets, /api/markets/:id, etc.)
         ↓
Frontend API Client (api/client.js)
         ↓
React Hooks (useMarkets, useMarket)
         ↓
React Components (MarketCard, ExplorePage, etc.)
```

## Components

### Backend
- **Data Source**: `backend/data/markets.json`
- **Server**: `backend/server.js` (Express on port 3001)
- **API Endpoints**:
  - `GET /api/markets` - Get all markets
  - `GET /api/markets/:id` - Get single market
  - `GET /api/markets/trending` - Get trending markets
  - `GET /api/markets/current-events` - Get current event markets
  - `GET /api/markets/category/:category` - Get markets by category
  - `POST /api/markets` - Create new market
  - `POST /api/markets/:id/resolve` - Resolve market

### Frontend
- **API Client**: `frontend/src/api/client.js`
  - Centralized API communication
  - Base URL: `/api` (proxied to `http://localhost:3001` in dev)
  
- **React Hooks**: `frontend/src/hooks/useMarkets.js`
  - `useMarkets()` - Fetches all markets from API
  - `useMarket(id)` - Fetches single market by ID
  
- **Components**:
  - `MarketCard` - Displays individual market (data-driven)
  - `ExplorePage` - Lists all markets (data-driven)
  - All market data comes from API, no hardcoded values

### Development Proxy
- **Vite Config**: `frontend/vite.config.js`
  - Proxies `/api` requests to `http://localhost:3001`
  - Enables seamless frontend-backend communication in dev

## Data Structure

Markets are stored in `backend/data/markets.json` with the following structure:

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "status": "active|resolved",
  "close_date": "ISO8601 date",
  "outcomes": [
    {
      "id": "string",
      "title": "string",
      "probability": "number (0-100)",
      "total_stake": "number"
    }
  ],
  "total_volume": "number",
  "winning_outcome_id": "string|null"
}
```

## Adding New Markets

To add new markets, update `backend/data/markets.json`. The changes will be immediately available through the API without any code changes.

## Production Deployment

In production:
1. Backend serves the built React app from `frontend/dist`
2. API requests go directly to the backend server
3. No proxy needed - all requests are same-origin
