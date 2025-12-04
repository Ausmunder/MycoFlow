# 🍄 Feature Plan: LC/Strain Tracking & AI Colonization Prediction

**Versjon:** v4.7.0
**Planlagt:** 2025-12-03
**Prioritet:** HIGH

---

## 📋 Oversikt

Implementere komplett LC/strain tracking system med:
1. LC management (add/edit/delete LCs)
2. Strain statistics og efficiency tracking
3. AI-basert kolonisering prediction
4. UI forbedringer i modals

---

## 🗄️ Database Schema Changes

### Ny tabell: `lc_cultures`

```sql
CREATE TABLE lc_cultures (
    id SERIAL PRIMARY KEY,
    lc_code VARCHAR(50) UNIQUE NOT NULL,          -- GOH2, GOL3, etc.
    strain_name VARCHAR(50) NOT NULL,              -- oyster, lions_mane, shiitake
    source VARCHAR(100),                           -- Origin (agar plate, spore syringe, etc.)
    date_created DATE,                             -- When LC was created
    notes TEXT,                                    -- Additional notes
    active BOOLEAN DEFAULT TRUE,                   -- Active/archived
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO lc_cultures (lc_code, strain_name, source, active) VALUES
('GOH2', 'oyster', 'Agar plate #2', TRUE),
('GOL3', 'oyster', 'Agar plate #3', TRUE),
('LMH1', 'lions_mane', 'Agar plate #1', TRUE),
('SHH1', 'shiitake', 'Agar plate #1', TRUE),
('SHH2', 'shiitake', 'Agar plate #2', TRUE);
```

### Oppdater `batches` tabell:

```sql
-- Add FK constraint for LC tracking
ALTER TABLE batches ADD COLUMN lc_id INTEGER;
ALTER TABLE batches ADD CONSTRAINT fk_lc_culture
    FOREIGN KEY (lc_id) REFERENCES lc_cultures(id);

-- Keep lc_batch as display name, but link to lc_cultures
-- For backwards compatibility and easy display
```

### Ny tabell: `strain_statistics`

```sql
CREATE TABLE strain_statistics (
    id SERIAL PRIMARY KEY,
    strain_name VARCHAR(50) NOT NULL,
    lc_code VARCHAR(50),                           -- Optional: per-LC stats

    -- Colonization stats
    avg_colonization_days INTEGER,                 -- Average days to full colonization
    min_colonization_days INTEGER,                 -- Fastest
    max_colonization_days INTEGER,                 -- Slowest

    -- Yield stats
    avg_yield_kg DECIMAL(10, 2),                   -- Average kg per batch
    total_batches INTEGER DEFAULT 0,               -- Number of batches tracked
    successful_batches INTEGER DEFAULT 0,          -- Non-contaminated
    contamination_rate DECIMAL(5, 2),              -- Percentage

    -- Efficiency (BE% - Biological Efficiency)
    avg_be_percent DECIMAL(5, 2),                  -- Average BE%

    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed initial data based on internet research
INSERT INTO strain_statistics (strain_name, avg_colonization_days, min_colonization_days, max_colonization_days) VALUES
('oyster', 14, 10, 21),          -- Oyster: 10-21 days typical
('lions_mane', 21, 14, 28),      -- Lions Mane: 14-28 days typical
('shiitake', 28, 21, 35);        -- Shiitake: 21-35 days typical
```

---

## 🎨 UI Changes

### 1. NewBatchModal - LC Selection

**Before:**
```
LC Details
  LC Kode: [text input]
```

**After:**
```
LC Culture Selection *
  [Dropdown: Select LC Culture ▼]
    - GOH2 (Oyster)
    - GOL3 (Oyster)
    - LMH1 (Lions Mane)
    - SHH1 (Shiitake)
    - SHH2 (Shiitake)
    - + Add New LC...

  [Info: Shows selected LC details]
    Created: 2024-11-15
    Source: Agar plate #2
```

**"Add New LC" modal:**
```
┌─────────────────────────────────┐
│ Add New LC Culture              │
├─────────────────────────────────┤
│ LC Code: [_______]              │
│ Strain: [oyster ▼]              │
│ Source: [_______]               │
│ Date Created: [YYYY-MM-DD]      │
│ Notes: [____________]           │
│                                 │
│    [Cancel]  [Save LC]          │
└─────────────────────────────────┘
```

### 2. BatchModal - Simplified Layout

**Remove:**
- ❌ Bag Details section (både bag1 og bag2 kolonner i dropdown)
- ❌ Details redigering i modal (skal redigeres i hovedvindu)

**Keep:**
- ✅ LC info (read-only, shows selected LC)
- ✅ Spawn details
- ✅ Units management
- ✅ Basic info

**Move Refrigeration:**
```
BEFORE:
┌─ Spawn Details ───────────┐
│ [Refrigerator icon]       │
└───────────────────────────┘
┌─ Bag Details ─────────────┐
└───────────────────────────┘

AFTER:
┌─ Spawn Details ───────────┐
└───────────────────────────┘
┌─ Storage ─────────────────┐
│ [Refrigerator icon]       │
│ Status: In fridge (5 days)│
└───────────────────────────┘
┌─ Bag Details ─────────────┐
└───────────────────────────┘
```

### 3. Main Table - "Forv" (Forventet kolonisering)

**Current:**
```
SPAWN
Dato | Dager | Type | Forv
```

**Updated:**
```
SPAWN
Dato | Dager | Type | Forv (AI)
                      ↓
             [AUTO-CALCULATED]
             Based on:
             - Strain type
             - Historical data
             - LC performance
```

**Display:**
- If not colonized yet: "Est. 2024-12-15 (12d left)"
- If colonized: "14 days" (actual)
- Color coding:
  - Green: On track
  - Yellow: Slower than expected
  - Red: Much slower (possible issue)

---

## 🤖 AI Colonization Prediction

### Algorithm:

```python
def predict_colonization_date(batch):
    """
    Predict expected colonization date based on:
    1. Strain-specific baseline (from internet research)
    2. Historical performance of this LC
    3. Temperature/humidity if available from HA
    4. Substrate type
    """

    # 1. Get baseline from strain_statistics
    stats = get_strain_stats(batch.strain_name, batch.lc_code)
    baseline_days = stats.avg_colonization_days

    # 2. Adjust based on LC performance
    lc_performance = get_lc_performance(batch.lc_id)
    if lc_performance:
        adjustment = lc_performance.avg_days - baseline_days
        baseline_days += adjustment * 0.5  # Weight historical data 50%

    # 3. Adjust for substrate type
    substrate_factor = {
        'Rye': 1.0,      # Baseline
        'Wheat': 0.9,    # Faster
        'Oats': 1.1,     # Slower
        'Sawdust': 1.3   # Much slower (for shiitake)
    }
    days = baseline_days * substrate_factor.get(batch.substrate, 1.0)

    # 4. Temperature adjustment (if available from HA)
    if batch.avg_temp:
        # Oyster optimal: 20-24°C
        # Lions Mane: 18-22°C
        # Shiitake: 18-21°C
        temp_factor = calculate_temp_factor(batch.strain_name, batch.avg_temp)
        days *= temp_factor

    # 5. Calculate expected date
    spawn_date = batch.spawn_date or batch.spawn_dato_inok
    expected_date = spawn_date + timedelta(days=int(days))

    return {
        'expected_date': expected_date,
        'expected_days': int(days),
        'confidence': calculate_confidence(lc_performance, batch),
        'factors': {
            'baseline': baseline_days,
            'substrate': substrate_factor.get(batch.substrate, 1.0),
            'temperature': temp_factor if batch.avg_temp else None
        }
    }
```

### Learning from actual data:

```python
def update_strain_statistics(batch):
    """
    Update statistics when batch is marked as colonized
    """
    if batch.bag_dato_inok:  # If colonization date is set
        actual_days = (batch.bag_dato_inok - batch.spawn_dato_inok).days

        # Update strain statistics
        update_stats(
            strain=batch.strain_name,
            lc_code=batch.lc_batch,
            colonization_days=actual_days,
            yield_kg=batch.bag_host1_total_kg + batch.bag_host2_total_kg,
            contaminated=batch.bag_kontam is not None
        )
```

---

## 🔌 API Endpoints

### LC Management

```python
# Get all LCs
GET /api/lc-cultures
Response: [
    {
        "id": 1,
        "lc_code": "GOH2",
        "strain_name": "oyster",
        "source": "Agar plate #2",
        "date_created": "2024-11-15",
        "active": true,
        "batch_count": 15  # Number of batches using this LC
    }
]

# Get single LC
GET /api/lc-cultures/{lc_code}

# Create LC
POST /api/lc-cultures
Body: {
    "lc_code": "GOH3",
    "strain_name": "oyster",
    "source": "Spore syringe",
    "date_created": "2024-12-01",
    "notes": "New LC from supplier X"
}

# Update LC
PATCH /api/lc-cultures/{lc_code}

# Delete/Archive LC
DELETE /api/lc-cultures/{lc_code}
```

### Predictions

```python
# Get colonization prediction for batch
GET /api/batches/{batch_id}/prediction
Response: {
    "expected_date": "2024-12-15",
    "expected_days": 14,
    "days_remaining": 7,
    "confidence": 0.85,
    "status": "on_track",  # on_track, slow, very_slow
    "factors": {
        "baseline": 14,
        "substrate_factor": 1.0,
        "temperature_factor": 0.95
    }
}
```

### Statistics

```python
# Get strain statistics
GET /api/stats/strain/{strain_name}
Response: {
    "strain_name": "oyster",
    "avg_colonization_days": 13.5,
    "avg_yield_kg": 2.3,
    "contamination_rate": 5.2,
    "avg_be_percent": 85.3,
    "total_batches": 47,
    "lc_breakdown": [
        {
            "lc_code": "GOH2",
            "batches": 25,
            "avg_colonization_days": 13.0,
            "contamination_rate": 4.0
        }
    ]
}

# Get LC-specific statistics
GET /api/stats/lc/{lc_code}
```

---

## 📊 Strain Efficiency Dashboard (Future)

Placeholder for later implementation:

```
┌─────────────────────────────────────────────────┐
│ Strain Performance Dashboard                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ OYSTER (GOH2)                                   │
│ ━━━━━━━━━━━━━━━━━━━━                           │
│ Avg Colonization: 13 days                      │
│ Contamination Rate: 4%                          │
│ Avg Yield: 2.5 kg/batch                        │
│ BE%: 87%                                        │
│                                                 │
│ [Chart: Yield over time]                        │
│ [Chart: Colonization time distribution]        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Implementation Order

### Phase 1: Database (This sprint)
1. ✅ Create `lc_cultures` table
2. ✅ Add `lc_id` FK to `batches`
3. ✅ Create `strain_statistics` table
4. ✅ Seed initial data

### Phase 2: Backend API (This sprint)
1. ✅ LC CRUD endpoints
2. ✅ Prediction endpoint
3. ✅ Update batch creation to use LC selection
4. ✅ Statistics calculation functions

### Phase 3: Frontend - NewBatchModal (This sprint)
1. ✅ LC dropdown selector
2. ✅ "Add New LC" modal
3. ✅ Remove manual LC Kode input

### Phase 4: Frontend - BatchModal (This sprint)
1. ✅ Remove Bag Details dropdowns
2. ✅ Move refrigeration toggle
3. ✅ Show LC info (read-only)

### Phase 5: Frontend - Main Table (This sprint)
1. ✅ Add "Forv (AI)" column
2. ✅ Show predicted colonization date
3. ✅ Color coding based on status

### Phase 6: AI & Learning (Next sprint)
1. ⏳ Implement prediction algorithm
2. ⏳ Auto-update statistics on batch completion
3. ⏳ Temperature integration from Home Assistant
4. ⏳ Confidence scoring

### Phase 7: Dashboard (Future)
1. 📅 Strain efficiency dashboard
2. 📅 LC comparison charts
3. 📅 Historical trends
4. 📅 Recommendations

---

## 🎯 Success Criteria

### Must Have:
- [x] LC selection dropdown in NewBatchModal
- [x] Ability to add new LCs
- [x] Basic colonization prediction (baseline from strain)
- [x] Show predicted date in "Forv" column
- [x] Refrigeration moved between Spawn/Bag sections

### Nice to Have:
- [ ] Temperature-adjusted predictions (HA integration)
- [ ] Learning from historical data
- [ ] Confidence scores
- [ ] LC performance comparison

### Future:
- [ ] Full strain efficiency dashboard
- [ ] ML-based predictions
- [ ] Automated recommendations
- [ ] Export statistics reports

---

## 📝 Notes

**Baseline Colonization Times (from research):**
- **Oyster:** 10-21 days (avg 14)
- **Lions Mane:** 14-28 days (avg 21)
- **Shiitake:** 21-35 days (avg 28)

**Factors affecting colonization:**
- Temperature (most important)
- Substrate type
- Spawn quality (LC vigor)
- Moisture content
- Container type (bag vs jar)
- Spawn rate (more spawn = faster colonization)

**BE% (Biological Efficiency):**
- Oyster: 80-120% typical
- Lions Mane: 50-80% typical
- Shiitake: 70-100% typical

---

**Status:** 📋 PLANNED
**Next Step:** Start Phase 1 (Database schema)
**Estimated Time:** 2-3 days full implementation
