"""
Workflow Router - Handles batch workflow transitions and predictions
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from ..database import get_db
from ..models import Batch
from ..utils.workflow_predictor import WorkflowPredictor
from ..core.auth import get_current_user

router = APIRouter(prefix="/api/batches", tags=["workflow"], dependencies=[Depends(get_current_user)])


# ===== REQUEST MODELS =====

class TransitionRequest(BaseModel):
    """Request body for workflow transitions"""
    action: str  # start_colonization, start_fruiting, start_flush1, etc.
    date: Optional[datetime] = None
    substrate_type: Optional[str] = None
    substrate_kg: Optional[float] = None
    yield_kg: Optional[float] = None
    notes: Optional[str] = None


# ===== ENDPOINTS =====

@router.get("/{batch_id}/workflow")
def get_workflow_status(batch_id: int, db: Session = Depends(get_db)):
    """
    Get current workflow status and predictions for a batch
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    predictor = WorkflowPredictor(db)
    predictions = predictor.get_workflow_predictions(batch)
    status = predictor.calculate_status(batch)

    # Calculate current stage progress
    current_stage_day = None
    current_stage_expected_days = None

    if batch.workflow_status == 'spawning' and batch.spawn_dato_inok:
        current_stage_day = (datetime.now() - batch.spawn_dato_inok).days
        if batch.spawn_expected_ready_date:
            current_stage_expected_days = (
                batch.spawn_expected_ready_date - batch.spawn_dato_inok
            ).days

    elif batch.workflow_status == 'colonizing' and batch.bag_dato_inok:
        current_stage_day = (datetime.now() - batch.bag_dato_inok).days
        if batch.colonization_expected_date:
            current_stage_expected_days = (
                batch.colonization_expected_date - batch.bag_dato_inok
            ).days

    elif batch.workflow_status == 'fruiting' and batch.fruiting_start_date:
        current_stage_day = (datetime.now() - batch.fruiting_start_date).days
        current_stage_expected_days = 7  # Default

    # Determine next stage
    next_stage_map = {
        'spawning': 'colonizing',
        'spawn_ready': 'colonizing',
        'colonizing': 'fruiting',
        'fruiting': 'flush1_active',
        'flush1_active': 'flush1_complete',
        'flush1_complete': 'flush2_active',
        'flush2_active': 'complete'
    }

    # Available actions based on current status
    available_actions = []
    if batch.workflow_status == 'spawn_ready':
        available_actions.append('start_colonization')
    elif batch.workflow_status == 'colonizing' and current_stage_day and current_stage_day >= (current_stage_expected_days or 14):
        available_actions.append('start_fruiting')
    elif batch.workflow_status == 'fruiting':
        available_actions.append('start_flush1')
    elif batch.workflow_status == 'flush1_active':
        available_actions.append('harvest_flush1')
    elif batch.workflow_status == 'flush2_active':
        available_actions.append('harvest_flush2')

    return {
        'current_stage': batch.workflow_status,
        'current_stage_day': current_stage_day,
        'current_stage_expected_days': current_stage_expected_days,
        'next_stage': next_stage_map.get(batch.workflow_status),
        'predictions': predictions.get('predictions', {}),
        'status': status,
        'available_actions': available_actions
    }


@router.post("/{batch_id}/workflow/transition")
def transition_workflow(
    batch_id: int,
    request: TransitionRequest,
    db: Session = Depends(get_db)
):
    """
    Transition batch to next workflow stage
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    transition_date = request.date or datetime.now()

    # ===== START COLONIZATION =====
    if request.action == 'start_colonization':
        if batch.workflow_status not in ['spawning', 'spawn_ready']:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start colonization from status: {batch.workflow_status}"
            )

        batch.spawn_actual_ready_date = transition_date
        batch.bag_dato_inok = transition_date
        batch.workflow_status = 'colonizing'

        if request.substrate_type:
            batch.bag_substrat_type = request.substrate_type
        if request.substrate_kg:
            batch.bag_kg_substrat = request.substrate_kg

        # Calculate colonization prediction
        predictor = WorkflowPredictor(db)
        batch.colonization_expected_date = predictor.predict_colonization(batch)

    # ===== START FRUITING =====
    elif request.action == 'start_fruiting':
        if batch.workflow_status != 'colonizing':
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start fruiting from status: {batch.workflow_status}"
            )

        batch.colonization_actual_date = transition_date
        batch.fruiting_start_date = transition_date
        batch.workflow_status = 'fruiting'

        # Calculate fruiting predictions
        predictor = WorkflowPredictor(db)
        batch.flush1_expected_date = predictor.predict_fruiting(batch)
        batch.flush1_expected_kg = predictor.predict_flush1_yield(batch)

    # ===== START FLUSH 1 =====
    elif request.action == 'start_flush1':
        if batch.workflow_status != 'fruiting':
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start flush1 from status: {batch.workflow_status}"
            )

        batch.flush1_actual_start_date = transition_date
        batch.workflow_status = 'flush1_active'

        # Predict harvest date
        predictor = WorkflowPredictor(db)
        batch.flush1_harvest_date = predictor.predict_flush1_harvest(batch)

    # ===== HARVEST FLUSH 1 =====
    elif request.action == 'harvest_flush1':
        if batch.workflow_status != 'flush1_active':
            raise HTTPException(
                status_code=400,
                detail=f"Cannot harvest flush1 from status: {batch.workflow_status}"
            )

        if not request.yield_kg:
            raise HTTPException(status_code=400, detail="yield_kg required for harvest")

        batch.flush1_harvest_date = transition_date
        batch.bag_host1_total_kg = request.yield_kg
        batch.workflow_status = 'flush1_complete'

        # Predict flush 2
        predictor = WorkflowPredictor(db)
        flush2_date, flush2_kg = predictor.predict_flush2(batch)
        batch.flush2_expected_date = flush2_date
        batch.flush2_expected_kg = flush2_kg

        # Update statistics
        _update_strain_statistics(db, batch)

    # ===== START FLUSH 2 =====
    elif request.action == 'start_flush2':
        if batch.workflow_status != 'flush1_complete':
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start flush2 from status: {batch.workflow_status}"
            )

        batch.flush2_actual_start_date = transition_date
        batch.workflow_status = 'flush2_active'

    # ===== HARVEST FLUSH 2 =====
    elif request.action == 'harvest_flush2':
        if batch.workflow_status != 'flush2_active':
            raise HTTPException(
                status_code=400,
                detail=f"Cannot harvest flush2 from status: {batch.workflow_status}"
            )

        if not request.yield_kg:
            raise HTTPException(status_code=400, detail="yield_kg required for harvest")

        batch.flush2_harvest_date = transition_date
        batch.bag_host2_total_kg = request.yield_kg
        batch.workflow_status = 'complete'

        # Calculate BE%
        if batch.bag_kg_substrat:
            total_yield = (batch.bag_host1_total_kg or 0) + (batch.bag_host2_total_kg or 0)
            batch.bag_be_percent = (total_yield / batch.bag_kg_substrat) * 100

        # Update statistics
        _update_strain_statistics(db, batch)

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")

    # Save notes if provided
    if request.notes:
        if batch.notes:
            batch.notes += f"\n[{transition_date.strftime('%Y-%m-%d')}] {request.notes}"
        else:
            batch.notes = f"[{transition_date.strftime('%Y-%m-%d')}] {request.notes}"

    batch.updated_at = datetime.now()
    db.commit()
    db.refresh(batch)

    return {
        'success': True,
        'batch_id': batch.id,
        'new_status': batch.workflow_status,
        'message': f'Transition to {request.action} completed'
    }


@router.post("/{batch_id}/workflow/update-predictions")
def update_predictions(batch_id: int, db: Session = Depends(get_db)):
    """
    Recalculate all predictions for a batch
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    predictor = WorkflowPredictor(db)

    # Update spawn predictions
    if batch.spawn_dato_inok and not batch.spawn_actual_ready_date:
        batch.spawn_expected_ready_date = predictor.predict_spawn_ready(batch)

    # Update colonization predictions
    if batch.bag_dato_inok and not batch.colonization_actual_date:
        batch.colonization_expected_date = predictor.predict_colonization(batch)

    # Update fruiting predictions
    if batch.fruiting_start_date and not batch.flush1_actual_start_date:
        batch.flush1_expected_date = predictor.predict_fruiting(batch)

    # Update yield predictions
    if batch.workflow_status in ['fruiting', 'flush1_active']:
        batch.flush1_expected_kg = predictor.predict_flush1_yield(batch)

    db.commit()
    db.refresh(batch)

    return {
        'success': True,
        'predictions': predictor.get_workflow_predictions(batch)
    }


# ===== HELPER FUNCTIONS =====

def _update_strain_statistics(db: Session, batch: Batch):
    """Update strain statistics with actual batch data"""
    from ..models import StrainStatistics

    # Get or create strain stats
    stats = db.query(StrainStatistics).filter(
        StrainStatistics.strain_name == batch.strain_name,
        StrainStatistics.lc_code.is_(None)
    ).first()

    if not stats:
        stats = StrainStatistics(strain_name=batch.strain_name)
        db.add(stats)

    # Update batch counts
    stats.total_batches = (stats.total_batches or 0) + 1

    # Update colonization timing if available
    if batch.bag_dato_inok and batch.colonization_actual_date:
        actual_days = (batch.colonization_actual_date - batch.bag_dato_inok).days

        if stats.avg_colonization_days:
            # Weighted average (give new data 20% weight)
            stats.avg_colonization_days = int(
                stats.avg_colonization_days * 0.8 + actual_days * 0.2
            )
        else:
            stats.avg_colonization_days = actual_days

        # Update min/max
        if not stats.min_colonization_days or actual_days < stats.min_colonization_days:
            stats.min_colonization_days = actual_days
        if not stats.max_colonization_days or actual_days > stats.max_colonization_days:
            stats.max_colonization_days = actual_days

    # Update yield stats
    total_yield = (batch.bag_host1_total_kg or 0) + (batch.bag_host2_total_kg or 0)
    if total_yield > 0:
        if stats.avg_yield_kg:
            stats.avg_yield_kg = round(stats.avg_yield_kg * 0.8 + total_yield * 0.2, 2)
        else:
            stats.avg_yield_kg = total_yield

        stats.successful_batches = (stats.successful_batches or 0) + 1

    # Update BE%
    if batch.bag_be_percent:
        if stats.avg_be_percent:
            stats.avg_be_percent = round(stats.avg_be_percent * 0.8 + batch.bag_be_percent * 0.2, 2)
        else:
            stats.avg_be_percent = batch.bag_be_percent

    db.commit()
