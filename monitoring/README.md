# Save-n-Bite CI/CD Monitoring with Grafana

Complete monitoring solution for Save-n-Bite GitHub Actions CI/CD pipelines using Grafana, Prometheus, and Loki.

## 📊 Overview

This monitoring stack provides real-time visibility into your CI/CD pipelines with:

- **Workflow Metrics**: Track success rates, durations, and failure patterns
- **Test Results**: Monitor test counts, pass/fail rates, and coverage trends
- **Build Metrics**: Docker image sizes, build times, and deployment status
- **Log Aggregation**: Centralized logging with Loki for troubleshooting
- **Alerting**: Prometheus alerts for critical CI/CD failures

## 🏗️ Architecture

```
GitHub Actions Workflows
          ↓
    (Export Metrics)
          ↓
   Prometheus Pushgateway ← Prometheus (scrapes metrics)
          ↓                         ↓
      Grafana ← Loki (logs)    Grafana (visualizations)
```

## 📦 Components

### Monitoring Stack

| Component | Purpose | Port |
|-----------|---------|------|
| **Grafana** | Visualization and dashboards | 3000 |
| **Prometheus** | Metrics storage and querying | 9090 |
| **Pushgateway** | Receives metrics from CI/CD | 9091 |
| **Loki** | Log aggregation and querying | 3100 |
| **Promtail** | Log collection agent | 9080 |
| **Node Exporter** | System metrics | 9100 |

## 🚀 Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- GitHub repository with Actions enabled
- Network access to run monitoring stack

### 2. Start the Monitoring Stack

```bash
cd monitoring
docker-compose up -d
```

Verify all services are running:
```bash
docker-compose ps
```

### 3. Access Grafana

1. Open browser to `http://localhost:3000`
2. Login credentials:
   - **Username**: `admin`
   - **Password**: `savenbite_admin`
3. Navigate to Dashboards → CI/CD folder

### 4. Generate and Import Dashboard

```bash
cd monitoring/scripts
python3 generate_dashboard.py
```

The dashboard JSON will be created in `monitoring/grafana/dashboards/`.

### 5. Configure GitHub Actions

#### Option A: Public Pushgateway (Recommended for Cloud)

If your Pushgateway is publicly accessible:

1. Add repository variable in GitHub:
   - Go to: Repository → Settings → Secrets and variables → Actions → Variables
   - Add variable: `PUSHGATEWAY_URL` = `http://your-public-ip:9091`

2. Copy example workflows:
```bash
cp monitoring/examples/backend_tests_with_metrics.yml .github/workflows/backend_tests.yml
cp monitoring/examples/frontend_ci_with_metrics.yml .github/workflows/frontend-ci.yml
cp monitoring/examples/deployment_with_metrics.yml .github/workflows/deployment.yml
```

#### Option B: Tunneling for Local Development

For local testing, use ngrok or similar:

```bash
# Terminal 1: Start monitoring stack
cd monitoring
docker-compose up

# Terminal 2: Expose Pushgateway
ngrok http 9091

# Use the ngrok URL as PUSHGATEWAY_URL
```

## 📊 Dashboard Features

### Main Panels

1. **Workflow Overview**
   - Total successful workflows (24h)
   - Failed workflows count
   - Average workflow duration by type

2. **Test Coverage Gauges**
   - Backend test coverage %
   - Frontend test coverage %
   - Per-component coverage visualization

3. **Test Results Distribution**
   - Pie chart: Passed vs Failed vs Skipped
   - Historical trends

4. **Build Status**
   - Backend build status
   - Frontend build status
   - Docker image sizes

5. **Deployment Status**
   - Production deployment success/failure
   - Deployment duration trends

6. **CI/CD Logs**
   - Real-time log streaming from workflows
   - Filterable by job, workflow, branch

### Variables

- **Workflow**: Filter by specific workflow name
- **Branch**: Filter by branch (main, develop, etc.)
- **Time Range**: Adjustable from toolbar

## 📈 Metrics Exported

### Workflow Metrics

```
github_actions_workflow_status{status="success|failure|cancelled"}
github_actions_workflow_duration_seconds
github_actions_workflow_runs_total
```

### Build Metrics

```
github_actions_build_status{component="backend|frontend"}
github_actions_build_duration_seconds
```

### Test Metrics

```
github_actions_tests_total{app="analytics|authentication|frontend"}
github_actions_tests_passed
github_actions_tests_failed
github_actions_tests_skipped
github_actions_test_duration_seconds
```

### Coverage Metrics

```
github_actions_test_coverage_percent{app="backend|frontend"}
github_actions_test_coverage_lines_covered
github_actions_test_coverage_lines_total
```

### Docker Metrics

```
github_actions_docker_image_size_mb{component="backend|frontend"}
github_actions_docker_build_time_seconds
```

### Deployment Metrics

```
github_actions_deployment_status{environment="production|staging"}
github_actions_deployment_duration_seconds
```

## 🔧 Configuration

### Prometheus Retention

Default: 30 days. To change:

Edit `monitoring/prometheus/prometheus.yml`:
```yaml
command:
  - '--storage.tsdb.retention.time=60d'  # Change to 60 days
```

### Grafana Admin Password

Edit `monitoring/docker-compose.yml`:
```yaml
environment:
  - GF_SECURITY_ADMIN_PASSWORD=your_secure_password
```

### Alert Rules

Edit `monitoring/prometheus/rules/cicd_alerts.yml` to customize:

- Failure thresholds
- Coverage minimums
- Duration limits
- Notification channels

## 🔍 Troubleshooting

### Metrics Not Appearing

1. **Check Pushgateway is reachable:**
```bash
curl http://localhost:9091/metrics
```

2. **Verify Prometheus is scraping:**
```bash
# Open Prometheus UI
open http://localhost:9090/targets
```

3. **Check GitHub Actions logs** for export errors

4. **Verify PUSHGATEWAY_URL** variable is set in GitHub

### Grafana Dashboard Empty

1. **Check data source connection:**
   - Grafana → Configuration → Data Sources
   - Test connection to Prometheus

2. **Verify metrics exist in Prometheus:**
   - Open Prometheus UI: `http://localhost:9090`
   - Query: `github_actions_workflow_status`

3. **Check time range** in Grafana (must include workflow runs)

### Pushgateway Connection Refused

```bash
# Check if container is running
docker ps | grep pushgateway

# Check logs
docker logs savenbite-pushgateway

# Restart if needed
docker-compose restart pushgateway
```

### High Memory Usage

Reduce retention periods:

**Prometheus:**
```yaml
# In docker-compose.yml
command:
  - '--storage.tsdb.retention.time=7d'  # Reduce to 7 days
```

**Loki:**
```yaml
# In loki/loki-config.yml
limits_config:
  retention_period: 168h  # 7 days
```

## 📝 Manual Metric Export

For testing or manual runs:

```bash
cd monitoring/scripts

# Export workflow status
python3 export_metrics.py workflow success 120

# Export test results
python3 export_metrics.py test 156 156 0 0 45.2 --app authentication

# Export coverage
python3 export_metrics.py coverage 73 --app backend

# Export build status
python3 export_metrics.py build backend success 180

# Export deployment
python3 export_metrics.py deployment production success 300
```

## 🔐 Security Considerations

### Production Deployment

1. **Change default passwords:**
   - Grafana admin password
   - Add authentication to Pushgateway

2. **Use HTTPS:**
   - Configure reverse proxy (nginx/traefik)
   - Add SSL certificates

3. **Network isolation:**
   - Use Docker networks
   - Firewall rules for Pushgateway

4. **GitHub Secrets:**
   - Use secrets, not variables, for sensitive URLs
   - Rotate credentials regularly

### Pushgateway Authentication

Add basic auth to `docker-compose.yml`:

```yaml
pushgateway:
  image: prom/pushgateway:latest
  command:
    - '--web.enable-admin-api'
  # Add nginx proxy with basic auth
```

## 📚 Advanced Usage

### Custom Dashboards

Create additional dashboards:

```bash
cd monitoring/scripts
python3 generate_dashboard.py

# Edit the generated JSON
# Import via Grafana UI: + → Import
```

### Alert Notifications

Configure Alertmanager (optional):

```yaml
# Add to docker-compose.yml
alertmanager:
  image: prom/alertmanager:latest
  ports:
    - "9093:9093"
  volumes:
    - ./alertmanager:/etc/alertmanager
```

### Multiple Environments

Separate stacks for staging/production:

```bash
# Production
COMPOSE_PROJECT_NAME=savenbite-prod docker-compose up -d

# Staging
COMPOSE_PROJECT_NAME=savenbite-staging docker-compose up -d
```

## 🧪 Testing

### Verify Metrics Export

```bash
# Run a workflow manually in GitHub Actions
# Then query Prometheus:

curl 'http://localhost:9090/api/v1/query?query=github_actions_workflow_status'
```

### Load Test Data

```bash
cd monitoring/scripts

# Generate sample metrics
for i in {1..10}; do
  python3 export_metrics.py workflow success $((RANDOM % 300 + 60))
  sleep 2
done
```

## 📊 Example Queries

### PromQL Queries

```promql
# Success rate over 24h
sum(rate(github_actions_workflow_runs_total{status="success"}[24h])) 
/ 
sum(rate(github_actions_workflow_runs_total[24h]))

# Average test duration by app
avg(github_actions_test_duration_seconds) by (app)

# Failed workflows in last hour
sum(github_actions_workflow_status{status="failure"} offset 1h)

# Coverage trend
github_actions_test_coverage_percent{app="backend"}
```

## 🤝 Contributing

To add new metrics:

1. Update `export_metrics.py` with new metric function
2. Add to GitHub Actions workflow
3. Update dashboard JSON
4. Document in this README

## 📞 Support

- **Issues**: Check GitHub Issues
- **Documentation**: See `documentation/` folder
- **Logs**: `docker-compose logs -f <service>`

## 📄 License

Part of the Save-n-Bite project.

## 🎉 Next Steps

1. ✅ Start monitoring stack
2. ✅ Configure GitHub Actions
3. ✅ Import dashboards
4. ✅ Set up alerts
5. 📈 Monitor your pipelines!

---

**Last Updated**: 2025-10-11  
**Version**: 1.0.0  
**Maintained by**: Save-n-Bite Team
