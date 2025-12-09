"""
Main FastAPI application for Sopp Tracker v4.6 - FULL STRUCTURE
Entry point for the backend API with complete LC-Spawn-Bag tracking
"""
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import json
from .database import engine, get_db, Base
from . import models, schemas

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Sopp Tracker API",
    description="API for Skogbunn Mikromusheri LC-Spawn-Bag tracking system",
    version="4.6.1"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://192.168.1.251:3001",
        "http://192.168.1.251:8123"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "OK",
        "version": "4.6.1",
        "features": [
            "Full LC-Spawn-Bag structure",
            "Harvest tracking (H1 + H2)",
            "Biological Efficiency calculation",
            "Refrigeration tracking",
            "Unit-level contamination",
            "Auto field calculations"
        ]
    }

# ==================== HELPER FUNCTIONS ====================

def convert_empty_to_none(data: dict) -> dict:
    """Convert empty strings to None in dictionary"""
    return {k: (None if v == "" else v) for k, v in data.items()}

def serialize_batch(batch: models.Batch, db: Session = None) -> dict:
    """Serialize batch with all fields including calculated ones"""
    # Get unit count if spawn_batch exists
    unit_count = 0
    if batch.spawn_batch and db:
        batch_info = db.query(models.BatchInfo).filter(
            models.BatchInfo.spawn_batch == batch.spawn_batch
        ).first()
        if batch_info:
            unit_count = db.query(models.BatchUnit).filter(
                models.BatchUnit.batch_info_id == batch_info.id
            ).count()

    # Auto-calculate spawn_forventet_ferdig if not set
    spawn_forventet_ferdig = batch.spawn_forventet_ferdig
    if not spawn_forventet_ferdig and batch.spawn_dato_inok and batch.strain_name:
        # Baseline spawn colonization days
        spawn_baseline = {
            "oyster": 10,
            "lions_mane": 12,
            "shiitake": 14,
            "reishi": 16
        }
        days = spawn_baseline.get(batch.strain_name, 12)
        spawn_forventet_ferdig = batch.spawn_dato_inok + timedelta(days=days)

    batch_dict = {
        "id": batch.id,
        "batch_type": batch.batch_type,
        "strain_name": batch.strain_name,
        "archived": batch.archived,
        "notes": batch.notes,
        "created_at": batch.created_at,
        "updated_at": batch.updated_at,

        # LC
        "lc_batch": batch.lc_batch,
        "lc_vol": batch.lc_vol,
        "lc_dato_inok": batch.lc_dato_inok,

        # Spawn
        "spawn_batch": batch.spawn_batch,
        "spawn_type": batch.spawn_type,
        "spawn_dato_inok": batch.spawn_dato_inok,
        "spawn_kg": batch.spawn_kg,
        "spawn_dager_ink": batch.spawn_dager_ink,
        "spawn_forventet_ferdig": spawn_forventet_ferdig,
        "unit_count": unit_count,

        # Bag - Basis
        "bag_batch": batch.bag_batch,
        "bag_forventet_kolon": batch.bag_forventet_kolon,
        "bag_substrat_type": batch.bag_substrat_type,
        "bag_kg_substrat": batch.bag_kg_substrat,
        "bag_dato_inok": batch.bag_dato_inok,
        "bag_dager_ink": batch.bag_dager_ink,
        "bag_status": batch.bag_status,
        "bag_temp": batch.bag_temp,

        # Bag - Frukting
        "bag_frukting_start": batch.bag_frukting_start,
        "bag_temp_kammer": batch.bag_temp_kammer,
        "bag_lf_kammer": batch.bag_lf_kammer,
        
        # Bag - Høst 1
        "bag_host1_start": batch.bag_host1_start,
        "bag_host1_slutt": batch.bag_host1_slutt,
        "bag_host1_total_kg": batch.bag_host1_total_kg,
        "bag_host1_dager": batch.bag_host1_dager,
        
        # Bag - Høst 2
        "bag_host2_start": batch.bag_host2_start,
        "bag_host2_slutt": batch.bag_host2_slutt,
        "bag_host2_total_kg": batch.bag_host2_total_kg,
        "bag_host2_dager": batch.bag_host2_dager,
        
        # Bag - Beregninger
        "bag_syklus_lengde": batch.bag_syklus_lengde,
        "bag_be_percent": batch.bag_be_percent,

        # Workflow and Refrigeration
        "workflow_status": batch.workflow_status,
        "in_fridge": batch.in_fridge,
        "fridge_date": batch.fridge_date,

        # QR Code
        "qr_code": batch.qr_code,
        "qr_data": batch.qr_data,
        "label_printed": batch.label_printed,
        "label_printed_at": batch.label_printed_at,
        "label_print_count": batch.label_print_count
    }
    return batch_dict

# ==================== CALCULATION FUNCTIONS ====================

def calculate_days_between(start_date, end_date=None):
    """Calculate days between two dates, or from start to now if end_date is None"""
    if not start_date:
        return None
    
    # Get end date (now if not provided)
    end = end_date if end_date else datetime.now(timezone.utc)
    
    # Ensure both datetimes are timezone-aware for comparison
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    
    delta = end - start_date
    return max(0, delta.days)

def calculate_spawn_days(spawn_dato_inok):
    """Calculate days since spawn inoculation"""
    return calculate_days_between(spawn_dato_inok)

def calculate_bag_days(bag_dato_inok):
    """Calculate days since bag inoculation"""
    return calculate_days_between(bag_dato_inok)

def calculate_host1_days(bag_frukting_start, bag_host1_slutt):
    """Calculate days from fruiting start to H1 end"""
    if not bag_frukting_start or not bag_host1_slutt:
        return None
    return calculate_days_between(bag_frukting_start, bag_host1_slutt)

def calculate_host2_days(bag_host1_slutt, bag_host2_slutt):
    """Calculate days from H1 end to H2 end"""
    if not bag_host1_slutt or not bag_host2_slutt:
        return None
    return calculate_days_between(bag_host1_slutt, bag_host2_slutt)

def calculate_cycle_length(bag_dato_inok, bag_host2_slutt):
    """Calculate total cycle length from bag inoculation to H2 end"""
    if not bag_dato_inok or not bag_host2_slutt:
        return None
    return calculate_days_between(bag_dato_inok, bag_host2_slutt)

def calculate_be_percent(bag_kg_substrat, bag_host1_total_kg, bag_host2_total_kg):
    """Calculate biological efficiency percentage: (H1 + H2) / substrat * 100"""
    if not bag_kg_substrat or bag_kg_substrat == 0:
        return None
    
    h1 = bag_host1_total_kg or 0
    h2 = bag_host2_total_kg or 0
    total_harvest = h1 + h2
    
    if total_harvest == 0:
        return None
    
    be = (total_harvest / bag_kg_substrat) * 100
    return round(be, 1)

def auto_calculate_batch_fields(batch: models.Batch) -> models.Batch:
    """Auto-calculate all calculated fields before saving"""
    # Spawn days
    if batch.spawn_dato_inok:
        batch.spawn_dager_ink = calculate_spawn_days(batch.spawn_dato_inok)
    
    # Bag days
    if batch.bag_dato_inok:
        batch.bag_dager_ink = calculate_bag_days(batch.bag_dato_inok)
    
    # H1 days
    if batch.bag_frukting_start and batch.bag_host1_slutt:
        batch.bag_host1_dager = calculate_host1_days(batch.bag_frukting_start, batch.bag_host1_slutt)
    
    # H2 days
    if batch.bag_host1_slutt and batch.bag_host2_slutt:
        batch.bag_host2_dager = calculate_host2_days(batch.bag_host1_slutt, batch.bag_host2_slutt)
    
    # Cycle length
    if batch.bag_dato_inok and batch.bag_host2_slutt:
        batch.bag_syklus_lengde = calculate_cycle_length(batch.bag_dato_inok, batch.bag_host2_slutt)
    
    # BE%
    if batch.bag_kg_substrat:
        batch.bag_be_percent = calculate_be_percent(
            batch.bag_kg_substrat,
            batch.bag_host1_total_kg,
            batch.bag_host2_total_kg
        )
    
    return batch

# ==================== BATCH ENDPOINTS ====================

@app.get("/api/batches", response_model=List[schemas.BatchResponse])
def get_batches(
    strain: Optional[str] = Query(None),
    archived: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all batches with optional filters"""
    query = db.query(models.Batch)
    
    if strain:
        query = query.filter(models.Batch.strain_name == strain)
    if archived is not None:
        query = query.filter(models.Batch.archived == archived)
    
    batches = query.order_by(models.Batch.created_at.desc()).all()
    return [serialize_batch(b, db) for b in batches]

@app.get("/api/batches/{batch_id}", response_model=schemas.BatchResponse)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    """Get single batch by ID"""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return serialize_batch(batch, db)

@app.post("/api/batches", response_model=schemas.BatchResponse)
def create_batch(batch: schemas.BatchCreate, db: Session = Depends(get_db)):
    """Create new batch with auto-calculated fields and QR code"""
    batch_data = batch.model_dump()
    batch_data = convert_empty_to_none(batch_data)

    db_batch = models.Batch(**batch_data)
    db_batch = auto_calculate_batch_fields(db_batch)

    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)

    # Generate QR code
    db_batch.qr_code = f"SOPP-{db_batch.id}"
    db_batch.qr_data = json.dumps({
        "id": db_batch.id,
        "spawn_batch": db_batch.spawn_batch,
        "strain": db_batch.strain_name,
        "lc": db_batch.lc_batch
    })
    db.commit()
    db.refresh(db_batch)

    # Auto-create BatchInfo if spawn_batch is provided and doesn't exist
    if db_batch.spawn_batch:
        existing_batch_info = db.query(models.BatchInfo).filter(
            models.BatchInfo.spawn_batch == db_batch.spawn_batch
        ).first()

        if not existing_batch_info:
            new_batch_info = models.BatchInfo(
                spawn_batch=db_batch.spawn_batch,
                strain_name=db_batch.strain_name,
                in_fridge=False
            )
            db.add(new_batch_info)
            db.commit()

    return serialize_batch(db_batch, db)

@app.patch("/api/batches/{batch_id}", response_model=schemas.BatchResponse)
def update_batch(batch_id: int, batch_update: schemas.BatchUpdate, db: Session = Depends(get_db)):
    """Update batch with auto-calculated fields"""
    db_batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    update_data = batch_update.model_dump(exclude_unset=True)
    update_data = convert_empty_to_none(update_data)
    
    for key, value in update_data.items():
        setattr(db_batch, key, value)
    
    db_batch = auto_calculate_batch_fields(db_batch)
    
    db.commit()
    db.refresh(db_batch)

    return serialize_batch(db_batch, db)

@app.delete("/api/batches/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    """Delete batch"""
    db_batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    db.delete(db_batch)
    db.commit()
    
    return {"message": "Batch deleted"}

@app.post("/api/batches/bulk-archive")
def bulk_archive_batches(batch_ids: List[int], db: Session = Depends(get_db)):
    """Archive multiple batches"""
    db.query(models.Batch).filter(models.Batch.id.in_(batch_ids)).update(
        {"archived": True},
        synchronize_session=False
    )
    db.commit()
    return {"message": f"Archived {len(batch_ids)} batches"}

@app.post("/api/batches/bulk-delete")
def bulk_delete_batches(batch_ids: List[int], db: Session = Depends(get_db)):
    """Delete multiple batches"""
    db.query(models.Batch).filter(models.Batch.id.in_(batch_ids)).delete(
        synchronize_session=False
    )
    db.commit()
    return {"message": f"Deleted {len(batch_ids)} batches"}

# ==================== BATCH INFO ENDPOINTS ====================

@app.get("/api/batch-info", response_model=List[schemas.BatchInfoResponse])
def get_batch_infos(db: Session = Depends(get_db)):
    """Get all batch infos with units"""
    batch_infos = db.query(models.BatchInfo).options(
        joinedload(models.BatchInfo.units)
    ).all()
    return batch_infos

@app.get("/api/batch-info/{spawn_batch}", response_model=schemas.BatchInfoResponse)
def get_batch_info(spawn_batch: str, db: Session = Depends(get_db)):
    """Get batch info by spawn_batch with units"""
    batch_info = db.query(models.BatchInfo).options(
        joinedload(models.BatchInfo.units)
    ).filter(models.BatchInfo.spawn_batch == spawn_batch).first()
    
    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch info not found")
    
    return batch_info

@app.post("/api/batch-info", response_model=schemas.BatchInfoResponse)
def create_batch_info(batch_info: schemas.BatchInfoCreate, db: Session = Depends(get_db)):
    """Create new batch info"""
    # Check if spawn_batch already exists
    existing = db.query(models.BatchInfo).filter(
        models.BatchInfo.spawn_batch == batch_info.spawn_batch
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Batch info with this spawn_batch already exists")
    
    db_batch_info = models.BatchInfo(**batch_info.model_dump())
    db.add(db_batch_info)
    db.commit()
    db.refresh(db_batch_info)
    
    return db_batch_info

@app.patch("/api/batch-info/{spawn_batch}/fridge")
def toggle_fridge(spawn_batch: str, in_fridge: bool, db: Session = Depends(get_db)):
    """Toggle refrigeration status"""
    batch_info = db.query(models.BatchInfo).filter(
        models.BatchInfo.spawn_batch == spawn_batch
    ).first()
    
    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch info not found")
    
    batch_info.in_fridge = in_fridge
    batch_info.fridge_start_date = datetime.now(timezone.utc) if in_fridge else None
    
    db.commit()
    db.refresh(batch_info)
    
    return batch_info

# ==================== BATCH UNITS ENDPOINTS ====================

@app.get("/api/batch-info/{spawn_batch}/units", response_model=List[schemas.BatchUnitResponse])
def get_batch_units(spawn_batch: str, db: Session = Depends(get_db)):
    """Get all units for a spawn batch"""
    batch_info = db.query(models.BatchInfo).filter(
        models.BatchInfo.spawn_batch == spawn_batch
    ).first()
    
    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch info not found")
    
    units = db.query(models.BatchUnit).filter(
        models.BatchUnit.batch_info_id == batch_info.id
    ).all()
    
    return units

@app.post("/api/batch-info/{spawn_batch}/units", response_model=schemas.BatchUnitResponse)
def create_batch_unit(spawn_batch: str, unit: schemas.BatchUnitCreate, db: Session = Depends(get_db)):
    """Create a single unit for a spawn batch"""
    batch_info = db.query(models.BatchInfo).filter(
        models.BatchInfo.spawn_batch == spawn_batch
    ).first()
    
    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch info not found")
    
    db_unit = models.BatchUnit(
        batch_info_id=batch_info.id,
        **unit.model_dump()
    )
    
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    
    return db_unit

@app.post("/api/batch-info/{spawn_batch}/units/bulk", response_model=List[schemas.BatchUnitResponse])
def create_batch_units_bulk(spawn_batch: str, bulk_data: schemas.BatchUnitBulkCreate, db: Session = Depends(get_db)):
    """Create multiple units at once for a spawn batch"""
    batch_info = db.query(models.BatchInfo).filter(
        models.BatchInfo.spawn_batch == spawn_batch
    ).first()
    
    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch info not found")
    
    units = []
    for i in range(bulk_data.count):
        unit = models.BatchUnit(
            batch_info_id=batch_info.id,
            type=bulk_data.type,
            substrat=bulk_data.substrat,
            kg=bulk_data.kg,
            dato_inok=bulk_data.dato_inok,
            status=bulk_data.status
        )
        units.append(unit)
    
    db.add_all(units)
    db.commit()
    
    for unit in units:
        db.refresh(unit)
    
    return units

@app.patch("/api/batch-info/{spawn_batch}/units/{unit_id}", response_model=schemas.BatchUnitResponse)
def update_batch_unit(spawn_batch: str, unit_id: int, unit_update: schemas.BatchUnitUpdate, db: Session = Depends(get_db)):
    """Update a batch unit"""
    batch_info = db.query(models.BatchInfo).filter(
        models.BatchInfo.spawn_batch == spawn_batch
    ).first()
    
    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch info not found")
    
    unit = db.query(models.BatchUnit).filter(
        models.BatchUnit.id == unit_id,
        models.BatchUnit.batch_info_id == batch_info.id
    ).first()
    
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    update_data = unit_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(unit, key, value)
    
    db.commit()
    db.refresh(unit)
    
    return unit

@app.patch("/api/batch-info/{spawn_batch}/units/{unit_id}/contamination")
def toggle_contamination(spawn_batch: str, unit_id: int, contaminated: bool, db: Session = Depends(get_db)):
    """Toggle contamination status of a unit"""
    batch_info = db.query(models.BatchInfo).filter(
        models.BatchInfo.spawn_batch == spawn_batch
    ).first()
    
    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch info not found")
    
    unit = db.query(models.BatchUnit).filter(
        models.BatchUnit.id == unit_id,
        models.BatchUnit.batch_info_id == batch_info.id
    ).first()
    
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    unit.contaminated = contaminated
    unit.contamination_date = datetime.now(timezone.utc) if contaminated else None
    
    db.commit()
    db.refresh(unit)
    
    return unit

@app.delete("/api/batch-info/{spawn_batch}/units/{unit_id}")
def delete_batch_unit(spawn_batch: str, unit_id: int, db: Session = Depends(get_db)):
    """Delete a batch unit"""
    batch_info = db.query(models.BatchInfo).filter(
        models.BatchInfo.spawn_batch == spawn_batch
    ).first()
    
    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch info not found")
    
    unit = db.query(models.BatchUnit).filter(
        models.BatchUnit.id == unit_id,
        models.BatchUnit.batch_info_id == batch_info.id
    ).first()
    
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    db.delete(unit)
    db.commit()
    
    return {"message": "Unit deleted"}

# ==================== STATISTICS ENDPOINTS ====================

@app.get("/api/stats")
def get_stats(strain: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get production statistics"""
    query = db.query(models.Batch)
    
    if strain:
        query = query.filter(models.Batch.strain_name == strain)
    
    total_batches = query.count()
    archived_batches = query.filter(models.Batch.archived == True).count()
    active_batches = total_batches - archived_batches
    
    # Calculate total harvest and average BE%
    batches_with_harvest = query.filter(
        (models.Batch.bag_host1_total_kg.isnot(None)) | (models.Batch.bag_host2_total_kg.isnot(None))
    ).all()
    
    total_harvest_kg = 0
    be_percentages = []
    
    for batch in batches_with_harvest:
        h1 = batch.bag_host1_total_kg or 0
        h2 = batch.bag_host2_total_kg or 0
        total_harvest_kg += (h1 + h2)
        
        if batch.bag_be_percent:
            be_percentages.append(batch.bag_be_percent)
    
    avg_be_percent = round(sum(be_percentages) / len(be_percentages), 1) if be_percentages else None
    
    return {
        "total_batches": total_batches,
        "active_batches": active_batches,
        "archived_batches": archived_batches,
        "total_harvest_kg": round(total_harvest_kg, 2),
        "avg_be_percent": avg_be_percent
    }

@app.get("/api/stats/next-colonization")
def get_next_colonization(db: Session = Depends(get_db)):
    """Get next batch expected to complete colonization"""
    next_batch = db.query(models.Batch).filter(
        models.Batch.bag_forventet_kolon.isnot(None),
        models.Batch.bag_status != "Høstet",
        models.Batch.bag_status != "Forkastet",
        models.Batch.archived == False
    ).order_by(models.Batch.bag_forventet_kolon).first()

    if not next_batch:
        raise HTTPException(status_code=404, detail="No batches with expected colonization date")

    return serialize_batch(next_batch, db)

@app.post("/api/predict-spawn-colonization")
def predict_spawn_colonization(
    strain_name: str,
    spawn_dato_inok: datetime,
    db: Session = Depends(get_db)
):
    """
    Smart prediction of spawn colonization completion date based on:
    1. Strain-specific baseline days for spawn
    2. Historical data from same strain
    """
    # Baseline days by strain for SPAWN colonization (from literature/experience)
    strain_baseline = {
        "oyster": 10,
        "lions_mane": 12,
        "shiitake": 14,
        "reishi": 16
    }

    # Get baseline or default to 12 days
    baseline_days = strain_baseline.get(strain_name, 12)

    # For now, use baseline (could add historical analysis later)
    predicted_days = baseline_days

    # Calculate expected date
    expected_date = spawn_dato_inok + timedelta(days=predicted_days)

    return {
        "predicted_days": predicted_days,
        "expected_date": expected_date,
        "baseline_used": baseline_days
    }

@app.post("/api/predict-colonization")
def predict_colonization(
    strain_name: str,
    bag_dato_inok: datetime,
    kg_substrat: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Smart prediction of bag colonization (to fruiting) date based on:
    1. Strain-specific baseline days
    2. Historical data from same strain
    3. Substrate amount adjustment
    """
    # Baseline days by strain for BAG colonization (from literature/experience)
    strain_baseline = {
        "oyster": 14,
        "lions_mane": 18,
        "shiitake": 21,
        "reishi": 28
    }

    # Get baseline or default to 18 days
    baseline_days = strain_baseline.get(strain_name, 18)

    # Get historical average for this strain
    historical_batches = db.query(models.Batch).filter(
        models.Batch.strain_name == strain_name,
        models.Batch.bag_dato_inok.isnot(None),
        models.Batch.bag_frukting_start.isnot(None),
        models.Batch.archived == False
    ).all()

    if historical_batches:
        # Calculate average colonization time from historical data
        colonization_times = []
        for batch in historical_batches:
            days_diff = (batch.bag_frukting_start - batch.bag_dato_inok).days
            if 0 < days_diff < 60:  # Sanity check: between 0 and 60 days
                colonization_times.append(days_diff)

        if colonization_times:
            avg_historical = sum(colonization_times) / len(colonization_times)
            # Weight: 60% historical, 40% baseline
            predicted_days = int(round(avg_historical * 0.6 + baseline_days * 0.4))
        else:
            predicted_days = baseline_days
    else:
        predicted_days = baseline_days

    # Adjust for substrate amount (if provided)
    # More substrate = longer colonization (rough estimate: +1 day per 2kg over 5kg)
    if kg_substrat and kg_substrat > 5:
        extra_days = int((kg_substrat - 5) / 2)
        predicted_days += extra_days

    # Calculate expected date
    expected_date = bag_dato_inok + timedelta(days=predicted_days)

    return {
        "predicted_days": predicted_days,
        "expected_date": expected_date,
        "baseline_used": baseline_days,
        "historical_samples": len(historical_batches) if historical_batches else 0
    }

@app.get("/api/stats/historical-averages")
def get_historical_averages(
    strain_name: Optional[str] = Query(None),
    lc_code: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get historical average colonization times for spawn and bag phases.
    Returns averages per strain (and optionally per LC culture).
    Includes confidence scores based on sample size.
    """

    result = {}

    # SPAWN colonization averages
    spawn_query = db.query(models.Batch).filter(
        models.Batch.spawn_dato_inok.isnot(None),
        models.Batch.spawn_forventet_ferdig.isnot(None),
        models.Batch.archived == False
    )

    if strain_name:
        spawn_query = spawn_query.filter(models.Batch.strain_name == strain_name)
    if lc_code:
        spawn_query = spawn_query.filter(models.Batch.lc_batch == lc_code)

    spawn_batches = spawn_query.all()

    if spawn_batches:
        spawn_days = []
        for batch in spawn_batches:
            days = (batch.spawn_forventet_ferdig - batch.spawn_dato_inok).days
            if days > 0 and days < 90:  # Sanity check
                spawn_days.append(days)

        if spawn_days:
            avg_spawn = sum(spawn_days) / len(spawn_days)
            # Confidence: 100% at 10+ samples, scales down linearly
            confidence_spawn = min(100, (len(spawn_days) / 10) * 100)

            result['spawn'] = {
                'avg_days': round(avg_spawn, 1),
                'sample_count': len(spawn_days),
                'confidence_percent': round(confidence_spawn, 0),
                'min_days': min(spawn_days),
                'max_days': max(spawn_days)
            }

    # BAG colonization averages (to fruiting)
    bag_query = db.query(models.Batch).filter(
        models.Batch.bag_dato_inok.isnot(None),
        models.Batch.bag_frukting_start.isnot(None),
        models.Batch.archived == False
    )

    if strain_name:
        bag_query = bag_query.filter(models.Batch.strain_name == strain_name)
    if lc_code:
        bag_query = bag_query.filter(models.Batch.lc_batch == lc_code)

    bag_batches = bag_query.all()

    if bag_batches:
        bag_days = []
        for batch in bag_batches:
            days = (batch.bag_frukting_start - batch.bag_dato_inok).days
            if days > 0 and days < 120:  # Sanity check
                bag_days.append(days)

        if bag_days:
            avg_bag = sum(bag_days) / len(bag_days)
            confidence_bag = min(100, (len(bag_days) / 10) * 100)

            result['bag'] = {
                'avg_days': round(avg_bag, 1),
                'sample_count': len(bag_days),
                'confidence_percent': round(confidence_bag, 0),
                'min_days': min(bag_days),
                'max_days': max(bag_days)
            }

    # If no data found, return baseline estimates
    if not result:
        strain_baselines = {
            "oyster": {"spawn": 14, "bag": 14},
            "lions_mane": {"spawn": 21, "bag": 18},
            "shiitake": {"spawn": 28, "bag": 21},
            "reishi": {"spawn": 30, "bag": 28}
        }

        baseline = strain_baselines.get(strain_name, {"spawn": 21, "bag": 18})

        return {
            "spawn": {
                "avg_days": baseline["spawn"],
                "sample_count": 0,
                "confidence_percent": 0,
                "baseline": True
            },
            "bag": {
                "avg_days": baseline["bag"],
                "sample_count": 0,
                "confidence_percent": 0,
                "baseline": True
            }
        }

    return result

# ==================== LC CULTURE ENDPOINTS ====================

@app.get("/api/lc-cultures", response_model=List[schemas.LCCultureResponse])
def get_lc_cultures(
    strain: Optional[str] = Query(None),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get all LC cultures, optionally filtered by strain"""
    query = db.query(models.LCCulture)

    if strain:
        query = query.filter(models.LCCulture.strain_name == strain)

    if active_only:
        query = query.filter(models.LCCulture.active == True)

    lc_cultures = query.order_by(models.LCCulture.lc_code).all()

    # Add batch count for each LC
    result = []
    for lc in lc_cultures:
        batch_count = db.query(models.Batch).filter(models.Batch.lc_id == lc.id).count()
        lc_dict = {
            "id": lc.id,
            "lc_code": lc.lc_code,
            "strain_name": lc.strain_name,
            "source": lc.source,
            "date_created": lc.date_created,
            "notes": lc.notes,
            "active": lc.active,
            "created_at": lc.created_at,
            "batch_count": batch_count
        }
        result.append(lc_dict)

    return result

@app.get("/api/lc-cultures/{lc_code}", response_model=schemas.LCCultureResponse)
def get_lc_culture(lc_code: str, db: Session = Depends(get_db)):
    """Get single LC culture by code"""
    lc = db.query(models.LCCulture).filter(models.LCCulture.lc_code == lc_code).first()
    if not lc:
        raise HTTPException(status_code=404, detail="LC culture not found")

    batch_count = db.query(models.Batch).filter(models.Batch.lc_id == lc.id).count()

    return {
        "id": lc.id,
        "lc_code": lc.lc_code,
        "strain_name": lc.strain_name,
        "source": lc.source,
        "date_created": lc.date_created,
        "notes": lc.notes,
        "active": lc.active,
        "created_at": lc.created_at,
        "batch_count": batch_count
    }

@app.post("/api/lc-cultures", response_model=schemas.LCCultureResponse)
def create_lc_culture(lc: schemas.LCCultureCreate, db: Session = Depends(get_db)):
    """Create new LC culture"""
    # Check if LC code already exists
    existing = db.query(models.LCCulture).filter(models.LCCulture.lc_code == lc.lc_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="LC code already exists")

    db_lc = models.LCCulture(**lc.model_dump())
    db.add(db_lc)
    db.commit()
    db.refresh(db_lc)

    return {
        "id": db_lc.id,
        "lc_code": db_lc.lc_code,
        "strain_name": db_lc.strain_name,
        "source": db_lc.source,
        "date_created": db_lc.date_created,
        "notes": db_lc.notes,
        "active": db_lc.active,
        "created_at": db_lc.created_at,
        "batch_count": 0
    }

@app.patch("/api/lc-cultures/{lc_code}", response_model=schemas.LCCultureResponse)
def update_lc_culture(lc_code: str, lc_update: schemas.LCCultureUpdate, db: Session = Depends(get_db)):
    """Update LC culture"""
    lc = db.query(models.LCCulture).filter(models.LCCulture.lc_code == lc_code).first()
    if not lc:
        raise HTTPException(status_code=404, detail="LC culture not found")

    update_data = lc_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lc, field, value)

    db.commit()
    db.refresh(lc)

    batch_count = db.query(models.Batch).filter(models.Batch.lc_id == lc.id).count()

    return {
        "id": lc.id,
        "lc_code": lc.lc_code,
        "strain_name": lc.strain_name,
        "source": lc.source,
        "date_created": lc.date_created,
        "notes": lc.notes,
        "active": lc.active,
        "created_at": lc.created_at,
        "batch_count": batch_count
    }

@app.delete("/api/lc-cultures/{lc_code}")
def delete_lc_culture(lc_code: str, db: Session = Depends(get_db)):
    """Archive/deactivate LC culture (don't actually delete due to FK constraints)"""
    lc = db.query(models.LCCulture).filter(models.LCCulture.lc_code == lc_code).first()
    if not lc:
        raise HTTPException(status_code=404, detail="LC culture not found")

    # Just mark as inactive instead of deleting
    lc.active = False
    db.commit()

    return {"message": "LC culture archived"}

# ==================== TEMPLATE ENDPOINTS ====================

@app.get("/api/templates", response_model=List[schemas.TemplateResponse])
def get_templates(strain: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get all templates, optionally filtered by strain"""
    query = db.query(models.Template)
    
    if strain:
        query = query.filter(models.Template.strain_name == strain)
    
    templates = query.all()
    return templates

@app.post("/api/templates", response_model=schemas.TemplateResponse)
def create_template(template: schemas.TemplateCreate, db: Session = Depends(get_db)):
    """Create new template"""
    db_template = models.Template(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@app.delete("/api/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """Delete template"""
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}

# ==================== QR CODE & LABEL PRINTING ====================

from fastapi.responses import Response
from .printer import get_printer

@app.get("/api/batches/{batch_id}/qr")
def get_batch_qr(batch_id: int, db: Session = Depends(get_db)):
    """Get QR code info for batch"""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return {
        "qr_code": batch.qr_code,
        "qr_data": batch.qr_data,
        "qr_image_url": f"/api/batches/{batch_id}/qr/image",
        "label_printed": batch.label_printed,
        "label_print_count": batch.label_print_count or 0
    }

@app.get("/api/batches/{batch_id}/qr/image")
def get_batch_qr_image(batch_id: int, db: Session = Depends(get_db)):
    """Get QR code as PNG image"""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    try:
        printer = get_printer()
        qr_data = batch.qr_code or f"SOPP-{batch_id}"
        img_bytes = printer.generate_qr_image_bytes(qr_data, size=400)

        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate QR image: {str(e)}")

@app.get("/api/batches/qr/{qr_code}")
def lookup_batch_by_qr(qr_code: str, db: Session = Depends(get_db)):
    """Lookup batch by QR code (for scanner)"""
    batch = db.query(models.Batch).filter(models.Batch.qr_code == qr_code).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return serialize_batch(batch, db)

@app.post("/api/batches/{batch_id}/print")
def print_batch_label(batch_id: int, copies: int = 1, db: Session = Depends(get_db)):
    """Print label for batch"""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    try:
        printer = get_printer()
        result = printer.print_label(batch, copies=copies)

        if result["success"]:
            # Update print tracking
            batch.label_printed = True
            batch.label_printed_at = datetime.now(timezone.utc)
            batch.label_print_count = (batch.label_print_count or 0) + copies
            db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Print failed: {str(e)}")

@app.post("/api/batches/{batch_id}/reprint")
def reprint_batch_label(batch_id: int, copies: int = 1, db: Session = Depends(get_db)):
    """Reprint label for batch (same as print, but explicit for UI)"""
    return print_batch_label(batch_id, copies, db)

@app.post("/api/printer/test")
def test_printer():
    """Test printer connectivity"""
    try:
        printer = get_printer()
        result = printer.test_print()
        return result
    except Exception as e:
        return {
            "success": False,
            "message": f"Printer test failed: {str(e)}"
        }