"""
Batch endpoints - main batch CRUD operations
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from ..database import get_db
from .. import models, schemas
from ..utils.helpers import serialize_batch, convert_empty_to_none
from ..utils.calculations import auto_calculate_batch_fields

router = APIRouter()


@router.get("/api/batches", response_model=List[schemas.BatchResponse])
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


@router.get("/api/batches/{batch_id}", response_model=schemas.BatchResponse)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    """Get single batch by ID"""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return serialize_batch(batch, db)


@router.post("/api/batches", response_model=schemas.BatchResponse)
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


@router.patch("/api/batches/{batch_id}", response_model=schemas.BatchResponse)
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


@router.delete("/api/batches/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    """Delete batch"""
    db_batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    db.delete(db_batch)
    db.commit()

    return {"message": "Batch deleted"}


@router.post("/api/batches/bulk-archive")
def bulk_archive_batches(batch_ids: List[int], db: Session = Depends(get_db)):
    """Archive multiple batches"""
    db.query(models.Batch).filter(models.Batch.id.in_(batch_ids)).update(
        {"archived": True},
        synchronize_session=False
    )
    db.commit()
    return {"message": f"Archived {len(batch_ids)} batches"}


@router.post("/api/batches/bulk-delete")
def bulk_delete_batches(batch_ids: List[int], db: Session = Depends(get_db)):
    """Delete multiple batches"""
    db.query(models.Batch).filter(models.Batch.id.in_(batch_ids)).delete(
        synchronize_session=False
    )
    db.commit()
    return {"message": f"Deleted {len(batch_ids)} batches"}


@router.get("/api/batches/qr/{qr_code}")
def lookup_batch_by_qr(qr_code: str, db: Session = Depends(get_db)):
    """Lookup batch by QR code (for scanner)"""
    batch = db.query(models.Batch).filter(models.Batch.qr_code == qr_code).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return serialize_batch(batch, db)
