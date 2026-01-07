"""
Colonization prediction algorithm for LC/Strain tracking

Predicts expected colonization dates based on:
1. Strain-specific baseline (from research)
2. Historical performance of specific LC
3. Substrate type
4. Temperature (if available from HA)
"""
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session
from .. import models


class ColonizationPredictor:
    """Predicts colonization times for spawn batches"""

    # Substrate adjustment factors
    SUBSTRATE_FACTORS = {
        'Rye': 1.0,          # Baseline
        'Wheat': 0.9,        # 10% faster
        'Oats': 1.1,         # 10% slower
        'Sawdust': 1.3,      # 30% slower (for shiitake)
        'Straw': 1.15,       # 15% slower
    }

    # Optimal temperature ranges (Celsius)
    TEMP_RANGES = {
        'oyster': (20, 24),
        'lions_mane': (18, 22),
        'shiitake': (18, 21),
        'reishi': (24, 28),
    }

    def __init__(self, db: Session):
        self.db = db

    def _get_strain_stats(self, strain_name: str, lc_code: Optional[str] = None):
        """Get strain statistics, optionally filtered by LC code"""
        query = self.db.query(models.StrainStatistics).filter(
            models.StrainStatistics.strain_name == strain_name
        )

        if lc_code:
            # Try to get LC-specific stats first
            lc_stats = query.filter(models.StrainStatistics.lc_code == lc_code).first()
            if lc_stats and lc_stats.total_batches > 0:
                return lc_stats

        # Fallback to general strain stats
        general_stats = query.filter(models.StrainStatistics.lc_code.is_(None)).first()
        return general_stats

    def _calculate_temp_factor(self, strain_name: str, avg_temp: float) -> float:
        """Calculate temperature adjustment factor"""
        if strain_name not in self.TEMP_RANGES:
            return 1.0

        optimal_min, optimal_max = self.TEMP_RANGES[strain_name]
        optimal_mid = (optimal_min + optimal_max) / 2

        # If within optimal range, no adjustment
        if optimal_min <= avg_temp <= optimal_max:
            return 1.0

        # For every degree away from optimal, add 5% time
        temp_diff = abs(avg_temp - optimal_mid)
        factor = 1.0 + (temp_diff * 0.05)

        # Cap at 50% slower (factor 1.5)
        return min(factor, 1.5)

    def _get_lc_performance(self, lc_id: int) -> Optional[Dict]:
        """Get historical performance data for specific LC"""
        # Get all completed batches for this LC
        batches = self.db.query(models.Batch).filter(
            models.Batch.lc_id == lc_id,
            models.Batch.spawn_dato_inok.isnot(None),
            models.Batch.bag_dato_inok.isnot(None)
        ).all()

        if not batches:
            return None

        # Calculate average colonization time
        total_days = 0
        count = 0
        for batch in batches:
            days = (batch.bag_dato_inok - batch.spawn_dato_inok).days
            if days > 0 and days < 60:  # Sanity check
                total_days += days
                count += 1

        if count == 0:
            return None

        return {
            'avg_days': total_days / count,
            'sample_size': count
        }

    def predict_colonization(self, batch: models.Batch) -> Dict:
        """
        Predict BAG colonization date and status (from bag inoculation to fruiting)

        This predicts when the bag will be ready for fruiting, based on:
        - bag_dato_inok (when spawn was added to bag)
        - bag_frukting_start (when fruiting actually started, if completed)

        Returns:
            {
                'expected_date': datetime,
                'expected_days': int,
                'days_remaining': int,
                'confidence': float (0-1),
                'status': 'on_track' | 'slow' | 'very_slow',
                'factors': {
                    'baseline': int,
                    'substrate_factor': float,
                    'temperature_factor': float | None,
                    'lc_adjustment': float | None
                }
            }
        """
        # CRITICAL: Must have bag_dato_inok - this is BAG colonization prediction
        # If bag hasn't been inoculated yet, we cannot predict
        if not batch.bag_dato_inok:
            return None

        # Get strain statistics
        stats = self._get_strain_stats(batch.strain_name, batch.lc_batch)
        if not stats or not stats.avg_colonization_days:
            # Fallback to hardcoded baseline
            baseline_days = 14  # Default
            confidence = 0.3
        else:
            baseline_days = stats.avg_colonization_days
            confidence = 0.7 if stats.total_batches > 0 else 0.5

        predicted_days = float(baseline_days)

        # Factor tracking
        factors = {
            'baseline': baseline_days,
            'substrate_factor': 1.0,
            'temperature_factor': None,
            'lc_adjustment': None
        }

        # Adjust for LC performance if we have an lc_id
        if batch.lc_id:
            lc_perf = self._get_lc_performance(batch.lc_id)
            if lc_perf and lc_perf['sample_size'] >= 3:
                # Weight historical data by sample size (max 50% weight)
                weight = min(lc_perf['sample_size'] / 10.0, 0.5)
                adjustment = lc_perf['avg_days'] - baseline_days
                predicted_days += adjustment * weight
                factors['lc_adjustment'] = adjustment * weight
                confidence = min(confidence + 0.2, 0.95)

        # Adjust for substrate type
        substrate = batch.spawn_type or 'Rye'
        # Extract substrate name (e.g., "Grain spawn glass" -> use default)
        substrate_key = None
        for key in self.SUBSTRATE_FACTORS:
            if key.lower() in substrate.lower():
                substrate_key = key
                break

        if substrate_key:
            substrate_factor = self.SUBSTRATE_FACTORS[substrate_key]
            predicted_days *= substrate_factor
            factors['substrate_factor'] = substrate_factor

        # Adjust for temperature if available
        if batch.bag_temp:
            temp_factor = self._calculate_temp_factor(batch.strain_name, batch.bag_temp)
            predicted_days *= temp_factor
            factors['temperature_factor'] = temp_factor

        # Calculate expected date from BAG inoculation date
        expected_date = batch.bag_dato_inok + timedelta(days=int(predicted_days))

        # Calculate days remaining (ensure both are dates for comparison)
        today = datetime.now().date()
        expected_date_only = expected_date.date() if isinstance(expected_date, datetime) else expected_date
        days_remaining = (expected_date_only - today).days

        # Determine status based on bag colonization progress
        status = 'on_track'
        bag_date = batch.bag_dato_inok.date() if isinstance(batch.bag_dato_inok, datetime) else batch.bag_dato_inok
        days_elapsed = (today - bag_date).days
        expected_progress = predicted_days

        # If already started fruiting (bag_frukting_start is set)
        if batch.bag_frukting_start:
            fruiting_date = batch.bag_frukting_start.date() if isinstance(batch.bag_frukting_start, datetime) else batch.bag_frukting_start
            actual_days = (fruiting_date - bag_date).days

            # Status based on actual vs predicted
            if actual_days > predicted_days * 1.3:
                status = 'very_slow'
            elif actual_days > predicted_days * 1.1:
                status = 'slow'
            else:
                status = 'on_track'
        # If still colonizing (not fruiting yet)
        else:
            if days_elapsed > expected_progress * 1.3:
                status = 'very_slow'
            elif days_elapsed > expected_progress * 1.1:
                status = 'slow'
            else:
                status = 'on_track'

        return {
            'expected_date': expected_date.isoformat(),
            'expected_days': int(predicted_days),
            'days_remaining': days_remaining,
            'confidence': round(confidence, 2),
            'status': status,
            'factors': factors
        }

    def update_statistics(self, batch: models.Batch):
        """
        Update strain statistics when batch colonization is complete
        Called when bag_dato_inok is set
        """
        if not batch.bag_dato_inok or not batch.spawn_dato_inok:
            return

        # Ensure we're comparing dates, not datetime
        spawn_date = batch.spawn_dato_inok.date() if isinstance(batch.spawn_dato_inok, datetime) else batch.spawn_dato_inok
        bag_date = batch.bag_dato_inok.date() if isinstance(batch.bag_dato_inok, datetime) else batch.bag_dato_inok
        actual_days = (bag_date - spawn_date).days

        # Sanity check
        if actual_days <= 0 or actual_days > 60:
            return

        # Update strain-level statistics
        strain_stats = self._get_strain_stats(batch.strain_name, lc_code=None)

        if not strain_stats:
            # Create new entry
            strain_stats = models.StrainStatistics(
                strain_name=batch.strain_name,
                lc_code=None,
                avg_colonization_days=actual_days,
                min_colonization_days=actual_days,
                max_colonization_days=actual_days,
                total_batches=1,
                successful_batches=1 if not batch.contaminated_units else 0
            )
            self.db.add(strain_stats)
        else:
            # Update existing
            total = strain_stats.total_batches
            avg = strain_stats.avg_colonization_days or actual_days

            # Incremental average
            new_avg = ((avg * total) + actual_days) / (total + 1)

            strain_stats.avg_colonization_days = int(new_avg)
            strain_stats.min_colonization_days = min(
                strain_stats.min_colonization_days or actual_days,
                actual_days
            )
            strain_stats.max_colonization_days = max(
                strain_stats.max_colonization_days or actual_days,
                actual_days
            )
            strain_stats.total_batches += 1
            if not batch.contaminated_units:
                strain_stats.successful_batches = (strain_stats.successful_batches or 0) + 1

        # Update LC-specific statistics if we have an lc_id
        if batch.lc_id:
            lc = self.db.query(models.LCCulture).filter(models.LCCulture.id == batch.lc_id).first()
            if lc:
                lc_stats = self.db.query(models.StrainStatistics).filter(
                    models.StrainStatistics.strain_name == batch.strain_name,
                    models.StrainStatistics.lc_code == lc.lc_code
                ).first()

                if not lc_stats:
                    lc_stats = models.StrainStatistics(
                        strain_name=batch.strain_name,
                        lc_code=lc.lc_code,
                        avg_colonization_days=actual_days,
                        min_colonization_days=actual_days,
                        max_colonization_days=actual_days,
                        total_batches=1,
                        successful_batches=1 if not batch.contaminated_units else 0
                    )
                    self.db.add(lc_stats)
                else:
                    total = lc_stats.total_batches
                    avg = lc_stats.avg_colonization_days or actual_days
                    new_avg = ((avg * total) + actual_days) / (total + 1)

                    lc_stats.avg_colonization_days = int(new_avg)
                    lc_stats.min_colonization_days = min(
                        lc_stats.min_colonization_days or actual_days,
                        actual_days
                    )
                    lc_stats.max_colonization_days = max(
                        lc_stats.max_colonization_days or actual_days,
                        actual_days
                    )
                    lc_stats.total_batches += 1
                    if not batch.contaminated_units:
                        lc_stats.successful_batches = (lc_stats.successful_batches or 0) + 1

        self.db.commit()
