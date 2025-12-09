"""
Batch Info endpoints - spawn batch metadata and refrigeration tracking
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone

from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/api/batch-info", response_model=List[schemas.BatchInfoResponse])
def get_batch_infos(db: Session = Depends(get_db)):
    """Get all batch infos with units"""
    batch_infos = db.query(models.BatchInfo).options(
        joinedload(models.BatchInfo.units)
    ).all()
    return batch_infos


@router.get("/api/batch-info/{spawn_batch}", response_model=schemas.BatchInfoResponse)
def get_batch_info(spawn_batch: str, db: Session = Depends(get_db)):
    """Get batch info by spawn_batch with units"""
    batch_info = db.query(models.BatchInfo).options(
        joinedload(models.BatchInfo.units)
    ).filter(models.BatchInfo.spawn_batch == spawn_batch).first()

    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch info not found")

    return batch_info


@router.post("/api/batch-info", response_model=schemas.BatchInfoResponse)
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


@router.patch("/api/batch-info/{spawn_batch}/fridge")
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
