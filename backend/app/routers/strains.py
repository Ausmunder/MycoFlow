"""
Strain register endpoints — the genetic root of the traceability chain.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas, events
from ..core.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


def _compose_prefix(species_code: str, strain_number: str) -> str:
    return f"{species_code.strip().upper()}{strain_number.strip()}"


def _serialize(strain: models.Strain, db: Session) -> dict:
    culture_count = db.query(models.Culture).filter(
        models.Culture.strain_id == strain.id
    ).count()
    batch_count = db.query(models.Batch).filter(
        models.Batch.strain_id == strain.id
    ).count()
    return {
        "id": strain.id,
        "species_code": strain.species_code,
        "strain_number": strain.strain_number,
        "prefix": strain.prefix,
        "species_latin": strain.species_latin,
        "common_name": strain.common_name,
        "strain_category": strain.strain_category,
        "notes": strain.notes,
        "active": strain.active,
        "created_at": strain.created_at,
        "culture_count": culture_count,
        "batch_count": batch_count,
    }


@router.get("/api/strains", response_model=List[schemas.StrainResponse])
def get_strains(active_only: bool = False, db: Session = Depends(get_db)):
    """List all strains in the register."""
    query = db.query(models.Strain)
    if active_only:
        query = query.filter(models.Strain.active == True)
    strains = query.order_by(models.Strain.prefix).all()
    return [_serialize(s, db) for s in strains]


@router.get("/api/strains/{strain_id}", response_model=schemas.StrainResponse)
def get_strain(strain_id: int, db: Session = Depends(get_db)):
    """Get a single strain by id."""
    strain = db.query(models.Strain).filter(models.Strain.id == strain_id).first()
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    return _serialize(strain, db)


@router.post("/api/strains", response_model=schemas.StrainResponse)
def create_strain(strain: schemas.StrainCreate, db: Session = Depends(get_db)):
    """Create a new strain. The prefix is composed from species_code + strain_number."""
    prefix = _compose_prefix(strain.species_code, strain.strain_number)

    existing = db.query(models.Strain).filter(models.Strain.prefix == prefix).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Strain prefix '{prefix}' already exists")

    db_strain = models.Strain(
        species_code=strain.species_code.strip().upper(),
        strain_number=strain.strain_number.strip(),
        prefix=prefix,
        species_latin=strain.species_latin,
        common_name=strain.common_name,
        strain_category=strain.strain_category,
        notes=strain.notes,
        active=strain.active,
    )
    db.add(db_strain)
    db.commit()
    db.refresh(db_strain)

    events.strain_created(db_strain.id, db_strain.prefix, db_strain.common_name)

    return _serialize(db_strain, db)


@router.patch("/api/strains/{strain_id}", response_model=schemas.StrainResponse)
def update_strain(strain_id: int, strain_update: schemas.StrainUpdate, db: Session = Depends(get_db)):
    """Update a strain. Recomposes prefix if species_code/strain_number change."""
    db_strain = db.query(models.Strain).filter(models.Strain.id == strain_id).first()
    if not db_strain:
        raise HTTPException(status_code=404, detail="Strain not found")

    update_data = strain_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_strain, field, value)

    # Recompose prefix if identity fields changed
    if "species_code" in update_data or "strain_number" in update_data:
        new_prefix = _compose_prefix(db_strain.species_code, db_strain.strain_number)
        clash = db.query(models.Strain).filter(
            models.Strain.prefix == new_prefix, models.Strain.id != strain_id
        ).first()
        if clash:
            raise HTTPException(status_code=400, detail=f"Strain prefix '{new_prefix}' already exists")
        db_strain.prefix = new_prefix

    db.commit()
    db.refresh(db_strain)
    return _serialize(db_strain, db)


@router.delete("/api/strains/{strain_id}")
def delete_strain(strain_id: int, db: Session = Depends(get_db)):
    """Deactivate a strain (kept for FK integrity / lineage)."""
    db_strain = db.query(models.Strain).filter(models.Strain.id == strain_id).first()
    if not db_strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    db_strain.active = False
    db.commit()
    return {"message": "Strain deactivated"}
