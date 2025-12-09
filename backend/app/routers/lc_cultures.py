"""
LC Culture endpoints - liquid culture management
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/api/lc-cultures", response_model=List[schemas.LCCultureResponse])
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


@router.get("/api/lc-cultures/{lc_code}", response_model=schemas.LCCultureResponse)
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


@router.post("/api/lc-cultures", response_model=schemas.LCCultureResponse)
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


@router.patch("/api/lc-cultures/{lc_code}", response_model=schemas.LCCultureResponse)
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


@router.delete("/api/lc-cultures/{lc_code}")
def delete_lc_culture(lc_code: str, db: Session = Depends(get_db)):
    """Archive/deactivate LC culture (don't actually delete due to FK constraints)"""
    lc = db.query(models.LCCulture).filter(models.LCCulture.lc_code == lc_code).first()
    if not lc:
        raise HTTPException(status_code=404, detail="LC culture not found")

    # Just mark as inactive instead of deleting
    lc.active = False
    db.commit()

    return {"message": "LC culture archived"}
