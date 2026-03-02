"""
QR Code and Label Printing endpoints - label generation and printer integration
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..database import get_db
from .. import models
from ..utils.helpers import serialize_batch
from ..printer import get_printer
from ..core.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/api/batches/{batch_id}/qr")
def get_batch_qr(batch_id: int, db: Session = Depends(get_db)):
    """Get QR code info for batch"""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return {
        "qr_code": batch.qr_code,
        "qr_data": batch.qr_data,
        "qr_image_url": f"/api/batches/{batch_id}/qr/image",
        "label_printed": batch.label_printed,
        "label_print_count": batch.label_print_count or 0
    }


@router.get("/api/batches/{batch_id}/qr/image")
def get_batch_qr_image(batch_id: int, db: Session = Depends(get_db)):
    """Get QR code as PNG image"""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    try:
        printer = get_printer()
        qr_data = batch.qr_code or f"SOPP-{batch_id}"
        img_bytes = printer.generate_qr_image_bytes(qr_data, size=400)

        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate QR image: {str(e)}")


@router.post("/api/batches/{batch_id}/print")
def print_batch_label(batch_id: int, copies: int = 1, db: Session = Depends(get_db)):
    """Print label for batch"""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    try:
        printer = get_printer()
        result = printer.print_label(batch, copies=copies)

        if result["success"]:
            # Update print tracking
            batch.label_printed = True
            batch.label_printed_at = datetime.now(timezone.utc)
            batch.label_print_count = (batch.label_print_count or 0) + copies
            db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Print failed: {str(e)}")


@router.post("/api/batches/{batch_id}/reprint")
def reprint_batch_label(batch_id: int, copies: int = 1, db: Session = Depends(get_db)):
    """Reprint label for batch (same as print, but explicit for UI)"""
    return print_batch_label(batch_id, copies, db)


@router.post("/api/printer/test")
def test_printer():
    """Test printer connectivity"""
    try:
        printer = get_printer()
        result = printer.test_print()
        return result
    except Exception as e:
        return {
            "success": False,
            "message": f"Printer test failed: {str(e)}"
        }
