"""
Migration: add strains + cultures traceability tables and Batch lineage FKs.

Idempotent. Works against the app engine (Postgres in production, SQLite in dev).

Steps:
  1. create_all() — creates `strains` and `cultures` tables if missing.
  2. ALTER `batches` ADD COLUMN source_culture_id, strain_id (skip if present).
  3. Backfill `strains` from distinct strain categories found in lc_cultures/batches.
  4. Backfill `cultures` from existing lc_cultures rows (media_type='LC').
  5. Backfill `batches.strain_id` (by category) and `source_culture_id` (by lc_batch == culture code).

Run:  python scripts/add_strains_cultures.py
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app import models
from app.utils.naming import lineage_prefix, current_year_week

# strain_category -> (species_code, latin name)
SPECIES_MAP = {
    "oyster":     ("PO", "Pleurotus ostreatus"),
    "lions_mane": ("HE", "Hericium erinaceus"),
    "shiitake":   ("LE", "Lentinula edodes"),
    "reishi":     ("GL", "Ganoderma lucidum"),
}


def _add_column(conn, table, col, ddl_type):
    try:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl_type}"))
        conn.commit()
        print(f"  [ok] Added {table}.{col}")
    except Exception as e:
        msg = str(e).lower()
        if "already exists" in msg or "duplicate column" in msg:
            print(f"  [skip] {table}.{col} already exists")
        else:
            print(f"  [ERR] {table}.{col}: {e}")
        conn.rollback()


def run():
    print("Migration: strains + cultures + batch lineage FKs")

    # 1. Create new tables
    Base.metadata.create_all(bind=engine)
    print("  [ok] create_all (strains, cultures created if missing)")

    # 2. Add FK columns to batches
    with engine.connect() as conn:
        _add_column(conn, "batches", "source_culture_id", "INTEGER")
        _add_column(conn, "batches", "strain_id", "INTEGER")

    db = SessionLocal()
    try:
        # 3. Backfill strains from distinct categories in lc_cultures + batches
        categories = set()
        for (name,) in db.query(models.LCCulture.strain_name).distinct().all():
            if name:
                categories.add(name)
        for (name,) in db.query(models.Batch.strain_name).distinct().all():
            if name:
                categories.add(name)

        cat_to_strain = {}
        for cat in sorted(categories):
            species_code, latin = SPECIES_MAP.get(cat, (cat[:2].upper() or "XX", None))
            # placeholder strain number "0000" — owner refines in the strain register
            prefix = f"{species_code}0000"
            existing = db.query(models.Strain).filter(
                models.Strain.strain_category == cat
            ).first()
            if existing:
                cat_to_strain[cat] = existing
                continue
            # avoid prefix clash
            n = 0
            base_prefix = prefix
            while db.query(models.Strain).filter(models.Strain.prefix == prefix).first():
                n += 1
                prefix = f"{base_prefix}{n}"
            strain = models.Strain(
                species_code=species_code, strain_number=prefix[len(species_code):],
                prefix=prefix, species_latin=latin, common_name=cat,
                strain_category=cat, active=True,
            )
            db.add(strain)
            db.commit()
            db.refresh(strain)
            cat_to_strain[cat] = strain
            print(f"  [ok] Strain {prefix} ({cat})")

        # 4. Backfill cultures from lc_cultures (media_type='LC')
        for lc in db.query(models.LCCulture).all():
            if db.query(models.Culture).filter(models.Culture.code == lc.lc_code).first():
                continue
            strain = cat_to_strain.get(lc.strain_name)
            if not strain:
                continue
            db.add(models.Culture(
                code=lc.lc_code, strain_id=strain.id, media_type="LC",
                year_week=current_year_week(lc.date_created) if lc.date_created else None,
                source=lc.source, date_created=lc.date_created,
                notes=lc.notes, active=lc.active if lc.active is not None else True,
            ))
        db.commit()
        print("  [ok] Backfilled cultures from lc_cultures")

        # 5. Backfill batch links
        code_to_culture = {c.code: c for c in db.query(models.Culture).all()}
        linked = 0
        for b in db.query(models.Batch).all():
            if b.strain_id is None and b.strain_name in cat_to_strain:
                b.strain_id = cat_to_strain[b.strain_name].id
            if b.source_culture_id is None and b.lc_batch and b.lc_batch in code_to_culture:
                b.source_culture_id = code_to_culture[b.lc_batch].id
                linked += 1
        db.commit()
        print(f"  [ok] Backfilled batch strain_id + {linked} source_culture links")

    finally:
        db.close()

    print("[ok] Migration completed.")


if __name__ == "__main__":
    run()
