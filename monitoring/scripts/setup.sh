#!/bin/bash
# Save-n-Bite Monitoring Stack Setup Script
# This script sets up the complete Grafana monitoring infrastructure

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Save-n-Bite CI/CD Monitoring Setup                 ║"
echo "║   Grafana + Prometheus + Loki                         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"

cd "$MONITORING_DIR"

# Check prerequisites
echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check for docker-compose or docker compose
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo -e "${YELLOW}For WSL 2 users:${NC}"
    echo -e "  1. Open Docker Desktop"
    echo -e "  2. Go to Settings → Resources → WSL Integration"
    echo -e "  3. Enable integration for your WSL 2 distro"
    echo -e "  4. Run: wsl --shutdown (then restart your terminal)"
    echo -e ""
    echo -e "Or install docker-compose: ${YELLOW}sudo apt install docker-compose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose found${NC}"

# Check if Python is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}❌ Python is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python found: $PYTHON_CMD${NC}"

# Install Python dependencies
echo -e "${YELLOW}[2/7] Installing Python dependencies...${NC}"
# Try to install requests, but don't fail if it's already available or system is externally managed
if $PYTHON_CMD -c "import requests" 2>/dev/null; then
    echo -e "${GREEN}✅ Python requests module already available${NC}"
else
    echo -e "${YELLOW}Installing requests module...${NC}"
    # Try different installation methods
    if $PYTHON_CMD -m pip install --user --quiet requests 2>/dev/null; then
        echo -e "${GREEN}✅ Python dependencies installed${NC}"
    elif $PYTHON_CMD -m pip install --quiet requests 2>/dev/null; then
        echo -e "${GREEN}✅ Python dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not install requests via pip${NC}"
        echo -e "${YELLOW}   Trying apt install...${NC}"
        if command -v apt &> /dev/null; then
            sudo apt install -y python3-requests > /dev/null 2>&1 && echo -e "${GREEN}✅ Installed via apt${NC}" || \
            echo -e "${YELLOW}⚠️  Please install manually: sudo apt install python3-requests${NC}"
        else
            echo -e "${YELLOW}⚠️  Please install requests manually before exporting metrics${NC}"
        fi
    fi
fi

# Create necessary directories
echo -e "${YELLOW}[3/7] Creating directories...${NC}"
mkdir -p prometheus/rules
mkdir -p loki
mkdir -p promtail
mkdir -p grafana/provisioning/datasources
mkdir -p grafana/provisioning/dashboards
mkdir -p grafana/dashboards
echo -e "${GREEN}✅ Directories created${NC}"

# Generate Grafana dashboard
echo -e "${YELLOW}[4/7] Generating Grafana dashboard...${NC}"
cd scripts
$PYTHON_CMD generate_dashboard.py
cd ..
echo -e "${GREEN}✅ Dashboard generated${NC}"

# Make scripts executable
echo -e "${YELLOW}[5/7] Setting script permissions...${NC}"
chmod +x scripts/*.sh
chmod +x scripts/*.py
echo -e "${GREEN}✅ Scripts made executable${NC}"

# Pull Docker images
echo -e "${YELLOW}[6/7] Pulling Docker images (this may take a few minutes)...${NC}"
$DOCKER_COMPOSE_CMD pull --quiet
echo -e "${GREEN}✅ Docker images pulled${NC}"

# Start the monitoring stack
echo -e "${YELLOW}[7/7] Starting monitoring stack...${NC}"
$DOCKER_COMPOSE_CMD up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service health
echo -e "\n${BLUE}Service Status:${NC}"

check_service() {
    local service=$1
    local port=$2
    local url=$3
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ $service${NC} - http://localhost:$port"
        return 0
    else
        echo -e "  ${RED}❌ $service${NC} - http://localhost:$port (not responding)"
        return 1
    fi
}

check_service "Grafana" "3000" "http://localhost:3000/api/health"
check_service "Prometheus" "9090" "http://localhost:9090/-/healthy"
check_service "Pushgateway" "9091" "http://localhost:9091/metrics"
check_service "Loki" "3100" "http://localhost:3100/ready"

echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 Monitoring Stack Successfully Started!          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📊 Access Points:${NC}"
echo -e "  • Grafana:      ${GREEN}http://localhost:3000${NC}"
echo -e "    Username: admin"
echo -e "    Password: savenbite_admin"
echo -e "\n  • Prometheus:   ${GREEN}http://localhost:9090${NC}"
echo -e "  • Pushgateway:  ${GREEN}http://localhost:9091${NC}"
echo -e "  • Loki:         ${GREEN}http://localhost:3100${NC}"

echo -e "\n${BLUE}📝 Next Steps:${NC}"
echo -e "  1. Open Grafana at http://localhost:3000"
echo -e "  2. Login with admin/savenbite_admin"
echo -e "  3. Navigate to Dashboards → CI/CD"
echo -e "  4. Configure GitHub Actions (see README.md)"
echo -e "     - Set PUSHGATEWAY_URL variable in GitHub"
echo -e "     - Update workflow files to export metrics"

echo -e "\n${BLUE}📚 Documentation:${NC}"
echo -e "  • Full setup guide: ${YELLOW}monitoring/README.md${NC}"
echo -e "  • Example workflows: ${YELLOW}monitoring/examples/${NC}"

echo -e "\n${BLUE}🛠️  Useful Commands:${NC}"
echo -e "  • View logs:    ${YELLOW}$DOCKER_COMPOSE_CMD logs -f${NC}"
echo -e "  • Stop stack:   ${YELLOW}$DOCKER_COMPOSE_CMD down${NC}"
echo -e "  • Restart:      ${YELLOW}$DOCKER_COMPOSE_CMD restart${NC}"
echo -e "  • Status:       ${YELLOW}$DOCKER_COMPOSE_CMD ps${NC}"

echo -e "\n${GREEN}Happy Monitoring! 🚀${NC}\n"
