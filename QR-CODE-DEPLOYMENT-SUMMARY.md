# 🏷️ QR Code & Label Printing - Implementation Summary

**Dato:** 2025-12-03
**Versjon:** v4.7.0-alpha (Backend only - Frontend TBD)
**Printer:** Brother QL-820NWB @ tcp://192.168.1.116

---

## ✅ Hva er implementert (Backend)

### 1. Database Schema ✅
**Fil:** `backend/app/models.py`

Nye kolonner i `batches` tabell:
```python
qr_code = Column(String(100), unique=True, index=True)  # SOPP-{id}
qr_data = Column(Text)  # JSON data encoded in QR
label_printed = Column(Boolean, default=False)
label_printed_at = Column(DateTime, nullable=True)
label_print_count = Column(Integer, default=0)
```

**Status:** ✅ Implementert - Må kjøre database migration

---

### 2. Printer Integration ✅
**Fil:** `backend/app/printer.py` (NY FIL)

**Klasse:** `BrotherPrinter`
- Genererer QR kode
- Lager label layout (62mm x 100mm)
- Printer til Brother QL-820NWB
- Test print funksjon

**Konfigurasjon:**
- Printer: `tcp://192.168.1.116`
- Model: `QL-820NWB`
- Label: 62mm bredde

**Label Design:**
```
┌────────────────────┐
│   [QR CODE 400px]  │
│     SP001          │  ← Spawn Batch (Bold, 60pt)
│  Strain: Oyster    │  ← Strain (40pt)
│   LC: GOH2         │  ← LC Code (40pt)
│  03.12.2025        │  ← Date (30pt)
└────────────────────┘
```

---

### 3. Batch Creation - QR Generation ✅
**Fil:** `backend/app/main.py` (linje 247-256)

Når batch opprettes:
```python
# Generate QR code
db_batch.qr_code = f"SOPP-{db_batch.id}"
db_batch.qr_data = json.dumps({
    "id": db_batch.id,
    "spawn_batch": db_batch.spawn_batch,
    "strain": db_batch.strain_name,
    "lc": db_batch.lc_batch
})
```

---

### 4. API Endpoints ✅
**Fil:** `backend/app/main.py` (linje 618-701)

#### QR Code Endpoints:
```python
# Get QR info
GET /api/batches/{batch_id}/qr
Response: {
    "qr_code": "SOPP-123",
    "qr_data": "{...}",
    "qr_image_url": "/api/batches/123/qr/image",
    "label_printed": false,
    "label_print_count": 0
}

# Get QR as PNG image
GET /api/batches/{batch_id}/qr/image
Response: PNG image (binary)

# Lookup batch by QR code
GET /api/batches/qr/{qr_code}
Example: GET /api/batches/qr/SOPP-123
Response: Full batch object
```

#### Print Endpoints:
```python
# Print label
POST /api/batches/{batch_id}/print?copies=1
Response: {
    "success": true,
    "message": "Successfully printed 1 label(s)",
    "copies_printed": 1
}

# Reprint label
POST /api/batches/{batch_id}/reprint?copies=1
Response: Same as above

# Test printer
POST /api/printer/test
Response: {
    "success": true,
    "message": "Test label printed successfully"
}
```

---

### 5. Dependencies ✅
**Fil:** `backend/requirements.txt`

Nye pakker:
```
qrcode[pil]==7.4.2
Pillow==10.1.0
brother-ql==0.9.4
```

---

### 6. Schemas ✅
**Fil:** `backend/app/schemas.py`

`BatchResponse` oppdatert med QR felter:
```python
qr_code: Optional[str] = None
qr_data: Optional[str] = None
label_printed: Optional[bool] = None
label_printed_at: Optional[datetime] = None
label_print_count: Optional[int] = None
```

---

## ⏳ Hva gjenstår (Frontend)

### 1. PrintDialog Component
**Lokasjon:** `D:\dev\sopp-tracker-frontend-v4.4-UNITS-CRUD\src\components\PrintDialog.jsx` (NY FIL)

**Funksjonalitet:**
- Vises automatisk etter batch creation
- Antall kopier selector (1-10)
- Print / Avbryt buttons
- Success/error toast notifications

**Design:**
```jsx
<Modal>
    <h3>Print Label?</h3>
    <p>Batch: SP001</p>
    <p>Strain: Oyster | LC: GOH2</p>

    <label>
        Antall kopier:
        <input type="number" min="1" max="10" value={1} />
    </label>

    <div>
        <button onClick={handlePrint}>🖨️ Print</button>
        <button onClick={handleSkip}>Hopp over</button>
    </div>
</Modal>
```

---

### 2. NewBatchModal Integration
**Fil:** `D:\dev\sopp-tracker-frontend-v4.4-UNITS-CRUD\src\components\NewBatchModal.jsx`

**Endringer:**
```javascript
const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const newBatch = await createBatchMutation.mutateAsync(formData);

        // Show print dialog
        setPrintDialogOpen(true);
        setPrintBatchId(newBatch.id);

        onClose();
    } catch (error) {
        // Handle error
    }
};
```

---

### 3. BatchModal - QR Display & Reprint
**Fil:** `D:\dev\sopp-tracker-frontend-v4.4-UNITS-CRUD\src\components\BatchModal.jsx`

**Ny seksjon:**
```jsx
<div className="qr-section">
    <h4>🏷️ Label & QR Code</h4>

    <img
        src={`/api/batches/${batch.id}/qr/image`}
        alt="QR Code"
        className="w-32 h-32 border"
    />

    <p className="text-sm text-gray-600">
        Code: {batch.qr_code}
    </p>

    {batch.label_printed && (
        <p className="text-xs text-gray-500">
            Printet: {batch.label_print_count} gang(er)
        </p>
    )}

    <button onClick={handleReprint} className="btn-secondary">
        🖨️ Skriv ut label
    </button>
</div>
```

---

### 4. QR Scanner (Optional - Phase 2)
**Fil:** `D:\dev\sopp-tracker-frontend-v4.4-UNITS-CRUD\src\components\QRScanner.jsx` (NY FIL)

**Dependencies:**
```bash
npm install @yudiel/react-qr-scanner
```

**Component:**
```jsx
import { QrScanner } from '@yudiel/react-qr-scanner';

const QRScannerModal = ({ onScan, onClose }) => {
    const handleScan = (result) => {
        if (result?.text?.startsWith('SOPP-')) {
            const batchId = result.text.replace('SOPP-', '');
            onScan(batchId);
        }
    };

    return (
        <Modal>
            <h3>Scan QR Code</h3>
            <QrScanner
                onDecode={handleScan}
                onError={(e) => console.log(e?.message)}
            />
            <button onClick={onClose}>Avbryt</button>
        </Modal>
    );
};
```

---

### 5. API Hooks
**Fil:** `D:\dev\sopp-tracker-frontend-v4.4-UNITS-CRUD\src\hooks\useApi.js`

**Nye hooks:**
```javascript
// Print label
export const usePrintLabel = () => {
    return useMutation({
        mutationFn: async ({ batchId, copies = 1 }) => {
            const response = await fetch(`/api/batches/${batchId}/print?copies=${copies}`, {
                method: 'POST'
            });
            return response.json();
        }
    });
};

// Get QR code
export const useQRCode = (batchId) => {
    return useQuery({
        queryKey: ['qr', batchId],
        queryFn: async () => {
            const response = await fetch(`/api/batches/${batchId}/qr`);
            return response.json();
        }
    });
};

// Test printer
export const useTestPrinter = () => {
    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/printer/test', {
                method: 'POST'
            });
            return response.json();
        }
    });
};
```

---

## 🚀 Deployment Plan

### Phase 1: Backend Deployment (Nå)

1. **Installer dependencies:**
```bash
ssh hassio@192.168.1.251
cd /config/sopp-tracker/backend
echo 'etsterktpassord' | sudo -S pip install qrcode[pil]==7.4.2 Pillow==10.1.0 brother-ql==0.9.4
```

2. **Database migration:**
```sql
-- Run on PostgreSQL
ALTER TABLE batches ADD COLUMN qr_code VARCHAR(100) UNIQUE;
ALTER TABLE batches ADD COLUMN qr_data TEXT;
ALTER TABLE batches ADD COLUMN label_printed BOOLEAN DEFAULT FALSE;
ALTER TABLE batches ADD COLUMN label_printed_at TIMESTAMP;
ALTER TABLE batches ADD COLUMN label_print_count INTEGER DEFAULT 0;

CREATE INDEX idx_batches_qr_code ON batches(qr_code);

-- Generate QR codes for existing batches
UPDATE batches SET
    qr_code = 'SOPP-' || id::text,
    qr_data = json_build_object(
        'id', id,
        'spawn_batch', spawn_batch,
        'strain', strain_name,
        'lc', lc_batch
    )::text
WHERE qr_code IS NULL;
```

3. **Restart backend:**
```bash
echo 'etsterktpassord' | sudo -S docker restart sopp-tracker
```

4. **Test endpoints:**
```bash
# Test QR generation
curl http://192.168.1.251:8000/api/batches/1/qr

# Test printer
curl -X POST http://192.168.1.251:8000/api/printer/test

# Test print (if printer is connected)
curl -X POST "http://192.168.1.251:8000/api/batches/1/print?copies=1"
```

---

### Phase 2: Frontend Implementation (Senere)

1. **Create PrintDialog component**
2. **Update NewBatchModal**
3. **Update BatchModal with QR display**
4. **Add API hooks**
5. **Test full workflow**

---

## 📊 Testing Checklist

### Backend Testing:
- [x] Database columns added
- [x] QR code generated on batch creation
- [ ] QR code API returns correct data
- [ ] QR image endpoint returns PNG
- [ ] Lookup by QR code works
- [ ] Print endpoint (requires printer)
- [ ] Test printer endpoint (requires printer)

### Integration Testing (After deployment):
- [ ] Create new batch → QR code auto-generated
- [ ] View batch → QR code visible
- [ ] Print label → Label prints correctly
- [ ] Scan QR code → Opens correct batch
- [ ] Reprint label → Works multiple times

### Label Quality:
- [ ] QR code scannable
- [ ] Text readable
- [ ] Batch info correct
- [ ] Label fits 62mm width
- [ ] Border/margins correct

---

## 🔧 Troubleshooting

### Printer ikke funnet:
```bash
# Finn printer på nettverket
brother_ql discover

# Test connection
brother_ql -p tcp://192.168.1.116 -m QL-820NWB print -l 62 test.png
```

### Database migration feil:
```bash
# Connect to database
docker exec -it sopp-tracker-db psql -U sopp -d sopp_tracker

# Check columns
\d batches
```

### QR code ikke generert:
```bash
# Check logs
docker logs sopp-tracker | grep -i qr

# Manually fix existing batches
UPDATE batches SET qr_code = 'SOPP-' || id::text WHERE qr_code IS NULL;
```

---

## 📝 Configuration

### Environment Variables (Optional)
```env
# .env
PRINTER_ENABLED=true
PRINTER_IP=192.168.1.116
PRINTER_MODEL=QL-820NWB
LABEL_WIDTH=62
LABEL_HEIGHT=100
AUTO_PRINT=false  # Show dialog instead of auto-print
```

---

## 🎯 Status

**Backend:** ✅ KLAR TIL DEPLOYMENT
**Frontend:** ⏳ IKKE STARTET (Venter på deployment av backend)
**Testing:** ⏳ PENDING (Venter på deployment)

---

## 📌 Next Steps

1. **Deploy backend** (Phase 1)
   - Installer dependencies
   - Run database migration
   - Restart container
   - Test endpoints

2. **Test printer connectivity**
   - Call `/api/printer/test`
   - Verify label prints correctly
   - Adjust label design if needed

3. **Implement frontend** (Phase 2)
   - PrintDialog component
   - NewBatchModal integration
   - BatchModal QR display
   - Testing

4. **Go live**
   - Deploy frontend
   - Train users
   - Monitor prints
   - Collect feedback

---

**Implementert av:** Claude Code
**Dato:** 2025-12-03
**Versjon:** v4.7.0-alpha (Backend)
