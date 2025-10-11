# 🚀 Quick Start Guide

Get your Save-n-Bite CI/CD monitoring up and running in 5 minutes!

## Step 1: Start Monitoring Stack (2 minutes)

```bash
cd monitoring
./scripts/setup.sh
```

This will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Generate Grafana dashboard
- ✅ Start all monitoring services
- ✅ Verify everything is running

## Step 2: Access Grafana (1 minute)

1. Open your browser to **http://localhost:3000**
2. Login:
   - **Username**: `admin`
   - **Password**: `savenbite_admin`
3. Navigate to **Dashboards** → **CI/CD** folder
4. Open **Save-n-Bite CI/CD Pipeline Dashboard**

## Step 3: Test with Sample Data (1 minute)

```bash
cd monitoring/scripts

# Generate some test metrics
python3 export_metrics.py workflow success 120
python3 export_metrics.py test 156 156 0 0 45 --app authentication
python3 export_metrics.py coverage 73 --app backend
python3 export_metrics.py build backend success 180
python3 export_metrics.py deployment production success 300
```

Refresh your Grafana dashboard - you should see the metrics!

## Step 4: Configure GitHub Actions (1 minute)

### For Public Server (Recommended)

1. **Expose Pushgateway** (if not already public):
   ```bash
   # Option A: Use ngrok (for testing)
   ngrok http 9091
   
   # Option B: Configure your firewall/router to expose port 9091
   ```

2. **Add GitHub Variable**:
   - Go to: Your Repository → Settings → Secrets and variables → Actions → **Variables**
   - Click **New repository variable**
   - Name: `PUSHGATEWAY_URL`
   - Value: `http://your-public-ip:9091` or ngrok URL

3. **Update Workflows**:
   ```bash
   # Copy example workflows
   cp monitoring/examples/backend_tests_with_metrics.yml .github/workflows/backend_tests.yml
   cp monitoring/examples/frontend_ci_with_metrics.yml .github/workflows/frontend-ci.yml
   cp monitoring/examples/deployment_with_metrics.yml .github/workflows/deployment.yml
   
   # Commit and push
   git add .github/workflows/
   git commit -m "Add Grafana metrics export to CI/CD"
   git push
   ```

### For Testing Locally

If you just want to test locally without exposing ports:

```bash
# In your workflow, set PUSHGATEWAY_URL to localhost
# This won't work in GitHub Actions but is useful for local testing
export PUSHGATEWAY_URL=http://localhost:9091
```

## Step 5: Run a Workflow

Trigger any GitHub Actions workflow and watch the metrics appear in Grafana!

## 🎯 What You Should See

After running workflows, your dashboard will show:

- ✅ **Workflow Status**: Success/failure counts
- ✅ **Test Results**: Pass/fail/skip distribution
- ✅ **Coverage**: Test coverage percentages
- ✅ **Build Times**: Duration trends
- ✅ **Deployment Status**: Production deployment tracking

## 🛠️ Troubleshooting

### Metrics not appearing?

1. **Check Pushgateway**:
   ```bash
   curl http://localhost:9091/metrics
   ```
   Should show metrics data.

2. **Check Prometheus is scraping**:
   - Open http://localhost:9090/targets
   - Pushgateway should be "UP"

3. **Check GitHub Actions logs** for metric export errors

4. **Verify time range** in Grafana matches your workflow run time

### Services not starting?

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart everything
docker-compose down
docker-compose up -d
```

### Dashboard is empty?

1. Make sure you've run at least one workflow OR generated test data
2. Check the time range in Grafana (top right)
3. Verify Prometheus data source is connected (Configuration → Data Sources)

## 📚 Next Steps

- ✅ Read the full [README.md](README.md) for advanced configuration
- ✅ Customize alert rules in `prometheus/rules/cicd_alerts.yml`
- ✅ Create additional dashboards for specific needs
- ✅ Set up alert notifications (Slack, email, etc.)

## 🔐 Security Notes

For production:
1. Change the default Grafana password
2. Add authentication to Pushgateway
3. Use HTTPS with reverse proxy
4. Restrict network access to monitoring services

## 📞 Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review [examples/](examples/) for workflow templates
- Check Docker logs: `docker-compose logs -f <service>`

---

**Ready to monitor?** Start with Step 1! 🚀
