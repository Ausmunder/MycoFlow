# 🚀 React Frontend - Quick Start

## ✅ Fase 2: React Frontend er klar!

---

## 📦 Hva er levert:

**React + Vite frontend:**
- ✅ Modern React 18 app
- ✅ TailwindCSS styling (ligner HTML-versjon)
- ✅ React Query for data fetching
- ✅ Kobler til backend API
- ✅ Batch management (create, read, update, delete)
- ✅ Statistics dashboard
- ✅ Filter og søk
- ✅ Bulk operations
- ✅ Responsive design

**Komponenter:**
- `Header.jsx` - Top bar med export/import
- `StatsPanel.jsx` - Statistikk dashboard
- `BatchTable.jsx` - Hovedtabell med alle batches
- `NewBatchModal.jsx` - Modal for ny batch

---

## 🏃 Kom i gang (3 kommandoer):

### På Windows PC:

```powershell
cd sopp-tracker-frontend

# Installer dependencies
npm install

# Start development server
npm run dev
```

✅ **Frontend kjører på:** http://localhost:5173

---

## 🔌 Kobler automatisk til backend:

**Development mode:**
- Frontend: http://localhost:5173
- API proxy til: http://192.168.1.251:8000

**API calls går via Vite proxy** - ingen CORS-problemer!

---

## 🧪 Test det:

1. Start frontend: `npm run dev`
2. Åpne: http://localhost:5173
3. Se dine 4 batches fra backend
4. Klikk "Ny batch" for å legge til
5. Se statistikk oppdateres

---

## 🎨 Features som fungerer:

### ✅ Batch Management
- Se alle batches i tabell
- Opprett ny batch (modal)
- Slett batch
- Bulk archive
- Bulk delete
- Filter på status
- Søk i LC kode, spawn batch, notater

### ✅ Statistics Dashboard
- Total batches
- Aktive batches
- Kontaminerte (med %)
- Høstede (med total kg)
- Gjennomsnittlig BE%
- Snitt kolonisering (dager)
- Snitt sykluslengde (dager)

### ✅ UI/UX
- Rød markering ved kontaminering
- Farget status badges
- Responsive design (mobil + desktop)
- Loading states
- Error handling
- Multi-strain tabs (Alle, Grå østers, Lions Mane, Shiitake)

---

## 📊 Arkitektur:

```
Frontend (React)
    ↓ HTTP
Backend (FastAPI)
    ↓ SQL
Database (PostgreSQL)
```

**Alt kjører lokalt på ditt nettverk! 🏠**

---

## 🚢 Deploy til produksjon:

### Option 1: Build og serve statisk

```powershell
npm run build
# dist/ folder kan hostes hvor som helst
```

### Option 2: Deploy på Vercel (gratis)

```bash
npm install -g vercel
vercel
```

### Option 3: Docker container

```bash
# Kommer i neste oppdatering
```

---

## 🔧 Endre backend URL:

**I `vite.config.js`:**

```js
proxy: {
  '/api': {
    target: 'http://DIN-HA-IP:8000',  // Endre her
    changeOrigin: true,
  }
}
```

---

## 📝 Hva fungerer IKKE ennå:

- ⏳ Inline editing (klikk i celle for å endre)
- ⏳ Template management UI
- ⏳ Export til fil
- ⏳ Import fra fil
- ⏳ Grafer/charts
- ⏳ Photo upload
- ⏳ PWA offline mode

**Disse kommer i neste iterasjon!**

---

## 🎯 Nå har du:

### ✅ Fase 1: Backend (FERDIG!)
- Python FastAPI
- PostgreSQL
- Docker på HA
- REST API

### ✅ Fase 2: Frontend (FERDIG!)
- React + Vite
- TailwindCSS
- React Query
- Kobler til backend

### 🚧 Fase 3: Home Assistant (Neste)
- MQTT sensorer
- Automations
- Dashboard
- Notifications

---

## 📞 Testing:

```powershell
# Start backend (på HA - kjører allerede)
# Backend: http://192.168.1.251:8000

# Start frontend (på Windows)
cd sopp-tracker-frontend
npm install
npm run dev

# Frontend: http://localhost:5173
```

**Åpne http://localhost:5173 og se dine batches! 🎉**

---

**Frontend er klar! Test det nå! 🚀**

Installer og kjør `npm run dev`!
