# Changelog - MycoFlow

All notable changes to this project will be documented in this file.

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
- Frontend deployed to Home Assistant (`k:\www\sopp-tracker\`)
- Backend deployed to Home Assistant (`k:\sopp-tracker\`)
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
