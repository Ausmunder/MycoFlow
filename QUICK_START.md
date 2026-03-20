# 🚀 QUICK START - MycoFlow Backend

## ✅ Fase 1 Complete: Backend API er klar!

---

## 📦 Hva er levert:

### Backend (Python FastAPI)
- ✅ Full REST API med alle endpoints
- ✅ Database models (SQLAlchemy)
- ✅ Data validation (Pydantic)
- ✅ PostgreSQL/SQLite support
- ✅ Home Assistant sensor endpoints
- ✅ Migrasjonsskript fra HTML-versjon
- ✅ Dokumentasjon

### Filer struktur:
```
mycoflow/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app - MAIN FILE
│   │   ├── models.py        # Database tables
│   │   ├── schemas.py       # API validation
│   │   └── database.py      # DB config
│   ├── requirements.txt     # Dependencies
│   └── .env.example        # Config template
├── scripts/
│   └── migrate_from_html.py # Migration tool
└── README.md               # Full documentation
```

---

## 🏃 Kom i gang (5 minutter):

### 1. Installer Python dependencies

```bash
cd mycoflow/backend

# Create virtual environment
python -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install
pip install -r requirements.txt
```

### 2. Start serveren

```bash
# From backend/ directory
uvicorn app.main:app --reload
```

✅ Backend kjører nå på: **http://localhost:8000**

### 3. Test API

Åpne i nettleser:
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000

---

## 🧪 Test API med eksempler:

### Opprett ny batch (POST)
```bash
curl -X POST http://localhost:8000/api/batches \
  -H "Content-Type: application/json" \
  -d '{
    "strain": "oyster",
    "lc_kode": "GOH1-190925",
    "spawn_batch": "SB001",
    "bag_status": "Inokulert"
  }'
```

### Hent alle batches (GET)
```bash
curl http://localhost:8000/api/batches
```

### Hent statistikk (GET)
```bash
curl http://localhost:8000/api/stats
```

---

## 📊 Migrer data fra HTML-versjon:

### 1. Eksporter data fra HTML-tracker
1. Åpne HTML-trackeren
2. Klikk "💾 Backup"
3. Last ned JSON-filen

### 2. Kjør migrasjonen
```bash
cd mycoflow
python scripts/migrate_from_html.py ~/Downloads/LC-Spawn-Bag-tracker-v3-backup-2025-10-28.json
```

✅ All data er nå i databasen!

---

## 🔌 API Endpoints (viktigste):

### Batches
- `GET /api/batches` - List all
- `GET /api/batches?strain=oyster` - Filter by strain
- `GET /api/batches?status=Inkubering` - Filter by status
- `GET /api/batches/{id}` - Get one
- `POST /api/batches` - Create new
- `PATCH /api/batches/{id}` - Update
- `DELETE /api/batches/{id}` - Delete
- `POST /api/batches/bulk-archive` - Archive multiple

### Statistics
- `GET /api/stats` - Overall stats
- `GET /api/stats?strain=oyster` - Per strain

### Templates
- `GET /api/templates` - List all
- `GET /api/templates?strain=oyster` - Filter by strain
- `POST /api/templates` - Create
- `DELETE /api/templates/{id}` - Delete

### Sensors (Home Assistant)
- `POST /api/sensors/readings` - Create reading
- `GET /api/sensors/readings?location=fruktekammer` - Get readings

**Full dokumentasjon:** http://localhost:8000/docs

---

## 🏠 Home Assistant integrasjon:

Backend er klar for HA! Endpointene finnes allerede:

```python
POST /api/sensors/readings
{
  "sensor_type": "temperature",
  "location": "fruktekammer",
  "value": 18.5,
  "unit": "°C"
}
```

---

## 🗄️ Database:

### Default: SQLite (lokal fil)
- Fil: `mycoflow.db`
- Perfekt for utvikling og testing
- Ingen oppsett nødvendig

### Production: PostgreSQL
Endre DATABASE_URL i `.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

---

## 🚢 Deploy:

### VPS (produksjon)
- Frontend: https://sopp.skogbunn.com
- Backend: https://api.skogbunn.com
- Se claude-setup.md for deploy-instruksjoner

### Lokal utvikling
```bash
uvicorn app.main:app --reload
```

### Systemd (Linux server)
```bash
systemctl enable mycoflow
systemctl start mycoflow
```

---

## ❓ Testing og feilsøking:

### Sjekk at backend kjører:
```bash
curl http://localhost:8000
# Should return: {"status":"OK","version":"1.0.0",...}
```

### Vanlige problemer:

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
**Fix:** `pip install -r requirements.txt`

**Problem:** Port 8000 already in use
**Fix:** `uvicorn app.main:app --reload --port 8001`

**Problem:** Database locked (SQLite)
**Fix:** Close other connections or restart server

---

## 📞 Spørsmål?

- Full docs: Se README.md
- API docs: http://localhost:8000/docs

---

**🍄 MycoFlow Backend er klar til bruk!**
