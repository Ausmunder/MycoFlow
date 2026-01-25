"""
Migration script: Fix workflow_status inconsistency
Changes 'Spawn' (uppercase) to 'spawning' (lowercase)
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models import Batch

def migrate():
    db = SessionLocal()
    try:
        # Find all batches with 'Spawn' (uppercase)
        batches = db.query(Batch).filter(Batch.workflow_status == 'Spawn').all()
        
        if not batches:
            print("No batches found with workflow_status='Spawn'. Nothing to migrate.")
            return
        
        print(f"Found {len(batches)} batches with workflow_status='Spawn'")
        
        for batch in batches:
            print(f"  - Batch ID {batch.id} ({batch.spawn_batch}): 'Spawn' -> 'spawning'")
            batch.workflow_status = 'spawning'
        
        db.commit()
        print(f"\nSuccessfully migrated {len(batches)} batches to workflow_status='spawning'")
        
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
