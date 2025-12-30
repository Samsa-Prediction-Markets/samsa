# Database Setup Instructions

## What We Just Built

Phase 1 is now complete! Here's what was created:

### Files Created:
1. **lib/database/connection.js** - Database connection handler
2. **lib/database/models/** - 5 model files (Market, Outcome, Prediction, User, Transaction)
3. **lib/database/models/index.js** - Exports all models with relationships
4. **scripts/migrate-json-to-db.js** - Migration script from JSON to PostgreSQL
5. **lib/database/schema.sql** - SQL schema (already existed)

### Package.json Updates:
- Added dependencies: `pg`, `sequelize`, `dotenv`
- Added scripts: `npm run migrate`, `npm run db:init`

---

## How to Use This (Step by Step)

### Step 1: Install Dependencies

```bash
npm install
```

This installs PostgreSQL client (`pg`), Sequelize ORM, and dotenv.

---

### Step 2: Install PostgreSQL

**Mac (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

---

### Step 3: Create Database

```bash
# Create database
createdb samsa_dev

# Verify it was created
psql -l | grep samsa
```

---

### Step 4: Create .env File

Create a file named `.env` in the project root:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://localhost:5432/samsa_dev
LOG_LEVEL=debug
```

**Note**: Replace `localhost` with your PostgreSQL host if different.

---

### Step 5: Run Migration

This copies all data from JSON files to PostgreSQL:

```bash
npm run migrate
```

You should see:
```
🚀 Starting migration from JSON to PostgreSQL...
📋 Step 1: Creating database tables...
✅ Tables created
👥 Step 2: Migrating users...
✅ Migrated X users
📊 Step 3: Migrating markets and outcomes...
✅ Migrated X markets
...
✅ Migration completed successfully!
```

---

### Step 6: Verify Data

```bash
psql samsa_dev

# Check tables
\dt

# Count markets
SELECT COUNT(*) FROM markets;

# View markets
SELECT id, title, category, status FROM markets LIMIT 5;

# Exit
\q
```

---

## What Changed in the App?

**Currently**: NOTHING! The app still uses JSON files.

**Next Step**: Update `server.js` to use the database instead of JSON files.

---

## Testing the Connection

Create a test file `test-db.js`:

```javascript
const { sequelize, Market } = require('./lib/database/models');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    const markets = await Market.findAll({ limit: 3 });
    console.log(`✅ Found ${markets.length} markets`);
    markets.forEach(m => console.log(`  - ${m.title}`));
    
    await sequelize.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
```

Run: `node test-db.js`

---

## Common Issues

### "Connection refused"
PostgreSQL isn't running. Start it:
```bash
brew services start postgresql@15  # Mac
sudo systemctl start postgresql    # Linux
```

### "Database does not exist"
Create it:
```bash
createdb samsa_dev
```

### "Role does not exist"
Create PostgreSQL user:
```bash
createuser -s $(whoami)
```

---

## Next Steps (Phase 2)

Now that data is in PostgreSQL, we need to:
1. Update `server.js` to read from database instead of JSON
2. Add transaction support for atomic operations
3. Add proper error handling
4. Test all endpoints

See `BACKEND_ROADMAP.md` for details!

