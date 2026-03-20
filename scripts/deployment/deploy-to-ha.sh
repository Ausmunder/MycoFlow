#!/bin/bash
# MycoFlow Backend Deployment Script
# Deploy backend til Home Assistant server

set -e  # Exit on error

# Configuration
HA_HOST="${HA_HOST:-192.168.1.251}"
HA_USER="${HA_USER:-root}"
HA_PATH="${HA_PATH:-/config/mycoflow}"
LOCAL_BACKEND="K:/mycoflow/backend"

echo "🍄 MycoFlow Backend Deployment"
echo "=================================="
echo "Target: $HA_USER@$HA_HOST:$HA_PATH"
echo ""

# Check if SSH is configured
if ! ssh -q $HA_USER@$HA_HOST exit; then
    echo "❌ Cannot connect to $HA_HOST via SSH"
    echo "Please configure SSH access first or set HA_USER environment variable"
    exit 1
fi

echo "✅ SSH connection OK"
echo ""

# Step 1: Backup current main.py
echo "📦 Creating backup of current main.py..."
ssh $HA_USER@$HA_HOST "cd $HA_PATH/backend/app && cp main.py main.py.backup-\$(date +%Y%m%d-%H%M%S) || true"

# Step 2: Copy updated files
echo "📤 Uploading updated backend files..."
scp "$LOCAL_BACKEND/app/main.py" "$HA_USER@$HA_HOST:$HA_PATH/backend/app/"
scp "$LOCAL_BACKEND/app/models.py" "$HA_USER@$HA_HOST:$HA_PATH/backend/app/"
scp "$LOCAL_BACKEND/app/schemas.py" "$HA_USER@$HA_HOST:$HA_PATH/backend/app/"

echo "✅ Files uploaded"
echo ""

# Step 3: Restart container
echo "🔄 Restarting Docker container..."
ssh $HA_USER@$HA_HOST "cd $HA_PATH && docker-compose restart mycoflow"

echo "✅ Container restarted"
echo ""

# Step 4: Wait for container to be healthy
echo "⏳ Waiting for container to be ready..."
sleep 5

# Step 5: Check if backend is responding
echo "🔍 Checking backend health..."
if ssh $HA_USER@$HA_HOST "curl -s http://localhost:8000/ > /dev/null"; then
    echo "✅ Backend is responding!"
else
    echo "⚠️  Backend may not be ready yet. Check logs with:"
    echo "   ssh $HA_USER@$HA_HOST 'docker logs mycoflow'"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test frontend: Open MycoFlow in browser"
echo "2. Create test batch with spawn_batch"
echo "3. Click 'Add Units' - should work without 404 error"
echo ""
echo "View logs: ssh $HA_USER@$HA_HOST 'docker logs -f mycoflow'"
echo "API docs: http://$HA_HOST:8000/docs"
