"""
Main FastAPI application for Sopp Tracker
Entry point for the backend API
"""
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .database import engine, get_db, Base
from . import models, schemas

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Sopp Tracker API",
    description="API for Skogbunn Mikromusheri LC-Spawn-Bag tracking system",
    version="3.1.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== HEALTH CHECK =====
@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": "Sopp Tracker API",
        "version": "3.1.0"
    }


# ===== BATCH ENDPOINTS =====
@app.get("/api/batches", response_model=List[schemas.BatchResponse])
def get_batches(
    strain: Optional[schemas.StrainType] = None,
    status: Optional[schemas.BagStatus] = None,
    archived: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all batches with optional filters
    """
    query = db.query(models.Batch)
    
    if strain:
        query = query.filter(models.Batch.strain == strain)
    if status:
        query = query.filter(models.Batch.bag_status == status)
    
    query = query.filter(models.Batch.archived == archived)
    
    batches = query.offset(skip).limit(limit).all()
    return batches


@app.get("/api/batches/{batch_id}", response_model=schemas.BatchResponse)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    """Get single batch by ID"""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@app.post("/api/batches", response_model=schemas.BatchResponse, status_code=201)
def create_batch(batch: schemas.BatchCreate, db: Session = Depends(get_db)):
    """Create new batch"""
    db_batch = models.Batch(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch


@app.patch("/api/batches/{batch_id}", response_model=schemas.BatchResponse)
def update_batch(
    batch_id: int,
    batch_update: schemas.BatchUpdate,
    db: Session = Depends(get_db)
):
    """Update existing batch"""
    db_batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # Update only provided fields
    update_data = batch_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_batch, key, value)
    
    db.commit()
    db.refresh(db_batch)
    return db_batch


@app.delete("/api/batches/{batch_id}", status_code=204)
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    """Delete batch"""
    db_batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    db.delete(db_batch)
    db.commit()
    return None


@app.post("/api/batches/bulk-archive")
def bulk_archive(batch_ids: List[int], db: Session = Depends(get_db)):
    """Archive multiple batches"""
    db.query(models.Batch).filter(models.Batch.id.in_(batch_ids)).update(
        {models.Batch.archived: True},
        synchronize_session=False
    )
    db.commit()
    return {"archived": len(batch_ids)}


@app.post("/api/batches/bulk-delete")
def bulk_delete(batch_ids: List[int], db: Session = Depends(get_db)):
    """Delete multiple batches"""
    deleted = db.query(models.Batch).filter(models.Batch.id.in_(batch_ids)).delete(
        synchronize_session=False
    )
    db.commit()
    return {"deleted": deleted}


# ===== BATCH INFO ENDPOINTS =====
@app.get("/api/batch-info", response_model=List[schemas.BatchInfoResponse])
def get_batch_infos(db: Session = Depends(get_db)):
    """Get all batch info records"""
    return db.query(models.BatchInfo).all()


@app.get("/api/batch-info/{batch_code}", response_model=schemas.BatchInfoResponse)
def get_batch_info(batch_code: str, db: Session = Depends(get_db)):
    """Get batch info by code"""
    info = db.query(models.BatchInfo).filter(
        models.BatchInfo.batch_code == batch_code
    ).first()
    if not info:
        raise HTTPException(status_code=404, detail="Batch info not found")
    return info


@app.post("/api/batch-info", response_model=schemas.BatchInfoResponse, status_code=201)
def create_batch_info(info: schemas.BatchInfoCreate, db: Session = Depends(get_db)):
    """Create new batch info"""
    # Check if batch code already exists
    existing = db.query(models.BatchInfo).filter(
        models.BatchInfo.batch_code == info.batch_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Batch code already exists")
    
    db_info = models.BatchInfo(**info.model_dump())
    db.add(db_info)
    db.commit()
    db.refresh(db_info)
    return db_info


# ===== TEMPLATE ENDPOINTS =====
@app.get("/api/templates", response_model=List[schemas.TemplateResponse])
def get_templates(
    strain: Optional[schemas.StrainType] = None,
    db: Session = Depends(get_db)
):
    """Get all templates, optionally filtered by strain"""
    query = db.query(models.Template)
    if strain:
        query = query.filter(models.Template.strain == strain)
    return query.all()


@app.post("/api/templates", response_model=schemas.TemplateResponse, status_code=201)
def create_template(template: schemas.TemplateCreate, db: Session = Depends(get_db)):
    """Create new template"""
    db_template = models.Template(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@app.delete("/api/templates/{template_id}", status_code=204)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """Delete template"""
    db_template = db.query(models.Template).filter(
        models.Template.id == template_id
    ).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(db_template)
    db.commit()
    return None


# ===== STATISTICS ENDPOINTS =====
@app.get("/api/stats", response_model=schemas.StatsResponse)
def get_statistics(
    strain: Optional[schemas.StrainType] = None,
    db: Session = Depends(get_db)
):
    """Get overall statistics"""
    from sqlalchemy import func
    
    query = db.query(models.Batch).filter(models.Batch.archived == False)
    if strain:
        query = query.filter(models.Batch.strain == strain)
    
    batches = query.all()
    
    total = len(batches)
    active = len([b for b in batches if b.bag_status not in [
        models.BagStatus.HOSTET, models.BagStatus.FORKASTET
    ]])
    contaminated = len([b for b in batches if b.bag_kontam != models.KontamType.INGEN])
    harvested = len([b for b in batches if b.bag_status == models.BagStatus.HOSTET])
    
    total_harvest = sum((b.bag_host1_total_kg or 0) + (b.bag_host2_total_kg or 0) for b in batches)
    total_substrate = sum(b.bag_kg_substrat or 0 for b in batches)
    
    avg_be = (total_harvest / total_substrate * 100) if total_substrate > 0 else 0
    contam_rate = (contaminated / total * 100) if total > 0 else 0
    
    # Avg colonization days
    colonized = [b for b in batches if b.bag_dager_ink and b.bag_dager_ink > 0]
    avg_colon = sum(b.bag_dager_ink for b in colonized) / len(colonized) if colonized else 0
    
    # Avg cycle length
    cycled = [b for b in batches if b.bag_syklus_lengde and b.bag_syklus_lengde > 0]
    avg_cycle = sum(b.bag_syklus_lengde for b in cycled) / len(cycled) if cycled else 0
    
    return schemas.StatsResponse(
        total_batches=total,
        active_batches=active,
        contaminated=contaminated,
        harvested=harvested,
        total_harvest_kg=round(total_harvest, 2),
        avg_be_percent=round(avg_be, 1),
        contamination_rate=round(contam_rate, 1),
        avg_colonization_days=round(avg_colon, 1),
        avg_cycle_length=round(avg_cycle, 1)
    )


# ===== SENSOR ENDPOINTS (for Home Assistant) =====
@app.post("/api/sensors/readings", response_model=schemas.SensorReadingResponse, status_code=201)
def create_sensor_reading(reading: schemas.SensorReadingCreate, db: Session = Depends(get_db)):
    """
    Create new sensor reading from Home Assistant
    """
    db_reading = models.SensorReading(**reading.model_dump())
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading


@app.get("/api/sensors/readings", response_model=List[schemas.SensorReadingResponse])
def get_sensor_readings(
    location: Optional[str] = None,
    sensor_type: Optional[str] = None,
    since: Optional[datetime] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get sensor readings with optional filters"""
    query = db.query(models.SensorReading)
    
    if location:
        query = query.filter(models.SensorReading.location == location)
    if sensor_type:
        query = query.filter(models.SensorReading.sensor_type == sensor_type)
    if since:
        query = query.filter(models.SensorReading.timestamp >= since)
    
    return query.order_by(models.SensorReading.timestamp.desc()).limit(limit).all()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
