"""
Template endpoints - batch templates for quick creation
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas
from ..core.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/api/templates", response_model=List[schemas.TemplateResponse])
def get_templates(strain: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get all templates, optionally filtered by strain"""
    query = db.query(models.Template)

    if strain:
        query = query.filter(models.Template.strain_name == strain)

    templates = query.all()
    return templates


@router.post("/api/templates", response_model=schemas.TemplateResponse)
def create_template(template: schemas.TemplateCreate, db: Session = Depends(get_db)):
    """Create new template"""
    db_template = models.Template(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.delete("/api/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """Delete template"""
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}
