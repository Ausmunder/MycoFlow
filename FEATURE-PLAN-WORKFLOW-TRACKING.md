# 🍄 Feature Plan: Workflow Status Tracking & AI Predictions

**Versjon:** v4.7.0
**Updated:** 2025-12-03
**Prioritet:** HIGH

---

## 📋 Oversikt

Implementere komplett workflow tracking med AI predictions for hver stage:

**Workflow Stages:**
```
LC → SPAWN → KOLONISERING → FRUKTING → FLUSH 1 → FLUSH 2 → (FLUSH 3...)
```

Hver stage har:
- ✅ Status tracking
- ✅ AI prediction for neste stage
- ✅ Actual dates når stage er completert
- ✅ Transition buttons for å flytte batch til neste stage

---

## 🔄 Workflow Lifecycle

### Stage 1: SPAWN (Grain Spawn Production)
**Start:** Når spawn batch inokuleres med LC
**Duration:** 10-28 dager (avhengig av strain)
**Conditions:** Temperature, substrate type, LC quality
**AI Predicts:** Dato for når spawn er klar til bruk

**Actions:**
- `spawn_dato_inok` settes
- AI beregner `spawn_expected_ready_date`
- Status: `spawning`

**Transition:**
- Button: "Til Kolonisering"
- Sets `spawn_actual_ready_date`
- Status → `colonizing`

---

### Stage 2: KOLONISERING (Substrate Colonization)
**Start:** Når spawn inokuleres i substrate bags
**Duration:** 10-35 dager (avhengig av strain + substrate)
**Conditions:** Temperature, humidity, spawn rate, substrate type
**AI Predicts:** Dato for full kolonisering

**Actions:**
- `bag_dato_inok` settes (kolonisering startet)
- AI beregner `colonization_expected_date`
- Status: `colonizing`

**Transition:**
- Button: "Til Frukting"
- Sets `colonization_actual_date`
- Status → `fruiting`

---

### Stage 3: FRUKTING (Fruiting Initiation)
**Start:** Når bags er fully colonized og åpnes for frukting
**Duration:** 5-10 dager til første pinning
**Conditions:** Temperature drop, FAE (fresh air exchange), humidity
**AI Predicts:** Dato for første flush

**Actions:**
- `fruiting_start_date` settes
- AI beregner `flush1_expected_date`
- Status: `fruiting`

**Transition:**
- Button: "Første Flush Klar"
- Sets `flush1_actual_start_date`
- Status → `flush1`

---

### Stage 4: FLUSH 1 (First Harvest)
**Start:** Første primordier/pins vises
**Duration:** 5-7 dager til harvest
**Conditions:** Maintained humidity, temperature, FAE
**AI Predicts:** Dato for høsting + forventet yield

**Actions:**
- `flush1_actual_start_date` settes
- AI beregner `flush1_harvest_date` + `flush1_expected_kg`
- Status: `flush1_active`

**Completion:**
- Button: "Registrer Høst 1"
- Sets `bag_host1_total_kg` (actual yield)
- Sets `flush1_harvest_date`
- AI beregner `flush2_expected_date`
- Status → `flush1_complete`

---

### Stage 5: FLUSH 2 (Second Harvest)
**Start:** 7-14 dager etter flush 1 harvest
**Duration:** 5-7 dager til harvest
**Conditions:** Rest period, rehydration
**AI Predicts:** Dato for andre høsting + forventet yield

**Actions:**
- AI beregner `flush2_expected_date` + `flush2_expected_kg`
- Status: `flush2_pending`

**When pins appear:**
- Button: "Andre Flush Klar"
- Sets `flush2_actual_start_date`
- Status → `flush2_active`

**Completion:**
- Button: "Registrer Høst 2"
- Sets `bag_host2_total_kg` (actual yield)
- Sets `flush2_harvest_date`
- Status → `complete` or `flush3_pending`

---

### Stage 6: FLUSH 3+ (Optional Additional Harvests)
**Start:** If block still has energy
**Same pattern as Flush 2**

---

## 🗄️ Database Schema Updates

### Update `batches` table:

```sql
-- Add workflow status tracking
ALTER TABLE batches ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'spawning';
-- Values: 'spawning', 'spawn_ready', 'colonizing', 'fruiting', 'flush1_active',
--         'flush1_complete', 'flush2_active', 'flush2_complete', 'complete', 'contaminated'

-- Spawn stage
ALTER TABLE batches ADD COLUMN spawn_expected_ready_date DATE;
ALTER TABLE batches ADD COLUMN spawn_actual_ready_date DATE;

-- Colonization stage
ALTER TABLE batches ADD COLUMN colonization_expected_date DATE;
ALTER TABLE batches ADD COLUMN colonization_actual_date DATE;

-- Fruiting stage
ALTER TABLE batches ADD COLUMN fruiting_start_date DATE;
ALTER TABLE batches ADD COLUMN flush1_expected_date DATE;
ALTER TABLE batches ADD COLUMN flush1_actual_start_date DATE;
ALTER TABLE batches ADD COLUMN flush1_harvest_date DATE;
ALTER TABLE batches ADD COLUMN flush1_expected_kg DECIMAL(10,2);

-- Flush 2
ALTER TABLE batches ADD COLUMN flush2_expected_date DATE;
ALTER TABLE batches ADD COLUMN flush2_actual_start_date DATE;
ALTER TABLE batches ADD COLUMN flush2_harvest_date DATE;
ALTER TABLE batches ADD COLUMN flush2_expected_kg DECIMAL(10,2);

-- Flush 3 (optional)
ALTER TABLE batches ADD COLUMN flush3_expected_date DATE;
ALTER TABLE batches ADD COLUMN flush3_actual_start_date DATE;
ALTER TABLE batches ADD COLUMN flush3_harvest_date DATE;
ALTER TABLE batches ADD COLUMN flush3_harvest_kg DECIMAL(10,2);

-- Keep existing fields for backwards compatibility:
-- bag_dato_inok (colonization start)
-- bag_host1_total_kg (flush 1 yield)
-- bag_host2_total_kg (flush 2 yield)
```

### Update `strain_statistics` table:

```sql
ALTER TABLE strain_statistics ADD COLUMN avg_spawn_days INTEGER;
ALTER TABLE strain_statistics ADD COLUMN avg_fruiting_days INTEGER;
ALTER TABLE strain_statistics ADD COLUMN avg_flush1_days INTEGER;
ALTER TABLE strain_statistics ADD COLUMN avg_flush2_yield_kg DECIMAL(10,2);
ALTER TABLE strain_statistics ADD COLUMN avg_flushes_per_batch DECIMAL(3,1);

-- Seed with research data
UPDATE strain_statistics SET
    avg_spawn_days = 14,
    avg_fruiting_days = 7,
    avg_flush1_days = 5
WHERE strain_name = 'oyster';

UPDATE strain_statistics SET
    avg_spawn_days = 21,
    avg_fruiting_days = 10,
    avg_flush1_days = 7
WHERE strain_name = 'lions_mane';

UPDATE strain_statistics SET
    avg_spawn_days = 28,
    avg_fruiting_days = 12,
    avg_flush1_days = 7
WHERE strain_name = 'shiitake';
```

---

## 🤖 AI Prediction System

### Prediction for each stage:

```python
class WorkflowPredictor:
    """AI predictions for all workflow stages"""

    def predict_spawn_ready(self, batch):
        """Predict when spawn will be ready"""
        stats = get_strain_stats(batch.strain_name, batch.lc_code)
        base_days = stats.avg_spawn_days

        # Adjust for substrate
        substrate_factor = {
            'Rye': 1.0,
            'Wheat': 0.9,
            'Oats': 1.1
        }
        days = base_days * substrate_factor.get(batch.spawn_substrate, 1.0)

        # Temperature adjustment from HA
        if batch.avg_temp:
            days *= self._temp_adjustment(batch.strain_name, batch.avg_temp)

        return batch.spawn_dato_inok + timedelta(days=int(days))

    def predict_colonization(self, batch):
        """Predict when bag will be fully colonized"""
        stats = get_strain_stats(batch.strain_name, batch.lc_code)
        base_days = stats.avg_colonization_days

        # Adjust for substrate type
        substrate_factor = {
            'Straw': 1.0,
            'Masters Mix': 1.2,
            'HWFP': 1.1,  # Hardwood fuel pellets
            'Sawdust': 1.3
        }
        days = base_days * substrate_factor.get(batch.bag_substrat, 1.0)

        # Spawn rate adjustment (more spawn = faster colonization)
        if batch.spawn_rate:  # kg spawn per kg substrate
            if batch.spawn_rate >= 0.05:
                days *= 0.85  # 5% spawn rate = 15% faster
            elif batch.spawn_rate >= 0.03:
                days *= 0.95  # 3% spawn rate = 5% faster

        # Temperature & humidity
        if batch.avg_temp and batch.avg_humidity:
            days *= self._environmental_adjustment(
                batch.strain_name,
                batch.avg_temp,
                batch.avg_humidity
            )

        return batch.bag_dato_inok + timedelta(days=int(days))

    def predict_fruiting(self, batch):
        """Predict when first pins will appear"""
        stats = get_strain_stats(batch.strain_name)
        base_days = stats.avg_fruiting_days

        # Oyster fruits faster than shiitake
        return batch.fruiting_start_date + timedelta(days=int(base_days))

    def predict_flush1_harvest(self, batch):
        """Predict when first flush is ready to harvest"""
        stats = get_strain_stats(batch.strain_name)
        days = stats.avg_flush1_days  # Usually 5-7 days after pins

        return batch.flush1_actual_start_date + timedelta(days=int(days))

    def predict_flush1_yield(self, batch):
        """Predict yield for first flush"""
        stats = get_strain_stats(batch.strain_name)

        # Base on substrate weight
        substrate_kg = sum(unit.kg for unit in batch.units if not unit.contaminated)

        # BE% (Biological Efficiency)
        be_percent = stats.avg_be_percent or 80
        expected_kg = substrate_kg * (be_percent / 100)

        # First flush is usually 60-70% of total yield
        return round(expected_kg * 0.65, 2)

    def predict_flush2(self, batch):
        """Predict second flush timing and yield"""
        # Rest period: 7-14 days after flush 1
        rest_days = {
            'oyster': 7,
            'lions_mane': 10,
            'shiitake': 14
        }

        flush2_date = batch.flush1_harvest_date + timedelta(
            days=rest_days.get(batch.strain_name, 10)
        )

        # Flush 2 is usually 30-40% of total yield
        flush1_kg = batch.bag_host1_total_kg
        flush2_kg = round(flush1_kg * 0.5, 2)  # ~50% of flush 1

        return {
            'expected_date': flush2_date,
            'expected_kg': flush2_kg
        }
```

---

## 🎨 UI Changes

### Main Table - Show Current Stage & Predictions

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Batch  │ Stage        │ Current        │ Next Stage       │ Actions      │
├──────────────────────────────────────────────────────────────────────────┤
│ SP001  │ 🌱 Spawning  │ Day 10 of ~14  │ Ready: Dec 15    │ [Til Kolon.] │
│ SP002  │ 🍄 Koloniser │ Day 18 of ~21  │ Ready: Dec 20    │ [Til Frukt.] │
│ SP003  │ 🌸 Frukting  │ Day 5 of ~7    │ Flush 1: Dec 22  │ [Flush Klar] │
│ SP004  │ ✅ Flush 1   │ Ready to harv. │ Est. 1.2 kg      │ [Reg. Høst]  │
│ SP005  │ ⏳ Flush 2   │ Rest (day 3/7) │ Pins: Dec 28     │              │
└──────────────────────────────────────────────────────────────────────────┘
```

**Color coding:**
- 🟢 Green: On track
- 🟡 Yellow: Slower than expected
- 🔴 Red: Much slower (possible issue)
- ⚫ Gray: Contaminated

### BatchModal - Workflow Section

```
┌─────────────────────────────────────────────────────────┐
│ Workflow Progress                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✅ Spawn       ━━━━━━━━━━━━━━ 14 days (Dec 1 - Dec 15) │
│                Expected: Dec 15  Actual: Dec 15  ✓     │
│                                                         │
│ ⏳ Kolonisering ━━━━━━━━━━━━━━ 21 days                 │
│                Expected: Jan 5   Current: Day 10/21    │
│                Status: On track  🟢                     │
│                [Til Frukting] ← Click when colonized   │
│                                                         │
│ ⬜ Frukting     ━━━━━━━━━━━━━━ ~7 days                 │
│                Expected: Jan 12                         │
│                                                         │
│ ⬜ Flush 1      ━━━━━━━━━━━━━━ ~5 days                 │
│                Expected yield: 1.2 kg                   │
│                                                         │
│ ⬜ Flush 2      ━━━━━━━━━━━━━━ ~7 days rest            │
│                Expected yield: 0.6 kg                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Transition Buttons

When clicked:
1. **"Til Kolonisering"** (From Spawn Ready)
   - Opens modal: "Kolonisering startet?"
   - Inputs:
     - Dato inokulert: [Today default]
     - Substrat type: [Masters Mix ▼]
     - Total substrate kg: [Auto from units]
     - Spawn rate: [Auto calculated]
   - Sets: `bag_dato_inok`, `workflow_status = 'colonizing'`

2. **"Til Frukting"** (From Colonizing)
   - Opens modal: "Full kolonisering bekreftet?"
   - Inputs:
     - Actual kolonisering dato: [Today default]
     - Notes: [Any observations]
   - Sets: `colonization_actual_date`, `fruiting_start_date`, `workflow_status = 'fruiting'`

3. **"Første Flush Klar"** (From Fruiting)
   - Opens modal: "Pins observert?"
   - Inputs:
     - Pin formation date: [Today default]
   - Sets: `flush1_actual_start_date`, `workflow_status = 'flush1_active'`

4. **"Registrer Høst 1"** (From Flush 1)
   - Opens modal: "Registrer første høst"
   - Inputs:
     - Harvest date: [Today default]
     - Total yield (kg): [____]
     - Quality notes: [____]
   - Sets: `bag_host1_total_kg`, `flush1_harvest_date`, `workflow_status = 'flush1_complete'`

5. **"Registrer Høst 2"** (From Flush 2)
   - Similar to above
   - Sets: `bag_host2_total_kg`, `flush2_harvest_date`, `workflow_status = 'complete'`

---

## 🔌 API Endpoints

### Workflow Transitions

```python
# Get workflow status
GET /api/batches/{batch_id}/workflow
Response: {
    "current_stage": "colonizing",
    "current_stage_day": 10,
    "current_stage_expected_days": 21,
    "next_stage": "fruiting",
    "predictions": {
        "colonization_complete": "2025-01-05",
        "fruiting_start": "2025-01-05",
        "flush1_pins": "2025-01-12",
        "flush1_harvest": "2025-01-19",
        "flush1_expected_kg": 1.2,
        "flush2_start": "2025-01-26",
        "flush2_expected_kg": 0.6
    },
    "status": "on_track",  # on_track, slow, very_slow
    "available_actions": ["transition_to_fruiting"]
}

# Transition to next stage
POST /api/batches/{batch_id}/workflow/transition
Body: {
    "action": "start_colonization",  # start_colonization, start_fruiting, start_flush1, harvest_flush1, etc.
    "date": "2025-12-03",
    "substrate_type": "Masters Mix",  # If starting colonization
    "yield_kg": 1.5,  # If harvesting
    "notes": "Full colonization, healthy mycelium"
}

# Update predictions (called after each transition)
POST /api/batches/{batch_id}/workflow/update-predictions
```

---

## 📊 Statistics Integration

Track accuracy of predictions:

```python
def calculate_prediction_accuracy(batch):
    """Track how accurate our predictions are"""
    accuracies = []

    if batch.spawn_actual_ready_date and batch.spawn_expected_ready_date:
        diff = abs((batch.spawn_actual_ready_date - batch.spawn_expected_ready_date).days)
        accuracies.append({
            'stage': 'spawn',
            'difference_days': diff,
            'percentage_error': (diff / 14) * 100  # Assuming 14 day baseline
        })

    if batch.colonization_actual_date and batch.colonization_expected_date:
        diff = abs((batch.colonization_actual_date - batch.colonization_expected_date).days)
        accuracies.append({
            'stage': 'colonization',
            'difference_days': diff,
            'percentage_error': (diff / 21) * 100
        })

    # Update strain_statistics with actual data
    update_strain_statistics(batch, accuracies)
```

---

## 🎯 Implementation Priority

### Phase 1: Database & Backend (Start now)
1. ✅ Add workflow status columns to batches
2. ✅ Create workflow transition endpoints
3. ✅ Implement basic prediction logic
4. ✅ Update strain_statistics

### Phase 2: UI - Main Table
1. ✅ Add stage column with icons
2. ✅ Show current progress (Day X of Y)
3. ✅ Show next prediction
4. ✅ Add transition buttons

### Phase 3: UI - BatchModal
1. ✅ Workflow progress section
2. ✅ Transition modal dialogs
3. ✅ Visual timeline

### Phase 4: AI Enhancement
1. ⏳ Learn from historical data
2. ⏳ Temperature/humidity integration
3. ⏳ Confidence scores
4. ⏳ Yield prediction refinement

---

## ✅ Success Criteria

- [ ] Batch can transition through all stages
- [ ] AI predictions shown for each stage
- [ ] Actual dates recorded vs predicted
- [ ] Statistics updated with each completion
- [ ] UI shows clear current stage and next steps
- [ ] Transition buttons only show when appropriate
- [ ] Color coding indicates on-track vs slow progress

---

**Status:** 📋 READY TO IMPLEMENT
**Next Step:** Database schema updates
**Estimated Time:** 3-4 days full implementation
