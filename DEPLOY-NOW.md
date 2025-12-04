# 🚀 Deploy Backend NÅ - Raske Instruksjoner

## ✅ Koden er allerede oppdatert!

Filen `K:\sopp-tracker\backend\app\main.py` er allerede oppdatert med bug-fixen.
Du trenger bare å restarte Docker-containeren.

---

## Metode 1: Via Home Assistant SSH & Web Terminal Add-on (ENKLEST)

1. **Åpne Home Assistant**
2. **Gå til Settings → Add-ons**
3. **Åpne "SSH & Web Terminal"** (eller "Terminal & SSH")
4. **Klikk "OPEN WEB UI"** (åpner terminal i browser)
5. **Kjør disse kommandoene:**

```bash
cd /config/sopp-tracker
docker-compose down
docker-compose build --no-cache sopp-tracker
docker-compose up -d
```

6. **Sjekk at det fungerer:**

```bash
docker-compose logs --tail=20 sopp-tracker
```

Du skal se at containeren starter uten errors.

---

## Metode 2: Via SSH fra Windows

```bash
# Åpne PowerShell eller Git Bash
ssh root@192.168.1.251
# eller
ssh homeassistant@192.168.1.251

# Når du er inne:
cd /config/sopp-tracker
docker-compose down
docker-compose build --no-cache sopp-tracker
docker-compose up -d
docker-compose logs --tail=20 sopp-tracker
```

---

## Metode 3: Enkel restart (hvis du ikke vil rebuilde)

Dette fungerer hvis containeren allerede har tilgang til de oppdaterte filene:

```bash
cd /config/sopp-tracker
docker-compose restart sopp-tracker
```

---

## ✅ Verifiser at det fungerer

1. **Åpne i browser:** http://192.168.1.251:8000/docs
2. **Test API:** Prøv å hente batches
3. **Sjekk logs:** `docker-compose logs -f sopp-tracker`

---

## 🧪 Test Bug-fixen

1. **Åpne Sopp Tracker frontend** (K:\www\sopp-tracker)
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

### Container starter ikke
```bash
docker-compose logs sopp-tracker
```

### Database connection error
```bash
docker-compose ps
# Sjekk at både postgres og sopp-tracker kjører
```

### Port allerede i bruk
```bash
docker ps -a | grep 8000
# Finn og stopp andre containere som bruker port 8000
```

---

## 📋 Quick Commands Reference

```bash
# Sjekk status
docker-compose ps

# Se logs
docker-compose logs -f sopp-tracker

# Restart
docker-compose restart sopp-tracker

# Full rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Sjekk at API svarer
curl http://localhost:8000/
```

---

**VIKTIG:** Backend-koden er allerede oppdatert på K:\sopp-tracker\backend\app\main.py
Du trenger bare å restarte/rebuilde containeren! 🚀
