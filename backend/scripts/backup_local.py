#!/usr/bin/env python3
"""
MycoFlow nattlig lokal database-backup
Kjøres via systemd timer kl 02:00 på VPS.

Flyt: pg_dump → .sql.gz med dato → /home/mycoflow/backups/ → slett filer > 30 dager
"""
import gzip
import logging
import os
import subprocess
import sys
import urllib.parse
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "app" / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("mycoflow-backup")

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg://mycoflow@/mycoflow?host=/var/run/postgresql",
)
BACKUP_DIR = Path(os.environ.get("BACKUP_DIR", "/home/mycoflow/backups"))
KEEP_DAYS = int(os.environ.get("BACKUP_KEEP_DAYS", "30"))


def pg_dump(db_url: str, output_path: Path) -> None:
    url = db_url.replace("postgresql+psycopg://", "postgresql://")
    parsed = urllib.parse.urlparse(url)
    qs = urllib.parse.parse_qs(parsed.query)

    cmd = ["pg_dump", "--format=plain", "--no-password"]

    host = qs.get("host", [None])[0] or parsed.hostname
    if host:
        cmd += ["-h", host]
    if parsed.username:
        cmd += ["-U", parsed.username]
    cmd.append(parsed.path.lstrip("/"))

    log.info("Kjører: %s", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"pg_dump feilet: {result.stderr.strip()}")

    with gzip.open(output_path, "wt", encoding="utf-8") as f:
        f.write(result.stdout)

    size_kb = output_path.stat().st_size // 1024
    log.info("Dump lagret: %s (%d KB)", output_path.name, size_kb)


def prune_old_backups(backup_dir: Path, keep_days: int) -> None:
    cutoff = datetime.now().timestamp() - keep_days * 86400
    deleted = 0
    for f in backup_dir.glob("mycoflow_backup_*.sql.gz"):
        if f.stat().st_mtime < cutoff:
            f.unlink()
            log.info("Slettet gammel backup: %s", f.name)
            deleted += 1
    log.info("Ryddet %d gammel(e) backup(s)", deleted)


def main():
    log.info("=== MycoFlow nattlig backup starter ===")

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dump_file = BACKUP_DIR / f"mycoflow_backup_{timestamp}.sql.gz"

    try:
        pg_dump(DATABASE_URL, dump_file)
        prune_old_backups(BACKUP_DIR, KEEP_DAYS)
        log.info("=== Backup fullført: %s ===", dump_file.name)
    except Exception as e:
        log.error("Backup FEILET: %s", e)
        if dump_file.exists():
            dump_file.unlink()
        sys.exit(1)


if __name__ == "__main__":
    main()
