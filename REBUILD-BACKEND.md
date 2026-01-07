# Backend Rebuild Instructions

## Why Rebuild?

The Docker container only mounts `./backend/app` as a volume. Changes to:
- `app/main.py`
- `app/models.py`
- New routers in `app/routers/`
- New utils in `app/utils/`

...are included in the Docker image at build time, so the container must be **rebuilt** after deploying these files.

## Rebuild on Home Assistant

### Via SSH or HA Terminal:

```bash
cd /config/sopp-tracker

# Stop and rebuild container
docker-compose down
docker-compose build sopp-tracker
docker-compose up -d

# Wait for services to start
sleep 10

# Run migration
docker exec sopp-tracker python scripts/run_migration.py

# Check version
curl http://localhost:8000/
# Should show version: 4.7.0
```

### Check Logs:

```bash
# View backend logs
docker logs -f sopp-tracker

# View all logs
docker-compose logs -f
```

### Test API:

```bash
# Health check
curl http://localhost:8000/

# Test workflow endpoint (replace 1 with actual batch ID)
curl http://localhost:8000/api/batches/1/workflow

# View API docs
curl http://localhost:8000/docs
```

## Quick Rebuild Command:

```bash
cd /config/sopp-tracker && \
docker-compose down && \
docker-compose build sopp-tracker && \
docker-compose up -d && \
sleep 10 && \
docker exec sopp-tracker python scripts/run_migration.py && \
curl http://localhost:8000/
```

## Troubleshooting:

### Container won't start:
```bash
docker-compose logs sopp-tracker
```

### Database connection issues:
```bash
# Check if postgres is running
docker ps | grep postgres

# Restart postgres
docker-compose restart postgres
```

### Migration fails:
```bash
# Run migration manually with verbose output
docker exec -it sopp-tracker python scripts/run_migration.py
```

### Reset to previous version:
```bash
# Restore from backup
cp /config/sopp-tracker/backend/.backup-TIMESTAMP/* /config/sopp-tracker/backend/app/

# Rebuild
docker-compose down && docker-compose build && docker-compose up -d
```
