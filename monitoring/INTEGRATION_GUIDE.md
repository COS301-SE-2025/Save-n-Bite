# 🔗 CI/CD Metrics Integration Guide

Step-by-step guide to add Grafana metrics to your existing GitHub Actions workflows.

## 📋 Prerequisites

- ✅ Monitoring stack running (completed)
- ✅ Test metrics working (completed)
- ⏳ Pushgateway exposed publicly (next step)
- ⏳ GitHub variable configured (next step)

## 🚀 Quick Integration (3 Steps)

### **Step 1: Configure GitHub Variable**

1. **Expose Pushgateway** (choose one):

   **Option A: For Production (Permanent)**
   ```bash
   # Configure your firewall/cloud provider to expose port 9091
   # Use your server's public IP
   ```

   **Option B: For Testing (Temporary - Recommended First)**
   ```bash
   # Install ngrok if not already installed
   # Download from: https://ngrok.com/download
   
   # Expose pushgateway
   ngrok http 9091
   
   # Copy the forwarding URL (e.g., https://xxxx-xx-xx-xx.ngrok-free.app)
   ```

2. **Set GitHub Repository Variable**:
   - Go to: https://github.com/COS301-SE-2025/Save-n-Bite/settings/variables/actions
   - Click **"New repository variable"**
   - **Name**: `PUSHGATEWAY_URL`
   - **Value**: `http://your-public-ip:9091` or your ngrok URL
   - Click **"Add variable"**

### **Step 2: Update Your Workflows**

You have **two options**:

#### **Option A: Full Integration (Recommended)**

Copy the example workflows which have complete metrics integration:

```bash
cd ~/COS301/Capstone/Save-n-Bite

# Backup your current workflows
cp .github/workflows/backend_tests.yml .github/workflows/backend_tests.yml.backup
cp .github/workflows/frontend-ci.yml .github/workflows/frontend-ci.yml.backup
cp .github/workflows/deployment.yml .github/workflows/deployment.yml.backup

# Copy enhanced versions
cp monitoring/examples/backend_tests_with_metrics.yml .github/workflows/backend_tests.yml
cp monitoring/examples/frontend_ci_with_metrics.yml .github/workflows/frontend-ci.yml
cp monitoring/examples/deployment_with_metrics.yml .github/workflows/deployment.yml
```

#### **Option B: Manual Integration (Custom)**

Add metrics export to your existing workflows manually. See detailed instructions below.

### **Step 3: Commit and Test**

```bash
git add .github/workflows/
git commit -m "Add Grafana metrics export to CI/CD pipelines"
git push
```

Trigger a workflow and watch metrics appear in Grafana!

---

## 📝 Manual Integration Instructions

If you prefer to manually add metrics to your workflows, follow these patterns:

### **Pattern 1: Backend Tests Workflow**

Add these steps to `.github/workflows/backend_tests.yml`:

```yaml
# At the beginning of the job (after checkout)
- name: Record workflow start time
  id: workflow_start
  run: echo "start_time=$(date +%s)" >> $GITHUB_OUTPUT

# After your test steps
- name: Calculate workflow metrics
  if: always()
  id: workflow_metrics
  run: |
    end_time=$(date +%s)
    start_time=${{ steps.workflow_start.outputs.start_time }}
    duration=$((end_time - start_time))
    echo "duration=$duration" >> $GITHUB_OUTPUT
    
    # Determine status based on test results
    if [ "${{ steps.run_tests.outcome }}" == "success" ]; then
      echo "status=success" >> $GITHUB_OUTPUT
    else
      echo "status=failure" >> $GITHUB_OUTPUT
    fi

# Export metrics (only if PUSHGATEWAY_URL is configured)
- name: Export workflow metrics
  if: always() && vars.PUSHGATEWAY_URL != ''
  continue-on-error: true
  env:
    PUSHGATEWAY_URL: ${{ vars.PUSHGATEWAY_URL }}
  run: |
    pip3 install requests > /dev/null 2>&1 || true
    cd $GITHUB_WORKSPACE/monitoring/scripts
    
    python3 export_metrics.py workflow \
      "${{ steps.workflow_metrics.outputs.status }}" \
      "${{ steps.workflow_metrics.outputs.duration }}" || true
```

### **Pattern 2: Frontend CI Workflow**

Similar to backend, add to `.github/workflows/frontend-ci.yml`:

```yaml
# Record start time
- name: Record workflow start time
  id: workflow_start
  run: echo "start_time=$(date +%s)" >> $GITHUB_OUTPUT

# After Jest tests, capture results
- name: Run Jest with coverage
  id: jest_tests
  continue-on-error: true
  run: |
    start=$(date +%s)
    npx jest --coverage --json --outputFile=test-results.json > test_output.txt 2>&1
    exit_code=$?
    end=$(date +%s)
    duration=$((end - start))
    
    # Parse test results
    if [ -f test-results.json ]; then
      total=$(jq -r '.numTotalTests' test-results.json)
      passed=$(jq -r '.numPassedTests' test-results.json)
      failed=$(jq -r '.numFailedTests' test-results.json)
      
      echo "total=$total" >> $GITHUB_OUTPUT
      echo "passed=$passed" >> $GITHUB_OUTPUT
      echo "failed=$failed" >> $GITHUB_OUTPUT
    fi
    
    echo "duration=$duration" >> $GITHUB_OUTPUT
    exit $exit_code

# Export metrics
- name: Export metrics
  if: always() && vars.PUSHGATEWAY_URL != ''
  continue-on-error: true
  env:
    PUSHGATEWAY_URL: ${{ vars.PUSHGATEWAY_URL }}
  run: |
    pip3 install requests > /dev/null 2>&1 || true
    cd $GITHUB_WORKSPACE/monitoring/scripts
    
    python3 export_metrics.py test \
      "${{ steps.jest_tests.outputs.total }}" \
      "${{ steps.jest_tests.outputs.passed }}" \
      "${{ steps.jest_tests.outputs.failed }}" \
      "0" \
      "${{ steps.jest_tests.outputs.duration }}" \
      --app "frontend" || true
```

### **Pattern 3: Deployment Workflow**

Add to `.github/workflows/deployment.yml`:

```yaml
# Record start
- name: Record workflow start time
  id: workflow_start
  run: echo "start_time=$(date +%s)" >> $GITHUB_OUTPUT

# After Docker build, capture metrics
- name: Build and push backend image
  id: backend_build
  run: |
    start=$(date +%s)
    docker build -t ${{ env.REGISTRY }}/backend:latest ./backend
    docker push ${{ env.REGISTRY }}/backend:latest
    exit_code=$?
    end=$(date +%s)
    duration=$((end - start))
    
    # Get image size
    size_mb=$(docker image inspect ${{ env.REGISTRY }}/backend:latest --format='{{.Size}}' | awk '{print $1/1024/1024}')
    
    echo "duration=$duration" >> $GITHUB_OUTPUT
    echo "size_mb=$size_mb" >> $GITHUB_OUTPUT
    
    if [ $exit_code -eq 0 ]; then
      echo "status=success" >> $GITHUB_OUTPUT
    else
      echo "status=failure" >> $GITHUB_OUTPUT
    fi
    
    exit $exit_code

# Export build and deployment metrics
- name: Export deployment metrics
  if: always() && vars.PUSHGATEWAY_URL != ''
  continue-on-error: true
  env:
    PUSHGATEWAY_URL: ${{ vars.PUSHGATEWAY_URL }}
  run: |
    pip3 install requests > /dev/null 2>&1 || true
    cd $GITHUB_WORKSPACE/monitoring/scripts
    
    # Build metrics
    python3 export_metrics.py build \
      "backend" \
      "${{ steps.backend_build.outputs.status }}" \
      "${{ steps.backend_build.outputs.duration }}" || true
    
    # Docker metrics
    python3 export_metrics.py docker \
      "backend" \
      "${{ steps.backend_build.outputs.size_mb }}" \
      "${{ steps.backend_build.outputs.duration }}" \
      --tag "latest" || true
    
    # Deployment status
    python3 export_metrics.py deployment \
      "production" \
      "${{ steps.backend_build.outputs.status }}" \
      "${{ steps.backend_build.outputs.duration }}" || true
```

---

## 🎯 Key Points

### **1. Always use `continue-on-error: true`**
- Metrics export should never fail your build
- If Pushgateway is unavailable, workflow continues

### **2. Check for PUSHGATEWAY_URL**
- Use: `if: always() && vars.PUSHGATEWAY_URL != ''`
- Metrics only export if variable is set
- Works seamlessly in environments without monitoring

### **3. Use `|| true` for safety**
- Python commands end with `|| true`
- Prevents failures from stopping the workflow

### **4. Capture timing correctly**
```yaml
start=$(date +%s)
# ... your commands ...
end=$(date +%s)
duration=$((end - start))
```

### **5. Parse test results**
- Use `jq` for JSON parsing (available in GitHub runners)
- Extract counts: total, passed, failed, skipped
- Calculate coverage percentage from coverage reports

---

## 🧪 Testing Your Integration

### **Local Testing**

Test the metrics export script locally:

```bash
cd ~/COS301/Capstone/Save-n-Bite/monitoring/scripts

# Set environment variables
export PUSHGATEWAY_URL=http://localhost:9091
export GITHUB_WORKFLOW="Test Workflow"
export GITHUB_REPOSITORY="COS301-SE-2025/Save-n-Bite"
export GITHUB_REF_NAME="main"

# Test workflow metrics
python3 export_metrics.py workflow success 120

# Test test metrics
python3 export_metrics.py test 156 156 0 0 45.2 --app authentication

# Verify in Pushgateway
curl http://localhost:9091/metrics | grep github_actions
```

### **GitHub Actions Testing**

1. **Push your changes**
2. **Trigger a workflow** (push to main or open PR)
3. **Check workflow logs** for metric export
4. **View Grafana dashboard** - metrics should appear within 15 seconds

### **Troubleshooting**

**Issue: Metrics not appearing**

1. Check GitHub Actions logs for export step
2. Verify PUSHGATEWAY_URL is set correctly
3. Test Pushgateway is accessible:
   ```bash
   curl -X POST http://your-pushgateway-url:9091/metrics
   ```
4. Check Prometheus targets: http://localhost:9090/targets

**Issue: Export step failing**

1. Check Python/pip installation in workflow
2. Verify `monitoring/scripts/export_metrics.py` exists
3. Check for network restrictions in GitHub Actions

**Issue: Wrong metrics values**

1. Verify test result parsing with `jq`
2. Check step outputs: `echo "${{ steps.your_step.outputs }}"`
3. Add debug logging to export commands

---

## 📊 Expected Dashboard Behavior

After integration, you should see in Grafana:

- **Workflow Status**: Real-time success/failure indicators
- **Test Results**: Live test counts and pass rates
- **Coverage Trends**: Coverage percentage over time
- **Build Duration**: Build time trends
- **Deployment Status**: Production deployment tracking
- **Historical Data**: All metrics retained per Prometheus retention (30 days default)

---

## 🎨 Customization Options

### **Add Custom Metrics**

Edit `monitoring/scripts/export_metrics.py` to add custom metric types:

```python
def export_custom_metric(value: float, label: str):
    """Export custom application metric"""
    metrics = [
        Metric('custom_metric_name', 'gauge', value, {
            'label': label,
            'app': 'your_app'
        })
    ]
    push_metrics(metrics, 'custom_metrics')
```

### **Adjust Dashboard**

Edit `monitoring/scripts/generate_dashboard.py` to customize:
- Panel layouts
- Time ranges
- Thresholds
- Alert conditions
- Visual styles

Then regenerate:
```bash
cd monitoring/scripts
python3 generate_dashboard.py
docker-compose restart grafana
```

---

## 📚 Additional Resources

- **Full Examples**: See `monitoring/examples/` for complete workflow files
- **Script Documentation**: `monitoring/scripts/export_metrics.py --help`
- **Dashboard Customization**: `monitoring/scripts/generate_dashboard.py`
- **Prometheus Queries**: http://localhost:9090/graph

---

## ✅ Integration Checklist

- [ ] Monitoring stack running locally
- [ ] Test metrics generated successfully
- [ ] Pushgateway exposed publicly (ngrok or public IP)
- [ ] GitHub variable `PUSHGATEWAY_URL` set
- [ ] Workflows updated with metrics export
- [ ] Changes committed and pushed
- [ ] First workflow run successful
- [ ] Metrics visible in Grafana dashboard
- [ ] Dashboard time range adjusted to see data

---

**🎊 Ready to integrate?** Choose Option A (full integration) or Option B (manual integration) from Step 2 above!
