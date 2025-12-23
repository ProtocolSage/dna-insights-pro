# DNA ANALYSIS PLATFORM - QUICK START GUIDE

## ⚡ Installation (5 Minutes)

### Prerequisites Checklist

- [ ] **PostgreSQL 14+** installed
- [ ] **Python 3.10+** installed  
- [ ] **Node.js 18+** installed
- [ ] **Git** installed

---

## 📦 Step 1: Database Installation

### Option A: PostgreSQL Already Installed

```bash
# Create database
createdb dna_analysis_platform

# Install schema
cd database/schema
psql -d dna_analysis_platform -f install_database.sql
```

### Option B: Install PostgreSQL First

**Windows:**
1. Download: https://www.postgresql.org/download/windows/
2. Run installer (default settings are fine)
3. Remember your password for user `postgres`
4. After install, run commands from Option A above

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb dna_analysis_platform
cd database/schema
psql -d dna_analysis_platform -f install_database.sql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql-14
sudo -u postgres createdb dna_analysis_platform
cd database/schema
sudo -u postgres psql -d dna_analysis_platform -f install_database.sql
```

---

## 🐍 Step 2: Python Validation Pipeline

```bash
# Navigate to validation directory
cd validation

# Install dependencies
pip install -r requirements.txt

# Configure database connection
# Edit config/database.ini with your credentials

# Run validation
python pipelines/validate_all.py
```

---

## 🌐 Step 3: TypeScript/React Frontend (Optional)

```bash
# Return to project root
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## ✅ Verification

### Check Database

```bash
psql -d dna_analysis_platform -c "\dt"
```

**Expected output:** List of 40+ tables

### Check Indexes

```bash
psql -d dna_analysis_platform -c "\di"
```

**Expected output:** 80+ indexes

### Run Sample Query

```bash
psql -d dna_analysis_platform -c "SELECT * FROM system_config;"
```

**Expected output:** 7 configuration rows

---

## 🎯 Next Steps

1. **Load Data**: Import variants from ClinVar, PharmGKB, gnomAD
2. **Validate Data**: Run comprehensive validation pipeline
3. **Build Frontend**: Create React components for data visualization
4. **Test**: Run unit and integration tests

---

## 🆘 Common Issues

### Issue: "database does not exist"
**Solution:**
```bash
createdb dna_analysis_platform
```

### Issue: "permission denied"
**Solution:** Check PostgreSQL user permissions
```bash
sudo -u postgres psql
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dna_analysis_platform TO your_username;
```

### Issue: "psql: command not found"
**Solution:** Add PostgreSQL to PATH or use full path:
- Windows: `C:\Program Files\PostgreSQL\14\bin\psql.exe`
- macOS: `/usr/local/bin/psql`
- Linux: `/usr/bin/psql`

### Issue: Python dependencies fail
**Solution:** Use virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r validation/requirements.txt
```

---

## 📊 Database Statistics

After installation, you should have:

| Component | Count |
|-----------|-------|
| Tables | 40+ |
| Indexes | 80+ |
| Functions | 2+ |
| Views | 3+ |
| Reference Rows | 100+ |

---

## 🔒 Security Notes

1. **Never commit** `config/database.ini` (already in .gitignore)
2. **Change default passwords** in production
3. **Enable SSL** for database connections
4. **Use environment variables** for sensitive data
5. **Enable audit logging** for HIPAA compliance

---

## 📖 Documentation

- Full README: `README.md`
- Schema Documentation: `database/schema/*.sql`
- Validation Rules: `validation/rules/validation_rules.yaml`
- API Documentation: `docs/API.md` (coming soon)

---

## ✨ Success!

If all steps completed successfully, you now have:

✅ PostgreSQL database with clinical-grade schema  
✅ Data validation pipeline ready  
✅ TypeScript/React development environment  
✅ Git version control configured  

**Ready to load and analyze DNA data!**

---

**Need Help?** Check `README.md` or open an issue.
