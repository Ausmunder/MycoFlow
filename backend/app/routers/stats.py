"""
Statistics and prediction endpoints - analytics and AI predictions
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from .. import models
from ..utils.helpers import serialize_batch
from ..utils.colonization_predictor import ColonizationPredictor

router = APIRouter()


@router.get("/api/stats")
def get_stats(strain: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get production statistics"""
    query = db.query(models.Batch)

    if strain:
        query = query.filter(models.Batch.strain_name == strain)

    total_batches = query.count()
    archived_batches = query.filter(models.Batch.archived == True).count()
    active_batches = total_batches - archived_batches

    # Calculate total harvest and average BE%
    batches_with_harvest = query.filter(
        (models.Batch.bag_host1_total_kg.isnot(None)) | (models.Batch.bag_host2_total_kg.isnot(None))
    ).all()

    total_harvest_kg = 0
    be_percentages = []

    for batch in batches_with_harvest:
        h1 = batch.bag_host1_total_kg or 0
        h2 = batch.bag_host2_total_kg or 0
        total_harvest_kg += (h1 + h2)

        if batch.bag_be_percent:
            be_percentages.append(batch.bag_be_percent)

    avg_be_percent = round(sum(be_percentages) / len(be_percentages), 1) if be_percentages else None

    # Calculate contamination rate based on bags, not batches
    all_batches_query = db.query(models.Batch)
    if strain:
        all_batches_query = all_batches_query.filter(models.Batch.strain_name == strain)

    # Sum total bags and contaminated bags across all batches
    total_bags = all_batches_query.with_entities(
        func.coalesce(func.sum(models.Batch.bag_antall_bager), 0)
    ).scalar() or 0

    # Sum contaminated units across all phases
    contaminated_bags = all_batches_query.with_entities(
        func.coalesce(func.sum(models.Batch.spawn_contaminated_units), 0) +
        func.coalesce(func.sum(models.Batch.inkubering_contaminated_units), 0) +
        func.coalesce(func.sum(models.Batch.frukt1_contaminated_units), 0) +
        func.coalesce(func.sum(models.Batch.frukt2_contaminated_units), 0)
    ).scalar() or 0

    contamination_rate = round((contaminated_bags / total_bags * 100), 1) if total_bags > 0 else 0

    abortert_batches = all_batches_query.filter(
        (models.Batch.spawn_abortert == True) |
        (models.Batch.inkubering_abortert == True) |
        (models.Batch.frukt1_abortert == True) |
        (models.Batch.frukt2_abortert == True)
    ).count()

    return {
        "total_batches": total_batches,
        "active_batches": active_batches,
        "archived_batches": archived_batches,
        "total_harvest_kg": round(total_harvest_kg, 2),
        "avg_be_percent": avg_be_percent,
        "contaminated": int(contaminated_bags),
        "total_bags": int(total_bags),
        "contamination_rate": contamination_rate,
        "abortert_batches": abortert_batches
    }


@router.get("/api/stats/weekly-trends")
def get_weekly_trends(
    weeks: int = Query(10, ge=1, le=52),
    strain: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get weekly harvest and BE% trends for the last N weeks.
    Returns data for charts showing:
    - Weekly harvest in kg
    - Weekly average BE%
    """
    today = datetime.now().date()

    # Calculate start date (N weeks ago, starting from Monday of that week)
    start_date = today - timedelta(weeks=weeks)
    # Adjust to Monday of that week
    start_date = start_date - timedelta(days=start_date.weekday())

    # Initialize result structure
    result = {
        "weeks": [],
        "harvest_kg": [],
        "avg_be_percent": []
    }

    # Get all batches with harvest data in the time range
    query = db.query(models.Batch).filter(
        models.Batch.bag_host1_slutt.isnot(None) | models.Batch.bag_host2_slutt.isnot(None)
    )

    if strain:
        query = query.filter(models.Batch.strain_name == strain)

    batches = query.all()

    # Process each week
    current_week_start = start_date
    for week_num in range(weeks):
        week_end = current_week_start + timedelta(days=6)

        # Format week label (e.g., "Uke 3" or "Jan 15")
        week_label = f"Uke {current_week_start.isocalendar()[1]}"
        result["weeks"].append(week_label)

        # Calculate harvest for this week
        week_harvest = 0
        week_be_values = []

        for batch in batches:
            # Check harvest 1
            if batch.bag_host1_slutt:
                h1_date = batch.bag_host1_slutt
                if isinstance(h1_date, datetime):
                    h1_date = h1_date.date()
                if current_week_start <= h1_date <= week_end:
                    week_harvest += batch.bag_host1_total_kg or 0
                    if batch.bag_be_percent:
                        week_be_values.append(batch.bag_be_percent)

            # Check harvest 2
            if batch.bag_host2_slutt:
                h2_date = batch.bag_host2_slutt
                if isinstance(h2_date, datetime):
                    h2_date = h2_date.date()
                if current_week_start <= h2_date <= week_end:
                    week_harvest += batch.bag_host2_total_kg or 0

        result["harvest_kg"].append(round(week_harvest, 2))

        # Calculate average BE% for this week (or None if no data)
        if week_be_values:
            result["avg_be_percent"].append(round(sum(week_be_values) / len(week_be_values), 1))
        else:
            result["avg_be_percent"].append(None)

        current_week_start += timedelta(days=7)

    return result


@router.get("/api/stats/next-colonization")
def get_next_colonization(db: Session = Depends(get_db)):
    """Get next batch expected to complete colonization"""
    next_batch = db.query(models.Batch).filter(
        models.Batch.bag_forventet_kolon.isnot(None),
        models.Batch.bag_status != "Høstet",
        models.Batch.bag_status != "Forkastet",
        models.Batch.archived == False
    ).order_by(models.Batch.bag_forventet_kolon).first()

    if not next_batch:
        raise HTTPException(status_code=404, detail="No batches with expected colonization date")

    return serialize_batch(next_batch, db)


@router.post("/api/predict-spawn-colonization")
def predict_spawn_colonization(
    strain_name: str,
    spawn_dato_inok: datetime,
    db: Session = Depends(get_db)
):
    """
    Smart prediction of spawn colonization completion date based on:
    1. Strain-specific baseline days for spawn
    2. Historical data from same strain
    """
    # Baseline days by strain for SPAWN colonization (from literature/experience)
    strain_baseline = {
        "oyster": 10,
        "lions_mane": 12,
        "shiitake": 14,
        "reishi": 16
    }

    # Get baseline or default to 12 days
    baseline_days = strain_baseline.get(strain_name, 12)

    # For now, use baseline (could add historical analysis later)
    predicted_days = baseline_days

    # Calculate expected date
    expected_date = spawn_dato_inok + timedelta(days=predicted_days)

    return {
        "predicted_days": predicted_days,
        "expected_date": expected_date,
        "baseline_used": baseline_days
    }


@router.post("/api/predict-colonization")
def predict_colonization(
    strain_name: str,
    bag_dato_inok: datetime,
    kg_substrat: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Smart prediction of bag colonization (to fruiting) date based on:
    1. Strain-specific baseline days
    2. Historical data from same strain
    3. Substrate amount adjustment
    """
    # Baseline days by strain for BAG colonization (from literature/experience)
    strain_baseline = {
        "oyster": 14,
        "lions_mane": 18,
        "shiitake": 21,
        "reishi": 28
    }

    # Get baseline or default to 18 days
    baseline_days = strain_baseline.get(strain_name, 18)

    # Get historical average for this strain
    historical_batches = db.query(models.Batch).filter(
        models.Batch.strain_name == strain_name,
        models.Batch.bag_dato_inok.isnot(None),
        models.Batch.bag_frukting_start.isnot(None),
        models.Batch.archived == False
    ).all()

    if historical_batches:
        # Calculate average colonization time from historical data
        colonization_times = []
        for batch in historical_batches:
            days_diff = (batch.bag_frukting_start - batch.bag_dato_inok).days
            if 0 < days_diff < 60:  # Sanity check: between 0 and 60 days
                colonization_times.append(days_diff)

        if colonization_times:
            avg_historical = sum(colonization_times) / len(colonization_times)
            # Weight: 60% historical, 40% baseline
            predicted_days = int(round(avg_historical * 0.6 + baseline_days * 0.4))
        else:
            predicted_days = baseline_days
    else:
        predicted_days = baseline_days

    # Adjust for substrate amount (if provided)
    # More substrate = longer colonization (rough estimate: +1 day per 2kg over 5kg)
    if kg_substrat and kg_substrat > 5:
        extra_days = int((kg_substrat - 5) / 2)
        predicted_days += extra_days

    # Calculate expected date
    expected_date = bag_dato_inok + timedelta(days=predicted_days)

    return {
        "predicted_days": predicted_days,
        "expected_date": expected_date,
        "baseline_used": baseline_days,
        "historical_samples": len(historical_batches) if historical_batches else 0
    }


@router.get("/api/stats/historical-averages")
def get_historical_averages(
    strain_name: Optional[str] = Query(None),
    lc_code: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get historical average colonization times for spawn and bag phases.
    Returns averages per strain (and optionally per LC culture).
    Includes confidence scores based on sample size.
    """

    result = {}

    # SPAWN colonization averages
    spawn_query = db.query(models.Batch).filter(
        models.Batch.spawn_dato_inok.isnot(None),
        models.Batch.spawn_forventet_ferdig.isnot(None),
        models.Batch.archived == False
    )

    if strain_name:
        spawn_query = spawn_query.filter(models.Batch.strain_name == strain_name)
    if lc_code:
        spawn_query = spawn_query.filter(models.Batch.lc_batch == lc_code)

    spawn_batches = spawn_query.all()

    if spawn_batches:
        spawn_days = []
        for batch in spawn_batches:
            days = (batch.spawn_forventet_ferdig - batch.spawn_dato_inok).days
            if days > 0 and days < 90:  # Sanity check
                spawn_days.append(days)

        if spawn_days:
            avg_spawn = sum(spawn_days) / len(spawn_days)
            # Confidence: 100% at 10+ samples, scales down linearly
            confidence_spawn = min(100, (len(spawn_days) / 10) * 100)

            result['spawn'] = {
                'avg_days': round(avg_spawn, 1),
                'sample_count': len(spawn_days),
                'confidence_percent': round(confidence_spawn, 0),
                'min_days': min(spawn_days),
                'max_days': max(spawn_days)
            }

    # BAG colonization averages (to fruiting)
    bag_query = db.query(models.Batch).filter(
        models.Batch.bag_dato_inok.isnot(None),
        models.Batch.bag_frukting_start.isnot(None),
        models.Batch.archived == False
    )

    if strain_name:
        bag_query = bag_query.filter(models.Batch.strain_name == strain_name)
    if lc_code:
        bag_query = bag_query.filter(models.Batch.lc_batch == lc_code)

    bag_batches = bag_query.all()

    if bag_batches:
        bag_days = []
        for batch in bag_batches:
            days = (batch.bag_frukting_start - batch.bag_dato_inok).days
            if days > 0 and days < 120:  # Sanity check
                bag_days.append(days)

        if bag_days:
            avg_bag = sum(bag_days) / len(bag_days)
            confidence_bag = min(100, (len(bag_days) / 10) * 100)

            result['bag'] = {
                'avg_days': round(avg_bag, 1),
                'sample_count': len(bag_days),
                'confidence_percent': round(confidence_bag, 0),
                'min_days': min(bag_days),
                'max_days': max(bag_days)
            }

    # If no data found, return baseline estimates
    if not result:
        strain_baselines = {
            "oyster": {"spawn": 14, "bag": 14},
            "lions_mane": {"spawn": 21, "bag": 18},
            "shiitake": {"spawn": 28, "bag": 21},
            "reishi": {"spawn": 30, "bag": 28}
        }

        baseline = strain_baselines.get(strain_name, {"spawn": 21, "bag": 18})

        return {
            "spawn": {
                "avg_days": baseline["spawn"],
                "sample_count": 0,
                "confidence_percent": 0,
                "baseline": True
            },
            "bag": {
                "avg_days": baseline["bag"],
                "sample_count": 0,
                "confidence_percent": 0,
                "baseline": True
            }
        }

    return result


@router.get("/api/batches/{batch_id}/prediction")
def get_batch_prediction(
    batch_id: int,
    db: Session = Depends(get_db)
):
    """
    Get AI-based colonization prediction for a batch.
    Based on strain, LC performance, substrate, and temperature.
    """
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    predictor = ColonizationPredictor(db)
    prediction = predictor.predict_colonization(batch)

    if not prediction:
        raise HTTPException(
            status_code=400,
            detail="Cannot predict: batch missing bag_dato_inok (bag not inoculated yet)"
        )

    return prediction
