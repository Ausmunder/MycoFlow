"""
Workflow Predictor - AI predictions for mushroom cultivation stages
Predicts timing and yields for each stage of the cultivation workflow
"""
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session
from ..models import Batch, StrainStatistics


class WorkflowPredictor:
    """AI predictions for all workflow stages"""

    def __init__(self, db: Session):
        self.db = db

    def _get_strain_stats(self, strain_name: str, lc_code: Optional[str] = None) -> Optional[StrainStatistics]:
        """Get strain statistics, optionally filtered by LC code"""
        query = self.db.query(StrainStatistics).filter(
            StrainStatistics.strain_name == strain_name
        )

        if lc_code:
            # Try to get LC-specific stats first
            lc_stats = query.filter(StrainStatistics.lc_code == lc_code).first()
            if lc_stats:
                return lc_stats

        # Fall back to general strain stats
        return query.filter(StrainStatistics.lc_code.is_(None)).first()

    def _temp_adjustment(self, strain_name: str, avg_temp: float) -> float:
        """Calculate temperature adjustment factor"""
        optimal_temps = {
            'oyster': (20, 24),
            'lions_mane': (18, 22),
            'shiitake': (18, 21)
        }

        if strain_name not in optimal_temps:
            return 1.0

        min_temp, max_temp = optimal_temps[strain_name]
        optimal_temp = (min_temp + max_temp) / 2

        # Calculate deviation from optimal
        deviation = abs(avg_temp - optimal_temp)

        # Each degree off optimal adds ~5% to duration
        if deviation <= 2:
            return 1.0  # Within tolerance
        elif deviation <= 4:
            return 1.1  # Slightly slower
        else:
            return 1.2  # Noticeably slower

    def _environmental_adjustment(self, strain_name: str, avg_temp: float, avg_humidity: float) -> float:
        """Calculate environmental adjustment based on temp and humidity"""
        temp_factor = self._temp_adjustment(strain_name, avg_temp)

        # Humidity adjustment (optimal is usually 90-95% for colonization)
        humidity_factor = 1.0
        if avg_humidity < 80:
            humidity_factor = 1.1  # Too dry = slower
        elif avg_humidity > 98:
            humidity_factor = 1.05  # Too wet = slightly slower

        return temp_factor * humidity_factor

    def predict_spawn_ready(self, batch: Batch) -> Optional[datetime]:
        """Predict when spawn will be ready for inoculation"""
        if not batch.spawn_dato_inok:
            return None

        stats = self._get_strain_stats(batch.strain_name, batch.lc_batch)
        if not stats or not stats.avg_spawn_days:
            # Use defaults if no stats
            default_days = {'oyster': 14, 'lions_mane': 21, 'shiitake': 28}
            base_days = default_days.get(batch.strain_name, 14)
        else:
            base_days = stats.avg_spawn_days

        # Adjust for substrate type
        substrate_factor = {
            'Rye': 1.0,
            'Rug': 1.0,  # Norwegian for Rye
            'Wheat': 0.9,
            'Hvete': 0.9,  # Norwegian
            'Oats': 1.1,
            'Havre': 1.1  # Norwegian
        }
        days = base_days * substrate_factor.get(batch.spawn_type, 1.0)

        # Temperature adjustment if available
        if batch.bag_temp:
            days *= self._temp_adjustment(batch.strain_name, batch.bag_temp)

        return batch.spawn_dato_inok + timedelta(days=int(days))

    def predict_colonization(self, batch: Batch) -> Optional[datetime]:
        """Predict when bag will be fully colonized"""
        if not batch.bag_dato_inok:
            return None

        stats = self._get_strain_stats(batch.strain_name, batch.lc_batch)
        if not stats or not stats.avg_colonization_days:
            # Use defaults
            default_days = {'oyster': 14, 'lions_mane': 21, 'shiitake': 28}
            base_days = default_days.get(batch.strain_name, 14)
        else:
            base_days = stats.avg_colonization_days

        # Adjust for substrate type
        substrate_factor = {
            'Straw': 1.0,
            'Halm': 1.0,  # Norwegian
            'Masters Mix': 1.2,
            'Masters Mix Shiitake': 1.3,
            'HWFP': 1.1,
            'Sawdust': 1.3,
            'Sagflis+kli': 1.2  # Norwegian
        }
        days = base_days * substrate_factor.get(batch.bag_substrat_type, 1.0)

        # Spawn rate adjustment
        if batch.spawn_kg and batch.bag_kg_substrat:
            spawn_rate = batch.spawn_kg / batch.bag_kg_substrat
            if spawn_rate >= 0.05:
                days *= 0.85  # 5% spawn rate = 15% faster
            elif spawn_rate >= 0.03:
                days *= 0.95  # 3% spawn rate = 5% faster

        # Environmental adjustment
        if batch.bag_temp and batch.bag_lf_kammer:
            days *= self._environmental_adjustment(
                batch.strain_name,
                batch.bag_temp,
                batch.bag_lf_kammer
            )
        elif batch.bag_temp:
            days *= self._temp_adjustment(batch.strain_name, batch.bag_temp)

        return batch.bag_dato_inok + timedelta(days=int(days))

    def predict_fruiting(self, batch: Batch) -> Optional[datetime]:
        """Predict when first pins will appear after fruiting initiation"""
        if not batch.fruiting_start_date:
            return None

        stats = self._get_strain_stats(batch.strain_name)
        if not stats or not stats.avg_fruiting_days:
            default_days = {'oyster': 7, 'lions_mane': 10, 'shiitake': 12}
            base_days = default_days.get(batch.strain_name, 7)
        else:
            base_days = stats.avg_fruiting_days

        return batch.fruiting_start_date + timedelta(days=int(base_days))

    def predict_flush1_harvest(self, batch: Batch) -> Optional[datetime]:
        """Predict when first flush is ready to harvest"""
        if not batch.flush1_actual_start_date:
            return None

        stats = self._get_strain_stats(batch.strain_name)
        if not stats or not stats.avg_flush1_days:
            days = 5  # Default
        else:
            days = stats.avg_flush1_days

        return batch.flush1_actual_start_date + timedelta(days=int(days))

    def predict_flush1_yield(self, batch: Batch) -> float:
        """Predict yield for first flush in kg"""
        if not batch.bag_kg_substrat:
            return 0.0

        stats = self._get_strain_stats(batch.strain_name)

        # Get BE% (Biological Efficiency)
        if stats and stats.avg_be_percent:
            be_percent = stats.avg_be_percent
        else:
            # Default BE% by strain
            default_be = {'oyster': 85, 'lions_mane': 65, 'shiitake': 80}
            be_percent = default_be.get(batch.strain_name, 80)

        # Calculate total expected yield
        total_expected_kg = batch.bag_kg_substrat * (be_percent / 100)

        # First flush is usually 60-70% of total yield
        return round(total_expected_kg * 0.65, 2)

    def predict_flush2(self, batch: Batch) -> Tuple[Optional[datetime], float]:
        """Predict second flush timing and yield"""
        if not batch.flush1_harvest_date:
            return None, 0.0

        # Rest period varies by strain
        rest_days = {
            'oyster': 7,
            'lions_mane': 10,
            'shiitake': 14
        }

        flush2_date = batch.flush1_harvest_date + timedelta(
            days=rest_days.get(batch.strain_name, 10)
        )

        # Flush 2 is usually 30-50% of flush 1 yield
        if batch.bag_host1_total_kg:
            flush2_kg = round(batch.bag_host1_total_kg * 0.5, 2)
        else:
            flush2_kg = 0.0

        return flush2_date, flush2_kg

    def get_workflow_predictions(self, batch: Batch) -> Dict:
        """Get all predictions for a batch based on current stage"""
        predictions = {
            'current_stage': batch.workflow_status,
            'predictions': {}
        }

        # Spawn stage predictions
        if batch.spawn_dato_inok and not batch.spawn_actual_ready_date:
            spawn_ready = self.predict_spawn_ready(batch)
            if spawn_ready:
                predictions['predictions']['spawn_ready_date'] = spawn_ready
                predictions['predictions']['spawn_days_remaining'] = (
                    spawn_ready - datetime.now()
                ).days

        # Colonization predictions
        if batch.bag_dato_inok and not batch.colonization_actual_date:
            colon_date = self.predict_colonization(batch)
            if colon_date:
                predictions['predictions']['colonization_date'] = colon_date
                predictions['predictions']['colonization_days_remaining'] = (
                    colon_date - datetime.now()
                ).days

        # Fruiting predictions
        if batch.fruiting_start_date and not batch.flush1_actual_start_date:
            flush1_pins = self.predict_fruiting(batch)
            if flush1_pins:
                predictions['predictions']['flush1_pins_date'] = flush1_pins

        # Flush 1 predictions
        if batch.workflow_status in ['fruiting', 'flush1_active']:
            flush1_kg = self.predict_flush1_yield(batch)
            predictions['predictions']['flush1_expected_kg'] = flush1_kg

        if batch.flush1_actual_start_date and not batch.flush1_harvest_date:
            harvest_date = self.predict_flush1_harvest(batch)
            if harvest_date:
                predictions['predictions']['flush1_harvest_date'] = harvest_date

        # Flush 2 predictions
        if batch.flush1_harvest_date:
            flush2_date, flush2_kg = self.predict_flush2(batch)
            if flush2_date:
                predictions['predictions']['flush2_start_date'] = flush2_date
                predictions['predictions']['flush2_expected_kg'] = flush2_kg

        return predictions

    def calculate_status(self, batch: Batch) -> str:
        """Calculate if batch is on track, slow, or very slow"""
        if batch.workflow_status == 'colonizing':
            if not batch.bag_dato_inok or not batch.colonization_expected_date:
                return 'unknown'

            days_elapsed = (datetime.now() - batch.bag_dato_inok).days
            expected_days = (batch.colonization_expected_date - batch.bag_dato_inok).days

            if days_elapsed <= expected_days:
                return 'on_track'
            elif days_elapsed <= expected_days * 1.2:
                return 'slow'
            else:
                return 'very_slow'

        return 'on_track'
