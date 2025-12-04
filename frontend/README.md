# 🍄 Sopp Tracker Frontend v3.1

React frontend for Skogbunn Mikromusheri production tracking system.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: http://localhost:5173

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/        # React components
│   ├── Header.jsx
│   ├── StatsPanel.jsx
│   ├── BatchTable.jsx
│   └── NewBatchModal.jsx
├── api/              # API client
│   └── client.js
├── hooks/            # Custom React hooks
│   └── useApi.js
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## 🔌 API Configuration

Backend API URL is configured in `vite.config.js`:

**Development:** Uses proxy to `http://192.168.1.251:8000`  
**Production:** Direct connection to `http://192.168.1.251:8000`

To change API URL, edit `vite.config.js`:

```js
proxy: {
  '/api': {
    target: 'http://YOUR-HA-IP:8000',
    changeOrigin: true,
  }
}
```

## 🎨 Features

- ✅ Real-time data from backend API
- ✅ Batch management (CRUD)
- ✅ Statistics dashboard
- ✅ Filter and search
- ✅ Bulk operations (archive, delete)
- ✅ Multi-strain support
- ✅ Responsive design
- ✅ Contamination tracking with red highlights

## 🛠️ Technologies

- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Query** - Data fetching
- **Axios** - HTTP client
- **Lucide React** - Icons
- **date-fns** - Date formatting

## 📦 Deployment

### Option 1: Static hosting (Vercel/Netlify)

```bash
npm run build
# Upload dist/ folder
```

### Option 2: Serve from Home Assistant

```bash
npm run build
# Copy dist/ to HA static files
```

### Option 3: Docker container

```bash
# Build
docker build -t sopp-tracker-frontend .

# Run
docker run -d -p 3000:80 sopp-tracker-frontend
```

## 🔧 Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://192.168.1.251:8000/api
```

## 🧪 Testing

```bash
npm run lint
```

## 📝 TODO

- [ ] Edit batch inline
- [ ] Advanced filtering
- [ ] Charts and graphs
- [ ] Export to PDF/Excel
- [ ] PWA offline support
- [ ] Photo uploads
- [ ] Template management UI

---

Made with 🍄 by Skogbunn Mikromusheri
