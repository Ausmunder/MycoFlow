# 🚀 Deploy Backend NÅ - For Docker Compose V2

## ✅ Koden er allerede oppdatert!

Filen `K:\sopp-tracker\backend\app\main.py` er allerede oppdatert med bug-fixen.
Du trenger bare å restarte Docker-containeren.

---

## 🔧 Docker Compose V2 Commands

Du har Docker v28.3.3 som bruker `docker compose` (med mellomrom) i stedet for `docker-compose`.

---

## Metode 1: Enkel restart (RASKEST)

Siden koden allerede er oppdatert på `K:\sopp-tracker\`, kan du bare restarte:

```bash
cd K:\sopp-tracker
docker compose restart sopp-tracker
```

---

## Metode 2: Full rebuild (ANBEFALT for å være sikker)

```bash
cd K:\sopp-tracker
docker compose down
docker compose build --no-cache sopp-tracker
docker compose up -d
```

---

## Metode 3: Via Home Assistant (hvis Docker kjører der)

Hvis Docker faktisk kjører på Home Assistant serveren:

```bash
ssh root@192.168.1.251
cd /config/sopp-tracker
docker compose down
docker compose build --no-cache sopp-tracker
docker compose up -d
```

---

## ✅ Verifiser deployment

```bash
# Sjekk status
docker compose ps

# Se logs
docker compose logs --tail=20 sopp-tracker

# Følg logs live
docker compose logs -f sopp-tracker

# Test API
curl http://localhost:8000/
# eller i browser: http://192.168.1.251:8000/docs
```

---

## 🧪 Test Bug-fixen

1. **Åpne Sopp Tracker frontend**
2. **Opprett ny batch:**
   - Strain: Oyster
   - Spawn Batch: TEST-SP999
   - Spawn Date: Dagens dato
3. **Klikk på batchen for å åpne modal**
4. **Klikk "Add Units"**
5. **Legg til 5 units à 0.3kg**

**Forventet resultat:**
- ✅ Ingen 404 error
- ✅ Units legges til
- ✅ "Total Kg (fra enheter)" viser 1.5kg

---

## 🔍 Troubleshooting

### "sopp-tracker" ikke funnet
```bash
# List alle containere
docker ps -a

# Start fra docker-compose.yml
docker compose up -d
```

### Port allerede i bruk
```bash
# Finn hva som bruker port 8000
docker ps | grep 8000
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Mac/Linux
```

### Se full container output
```bash
docker compose logs sopp-tracker
docker inspect sopp-tracker
```

---

## 📋 Quick Commands (Docker Compose V2)

```bash
# Status
docker compose ps

# Logs
docker compose logs -f sopp-tracker

# Restart
docker compose restart sopp-tracker

# Stop
docker compose down

# Start
docker compose up -d

# Rebuild
docker compose build --no-cache
docker compose up -d
```

---

**VIKTIG:**
- Backend-koden er oppdatert på `K:\sopp-tracker\backend\app\main.py`
- Frontend er deployed til `K:\www\sopp-tracker\`
- Bruk `docker compose` (MED mellomrom) ikke `docker-compose` (med bindestrek)

🚀 Kjør en av metodene over for å aktivere bug-fixen!
