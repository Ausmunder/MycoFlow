# 🚀 Backend Deployment til Home Assistant

## Endringer i denne deploymenten

### ✅ Bug Fix: "Add Units" 404 Error
**Problem:** Når man opprettet ny batch med spawn_batch og prøvde å legge til units, fikk man 404 error fordi `batch_info` ikke ble opprettet automatisk.

**Løsning:** Oppdatert `create_batch()` i `backend/app/main.py` (linje 234-263):
- Når en batch opprettes med `spawn_batch`, sjekkes det nå om `BatchInfo` eksisterer
- Hvis ikke, opprettes automatisk en ny `BatchInfo` med spawn_batch, spawn_type, spawn_date og in_fridge=False

### ✅ Timezone Fix
Allerede på plass - bruker `datetime.now(timezone.utc)` korrekt i `calculate_days_between()`

---

## Deployment Metoder

### **Metode 1: Docker via SSH (Anbefalt)**

```bash
# 1. SSH inn til Home Assistant
ssh root@192.168.1.251
# eller
ssh username@192.168.1.251

# 2. Naviger til sopp-tracker mappen
cd /path/to/sopp-tracker

# 3. Pull latest kode (hvis du bruker git)
git pull

# Eller kopier oppdatert main.py manuelt:
# Fra Windows: scp K:\sopp-tracker\backend\app\main.py root@192.168.1.251:/path/to/sopp-tracker/backend/app/

# 4. Rebuild Docker container
docker-compose down
docker-compose build --no-cache sopp-tracker
docker-compose up -d

# 5. Sjekk logs
docker-compose logs -f sopp-tracker
```

---

### **Metode 2: Manuell fil-kopiering**

```bash
# 1. Kopier oppdatert main.py fra Windows til HA
# Fra Windows PowerShell eller Git Bash:
scp K:\sopp-tracker\backend\app\main.py root@192.168.1.251:/config/sopp-tracker/backend/app/

# 2. SSH inn og restart container
ssh root@192.168.1.251
docker restart sopp-tracker

# Eller rebuild:
cd /config/sopp-tracker
docker-compose down
docker-compose up -d --build
```

---

### **Metode 3: Via Home Assistant Add-on (File Editor/SSH & Web Terminal)**

1. **Åpne File Editor eller SSH & Web Terminal i Home Assistant**
2. **Naviger til:** `/config/sopp-tracker/backend/app/`
3. **Erstatt `main.py`** med den oppdaterte versjonen fra `K:\sopp-tracker\backend\app\main.py`
4. **Restart container via Terminal:**
   ```bash
   docker restart sopp-tracker
   ```

---

### **Metode 4: Kopier hele backend-mappen via nettverk**

Hvis du har tilgang til Home Assistant som nettverkshare (f.eks. via Samba):

```bash
# Fra Windows
xcopy /E /Y K:\sopp-tracker\backend\app\* \\192.168.1.251\config\sopp-tracker\backend\app\

# Deretter restart via HA terminal eller SSH
```

---

## Verifisering etter deployment

1. **Sjekk at backend kjører:**
   ```bash
   curl http://192.168.1.251:8000/
   ```

2. **Sjekk API docs:**
   Åpne i browser: `http://192.168.1.251:8000/docs`

3. **Test bug fix:**
   - Åpne Sopp Tracker frontend
   - Opprett ny batch med spawn_batch (f.eks. "TEST-SP999")
   - Åpne modal for batchen
   - Klikk "Add Units"
   - **Forventet:** Skal fungere uten 404 error!

4. **Sjekk logs:**
   ```bash
   docker logs sopp-tracker
   ```

---

## Troubleshooting

### Container starter ikke
```bash
# Sjekk logs
docker logs sopp-tracker

# Sjekk at postgres kjører
docker ps | grep postgres

# Restart hele stacken
docker-compose down
docker-compose up -d
```

### Database connection error
```bash
# Sjekk at DATABASE_URL er riktig satt
docker inspect sopp-tracker | grep DATABASE_URL

# Sjekk network
docker network ls
docker network inspect sopp-network
```

### 404 error på /api/batch-info
Dette er nå fikset! Men hvis det fortsatt skjer:
- Sjekk at du bruker den nye versjonen av main.py
- Verifiser at BatchInfo opprettes automatisk ved å sjekke database:
  ```bash
  docker exec -it sopp-tracker-db psql -U sopp -d sopp_tracker
  SELECT * FROM batch_info;
  ```

---

## Backend Info

**Lokasjon:** `K:\sopp-tracker\backend\`
**Endret fil:** `app/main.py` (linje 234-263)
**Docker image:** `sopp-tracker`
**Container navn:** `sopp-tracker`
**Port:** `8000`

---

## Neste steg etter deployment

1. ✅ Test "Add Units" funksjonaliteten
2. ✅ Opprett test batch med spawn_batch
3. ✅ Legg til units og verifiser at total kg beregnes riktig
4. ✅ Test refrigeration toggle
5. ✅ Test contamination toggle på units

---

**Deployert dato:** 2025-12-02
**Versjon:** v4.6.1 (Bug fix: Add Units 404 + Timezone fix)
