# Changelog - MycoFlow

All notable changes to this project will be documented in this file.

## [5.1.1] - 2026-03-01

### Bug Fix: BE% utregning
- Fjernet feil moisture-korreksjon fra `calculate_be_percent` i `calculations.py`
- `bag_kg_substrat` er tørrvekt — koden behandlet det feilaktig som vektvekt og dividerte på `kg × (1 - fuktinnhold)` istedenfor `kg` direkte
- Eksempel OST-B03: 169,6% → 64,4% (11,6 kg høst / 18,0 kg tørrvekt)
- Alle eksisterende batches rekalkulert i databasen (LM-B04: 36,8%, OST-B03: 64,4%, OST-B05: 15,8%)
- `workflow.py` hadde riktig formel fra før — `calculations.py` er nå konsistent

---

## [5.1.0] - 2026-03-01

### Contamination modal (per-fase kontaminasjon)
- Ny `ContaminationModal.jsx` — åpnes ved klikk på kontaminasjonscellen i tabellen
- Registrering per fase: Spawn, Inkubering, Frukt 1, Frukt 2
- Antall kontaminerte enheter (1–5) via klikk-knapper (rød når valgt)
- Kontaminasjonstype per fase: Grønn mugg, Sort mugg, Cobweb, Wet spot (oransje når valgt)
- Abortert per fase (boolean toggle, amber) — skilt fra kontaminasjon med vertikal skillelinje
- Abortert = sopp danner ikke fruktlegemer, ikke kontaminasjon

### Abortert-statistikk
- `StatsPanel` viser nytt kort: "Abortert" med XCircle-ikon (amber)
- `/api/stats` returnerer nå `abortert_batches` (antall batches med ≥1 abortert fase)
- Adskilt fra `contamination_rate` — kontaminasjonsstatistikk påvirkes ikke

### Substrat-database tilgang
- "🧪 Substrat"-knapp i toppnavigasjon for direkte tilgang til SubstrateMixManager
- `SubstrateMixManager` støtter nå dual-mode: modal (med X) og full-side (uten X)

### Database
- Nye kolonner: `inkubering_contaminated_units`, `frukt1_contaminated_units`, `frukt2_contaminated_units`
- Nye kolonner: `spawn/inkubering/frukt1/frukt2_contamination_type` (VARCHAR)
- Nye kolonner: `spawn/inkubering/frukt1/frukt2_abortert` (BOOLEAN DEFAULT FALSE)

---

## [5.0.1] - 2026-02-24

### Security
- Removed exposed credentials (SSH private key, GitHub password, PostgreSQL password) from git history using `git filter-repo`
- Added `claude-setup.md` to `.gitignore` to prevent future credential exposure
- Rotated all compromised credentials: SSH key, GitHub password, PostgreSQL password
- Updated `docker-compose.yml` and `restart.sh` on HA with new PostgreSQL password

---

## [5.0.0] - 2026-01-25

### Dashboard Redesign
- 4 strain cards (Alle, Østers, Lions Mane, Shiitake) with color-coding
- Each card shows: active batches, total harvest, BE%, contamination rate
- Active batch list with workflow status and days-to-completion
- Integrated charts (weekly harvest trend + BE% trend, 10 weeks)
- Removed LC cultures box and archived batches box from dashboard

### API
- New endpoint: `/api/stats/weekly-trends?weeks=10&strain=oyster`

### Bug Fixes
- Fixed workflow_status inconsistency (Spawn vs spawning)
- Added Fruktdato column to batch table (editable after →Frukt)
- Fixed contamination stats to count bags instead of batches
- Column visibility uses toggle buttons instead of checkboxes
- Renamed "Batch Table" to "Batch oversikt"
- Removed Charts from top navigation (now in Dashboard)

### Dependencies
- Added: react-chartjs-2

---

## [1.0.0] - 2026-01-07

### 🎉 Major Refactoring - Sopp Tracker → MycoFlow

This release represents a complete rebranding and refactoring of the application from "Sopp Tracker" to "MycoFlow v1.0".

### Changed

#### Branding & Versioning
- **Application name**: "Sopp Tracker" → "MycoFlow"
- **Version**: Consolidated from multiple versions (v3.1, v4.6, v4.7) → v1.0.0
- All UI elements updated with new branding
- Browser tab title, headers, and help modal updated

#### Frontend Improvements
- Created centralized `src/config/version.js` for version management
- Created centralized `src/config/config.js` for environment-based configuration
- Created `src/config/constants.js` with:
  - Strain definitions and baseline data
  - Workflow and bag status constants
  - Status colors and helper functions
- Merged `dateFormat.js` + `dateCalculations.js` → `dateUtils.js`
- Removed duplicate utility file `calculations.js`
- Added `.env.example` for configuration documentation

#### Backend Improvements
- Created `app/core/version.py` for centralized version info
- Created `app/core/config.py` with pydantic settings for environment variables
- Created `app/core/constants.py` with strain baselines and constants
- Created `app/core/exceptions.py` with custom exception classes:
  - `BatchNotFoundException`
  - `LCCultureNotFoundException`
  - `ValidationException`
  - `DatabaseException`
- Created `app/services/base.py` with `BaseService` class providing:
  - `get_or_404()` - Get object or raise 404
  - `get_all()` - Get all with filtering
  - `create()` - Create new object
  - `update()` - Update existing object
  - `delete()` - Delete object
- Added `.env.example` for configuration documentation

### Deployment
- Frontend deployed to Home Assistant (`k:\www\mycoflow\`)
- Backend deployed to Home Assistant (`k:\mycoflow\`)
- Backend container restarted successfully
- API now returns `"version": "1.0.0"`

### Technical Debt Reduced
- Eliminated hardcoded IPs and URLs (now in config files)
- Removed duplicate code across utilities
- Centralized magic strings and constants
- Improved code organization with clear separation of concerns

### Migration Notes
- **Breaking**: Version number reset to 1.0.0
- **Non-breaking**: All existing features preserved
- **Deployment**: Restart backend required to see new version

---

## [4.7.0] - Previous Release

### Added
- Workflow status tracking
- QR code label printing
- LC strain tracking improvements

---

## Future Releases

### Planned for v1.1+
- TypeScript migration
- Comprehensive test suite (>70% coverage)
- Database model refactoring
- Component splitting (BatchTable, Dashboard, NewBatchModal)
- Performance optimizations
- Error boundaries
- Storybook for component library
- CI/CD pipeline
