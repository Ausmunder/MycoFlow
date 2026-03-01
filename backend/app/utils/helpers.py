"""
Helper functions for batch serialization and data conversion
"""
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import models


def convert_empty_to_none(data: dict) -> dict:
    """Convert empty strings to None in dictionary"""
    return {k: (None if v == "" else v) for k, v in data.items()}


def serialize_batch(batch: models.Batch, db: Session = None) -> dict:
    """Serialize batch with all fields including calculated ones"""
    # Get unit count if spawn_batch exists
    unit_count = 0
    if batch.spawn_batch and db:
        batch_info = db.query(models.BatchInfo).filter(
            models.BatchInfo.spawn_batch == batch.spawn_batch
        ).first()
        if batch_info:
            unit_count = db.query(models.BatchUnit).filter(
                models.BatchUnit.batch_info_id == batch_info.id
            ).count()

    # Auto-calculate spawn_forventet_ferdig if not set
    spawn_forventet_ferdig = batch.spawn_forventet_ferdig
    if not spawn_forventet_ferdig and batch.spawn_dato_inok and batch.strain_name:
        # Baseline spawn colonization days
        spawn_baseline = {
            "oyster": 10,
            "lions_mane": 12,
            "shiitake": 14,
            "reishi": 16
        }
        days = spawn_baseline.get(batch.strain_name, 12)
        spawn_forventet_ferdig = batch.spawn_dato_inok + timedelta(days=days)

    batch_dict = {
        "id": batch.id,
        "batch_type": batch.batch_type,
        "strain_name": batch.strain_name,
        "archived": batch.archived,
        "notes": batch.notes,
        "created_at": batch.created_at,
        "updated_at": batch.updated_at,

        # LC
        "lc_batch": batch.lc_batch,
        "lc_vol": batch.lc_vol,
        "lc_dato_inok": batch.lc_dato_inok,

        # Spawn
        "spawn_batch": batch.spawn_batch,
        "spawn_type": batch.spawn_type,
        "spawn_dato_inok": batch.spawn_dato_inok,
        "spawn_kg": batch.spawn_kg,
        "spawn_dager_ink": batch.spawn_dager_ink,
        "spawn_forventet_ferdig": spawn_forventet_ferdig,
        "unit_count": unit_count,

        # Bag - Basis
        "bag_batch": batch.bag_batch,
        "bag_forventet_kolon": batch.bag_forventet_kolon,
        "bag_substrat_type": batch.bag_substrat_type,
        "bag_kg_substrat": batch.bag_kg_substrat,
        "bag_antall_bager": batch.bag_antall_bager,
        "bag_dato_inok": batch.bag_dato_inok,
        "bag_dager_ink": batch.bag_dager_ink,
        "bag_status": batch.bag_status,
        "bag_temp": batch.bag_temp,

        # Bag - Frukting
        "bag_frukting_start": batch.bag_frukting_start,
        "bag_temp_kammer": batch.bag_temp_kammer,
        "bag_lf_kammer": batch.bag_lf_kammer,

        # Bag - Høst 1
        "bag_host1_start": batch.bag_host1_start,
        "bag_host1_slutt": batch.bag_host1_slutt,
        "bag_host1_total_kg": batch.bag_host1_total_kg,
        "bag_host1_dager": batch.bag_host1_dager,

        # Bag - Høst 2
        "bag_host2_start": batch.bag_host2_start,
        "bag_host2_slutt": batch.bag_host2_slutt,
        "contaminated_units": batch.contaminated_units,

        # Kontaminasjon per fase
        "spawn_contaminated_units":      batch.spawn_contaminated_units,
        "inkubering_contaminated_units": batch.inkubering_contaminated_units,
        "frukt1_contaminated_units":     batch.frukt1_contaminated_units,
        "frukt2_contaminated_units":     batch.frukt2_contaminated_units,
        "spawn_contamination_type":      batch.spawn_contamination_type,
        "inkubering_contamination_type": batch.inkubering_contamination_type,
        "frukt1_contamination_type":     batch.frukt1_contamination_type,
        "frukt2_contamination_type":     batch.frukt2_contamination_type,
        "spawn_abortert":      batch.spawn_abortert,
        "inkubering_abortert": batch.inkubering_abortert,
        "frukt1_abortert":     batch.frukt1_abortert,
        "frukt2_abortert":     batch.frukt2_abortert,

        "bag_host2_total_kg": batch.bag_host2_total_kg,
        "bag_host2_dager": batch.bag_host2_dager,

        # Bag - Beregninger
        "bag_syklus_lengde": batch.bag_syklus_lengde,
        "bag_be_percent": batch.bag_be_percent,

        # Workflow and Refrigeration
        "workflow_status": batch.workflow_status,
        "in_fridge": batch.in_fridge,
        "fridge_date": batch.fridge_date,

        # QR Code
        "qr_code": batch.qr_code,
        "qr_data": batch.qr_data,
        "label_printed": batch.label_printed,
        "label_printed_at": batch.label_printed_at,
        "label_print_count": batch.label_print_count
    }
    return batch_dict
