"""
MycoFlow event dispatcher — sends domain events to HAL-Core via hal_core_client.

Mirrors hal-9000/packages/mycoflow/app/events.py so this module can be copied
verbatim into the HAL-9000 package on migration. In standalone mode hal_core_client
is unavailable and every dispatch is a no-op, so the same calling code runs unchanged.

asyncio.run() is safe here because FastAPI runs synchronous routes in a thread pool
(no active event loop in the thread).
"""

import asyncio
import logging
from datetime import datetime, timezone
from uuid import uuid4

logger = logging.getLogger(__name__)

try:
    from hal_core_client import dispatch_command, make_command_envelope, registry
    _HAS_HAL_CORE = True
except (ImportError, ModuleNotFoundError):
    _HAS_HAL_CORE = False
    dispatch_command = None
    make_command_envelope = None
    registry = None
    logger.warning("hal_core_client not available — event dispatch disabled (dev/standalone mode)")

_ISSUED_BY = "mycoflow"
_SOURCE = "mycoflow"


def _dispatch(command_type: str, payload: dict) -> None:
    """Send a command to HAL-Core from a synchronous context."""
    if not _HAS_HAL_CORE:
        logger.debug("Skipping dispatch of %s (hal_core_client unavailable)", command_type)
        return
    try:
        schema_hash = registry.command_schema_hash(command_type, 1)
        envelope = make_command_envelope(
            type=command_type,
            version=1,
            schema_hash=schema_hash,
            issued_by=_ISSUED_BY,
            source=_SOURCE,
            payload=payload,
            idempotency_key=f"mycoflow:{command_type}:{uuid4()}",
        )
        asyncio.run(dispatch_command(envelope))
        logger.debug("Dispatched %s", command_type)
    except Exception as exc:
        logger.warning("Failed to dispatch %s: %s", command_type, exc)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Batch events (already present in HAL-9000 — kept compatible)
# ---------------------------------------------------------------------------

def batch_created(batch_id: int, strain: str, batch_type: str,
                  substrat_kg: float | None, lot_number: str | None) -> None:
    _dispatch("mycoflow.batch.created.submit", {
        "batch_id": batch_id,
        "strain": strain,
        "batch_type": batch_type,
        "substrat_kg": substrat_kg,
        "lot_number": lot_number,
        "timestamp": _now(),
    })


# ---------------------------------------------------------------------------
# New traceability events (strain register + culture lineage)
# ---------------------------------------------------------------------------

def strain_created(strain_id: int, prefix: str, common_name: str | None) -> None:
    _dispatch("mycoflow.strain.created.submit", {
        "strain_id": strain_id,
        "prefix": prefix,
        "common_name": common_name,
        "timestamp": _now(),
    })


def culture_created(culture_id: int, code: str, media_type: str,
                    strain_prefix: str) -> None:
    _dispatch("mycoflow.culture.created.submit", {
        "culture_id": culture_id,
        "code": code,
        "media_type": media_type,
        "strain_prefix": strain_prefix,
        "timestamp": _now(),
    })


def culture_derived(parent_code: str | None, child_code: str,
                    child_media_type: str) -> None:
    _dispatch("mycoflow.culture.derived.submit", {
        "parent_code": parent_code,
        "child_code": child_code,
        "child_media_type": child_media_type,
        "timestamp": _now(),
    })
