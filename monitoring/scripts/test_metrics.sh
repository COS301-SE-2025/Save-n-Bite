#!/bin/bash
# Test Script for Monitoring Stack
# Generates sample metrics to verify the pipeline is working

set -e

PUSHGATEWAY_URL="${PUSHGATEWAY_URL:-http://localhost:9091}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Testing Save-n-Bite Monitoring Stack               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if pushgateway is reachable
echo -e "${YELLOW}[1/6] Checking Pushgateway connection...${NC}"
if curl -s --max-time 5 "$PUSHGATEWAY_URL/metrics" > /dev/null; then
    echo -e "${GREEN}✅ Pushgateway is reachable at $PUSHGATEWAY_URL${NC}"
else
    echo -e "${RED}❌ Cannot reach Pushgateway at $PUSHGATEWAY_URL${NC}"
    echo "Make sure the monitoring stack is running: docker-compose up -d"
    exit 1
fi

cd "$SCRIPT_DIR"

# Set GitHub-like environment for testing
export GITHUB_WORKFLOW="Test Workflow"
export GITHUB_RUN_ID="test-$(date +%s)"
export GITHUB_REPOSITORY="COS301-SE-2025/Save-n-Bite"
export GITHUB_REF_NAME="main"
export GITHUB_RUN_NUMBER="42"
export GITHUB_ACTOR="test-user"

echo ""
echo -e "${YELLOW}[2/6] Generating workflow metrics...${NC}"
python3 export_metrics.py workflow success 145
python3 export_metrics.py workflow failure 89
echo -e "${GREEN}✅ Workflow metrics exported${NC}"

echo ""
echo -e "${YELLOW}[3/6] Generating test metrics...${NC}"
python3 export_metrics.py test 156 156 0 0 45.2 --app "authentication"
python3 export_metrics.py test 104 102 2 0 38.7 --app "analytics"
python3 export_metrics.py test 67 65 2 0 28.3 --app "frontend"
echo -e "${GREEN}✅ Test metrics exported${NC}"

echo ""
echo -e "${YELLOW}[4/6] Generating coverage metrics...${NC}"
python3 export_metrics.py coverage 73 --app "backend"
python3 export_metrics.py coverage 68 --app "frontend"
python3 export_metrics.py coverage 91 --app "authentication"
echo -e "${GREEN}✅ Coverage metrics exported${NC}"

echo ""
echo -e "${YELLOW}[5/6] Generating build metrics...${NC}"
python3 export_metrics.py build backend success 182
python3 export_metrics.py build frontend success 156
echo -e "${GREEN}✅ Build metrics exported${NC}"

echo ""
echo -e "${YELLOW}[6/6] Generating Docker and deployment metrics...${NC}"
python3 export_metrics.py docker backend 245.5 182 --tag "latest"
python3 export_metrics.py docker frontend 128.3 156 --tag "latest"
python3 export_metrics.py deployment production success 425
echo -e "${GREEN}✅ Docker and deployment metrics exported${NC}"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Test Metrics Successfully Generated!            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${BLUE}📊 Next Steps:${NC}"
echo -e "  1. Open Grafana: ${GREEN}http://localhost:3000${NC}"
echo -e "  2. Navigate to: Dashboards → CI/CD"
echo -e "  3. View the 'Save-n-Bite CI/CD Pipeline Dashboard'"
echo -e "  4. You should see the test metrics displayed"
echo ""
echo -e "${BLUE}🔍 Verify in Prometheus:${NC}"
echo -e "  • Open: ${GREEN}http://localhost:9090${NC}"
echo -e "  • Query: ${YELLOW}github_actions_workflow_status${NC}"
echo -e "  • You should see metrics with your test data"
echo ""
echo -e "${BLUE}💡 Tip:${NC} Adjust the time range in Grafana to 'Last 5 minutes'"
echo -e "     to see your test metrics clearly."
echo ""
