# 🏷️ Feature Plan: QR Code Labels & Brother Printer Integration

**Versjon:** v4.7.0
**Prioritet:** HIGH (Must implement before workflow tracking)
**Printer:** Brother QL-820NWB

---

## 📋 Oversikt

Automatisk generering og printing av QR-kode labels når en batch opprettes.

**Features:**
- ✅ Unique QR code per batch
- ✅ Automatic label generation
- ✅ Brother QL-820NWB network printer integration
- ✅ QR scan for quick batch lookup
- ✅ Label template with batch info

---

## 🗄️ Database Schema

### Update `batches` table:

```sql
-- Add QR code tracking
ALTER TABLE batches ADD COLUMN qr_code VARCHAR(100) UNIQUE;
ALTER TABLE batches ADD COLUMN qr_data TEXT;  -- JSON data encoded in QR
ALTER TABLE batches ADD COLUMN label_printed BOOLEAN DEFAULT FALSE;
ALTER TABLE batches ADD COLUMN label_printed_at TIMESTAMP;
ALTER TABLE batches ADD COLUMN label_print_count INTEGER DEFAULT 0;

-- Create index for fast QR lookups
CREATE INDEX idx_batches_qr_code ON batches(qr_code);
```

---

## 🏷️ QR Code Format

### QR Code Content:

**Format:** `https://sopp.skogbunn.no/batch/{batch_id}` or `SOPP-{batch_id}`

**Option 1: Simple ID (Recommended)**
```
SOPP-123
```
- Small QR code, easy to scan
- Fast lookup
- Works offline

**Option 2: Full URL**
```
https://192.168.1.251/sopp-tracker/batch/123
```
- Opens directly in app
- Works on any device
- Requires network

**Option 3: Encoded Data (Advanced)**
```json
{
  "id": 123,
  "spawn_batch": "SP001",
  "strain": "oyster",
  "lc": "GOH2",
  "created": "2025-12-03"
}
```
- All info in QR code
- Works 100% offline
- Larger QR code

**Recommendation:** Use Option 1 (Simple ID) for small, scannable labels.

---

## 🖨️ Brother QL-820NWB Integration

### Printer Specs:
- **Model:** Brother QL-820NWB
- **Connection:** WiFi / Ethernet / USB
- **Label Width:** 62mm (recommended for this use case)
- **Resolution:** 300 x 600 dpi
- **Speed:** 110 labels/minute

### Python Library: `brother_ql`

```bash
pip install brother_ql pillow qrcode
```

### Printer Setup:

```python
# backend/app/printer.py

from brother_ql import BrotherQLRaster, create_label
from brother_ql.backends import backend_factory, guess_backend
from PIL import Image, ImageDraw, ImageFont
import qrcode
import io

class BrotherPrinter:
    """Brother QL-820NWB label printer integration"""

    def __init__(self, printer_identifier='tcp://192.168.1.XXX'):
        """
        Initialize printer
        printer_identifier can be:
        - 'tcp://192.168.1.XXX' for network
        - 'usb://0x04f9:0x209b' for USB
        - 'file:///dev/usb/lp0' for Linux USB
        """
        self.printer_identifier = printer_identifier
        self.model = 'QL-820NWB'
        self.backend = guess_backend(printer_identifier)

    def create_batch_label(self, batch, width=62, height=100):
        """
        Create label image for batch

        Args:
            batch: Batch object
            width: Label width in mm (62mm standard)
            height: Label height in mm (100mm for full info)

        Returns:
            PIL Image object
        """
        # Convert mm to pixels (300 dpi)
        width_px = int(width * 11.81)  # 62mm = ~732px
        height_px = int(height * 11.81)  # 100mm = ~1181px

        # Create blank label
        img = Image.new('RGB', (width_px, height_px), 'white')
        draw = ImageDraw.Draw(img)

        # Load fonts
        try:
            font_large = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 60)
            font_medium = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 40)
            font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 30)
        except:
            # Fallback to default font
            font_large = ImageFont.load_default()
            font_medium = ImageFont.load_default()
            font_small = ImageFont.load_default()

        # Generate QR code
        qr_data = f"SOPP-{batch.id}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")

        # Resize QR code to fit label (400x400px)
        qr_img = qr_img.resize((400, 400))

        # Paste QR code at top
        img.paste(qr_img, (166, 50))  # Centered: (732-400)/2 = 166

        # Add batch info below QR
        y_offset = 480

        # Spawn Batch Name (Large)
        text = batch.spawn_batch or f"B-{batch.id}"
        bbox = draw.textbbox((0, 0), text, font=font_large)
        text_width = bbox[2] - bbox[0]
        x = (width_px - text_width) / 2
        draw.text((x, y_offset), text, fill='black', font=font_large)
        y_offset += 80

        # Strain
        text = f"Strain: {batch.strain_name.title()}"
        bbox = draw.textbbox((0, 0), text, font=font_medium)
        text_width = bbox[2] - bbox[0]
        x = (width_px - text_width) / 2
        draw.text((x, y_offset), text, fill='black', font=font_medium)
        y_offset += 60

        # LC Code
        if batch.lc_batch:
            text = f"LC: {batch.lc_batch}"
            bbox = draw.textbbox((0, 0), text, font=font_medium)
            text_width = bbox[2] - bbox[0]
            x = (width_px - text_width) / 2
            draw.text((x, y_offset), text, fill='black', font=font_medium)
            y_offset += 60

        # Date
        date_str = batch.created_at.strftime('%d.%m.%Y')
        text = f"Opprettet: {date_str}"
        bbox = draw.textbbox((0, 0), text, font=font_small)
        text_width = bbox[2] - bbox[0]
        x = (width_px - text_width) / 2
        draw.text((x, y_offset), text, fill='black', font=font_small)

        # Add border
        draw.rectangle([(10, 10), (width_px-10, height_px-10)], outline='black', width=3)

        return img

    def print_label(self, batch, copies=1):
        """
        Print label for batch

        Args:
            batch: Batch object
            copies: Number of copies to print

        Returns:
            bool: Success status
        """
        try:
            # Create label image
            label_img = self.create_batch_label(batch)

            # Convert to correct format for Brother QL
            qlr = BrotherQLRaster(self.model)
            qlr.exception_on_warning = True

            # Create label instructions
            instructions = create_label(
                qlr,
                label_img,
                '62',  # 62mm label
                threshold=70.0,
                cut=True,
                rotate=0
            )

            # Send to printer
            be = backend_factory(self.backend)
            be['list_available_devices']()
            be['setup'](self.printer_identifier)

            for _ in range(copies):
                be['send'](instructions)

            return True

        except Exception as e:
            print(f"Print error: {e}")
            return False

    def test_print(self):
        """Print test label"""
        img = Image.new('RGB', (732, 400), 'white')
        draw = ImageDraw.Draw(img)
        draw.text((200, 150), "Test Label", fill='black')

        qlr = BrotherQLRaster(self.model)
        instructions = create_label(qlr, img, '62')

        be = backend_factory(self.backend)
        be['setup'](self.printer_identifier)
        be['send'](instructions)
```

---

## 🎨 Label Template Design

### 62mm x 100mm Label Layout:

```
┌────────────────────────────────┐
│                                │
│       ┌──────────────┐         │
│       │              │         │
│       │   QR CODE    │         │
│       │   400x400px  │         │
│       │              │         │
│       └──────────────┘         │
│                                │
│        SP001                   │  ← Spawn Batch (Large, Bold)
│                                │
│      Strain: Oyster            │  ← Strain (Medium)
│                                │
│       LC: GOH2                 │  ← LC Code (Medium)
│                                │
│  Opprettet: 03.12.2025         │  ← Date (Small)
│                                │
└────────────────────────────────┘
```

### Alternative: Compact 62mm x 29mm Label:

```
┌───────────────────────────────────────┐
│  ┌────┐  SP001 | Oyster | GOH2       │
│  │ QR │  03.12.2025                   │
│  └────┘                               │
└───────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### QR Code & Printing

```python
# Generate QR code for batch
GET /api/batches/{batch_id}/qr
Response: {
    "qr_code": "SOPP-123",
    "qr_data": "SOPP-123",
    "qr_image_url": "/api/batches/123/qr/image",
    "label_printed": true,
    "label_print_count": 2
}

# Get QR code as image
GET /api/batches/{batch_id}/qr/image
Response: PNG image (base64 or direct download)

# Print label
POST /api/batches/{batch_id}/print
Body: {
    "copies": 1,
    "printer": "auto"  # or specific printer ID
}
Response: {
    "success": true,
    "message": "Label printed successfully",
    "copies_printed": 1
}

# Reprint label
POST /api/batches/{batch_id}/reprint
Body: { "copies": 1 }

# Lookup batch by QR code
GET /api/batches/qr/{qr_code}
Example: GET /api/batches/qr/SOPP-123
Response: {
    "id": 123,
    "spawn_batch": "SP001",
    "strain_name": "oyster",
    "lc_batch": "GOH2",
    "workflow_status": "colonizing",
    "created_at": "2025-12-03T10:00:00Z"
}

# Scan QR and open batch modal
GET /batch/qr/{qr_code}
→ Redirects to /batch/123 with modal open
```

---

## 🎯 Frontend Integration

### NewBatchModal - Auto-print on creation

```javascript
// After batch is created
const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        // Create batch
        const newBatch = await createBatchMutation.mutateAsync(formData);

        // Auto-print label
        if (autoPrintLabel) {  // User setting
            await printLabel(newBatch.id, 1);
            toast.success('Batch opprettet og label printet!');
        } else {
            toast.success('Batch opprettet!');
            // Show print dialog
            setPrintDialog({
                open: true,
                batchId: newBatch.id
            });
        }

        onClose();
    } catch (error) {
        console.error('Error:', error);
    }
};
```

### Print Dialog Component

```jsx
const PrintDialog = ({ batchId, onClose }) => {
    const [copies, setCopies] = useState(1);

    const handlePrint = async () => {
        try {
            await printLabel(batchId, copies);
            toast.success(`${copies} label(s) printet!`);
            onClose();
        } catch (error) {
            toast.error('Print feilet: ' + error.message);
        }
    };

    return (
        <Modal>
            <h3>Print Label</h3>
            <p>Batch: SP001</p>
            <label>
                Antall kopier:
                <input
                    type="number"
                    min="1"
                    max="10"
                    value={copies}
                    onChange={(e) => setCopies(e.target.value)}
                />
            </label>
            <button onClick={handlePrint}>Print</button>
            <button onClick={onClose}>Avbryt</button>
        </Modal>
    );
};
```

### BatchModal - Reprint button

```jsx
<div className="qr-section">
    <h4>QR Code</h4>
    <img src={`/api/batches/${batch.id}/qr/image`} alt="QR Code" />
    <p>Code: {batch.qr_code}</p>
    <button onClick={handleReprint}>
        🖨️ Skriv ut label
    </button>
</div>
```

### QR Scanner Component

```jsx
import { QrScanner } from '@yudiel/react-qr-scanner';

const QRScannerModal = ({ onScan, onClose }) => {
    const handleScan = (result) => {
        if (result) {
            const qrCode = result.text;
            // Extract batch ID from QR code
            if (qrCode.startsWith('SOPP-')) {
                const batchId = qrCode.replace('SOPP-', '');
                onScan(batchId);
            }
        }
    };

    return (
        <Modal>
            <h3>Scan QR Code</h3>
            <QrScanner
                onDecode={handleScan}
                onError={(error) => console.log(error?.message)}
            />
            <button onClick={onClose}>Avbryt</button>
        </Modal>
    );
};

// In main app
const handleQRScan = (batchId) => {
    // Open batch modal
    navigate(`/batch/${batchId}`);
    setQRScannerOpen(false);
};

// Add scan button to header
<button onClick={() => setQRScannerOpen(true)}>
    📷 Scan QR
</button>
```

---

## ⚙️ Configuration

### Environment Variables

```env
# .env
PRINTER_ENABLED=true
PRINTER_TYPE=brother_ql
PRINTER_MODEL=QL-820NWB
PRINTER_IDENTIFIER=tcp://192.168.1.250
PRINTER_LABEL_WIDTH=62
PRINTER_AUTO_PRINT=true
```

### Settings in UI

```jsx
<Settings>
    <h3>Printer Settings</h3>

    <label>
        <input type="checkbox" checked={autoPrint} onChange={...} />
        Auto-print labels når batch opprettes
    </label>

    <label>
        Printer IP:
        <input type="text" value={printerIP} onChange={...} />
    </label>

    <label>
        Label bredde:
        <select value={labelWidth} onChange={...}>
            <option value="29">29mm</option>
            <option value="62">62mm (anbefalt)</option>
            <option value="102">102mm</option>
        </select>
    </label>

    <button onClick={testPrint}>Test Print</button>
</Settings>
```

---

## 📱 Mobile QR Scanning

### PWA Integration

```javascript
// In manifest.json
{
    "name": "Sopp Tracker",
    "short_name": "Sopp",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#1e293b",
    "icons": [...],
    "permissions": ["camera"]  // For QR scanning
}
```

### Add scan shortcut to home screen

```jsx
// Quick action: Scan QR
<FloatingActionButton onClick={openQRScanner}>
    📷
</FloatingActionButton>
```

---

## 🔄 Workflow Integration

### Auto-print on stage transitions

```python
# When batch moves to colonization
def transition_to_colonization(batch_id, data):
    batch = update_batch_status(batch_id, 'colonizing', data)

    # Optionally print new label with updated stage
    if settings.PRINTER_AUTO_PRINT_ON_TRANSITION:
        print_label(batch, copies=1)

    return batch
```

---

## 📊 Label Printing Statistics

Track label usage:

```sql
CREATE TABLE label_print_log (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id),
    printed_at TIMESTAMP DEFAULT NOW(),
    printed_by VARCHAR(100),  -- User or 'auto'
    copies INTEGER DEFAULT 1,
    printer_id VARCHAR(100)
);
```

---

## 🎯 Implementation Order

### Phase 1: QR Generation (Today)
1. ✅ Add qr_code columns to batches
2. ✅ Generate QR code on batch creation
3. ✅ QR lookup endpoint

### Phase 2: Label Design (Today)
1. ✅ Create label template (PIL/Python)
2. ✅ QR code image generation
3. ✅ Test label design

### Phase 3: Printer Integration (Tomorrow)
1. ✅ Install brother_ql library
2. ✅ Test printer connection
3. ✅ Print endpoint
4. ✅ Auto-print on batch creation

### Phase 4: Frontend (Tomorrow)
1. ✅ Print dialog
2. ✅ QR scanner component
3. ✅ Reprint button in BatchModal
4. ✅ Settings page

---

## ✅ Success Criteria

- [x] QR code generated for each batch
- [x] Label prints automatically when batch created
- [x] QR code can be scanned to open batch
- [x] Reprint functionality works
- [x] Label shows: QR + Batch name + Strain + LC + Date
- [x] Works with Brother QL-820NWB over network

---

## 🔧 Troubleshooting

### Printer not found
```bash
# Find printer on network
brother_ql discover

# Test connection
brother_ql -p tcp://192.168.1.250 -m QL-820NWB print -l 62 test.png
```

### Label too large
- Reduce QR code size
- Use smaller fonts
- Switch to 29mm compact format

### QR code not scanning
- Increase QR error correction level
- Make QR code larger
- Ensure good contrast (black on white)

---

**Priority:** 🔴 HIGH - Implement before workflow tracking
**Status:** 📋 READY TO IMPLEMENT
**Estimated Time:** 1 day
