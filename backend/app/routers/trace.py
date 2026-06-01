"""
Traceability endpoint — resolves the full lineage for a batch- or culture-code.

Used by QR scanning and the batch/culture detail views to show
Strain -> MC -> LC/PD/SL -> Batch both backward and forward.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..core.auth import get_current_user
from ..utils.naming import lineage_prefix

router = APIRouter(dependencies=[Depends(get_current_user)])


def _culture_node(c: models.Culture) -> dict:
    return {
        "id": c.id,
        "code": c.code,
        "media_type": c.media_type,
        "parent_culture_id": c.parent_culture_id,
    }


def _ancestor_chain(db: Session, culture: models.Culture) -> list[dict]:
    """Walk parent_culture_id up to the root, return ordered root -> leaf."""
    chain: list[models.Culture] = []
    seen: set[int] = set()
    node = culture
    while node and node.id not in seen:
        seen.add(node.id)
        chain.append(node)
        if node.parent_culture_id:
            node = db.query(models.Culture).filter(
                models.Culture.id == node.parent_culture_id
            ).first()
        else:
            node = None
    chain.reverse()  # root first
    return [_culture_node(c) for c in chain]


def _strain_payload(strain: models.Strain, db: Session) -> dict | None:
    if not strain:
        return None
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


def _resolve_strain(db: Session, *, strain_id=None, code=None) -> models.Strain | None:
    if strain_id:
        s = db.query(models.Strain).filter(models.Strain.id == strain_id).first()
        if s:
            return s
    if code:
        prefix = lineage_prefix(code)
        if prefix:
            return db.query(models.Strain).filter(models.Strain.prefix == prefix).first()
    return None


def build_trace(db: Session, code: str) -> dict:
    """Build a TraceResponse-shaped dict for a batch- or culture-code."""
    batch = db.query(models.Batch).filter(models.Batch.spawn_batch == code).first()
    culture = None
    if batch is None:
        culture = db.query(models.Culture).filter(models.Culture.code == code).first()

    if batch is None and culture is None:
        raise HTTPException(status_code=404, detail=f"No batch or culture with code '{code}'")

    if batch is not None:
        kind = "batch"
        source_culture = None
        if batch.source_culture_id:
            source_culture = db.query(models.Culture).filter(
                models.Culture.id == batch.source_culture_id
            ).first()
        strain = _resolve_strain(db, strain_id=batch.strain_id, code=code)
        ancestors = _ancestor_chain(db, source_culture) if source_culture else []
    else:
        kind = "culture"
        strain = _resolve_strain(db, strain_id=culture.strain_id, code=code)
        ancestors = _ancestor_chain(db, culture)

    # Descendants for the whole lineage (strain): all cultures + batches of the strain
    cultures: list[dict] = []
    batches: list[dict] = []
    if strain:
        for c in db.query(models.Culture).filter(
            models.Culture.strain_id == strain.id
        ).order_by(models.Culture.code).all():
            cultures.append(_culture_node(c))
        for b in db.query(models.Batch).filter(
            models.Batch.strain_id == strain.id
        ).order_by(models.Batch.spawn_batch).all():
            batches.append({
                "id": b.id,
                "spawn_batch": b.spawn_batch,
                "workflow_status": b.workflow_status,
            })

    return {
        "query_code": code,
        "kind": kind,
        "strain": _strain_payload(strain, db),
        "ancestors": ancestors,
        "cultures": cultures,
        "batches": batches,
    }


@router.get("/api/trace/{code}", response_model=schemas.TraceResponse)
def trace(code: str, db: Session = Depends(get_db)):
    """Return the full lineage chain for a batch- or culture-code."""
    return build_trace(db, code)
