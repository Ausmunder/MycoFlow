"""
Batch Units endpoints - individual unit tracking and contamination management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/api/batch-info/{spawn_batch}/units", response_model=List[schemas.BatchUnitResponse])
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


@router.post("/api/batch-info/{spawn_batch}/units", response_model=schemas.BatchUnitResponse)
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


@router.post("/api/batch-info/{spawn_batch}/units/bulk", response_model=List[schemas.BatchUnitResponse])
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


@router.patch("/api/batch-info/{spawn_batch}/units/{unit_id}", response_model=schemas.BatchUnitResponse)
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


@router.patch("/api/batch-info/{spawn_batch}/units/{unit_id}/contamination")
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


@router.delete("/api/batch-info/{spawn_batch}/units/{unit_id}")
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
