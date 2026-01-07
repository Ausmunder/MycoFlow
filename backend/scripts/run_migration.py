"""
Run database migration for workflow v4.7.0
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.database import engine, Base
from app.models import Batch, StrainStatistics

def run_migration():
    """Run the workflow v4.7 migration"""
    print("Starting migration for Workflow v4.7.0...")

    with engine.connect() as conn:
        print("Adding new columns to batches table...")

        # Add workflow columns to batches table
        workflow_columns = [
            ("workflow_status", "VARCHAR DEFAULT 'spawning'"),
            ("spawn_expected_ready_date", "TIMESTAMP"),
            ("spawn_actual_ready_date", "TIMESTAMP"),
            ("colonization_expected_date", "TIMESTAMP"),
            ("colonization_actual_date", "TIMESTAMP"),
            ("colonization_temp_c", "FLOAT"),
            ("fruiting_start_date", "TIMESTAMP"),
            ("fruiting_temp_c", "FLOAT"),
            ("flush1_expected_date", "TIMESTAMP"),
            ("flush1_actual_start_date", "TIMESTAMP"),
            ("flush1_harvest_date", "TIMESTAMP"),
            ("flush1_expected_kg", "FLOAT"),
            ("flush1_actual_kg", "FLOAT"),
            ("flush2_expected_date", "TIMESTAMP"),
            ("flush2_actual_start_date", "TIMESTAMP"),
            ("flush2_harvest_date", "TIMESTAMP"),
            ("flush2_expected_kg", "FLOAT"),
            ("flush2_actual_kg", "FLOAT"),
            ("flush3_expected_date", "TIMESTAMP"),
            ("flush3_actual_start_date", "TIMESTAMP"),
            ("flush3_harvest_date", "TIMESTAMP"),
            ("flush3_harvest_kg", "FLOAT"),
        ]

        for col_name, col_type in workflow_columns:
            try:
                conn.execute(text(f"ALTER TABLE batches ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"  ✓ Added {col_name}")
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                    print(f"  - {col_name} already exists")
                else:
                    print(f"  ✗ Error adding {col_name}: {e}")
                conn.rollback()

        print("Adding new columns to strain_statistics table...")

        # Add columns to strain_statistics
        stats_columns = [
            ("avg_spawn_days", "INTEGER"),
            ("avg_fruiting_days", "INTEGER"),
            ("avg_flush1_days", "INTEGER"),
            ("avg_flush2_yield_kg", "FLOAT"),
            ("avg_flushes_per_batch", "FLOAT"),
        ]

        for col_name, col_type in stats_columns:
            try:
                conn.execute(text(f"ALTER TABLE strain_statistics ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"  ✓ Added {col_name}")
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                    print(f"  - {col_name} already exists")
                else:
                    print(f"  ✗ Error adding {col_name}: {e}")
                conn.rollback()

        print("Running data updates...")

        # Update existing workflow_status values
        conn.execute(text(
            "UPDATE batches SET workflow_status = 'spawning' WHERE workflow_status = 'Spawn' OR workflow_status IS NULL"
        ))
        conn.commit()

        # Check if strain_statistics has data
        result = conn.execute(text("SELECT COUNT(*) FROM strain_statistics"))
        count = result.scalar()

        if count == 0:
            print("Seeding initial strain statistics...")
            conn.execute(text("""
                INSERT INTO strain_statistics (
                    strain_name,
                    avg_colonization_days,
                    min_colonization_days,
                    max_colonization_days,
                    avg_spawn_days,
                    avg_fruiting_days,
                    avg_flush1_days,
                    total_batches
                ) VALUES
                ('oyster', 14, 10, 21, 14, 7, 5, 0),
                ('lions_mane', 21, 14, 28, 21, 10, 7, 0),
                ('shiitake', 28, 21, 35, 28, 12, 7, 0)
            """))
            conn.commit()
        else:
            print(f"Strain statistics already has {count} entries, updating existing...")
            conn.execute(text("""
                UPDATE strain_statistics SET
                    avg_spawn_days = CASE
                        WHEN strain_name = 'oyster' THEN 14
                        WHEN strain_name = 'lions_mane' THEN 21
                        WHEN strain_name = 'shiitake' THEN 28
                        ELSE avg_spawn_days
                    END,
                    avg_fruiting_days = CASE
                        WHEN strain_name = 'oyster' THEN 7
                        WHEN strain_name = 'lions_mane' THEN 10
                        WHEN strain_name = 'shiitake' THEN 12
                        ELSE avg_fruiting_days
                    END,
                    avg_flush1_days = CASE
                        WHEN strain_name = 'oyster' THEN 5
                        WHEN strain_name = 'lions_mane' THEN 7
                        WHEN strain_name = 'shiitake' THEN 7
                        ELSE avg_flush1_days
                    END
                WHERE strain_name IN ('oyster', 'lions_mane', 'shiitake')
            """))
            conn.commit()

    print("✓ Migration completed successfully!")
    print("\nWorkflow v4.7.0 features:")
    print("  - Workflow status tracking (spawning → colonizing → fruiting → flush)")
    print("  - AI predictions for each stage")
    print("  - Transition endpoints for workflow progression")
    print("  - Strain statistics with timing data")

if __name__ == "__main__":
    run_migration()
