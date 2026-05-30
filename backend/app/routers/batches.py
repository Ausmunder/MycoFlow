"""
Batch endpoints - main batch CRUD operations
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from ..database import get_db
from .. import models, schemas, events
from ..utils.helpers import serialize_batch, convert_empty_to_none
from ..utils.calculations import auto_calculate_batch_fields
from ..utils.colonization_predictor import ColonizationPredictor
from ..utils.naming import next_batch_code
from ..core.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


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
    """Create new batch with auto-calculated fields, traceability links and QR code"""
    batch_data = batch.model_dump()
    batch_data = convert_empty_to_none(batch_data)

    # ── Traceability: link to source culture, derive strain + auto batch code ──
    strain = None
    if batch_data.get("source_culture_id"):
        culture = db.query(models.Culture).filter(
            models.Culture.id == batch_data["source_culture_id"]
        ).first()
        if not culture:
            raise HTTPException(status_code=404, detail="Source culture not found")
        strain = db.query(models.Strain).filter(models.Strain.id == culture.strain_id).first()
        # Denormalize strain + LC code from the culture (culture is authoritative)
        batch_data["strain_id"] = culture.strain_id
        if not batch_data.get("lc_batch"):
            batch_data["lc_batch"] = culture.code
        if strain and strain.strain_category:
            batch_data["strain_name"] = strain.strain_category
    elif batch_data.get("strain_id"):
        strain = db.query(models.Strain).filter(
            models.Strain.id == batch_data["strain_id"]
        ).first()

    # Auto-generate the persistent batch code ({prefix}-B{NN}) when not supplied
    if not batch_data.get("spawn_batch") and strain:
        batch_data["spawn_batch"] = next_batch_code(db, strain.prefix)

    db_batch = models.Batch(**batch_data)
    db_batch = auto_calculate_batch_fields(db_batch, db)

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

    # Emit domain event (no-op in standalone; builds lineage in HAL-Core after migration)
    events.batch_created(
        db_batch.id, db_batch.strain_name, db_batch.batch_type,
        db_batch.bag_kg_substrat, db_batch.spawn_batch,
    )

    return serialize_batch(db_batch, db)


@router.patch("/api/batches/{batch_id}", response_model=schemas.BatchResponse)
def update_batch(batch_id: int, batch_update: schemas.BatchUpdate, db: Session = Depends(get_db)):
    """Update batch with auto-calculated fields"""
    db_batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Track if bag_dato_inok was just set (colonization complete)
    old_bag_dato_inok = db_batch.bag_dato_inok

    update_data = batch_update.model_dump(exclude_unset=True)
    update_data = convert_empty_to_none(update_data)

    for key, value in update_data.items():
        setattr(db_batch, key, value)

    db_batch = auto_calculate_batch_fields(db_batch, db)

    # Auto-update statistics if colonization just completed
    if db_batch.bag_dato_inok and not old_bag_dato_inok:
        predictor = ColonizationPredictor(db)
        predictor.update_statistics(db_batch)

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
