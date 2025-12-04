# 🏠 Installere Sopp Tracker Backend på Home Assistant Maskin

## 📋 Oversikt

Det finnes 3 måter å kjøre backend på HA-maskinen:

1. **Docker Container** ⭐ (ANBEFALT - enklest)
2. **Home Assistant Add-on** (best integrasjon, mer arbeid)
3. **Systemd Service** (hvis bare HA Core)

---

## 🐳 Metode 1: Docker Container (ANBEFALT)

### Fordeler:
- ✅ Enklest å sette opp
- ✅ Isolert fra HA
- ✅ Lett å oppdatere
- ✅ Fungerer med HA OS/Supervised/Core

### Forutsetninger:
- Home Assistant med SSH-tilgang
- Docker installert (vanligvis inkludert i HA OS/Supervised)

### Steg-for-steg:

#### 1. SSH inn til Home Assistant
```bash
# Fra din PC
ssh root@homeassistant.local
# eller
ssh root@<IP-ADRESSE>
```

#### 2. Opprett prosjektmappe
```bash
mkdir -p /config/sopp-tracker
cd /config/sopp-tracker
```

#### 3. Last opp filer
**Fra din Windows PC:**

Bruk WinSCP eller scp for å kopiere filene:
```powershell
# Bruk WinSCP GUI, eller:
scp -r sopp-tracker/backend root@homeassistant.local:/config/sopp-tracker/
```

**Eller opprett filene manuelt via SSH:**
```bash
cd /config/sopp-tracker

# Opprett Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements-linux.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/app ./app

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

# Opprett docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  sopp-tracker:
    build: .
    container_name: sopp-tracker
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./backend/app:/app/app
    environment:
      - DATABASE_URL=sqlite:///./data/sopp_tracker.db
    networks:
      - homeassistant

networks:
  homeassistant:
    external: true
EOF
```

#### 4. Kopier backend-filene
```bash
# Opprett backend/app mappe
mkdir -p backend/app

# Kopier Python-filene (bruk WinSCP eller opprett manuelt)
# Du trenger:
# - backend/app/main.py
# - backend/app/models.py
# - backend/app/schemas.py
# - backend/app/database.py
# - backend/app/__init__.py
```

#### 5. Opprett requirements-linux.txt
```bash
cat > backend/requirements-linux.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
python-multipart==0.0.6
python-dateutil==2.8.2
paho-mqtt==1.6.1
EOF
```

#### 6. Opprett data-mappe
```bash
mkdir -p data
```

#### 7. Bygg og start container
```bash
docker-compose up -d --build
```

#### 8. Sjekk at det kjører
```bash
docker ps
docker logs sopp-tracker
```

✅ **Backend kjører nå på:** `http://homeassistant.local:8000`

---

## 🔌 Metode 2: Home Assistant Add-on (Avansert)

### Fordeler:
- ✅ Best integrasjon med HA
- ✅ Vises i Add-ons menyen
- ✅ Enkel oppstart/restart fra UI

### Steg:

#### 1. Opprett add-on struktur
```bash
ssh root@homeassistant.local

mkdir -p /addons/sopp-tracker
cd /addons/sopp-tracker
```

#### 2. Opprett config.json
```bash
cat > config.json << 'EOF'
{
  "name": "Sopp Tracker",
  "version": "3.1.0",
  "slug": "sopp_tracker",
  "description": "Production tracking for Skogbunn Mikromusheri",
  "arch": ["armhf", "armv7", "aarch64", "amd64", "i386"],
  "startup": "application",
  "boot": "auto",
  "ports": {
    "8000/tcp": 8000
  },
  "ports_description": {
    "8000/tcp": "Web API"
  },
  "options": {
    "database_url": "sqlite:///data/sopp_tracker.db"
  },
  "schema": {
    "database_url": "str"
  }
}
EOF
```

#### 3. Opprett Dockerfile
```bash
cat > Dockerfile << 'EOF'
ARG BUILD_FROM
FROM $BUILD_FROM

# Install Python
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy files
COPY backend/requirements-linux.txt requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY run.sh /

RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
EOF
```

#### 4. Opprett run.sh
```bash
cat > run.sh << 'EOF'
#!/usr/bin/with-contenv bashio

CONFIG_PATH=/data/options.json
DATABASE_URL=$(bashio::config 'database_url')

export DATABASE_URL

bashio::log.info "Starting Sopp Tracker..."

cd /app
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
EOF
```

#### 5. Legg til repository i HA
1. Gå til **Settings → Add-ons → Add-on Store**
2. Klikk **⋮ → Repositories**
3. Legg til: `/addons/sopp-tracker`
4. Install og start!

---

## ⚙️ Metode 3: Systemd Service (HA Core)

### Hvis du kjører bare Home Assistant Core på Raspberry Pi:

#### 1. Installer dependencies
```bash
# SSH til Raspberry Pi
ssh pi@homeassistant.local

# Installer Python og avhengigheter
sudo apt update
sudo apt install python3 python3-venv python3-pip -y
```

#### 2. Opprett applikasjonsmappe
```bash
sudo mkdir -p /opt/sopp-tracker
sudo chown $USER:$USER /opt/sopp-tracker
cd /opt/sopp-tracker
```

#### 3. Kopier backend-filer
```bash
# Fra din PC
scp -r sopp-tracker/backend pi@homeassistant.local:/opt/sopp-tracker/
```

#### 4. Sett opp virtual environment
```bash
cd /opt/sopp-tracker/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-linux.txt
```

#### 5. Opprett systemd service
```bash
sudo nano /etc/systemd/system/sopp-tracker.service
```

Lim inn:
```ini
[Unit]
Description=Sopp Tracker Backend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/sopp-tracker/backend
Environment="PATH=/opt/sopp-tracker/backend/venv/bin"
Environment="DATABASE_URL=sqlite:////opt/sopp-tracker/data/sopp_tracker.db"
ExecStart=/opt/sopp-tracker/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 6. Start service
```bash
# Opprett data-mappe
sudo mkdir -p /opt/sopp-tracker/data
sudo chown pi:pi /opt/sopp-tracker/data

# Enable og start
sudo systemctl daemon-reload
sudo systemctl enable sopp-tracker
sudo systemctl start sopp-tracker

# Sjekk status
sudo systemctl status sopp-tracker
```

---

## 🔗 Koble til fra Windows-PC

Etter installasjon, backend er tilgjengelig på:

**Fra samme nettverk:**
- http://homeassistant.local:8000
- http://<HA-IP>:8000

**API Docs:**
- http://homeassistant.local:8000/docs

**Test fra PowerShell:**
```powershell
curl http://homeassistant.local:8000
curl http://homeassistant.local:8000/api/stats
```

---

## 📊 Migrer data til HA

### Fra Windows PC til HA:

```powershell
# 1. Eksporter backup fra HTML-tracker (💾 knapp)
# 2. Kopier til HA via SCP

scp LC-Spawn-Bag-tracker-v3-backup.json root@homeassistant.local:/config/sopp-tracker/backup.json

# 3. SSH til HA og kjør migrasjon
ssh root@homeassistant.local
cd /config/sopp-tracker
docker exec -it sopp-tracker python /app/migrate_from_html.py /data/backup.json
```

---

## 🛠️ Vedlikehold og Debugging

### Docker-kommandoer:
```bash
# Se logs
docker logs sopp-tracker

# Restart
docker restart sopp-tracker

# Stopp
docker stop sopp-tracker

# Start
docker start sopp-tracker

# Rebuild etter kodeendringer
docker-compose up -d --build
```

### Systemd-kommandoer:
```bash
# Se logs
sudo journalctl -u sopp-tracker -f

# Restart
sudo systemctl restart sopp-tracker

# Status
sudo systemctl status sopp-tracker

# Stopp
sudo systemctl stop sopp-tracker
```

---

## 🔒 Sikkerhet (valgfritt)

### Nginx Reverse Proxy
Hvis du vil eksponere API eksternt:

```nginx
# /etc/nginx/sites-available/sopp-tracker
server {
    listen 443 ssl;
    server_name sopp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/sopp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sopp.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📝 Sammendrag

**For de fleste: Bruk Docker (Metode 1)**
- Enklest å sette opp
- Enklest å vedlikeholde
- Isolert og trygt

**Kommandoer du trenger:**
```bash
# SSH til HA
ssh root@homeassistant.local

# Opprett og naviger til mappe
mkdir -p /config/sopp-tracker && cd /config/sopp-tracker

# Last opp filer (fra Windows)
# Bruk WinSCP eller scp

# Start Docker container
docker-compose up -d --build

# Sjekk logs
docker logs sopp-tracker
```

✅ Backend kjører nå på: `http://homeassistant.local:8000`

---

**Trenger du hjelp med oppsett?** Gi beskjed hvilken metode du vil bruke!
