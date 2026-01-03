"""
Calculation functions for batch metrics and dates
"""
from datetime import datetime, timezone
from .. import models


def calculate_days_between(start_date, end_date=None):
    """Calculate days between two dates, or from start to now if end_date is None"""
    if not start_date:
        return None

    # Get end date (now if not provided)
    end = end_date if end_date else datetime.now(timezone.utc)

    # Ensure both datetimes are timezone-aware for comparison
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    delta = end - start_date
    return max(0, delta.days)


def calculate_spawn_days(spawn_dato_inok):
    """Calculate days since spawn inoculation"""
    return calculate_days_between(spawn_dato_inok)


def calculate_bag_days(bag_dato_inok):
    """Calculate days since bag inoculation"""
    return calculate_days_between(bag_dato_inok)


def calculate_host1_days(bag_frukting_start, bag_host1_slutt):
    """Calculate days from fruiting start to H1 end"""
    if not bag_frukting_start or not bag_host1_slutt:
        return None
    return calculate_days_between(bag_frukting_start, bag_host1_slutt)


def calculate_host2_days(bag_host1_slutt, bag_host2_slutt):
    """Calculate days from H1 end to H2 end"""
    if not bag_host1_slutt or not bag_host2_slutt:
        return None
    return calculate_days_between(bag_host1_slutt, bag_host2_slutt)


def calculate_cycle_length(bag_dato_inok, bag_host2_slutt):
    """Calculate total cycle length from bag inoculation to H2 end"""
    if not bag_dato_inok or not bag_host2_slutt:
        return None
    return calculate_days_between(bag_dato_inok, bag_host2_slutt)


def calculate_be_percent(bag_kg_substrat, bag_host1_total_kg, bag_host2_total_kg, bag_substrat_type=None, db=None):
    """
    Calculate biological efficiency percentage with moisture correction.

    Formula: BE% = (Total fresh harvest / Dry substrate weight) × 100

    Dry substrate weight = Wet substrate × (1 - moisture%)

    Moisture content is fetched from substrate_mixes table.
    Falls back to 0.62 (62%) if substrate type not found or no database session provided.
    """
    if not bag_kg_substrat or bag_kg_substrat == 0:
        return None

    h1 = bag_host1_total_kg or 0
    h2 = bag_host2_total_kg or 0
    total_harvest = h1 + h2

    if total_harvest == 0:
        return None

    # Default moisture content (62%)
    moisture = 0.62

    # Try to get moisture content from database
    if db and bag_substrat_type:
        try:
            from ..models import SubstrateMix
            substrate_mix = db.query(SubstrateMix).filter(
                SubstrateMix.name == bag_substrat_type
            ).first()

            if substrate_mix and substrate_mix.moisture_content:
                moisture = float(substrate_mix.moisture_content)
        except Exception:
            # Fall back to default if database query fails
            pass

    # Calculate dry substrate weight
    dry_substrate = bag_kg_substrat * (1 - moisture)

    # Calculate BE%
    be = (total_harvest / dry_substrate) * 100
    return round(be, 1)


def auto_calculate_batch_fields(batch: models.Batch, db=None) -> models.Batch:
    """Auto-calculate all calculated fields before saving"""
    # Auto-calculate bag_kg_substrat from bag_antall_bager × substrate recipe
    if db and batch.bag_antall_bager and batch.bag_substrat_type:
        try:
            from ..models import SubstrateMix
            substrate_mix = db.query(SubstrateMix).filter(
                SubstrateMix.name == batch.bag_substrat_type
            ).first()

            if substrate_mix and substrate_mix.grams_per_bag:
                # Calculate: number of bags × grams per bag / 1000 = kg
                batch.bag_kg_substrat = (batch.bag_antall_bager * substrate_mix.grams_per_bag) / 1000
        except Exception:
            # If calculation fails, keep existing value
            pass

    # Spawn days
    if batch.spawn_dato_inok:
        batch.spawn_dager_ink = calculate_spawn_days(batch.spawn_dato_inok)

    # Bag days
    if batch.bag_dato_inok:
        batch.bag_dager_ink = calculate_bag_days(batch.bag_dato_inok)

    # H1 days
    if batch.bag_frukting_start and batch.bag_host1_slutt:
        batch.bag_host1_dager = calculate_host1_days(batch.bag_frukting_start, batch.bag_host1_slutt)

    # H2 days
    if batch.bag_host1_slutt and batch.bag_host2_slutt:
        batch.bag_host2_dager = calculate_host2_days(batch.bag_host1_slutt, batch.bag_host2_slutt)

    # Cycle length
    if batch.bag_dato_inok and batch.bag_host2_slutt:
        batch.bag_syklus_lengde = calculate_cycle_length(batch.bag_dato_inok, batch.bag_host2_slutt)

    # BE% - now with database lookup for moisture content
    if batch.bag_kg_substrat:
        batch.bag_be_percent = calculate_be_percent(
            batch.bag_kg_substrat,
            batch.bag_host1_total_kg,
            batch.bag_host2_total_kg,
            batch.bag_substrat_type,
            db
        )

    return batch
