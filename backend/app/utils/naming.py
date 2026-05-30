"""
Naming / code generation for the traceability chain.

Convention (confirmed with owner):
    STRAIN   prefix = species_code + strain_number      e.g. "HE9514"
    CULTURE  {prefix}-{media}-{YYWW}{unit}               e.g. "HE9514-LC-2614A"
    BATCH    {prefix}-B{NN}                               e.g. "HE9514-B01"

- media   = MC | LC | PD | SL
- YYWW    = 2-digit ISO year + 2-digit ISO week ("2614" = 2026 week 14)
- unit    = letter A, B, C… incremented per (strain, media, year_week)
- batch NN = incremented per lineage (prefix), 2 digits (extends to 3 past 99)

The batch code carries no date — the production week/date is recoverable via the
linked source culture (which carries year_week) and the batch's own inoculation date.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from .. import models

MEDIA_TYPES = ("MC", "LC", "PD", "SL")


def current_year_week(d: datetime | None = None) -> str:
    """Return YYWW for the given date (default: now, UTC). E.g. 2026-W14 -> '2614'."""
    d = d or datetime.now(timezone.utc)
    iso = d.isocalendar()  # (ISO year, ISO week, ISO weekday)
    return f"{iso[0] % 100:02d}{iso[1]:02d}"


def _next_letter(used: set[str]) -> str:
    """Return the next free uppercase letter not in `used` (A..Z, then AA, AB…)."""
    # Single letters A-Z
    for code in range(ord("A"), ord("Z") + 1):
        if chr(code) not in used:
            return chr(code)
    # Overflow: AA, AB, … (rare)
    i = 0
    while True:
        first = chr(ord("A") + (i // 26))
        second = chr(ord("A") + (i % 26))
        candidate = first + second
        if candidate not in used:
            return candidate
        i += 1


def next_culture_unit(db: Session, strain_id: int, media_type: str, year_week: str) -> str:
    """Next free unit letter for a (strain, media, year_week) group."""
    rows = (
        db.query(models.Culture.unit)
        .filter(
            models.Culture.strain_id == strain_id,
            models.Culture.media_type == media_type,
            models.Culture.year_week == year_week,
        )
        .all()
    )
    used = {r[0] for r in rows if r[0]}
    return _next_letter(used)


def compose_culture_code(prefix: str, media_type: str, year_week: str, unit: str) -> str:
    """Compose a culture code, e.g. compose('HE9514','LC','2614','A') -> 'HE9514-LC-2614A'."""
    return f"{prefix}-{media_type}-{year_week}{unit}"


def lineage_prefix(code: str) -> str:
    """Extract the lineage prefix (everything before the first '-') from any code.

    Robust for both the new convention ('HE9514-LC-2614A' -> 'HE9514') and older
    LC codes ('GOH1-190925' -> 'GOH1').
    """
    return code.split("-", 1)[0] if code else ""


def next_batch_code(db: Session, strain_prefix: str) -> str:
    """Next batch code for a lineage, e.g. 'HE9514' -> 'HE9514-B01'.

    Scans existing batch codes ``{prefix}-B%`` in ``batches.spawn_batch``, parses the
    trailing number and increments. Counter is per lineage (prefix).
    """
    like = f"{strain_prefix}-B%"
    rows = (
        db.query(models.Batch.spawn_batch)
        .filter(models.Batch.spawn_batch.like(like))
        .all()
    )
    max_n = 0
    marker = f"{strain_prefix}-B"
    for (code,) in rows:
        if not code or not code.startswith(marker):
            continue
        tail = code[len(marker):]
        # Take leading digits only (ignore any suffix)
        digits = ""
        for ch in tail:
            if ch.isdigit():
                digits += ch
            else:
                break
        if digits:
            max_n = max(max_n, int(digits))
    nxt = max_n + 1
    width = 2 if nxt < 100 else 3
    return f"{strain_prefix}-B{nxt:0{width}d}"
