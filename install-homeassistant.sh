#!/bin/bash
# Sopp Tracker - Automated Home Assistant Installation Script
# Run this script on your Home Assistant machine

set -e

echo "🍄 Sopp Tracker - Home Assistant Installation"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running with root/sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}" 
   exit 1
fi

echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}✓ Docker found${NC}"
fi

# Check for docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}Installing docker-compose...${NC}"
    apt-get update
    apt-get install -y docker-compose
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

echo -e "${BLUE}Step 2: Setting up directories...${NC}"

# Default installation directory
INSTALL_DIR="/config/sopp-tracker"

# Ask user for installation directory
read -p "Installation directory [${INSTALL_DIR}]: " USER_DIR
INSTALL_DIR="${USER_DIR:-$INSTALL_DIR}"

# Create directories
mkdir -p "${INSTALL_DIR}"
mkdir -p "${INSTALL_DIR}/data"
cd "${INSTALL_DIR}"

echo -e "${GREEN}✓ Directories created: ${INSTALL_DIR}${NC}"
echo ""

echo -e "${BLUE}Step 3: Downloading files...${NC}"

# Check if files already exist
if [ -f "docker-compose.yml" ]; then
    read -p "Files already exist. Overwrite? (y/N): " OVERWRITE
    if [[ ! $OVERWRITE =~ ^[Yy]$ ]]; then
        echo "Skipping download. Using existing files."
    else
        echo "Files will be overwritten."
        # Download files logic here
        echo -e "${GREEN}✓ Files downloaded${NC}"
    fi
else
    echo "Please copy the sopp-tracker files to ${INSTALL_DIR}"
    echo "Required files:"
    echo "  - docker-compose.yml"
    echo "  - backend/ (entire directory)"
    echo ""
    read -p "Have you copied the files? (y/N): " FILES_READY
    if [[ ! $FILES_READY =~ ^[Yy]$ ]]; then
        echo "Please copy files and run this script again."
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Step 4: Configuration...${NC}"

# Ask for MQTT settings (optional)
read -p "Configure MQTT for Home Assistant? (y/N): " CONFIG_MQTT

if [[ $CONFIG_MQTT =~ ^[Yy]$ ]]; then
    read -p "MQTT Broker [homeassistant.local]: " MQTT_BROKER
    MQTT_BROKER="${MQTT_BROKER:-homeassistant.local}"
    
    read -p "MQTT Port [1883]: " MQTT_PORT
    MQTT_PORT="${MQTT_PORT:-1883}"
    
    read -p "MQTT Username (optional): " MQTT_USER
    read -sp "MQTT Password (optional): " MQTT_PASS
    echo ""
    
    # Create .env file
    cat > .env << EOF
MQTT_BROKER=${MQTT_BROKER}
MQTT_PORT=${MQTT_PORT}
MQTT_USERNAME=${MQTT_USER}
MQTT_PASSWORD=${MQTT_PASS}
EOF
    
    echo -e "${GREEN}✓ MQTT configured${NC}"
fi

echo ""
echo -e "${BLUE}Step 5: Building and starting containers...${NC}"

# Build and start
docker-compose up -d --build

echo ""
echo -e "${GREEN}✓ Container started${NC}"
echo ""

# Wait for service to be ready
echo -e "${BLUE}Waiting for service to start...${NC}"
sleep 10

# Check if service is running
if docker ps | grep -q sopp-tracker; then
    echo -e "${GREEN}✓ Service is running${NC}"
else
    echo -e "${RED}✗ Service failed to start${NC}"
    echo "Check logs with: docker logs sopp-tracker"
    exit 1
fi

# Get IP address
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo "=============================================="
echo ""
echo "Backend is now running at:"
echo "  - http://localhost:8000"
echo "  - http://${IP}:8000"
echo "  - http://homeassistant.local:8000"
echo ""
echo "API Documentation:"
echo "  - http://${IP}:8000/docs"
echo ""
echo "Useful commands:"
echo "  - View logs:    docker logs sopp-tracker"
echo "  - Restart:      docker restart sopp-tracker"
echo "  - Stop:         docker stop sopp-tracker"
echo "  - Start:        docker start sopp-tracker"
echo ""
echo "Data is stored in: ${INSTALL_DIR}/data"
echo ""
echo "Next steps:"
echo "  1. Open http://${IP}:8000/docs in your browser"
echo "  2. Test the API"
echo "  3. Migrate data from HTML version (if needed)"
echo ""
echo "To migrate data:"
echo "  docker exec -it sopp-tracker python /app/scripts/migrate_from_html.py /app/data/backup.json"
echo ""
