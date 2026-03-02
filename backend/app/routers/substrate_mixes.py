"""
Substrate Mix Router
API endpoints for managing substrate mix recipes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..core.auth import get_current_user

router = APIRouter(prefix="/api/substrate-mixes", tags=["substrate-mixes"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=List[schemas.SubstrateMixResponse])
def get_substrate_mixes(
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all substrate mixes"""
    query = db.query(models.SubstrateMix)

    if active_only:
        query = query.filter(models.SubstrateMix.is_active == True)

    return query.order_by(models.SubstrateMix.name).all()


@router.get("/{mix_id}", response_model=schemas.SubstrateMixResponse)
def get_substrate_mix(mix_id: int, db: Session = Depends(get_db)):
    """Get a specific substrate mix by ID"""
    mix = db.query(models.SubstrateMix).filter(models.SubstrateMix.id == mix_id).first()

    if not mix:
        raise HTTPException(status_code=404, detail="Substrate mix not found")

    return mix


@router.post("/", response_model=schemas.SubstrateMixResponse)
def create_substrate_mix(
    mix_data: schemas.SubstrateMixCreate,
    db: Session = Depends(get_db)
):
    """Create a new substrate mix"""
    # Check if name already exists
    existing = db.query(models.SubstrateMix).filter(
        models.SubstrateMix.name == mix_data.name
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Substrate mix with this name already exists")

    new_mix = models.SubstrateMix(**mix_data.model_dump())
    db.add(new_mix)
    db.commit()
    db.refresh(new_mix)

    return new_mix


@router.put("/{mix_id}", response_model=schemas.SubstrateMixResponse)
def update_substrate_mix(
    mix_id: int,
    mix_data: schemas.SubstrateMixUpdate,
    db: Session = Depends(get_db)
):
    """Update a substrate mix"""
    mix = db.query(models.SubstrateMix).filter(models.SubstrateMix.id == mix_id).first()

    if not mix:
        raise HTTPException(status_code=404, detail="Substrate mix not found")

    # Check if new name conflicts with existing
    if mix_data.name and mix_data.name != mix.name:
        existing = db.query(models.SubstrateMix).filter(
            models.SubstrateMix.name == mix_data.name
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Substrate mix with this name already exists")

    # Update fields
    update_data = mix_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mix, key, value)

    db.commit()
    db.refresh(mix)

    return mix


@router.delete("/{mix_id}")
def delete_substrate_mix(mix_id: int, db: Session = Depends(get_db)):
    """Delete a substrate mix"""
    mix = db.query(models.SubstrateMix).filter(models.SubstrateMix.id == mix_id).first()

    if not mix:
        raise HTTPException(status_code=404, detail="Substrate mix not found")

    db.delete(mix)
    db.commit()

    return {"message": "Substrate mix deleted successfully"}
