# 🪟 Windows Setup Guide - Sopp Tracker

## ⚡ Quick Fix for Windows

Du trenger **IKKE** PostgreSQL for å komme i gang!  
Backend bruker SQLite (lokal database) som default.

---

## 🚀 Setup (3 steg):

### 1. Installer Python dependencies

```powershell
# Naviger til backend-mappen
cd sopp-tracker\backend

# Lag virtual environment
python -m venv venv

# Aktiver (PowerShell)
.\venv\Scripts\Activate.ps1

# VIKTIG: Bruk Windows-spesifikk requirements
pip install -r requirements-windows.txt
```

**Hvis du får "execution policy" error:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Start backend

```powershell
# Fra backend\ mappen
uvicorn app.main:app --reload
```

✅ **Backend kjører nå på:** http://localhost:8000

### 3. Test det

Åpne i nettleser: http://localhost:8000/docs

---

## 🗄️ Database

**Default:** SQLite (lokal fil)
- Fil: `sopp_tracker.db` (opprettes automatisk)
- Ingen setup nødvendig
- Perfekt for utvikling og testing

**Later:** PostgreSQL (hvis du trenger det)
```powershell
pip install psycopg[binary]
```

---

## 🧪 Test at det virker:

### I PowerShell:
```powershell
# Test health check
curl http://localhost:8000

# Hent statistikk
curl http://localhost:8000/api/stats
```

### I nettleser:
- Health check: http://localhost:8000
- API docs: http://localhost:8000/docs
- Statistikk: http://localhost:8000/api/stats

---

## 📊 Migrer data fra HTML-versjon:

### 1. Eksporter fra HTML-tracker
1. Åpne `LC-Spawn-Bag-tracker-v3.1.html`
2. Klikk "💾 Backup"
3. Fil lastes ned (f.eks. `LC-Spawn-Bag-tracker-v3-backup-2025-10-28.json`)

### 2. Kjør migrasjon
```powershell
# Fra sopp-tracker\ mappen (ikke backend\)
python scripts\migrate_from_html.py "C:\Users\assmu\Downloads\LC-Spawn-Bag-tracker-v3-backup-2025-10-28.json"
```

✅ All data er nå i SQLite-databasen!

---

## ❌ Vanlige problemer og løsninger:

### Problem 1: "python not found"
**Fix:** Installer Python 3.11+ fra https://python.org
- ✅ Huk av "Add Python to PATH"

### Problem 2: "execution policy error"
**Fix:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problem 3: "Module not found: fastapi"
**Fix:**
```powershell
# Sjekk at venv er aktivert (skal se "(venv)" i terminal)
.\venv\Scripts\Activate.ps1

# Installer på nytt
pip install -r requirements-windows.txt
```

### Problem 4: Port 8000 in use
**Fix:**
```powershell
uvicorn app.main:app --reload --port 8001
```

---

## 🎯 Hva nå?

1. ✅ Start backend: `uvicorn app.main:app --reload`
2. ✅ Åpne API docs: http://localhost:8000/docs
3. ✅ Test endpoints i nettleseren
4. ✅ Migrer HTML-data hvis du har det
5. ⏳ Vent på React frontend

---

## 📝 Kommandoer - Komplett guide:

### Start backend (hver gang):
```powershell
cd sopp-tracker\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

### Stopp backend:
```
Ctrl+C
```

### Migrer data:
```powershell
cd sopp-tracker
python scripts\migrate_from_html.py "sti\til\backup.json"
```

---

## ✅ Windows er nå klar!

Backend kjører med SQLite - ingen PostgreSQL nødvendig! 🎉

**Neste:** Test API på http://localhost:8000/docs
