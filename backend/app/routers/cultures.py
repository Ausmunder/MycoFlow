"""
Culture endpoints — Mother Culture (MC), Liquid Culture (LC), Petri Dish (PD),
Slant (SL). Generalizes the old lc_cultures router with auto code generation,
derivation (parent_culture_id) and lineage tracing.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas, events
from ..core.auth import get_current_user
from ..utils.naming import (
    MEDIA_TYPES, current_year_week, next_culture_unit, compose_culture_code,
)

router = APIRouter(dependencies=[Depends(get_current_user)])


def _serialize(culture: models.Culture, db: Session) -> dict:
    strain = db.query(models.Strain).filter(models.Strain.id == culture.strain_id).first()
    prefix = strain.prefix if strain else None
    batch_count = db.query(models.Batch).filter(
        models.Batch.source_culture_id == culture.id
    ).count()
    return {
        "id": culture.id,
        "code": culture.code,
        "strain_id": culture.strain_id,
        "media_type": culture.media_type,
        "year_week": culture.year_week,
        "unit": culture.unit,
        "parent_culture_id": culture.parent_culture_id,
        "source": culture.source,
        "quantity": culture.quantity,
        "quantity_unit": culture.quantity_unit,
        "date_created": culture.date_created,
        "notes": culture.notes,
        "active": culture.active,
        "created_at": culture.created_at,
        "prefix": prefix,
        "strain_prefix": prefix,
        "batch_count": batch_count,
    }


@router.get("/api/cultures", response_model=List[schemas.CultureResponse])
def get_cultures(
    media_type: Optional[str] = Query(None),
    strain_id: Optional[int] = Query(None),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    """List cultures, optionally filtered by media type / strain / active."""
    query = db.query(models.Culture)
    if media_type:
        query = query.filter(models.Culture.media_type == media_type)
    if strain_id:
        query = query.filter(models.Culture.strain_id == strain_id)
    if active_only:
        query = query.filter(models.Culture.active == True)
    cultures = query.order_by(models.Culture.code).all()
    return [_serialize(c, db) for c in cultures]


@router.get("/api/cultures/{code}", response_model=schemas.CultureResponse)
def get_culture(code: str, db: Session = Depends(get_db)):
    """Get a single culture by code."""
    culture = db.query(models.Culture).filter(models.Culture.code == code).first()
    if not culture:
        raise HTTPException(status_code=404, detail="Culture not found")
    return _serialize(culture, db)


@router.post("/api/cultures", response_model=schemas.CultureResponse)
def create_culture(culture: schemas.CultureCreate, db: Session = Depends(get_db)):
    """Create a culture, auto-composing the code from strain + media + year-week + unit."""
    if culture.media_type not in MEDIA_TYPES:
        raise HTTPException(status_code=400, detail=f"media_type must be one of {MEDIA_TYPES}")

    strain = db.query(models.Strain).filter(models.Strain.id == culture.strain_id).first()
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")

    # Validate parent (derivation), if provided
    parent = None
    if culture.parent_culture_id:
        parent = db.query(models.Culture).filter(
            models.Culture.id == culture.parent_culture_id
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent culture not found")

    year_week = culture.year_week or current_year_week(culture.date_created)
    unit = culture.unit or next_culture_unit(db, strain.id, culture.media_type, year_week)
    code = culture.code or compose_culture_code(strain.prefix, culture.media_type, year_week, unit)

    if db.query(models.Culture).filter(models.Culture.code == code).first():
        raise HTTPException(status_code=400, detail=f"Culture code '{code}' already exists")

    db_culture = models.Culture(
        code=code,
        strain_id=strain.id,
        media_type=culture.media_type,
        year_week=year_week,
        unit=unit,
        parent_culture_id=culture.parent_culture_id,
        source=culture.source,
        quantity=culture.quantity,
        quantity_unit=culture.quantity_unit,
        date_created=culture.date_created,
        notes=culture.notes,
        active=culture.active,
    )
    db.add(db_culture)
    db.commit()
    db.refresh(db_culture)

    events.culture_created(db_culture.id, db_culture.code, db_culture.media_type, strain.prefix)
    if parent:
        events.culture_derived(parent.code, db_culture.code, db_culture.media_type)

    return _serialize(db_culture, db)


@router.patch("/api/cultures/{code}", response_model=schemas.CultureResponse)
def update_culture(code: str, culture_update: schemas.CultureUpdate, db: Session = Depends(get_db)):
    """Update a culture (quantity, source, notes, active). The code is immutable."""
    db_culture = db.query(models.Culture).filter(models.Culture.code == code).first()
    if not db_culture:
        raise HTTPException(status_code=404, detail="Culture not found")

    update_data = culture_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_culture, field, value)

    db.commit()
    db.refresh(db_culture)
    return _serialize(db_culture, db)


@router.delete("/api/cultures/{code}")
def delete_culture(code: str, db: Session = Depends(get_db)):
    """Deactivate a culture (kept for lineage / FK integrity)."""
    db_culture = db.query(models.Culture).filter(models.Culture.code == code).first()
    if not db_culture:
        raise HTTPException(status_code=404, detail="Culture not found")
    db_culture.active = False
    db.commit()
    return {"message": "Culture deactivated"}


@router.get("/api/cultures/{code}/trace", response_model=schemas.TraceResponse)
def trace_culture(code: str, db: Session = Depends(get_db)):
    """Lineage for a culture: ancestor chain to the root + descendant cultures/batches."""
    from .trace import build_trace  # local import to avoid circular import
    culture = db.query(models.Culture).filter(models.Culture.code == code).first()
    if not culture:
        raise HTTPException(status_code=404, detail="Culture not found")
    return build_trace(db, code)
