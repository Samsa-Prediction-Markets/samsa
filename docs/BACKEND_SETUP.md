# Backend Setup Guide
## Quick Start for Backend Development

### Prerequisites

1. **Install PostgreSQL** (if not installed):
   ```bash
   # Mac (using Homebrew)
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from: https://www.postgresql.org/download/windows/
   ```

2. **Create Database**:
   ```bash
   # Create development database
   createdb samsa_dev
   
   # Or using psql
   psql postgres
   CREATE DATABASE samsa_dev;
   \q
   ```

3. **Install Dependencies**:
   ```bash
   npm install pg sequelize
   npm install --save-dev sequelize-cli
   ```

### Step 1: Set Up Database

1. **Run Schema** (creates all tables):
   ```bash
   psql samsa_dev < lib/database/schema.sql
   ```

2. **Verify Tables**:
   ```bash
   psql samsa_dev
   \dt  # List all tables
   \d markets  # Describe markets table
   ```

### Step 2: Create Environment File

Create `.env` file in project root:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://localhost:5432/samsa_dev
LOG_LEVEL=debug
```

**For Mac with default PostgreSQL**:
```env
DATABASE_URL=postgresql://$(whoami)@localhost:5432/samsa_dev
```

### Step 3: Test Connection

Create `test-db-connection.js`:
```javascript
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/samsa_dev'
});

async function testConnection() {
  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ Database connected:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection error:', err);
  }
}

testConnection();
```

Run: `node test-db-connection.js`

### Step 4: Start Development

1. **Current Setup** (JSON files) still works:
   ```bash
   npm start
   ```

2. **Next Steps**:
   - Follow `BACKEND_ROADMAP.md` for detailed implementation
   - Start with Phase 1: Database models
   - Test each endpoint as you migrate

### Common Issues

**Problem**: `connection refused on port 5432`  
**Solution**: PostgreSQL isn't running
```bash
# Mac
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

**Problem**: `role does not exist`  
**Solution**: Create PostgreSQL user
```bash
createuser -s $(whoami)
```

**Problem**: `database does not exist`  
**Solution**:
```bash
createdb samsa_dev
```

### Development Workflow

1. **Work on a feature** (e.g., database migration)
2. **Test locally** with development database
3. **Commit changes** to your branch
4. **Push** to GitHub
5. **Create PR** when ready for review

### Useful Commands

```bash
# Check PostgreSQL status
brew services list | grep postgresql  # Mac
systemctl status postgresql  # Linux

# Access PostgreSQL console
psql samsa_dev

# Backup database
pg_dump samsa_dev > backup.sql

# Restore database
psql samsa_dev < backup.sql

# Drop and recreate (WARNING: loses all data)
dropdb samsa_dev && createdb samsa_dev
psql samsa_dev < lib/database/schema.sql
```

### Next Steps

📖 Read `BACKEND_ROADMAP.md` for complete implementation plan  
🔧 Start with Phase 1: Database Setup & Migration  
✅ Check off tasks as you complete them  
💬 Ask questions in team channel

Good luck! 🚀

