# 🍄 MycoFlow v1.0

**Professional mushroom cultivation tracking system for Skogbunn Mikromusheri**

Modern web application for tracking LC → Spawn → Bag → Harvest workflow with Home Assistant integration.

---

## 📋 Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL / SQLite
- Pydantic (validation)

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS
- React Query

**Integrations:**
- Home Assistant (MQTT/Webhooks)
- Google Drive sync
- PWA (offline-first)

---

## 🚀 Quick Start

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run database migrations (auto-creates tables)
python -m app.main

# Start development server
uvicorn app.main:app --reload
```

Backend runs on: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 📁 Project Structure

```
mycoflow/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # DB configuration
│   │   └── routers/         # API routes (future)
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── api/             # API client
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── API.md              # API documentation
└── README.md
```

---

## 🗄️ Database Schema

### Batches Table
Main table tracking LC → Spawn → Bag → Harvest

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| strain | Enum | oyster/lionsmane/shiitake |
| lc_kode | String | LC culture code |
| spawn_batch | String | Spawn batch identifier |
| bag_status | Enum | Current status |
| bag_kontam | Enum | Contamination type |
| bag_host1_total_kg | Float | Harvest 1 yield |
| bag_host2_total_kg | Float | Harvest 2 yield |
| archived | Boolean | Archive status |

### BatchInfo Table
Metadata about spawn batches

### Templates Table
Quick-create templates per strain

### SensorReadings Table
Temperature/humidity from Home Assistant

---

## 🔌 API Endpoints

### Batches
- `GET /api/batches` - List all batches
- `GET /api/batches/{id}` - Get single batch
- `POST /api/batches` - Create batch
- `PATCH /api/batches/{id}` - Update batch
- `DELETE /api/batches/{id}` - Delete batch
- `POST /api/batches/bulk-archive` - Archive multiple
- `POST /api/batches/bulk-delete` - Delete multiple

### Statistics
- `GET /api/stats` - Overall statistics
- `GET /api/stats?strain=oyster` - Stats per strain

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `DELETE /api/templates/{id}` - Delete template

### Sensors (Home Assistant)
- `POST /api/sensors/readings` - Create reading
- `GET /api/sensors/readings` - Get readings

Full API docs: `http://localhost:8000/docs`

---

## 🏠 Home Assistant Integration

### MQTT Configuration

Add to Home Assistant `configuration.yaml`:

```yaml
mqtt:
  sensor:
    - name: "Fruktekammer Temperature"
      state_topic: "sopp_tracker/fruktekammer/temperature"
      unit_of_measurement: "°C"
      
    - name: "Fruktekammer Humidity"
      state_topic: "sopp_tracker/fruktekammer/humidity"
      unit_of_measurement: "%"
```

### Automations Example

```yaml
automation:
  - alias: "Alert on High Temperature"
    trigger:
      - platform: numeric_state
        entity_id: sensor.fruktekammer_temperature
        above: 20
    action:
      - service: notify.mobile_app
        data:
          message: "⚠️ Fruktekammer temperature too high!"
```

---

## 📊 Features

✅ **Completed:**
- [x] Full CRUD API for batches
- [x] Statistics and analytics
- [x] Template system
- [x] Sensor readings (HA)
- [x] Bulk operations
- [x] Filter and search

🚧 **In Progress:**
- [ ] React frontend
- [ ] Authentication
- [ ] File uploads (photos)
- [ ] Real-time notifications

📅 **Planned:**
- [ ] Mobile app (React Native)
- [ ] ML predictions
- [ ] Advanced reporting

---

## 🔧 Development

### Run Tests

```bash
pytest
```

### Database Migrations

Using Alembic:

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

### Code Style

```bash
# Format code
black app/

# Lint
ruff check app/
```

---

## 🚢 Deployment

### Option 1: Railway (Recommended)

1. Push to GitHub
2. Connect to Railway
3. Add PostgreSQL addon
4. Set environment variables
5. Deploy!

### Option 2: Render

1. Create new Web Service
2. Connect GitHub repo
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

### Option 3: Local (Raspberry Pi)

```bash
# Install systemd service
sudo cp mycoflow.service /etc/systemd/system/
sudo systemctl enable mycoflow
sudo systemctl start mycoflow
```

---

## 📝 Migration from HTML Version

Script to migrate data from localStorage JSON to PostgreSQL:

```bash
python scripts/migrate_from_html.py --input backup.json
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Run tests
5. Submit PR

---

## 📄 License

MIT License - Skogbunn Mikromusheri AS

---

## 📞 Support

Issues: [GitHub Issues](https://github.com/Ausmunder/MycoFlow/issues)
Email: aasmund@skogbunn.no

---

## 🎯 Roadmap

**Q1 2025:**
- ✅ Backend API
- 🚧 React Frontend
- 🚧 Home Assistant integration

**Q2 2025:**
- PWA with offline support
- Photo uploads
- Advanced analytics

**Q3 2025:**
- Mobile app
- ML predictions
- Multi-user support

---

Made with 🍄 by Skogbunn Mikromusheri
