# 🏠 Home Assistant - Quick Start

## ⚡ Raskeste måte (5 minutter):

### 1. Kopier filer til Home Assistant

**Fra Windows PC:**

```powershell
# Bruk WinSCP eller SCP til å kopiere hele mappen til HA
scp -r sopp-tracker root@homeassistant.local:/config/
```

**Eller bruk WinSCP GUI:**
- Host: `homeassistant.local` (eller IP-adresse)
- Username: `root`
- Password: (din HA root passord)
- Kopier `sopp-tracker` mappen til `/config/`

### 2. SSH til Home Assistant

```bash
ssh root@homeassistant.local
```

### 3. Kjør installasjonsskriptet

```bash
cd /config/sopp-tracker
chmod +x install-homeassistant.sh
./install-homeassistant.sh
```

✅ **Ferdig!** Backend kjører nå på: `http://homeassistant.local:8000`

---

## 🔧 Manuell installasjon (hvis skriptet ikke fungerer):

```bash
# SSH til HA
ssh root@homeassistant.local

# Naviger til mappe
cd /config/sopp-tracker

# Opprett data-mappe
mkdir -p data

# Start med Docker Compose
docker-compose up -d --build

# Sjekk at det kjører
docker ps
docker logs sopp-tracker
```

---

## 📊 Migrer data fra HTML-versjon

### 1. Eksporter fra HTML
1. Åpne `LC-Spawn-Bag-tracker-v3.1.html`
2. Klikk "💾 Backup"
3. Last ned JSON-filen

### 2. Kopier til HA
```powershell
# Fra Windows
scp backup.json root@homeassistant.local:/config/sopp-tracker/data/
```

### 3. Kjør migrasjon
```bash
# SSH til HA
ssh root@homeassistant.local

# Kjør migrasjon i container
docker exec -it sopp-tracker python scripts/migrate_from_html.py /app/data/backup.json
```

---

## 🧪 Test at det virker

**Fra Windows PC:**
```powershell
# Test health check
curl http://homeassistant.local:8000

# Hent statistikk
curl http://homeassistant.local:8000/api/stats
```

**I nettleser:**
- http://homeassistant.local:8000
- http://homeassistant.local:8000/docs

---

## 🛠️ Nyttige kommandoer

```bash
# Se logs
docker logs sopp-tracker

# Restart
docker restart sopp-tracker

# Stopp
docker stop sopp-tracker

# Start
docker start sopp-tracker

# Rebuild (etter kodeendringer)
cd /config/sopp-tracker
docker-compose up -d --build
```

---

## ❓ Problemer?

**Docker ikke installert?**
```bash
curl -fsSL https://get.docker.com | sh
```

**Port 8000 opptatt?**
Endre i `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Endre 8000 til 8001
```

**Se full guide:** `HOME_ASSISTANT_INSTALL.md`

---

## 🎯 Neste steg

1. ✅ Backend kjører på HA
2. 🚧 Koble React frontend til HA-backend
3. 🚧 Sett opp MQTT sensorer
4. 🚧 Lag HA automations

Backend er nå klar for Home Assistant integrasjon! 🎉
