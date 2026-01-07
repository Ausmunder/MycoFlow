#!/usr/bin/env python3
"""
Run migration to add spawn_contaminated_units and bag_contaminated_units columns
"""
import sys
import os

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def run_migration():
    """Execute the SQL migration"""
    migration_file = os.path.join(os.path.dirname(__file__), 'add_spawn_bag_contaminated_columns.sql')

    with open(migration_file, 'r') as f:
        sql = f.read()

    with engine.connect() as conn:
        # Execute each statement separately
        for statement in sql.split(';'):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                print(f"Executing: {statement[:50]}...")
                conn.execute(text(statement))
                conn.commit()

    print("✓ Migration completed successfully!")
    print("Added columns: spawn_contaminated_units, bag_contaminated_units")

if __name__ == "__main__":
    run_migration()
