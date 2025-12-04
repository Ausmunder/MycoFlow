"""
Migration script: HTML localStorage → PostgreSQL/SQLite
Converts data from LC-Spawn-Bag-tracker v3.1 HTML to new database
"""
import json
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from app.database import SessionLocal
from app.models import Batch, BatchInfo, Template, StrainType, BagStatus, KontamType


def parse_date(date_str):
    """Parse date string to datetime, return None if empty"""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        return None


def parse_float(value):
    """Parse float value, return None if empty"""
    if not value or value == '':
        return None
    try:
        return float(value)
    except:
        return None


def parse_int(value):
    """Parse int value, return None if empty"""
    if not value or value == '':
        return None
    try:
        return int(value)
    except:
        return None


def map_strain(key):
    """Map old strain key to new StrainType enum"""
    mapping = {
        'oyster': StrainType.OYSTER,
        'lionsmane': StrainType.LIONSMANE,
        'shiitake': StrainType.SHIITAKE
    }
    return mapping.get(key, StrainType.OYSTER)


def map_status(status_str):
    """Map status string to BagStatus enum"""
    if not status_str:
        return BagStatus.INOKULERT
    try:
        return BagStatus(status_str)
    except:
        return BagStatus.INOKULERT


def map_kontam(kontam_str):
    """Map contamination string to KontamType enum"""
    if not kontam_str or kontam_str == "Ingen":
        return KontamType.INGEN
    try:
        return KontamType(kontam_str)
    except:
        return KontamType.ANNET


def migrate_batch(row_data, strain):
    """Convert single row from HTML to Batch model"""
    return Batch(
        strain=strain,
        
        # LC
        lc_kode=row_data.get('lcKode', ''),
        lc_vol=row_data.get('lcVol', ''),
        
        # Spawn
        spawn_type=row_data.get('spawnType', ''),
        spawn_batch=row_data.get('spawnBatch', ''),
        spawn_dato_inok=parse_date(row_data.get('spawnDatoInok')),
        spawn_kg=parse_float(row_data.get('spawnKg')),
        spawn_dager_ink=parse_int(row_data.get('spawnDagerInk')),
        
        # Bag
        bag_forventet_kolon=parse_date(row_data.get('bagForventetKolon')),
        bag_substrat_type=row_data.get('substratType', ''),
        bag_kg_substrat=parse_float(row_data.get('bagKgSubstrat')),
        bag_dato_inok=parse_date(row_data.get('bagDatoInok')),
        bag_dager_ink=parse_int(row_data.get('bagDagerInk')),
        bag_status=map_status(row_data.get('bagStatus')),
        bag_kontam=map_kontam(row_data.get('bagKontam')),
        bag_frukting_start=parse_date(row_data.get('bagFruktingStart')),
        bag_temp_kammer=parse_float(row_data.get('bagTempKammer')),
        bag_lf_kammer=parse_float(row_data.get('bagLfKammer')),
        
        # Harvest 1
        bag_host1_start=parse_date(row_data.get('bagHost1Start')),
        bag_host1_slutt=parse_date(row_data.get('bagHost1Slutt')),
        bag_host1_total_kg=parse_float(row_data.get('bagHost1TotalKg')) or 0.0,
        
        # Harvest 2
        bag_host2_start=parse_date(row_data.get('bagHost2Start')),
        bag_host2_slutt=parse_date(row_data.get('bagHost2Slutt')),
        bag_syklus_lengde=parse_int(row_data.get('bagSyklusLengde')),
        bag_host2_total_kg=parse_float(row_data.get('bagHost2TotalKg')) or 0.0,
        
        # Meta
        notater=row_data.get('notater', ''),
        archived=row_data.get('archived', False)
    )


def migrate_templates(templates_data, db):
    """Migrate templates from HTML to database"""
    if not templates_data:
        return 0
    
    count = 0
    for strain_key, strain_templates in templates_data.items():
        strain = map_strain(strain_key)
        for name, template_data in strain_templates.items():
            template = Template(
                name=name,
                strain=strain,
                bag_temp_kammer=parse_float(template_data.get('bagTempKammer')),
                bag_lf_kammer=parse_float(template_data.get('bagLfKammer')),
                bag_substrat_type=template_data.get('substratType'),
                spawn_type=template_data.get('spawnType')
            )
            db.add(template)
            count += 1
    
    return count


def migrate_batch_info(batch_data, db):
    """Migrate batch info from HTML to database"""
    if not batch_data:
        return 0
    
    count = 0
    for batch_code, info in batch_data.items():
        batch_info = BatchInfo(
            batch_code=batch_code,
            strain_name=info.get('strain', ''),
            lc_source=info.get('lcSource', ''),
            generation=parse_int(info.get('generation')),
            notes=info.get('notes', '')
        )
        db.add(batch_info)
        count += 1
    
    return count


def main(json_file_path):
    """
    Main migration function
    
    Usage:
        python migrate_from_html.py path/to/backup.json
    """
    print(f"🍄 Starting migration from {json_file_path}...")
    
    # Load JSON file
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: File not found: {json_file_path}")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON: {e}")
        return
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Migrate batches
        batch_count = 0
        for strain_key in ['oyster', 'lionsmane', 'shiitake']:
            if strain_key in data.get('data', {}):
                strain = map_strain(strain_key)
                for row in data['data'][strain_key]:
                    batch = migrate_batch(row, strain)
                    db.add(batch)
                    batch_count += 1
        
        print(f"✅ Migrated {batch_count} batches")
        
        # Migrate templates
        template_count = migrate_templates(data.get('templates', {}), db)
        print(f"✅ Migrated {template_count} templates")
        
        # Migrate batch info
        batch_info_count = migrate_batch_info(data.get('batchData', {}), db)
        print(f"✅ Migrated {batch_info_count} batch info records")
        
        # Commit all changes
        db.commit()
        
        print(f"\n🎉 Migration complete!")
        print(f"   - {batch_count} batches")
        print(f"   - {template_count} templates")
        print(f"   - {batch_info_count} batch info records")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_from_html.py <path_to_json_file>")
        print("\nExample:")
        print("  python migrate_from_html.py ~/Downloads/LC-Spawn-Bag-tracker-v3-backup-2025-10-28.json")
        sys.exit(1)
    
    json_path = sys.argv[1]
    main(json_path)
