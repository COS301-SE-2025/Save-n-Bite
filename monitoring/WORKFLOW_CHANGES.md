# 📝 Workflow Changes Summary

Quick reference showing exactly what to add to your existing workflows.

## 🎯 Quick Option: Use Enhanced Workflows

**Fastest way:** Copy the complete enhanced workflows:

```bash
cd ~/COS301/Capstone/Save-n-Bite

# Backup originals
cp .github/workflows/backend_tests.yml .github/workflows/backend_tests.yml.backup
cp .github/workflows/frontend-ci.yml .github/workflows/frontend-ci.yml.backup  
cp .github/workflows/deployment.yml .github/workflows/deployment.yml.backup

# Use enhanced versions
cp monitoring/examples/backend_tests_with_metrics.yml .github/workflows/backend_tests.yml
cp monitoring/examples/frontend_ci_with_metrics.yml .github/workflows/frontend-ci.yml
cp monitoring/examples/deployment_with_metrics.yml .github/workflows/deployment.yml
```

---

## 📋 Manual Changes (If You Prefer)

### **1. Backend Tests Workflow** (`backend_tests.yml`)

#### **Add at the beginning** (after checkout):

```yaml
- name: Record workflow start time
  id: workflow_start
  run: echo "start_time=$(date +%s)" >> $GITHUB_OUTPUT
```

#### **Modify your test step** to capture metrics:

```yaml
- name: Run tests
  id: run_tests
  continue-on-error: true  # Add this
  run: |
    start=$(date +%s)
    
    # Your existing test commands here
    poetry run python run_app_tests.py
    exit_code=$?
    
    end=$(date +%s)
    duration=$((end - start))
    echo "duration=$duration" >> $GITHUB_OUTPUT
    
    # Parse test results (example for pytest)
    if [ -f test_output.txt ]; then
      passed=$(grep -oP '\d+(?= passed)' test_output.txt || echo "0")
      failed=$(grep -oP '\d+(?= failed)' test_output.txt || echo "0")
      echo "passed=$passed" >> $GITHUB_OUTPUT
      echo "failed=$failed" >> $GITHUB_OUTPUT
    fi
    
    exit $exit_code
```

#### **Add at the end** (before final status check):

```yaml
- name: Calculate workflow metrics
  if: always()
  id: workflow_metrics
  run: |
    end_time=$(date +%s)
    start_time=${{ steps.workflow_start.outputs.start_time }}
    duration=$((end_time - start_time))
    echo "duration=$duration" >> $GITHUB_OUTPUT
    
    if [ "${{ steps.run_tests.outcome }}" == "success" ]; then
      echo "status=success" >> $GITHUB_OUTPUT
    else
      echo "status=failure" >> $GITHUB_OUTPUT
    fi

- name: Export workflow metrics
  if: always() && vars.PUSHGATEWAY_URL != ''
  continue-on-error: true
  env:
    PUSHGATEWAY_URL: ${{ vars.PUSHGATEWAY_URL }}
  run: |
    pip3 install requests > /dev/null 2>&1 || true
    cd $GITHUB_WORKSPACE/monitoring/scripts
    
    # Export workflow status
    python3 export_metrics.py workflow \
      "${{ steps.workflow_metrics.outputs.status }}" \
      "${{ steps.workflow_metrics.outputs.duration }}" || true
    
    # Export test results (if captured)
    if [ -n "${{ steps.run_tests.outputs.passed }}" ]; then
      total=$(($${{ steps.run_tests.outputs.passed }} + ${{ steps.run_tests.outputs.failed }}))
      python3 export_metrics.py test \
        "$total" \
        "${{ steps.run_tests.outputs.passed }}" \
        "${{ steps.run_tests.outputs.failed }}" \
        "0" \
        "${{ steps.run_tests.outputs.duration }}" \
        --app "backend" || true
    fi
```

---

### **2. Frontend CI Workflow** (`frontend-ci.yml`)

#### **Add at the beginning**:

```yaml
- name: Record workflow start time
  id: workflow_start
  run: echo "start_time=$(date +%s)" >> $GITHUB_OUTPUT
```

#### **Modify Jest step** to capture results:

```yaml
- name: Run Jest with coverage
  id: jest_tests
  continue-on-error: true
  working-directory: ./save-n-bite-frontend
  run: |
    start=$(date +%s)
    npx jest --coverage --json --outputFile=test-results.json > test_output.txt 2>&1
    exit_code=$?
    end=$(date +%s)
    duration=$((end - start))
    
    # Parse test results from JSON
    if [ -f test-results.json ]; then
      total=$(jq -r '.numTotalTests' test-results.json)
      passed=$(jq -r '.numPassedTests' test-results.json)
      failed=$(jq -r '.numFailedTests' test-results.json)
      skipped=$(jq -r '.numPendingTests' test-results.json)
      
      echo "total=$total" >> $GITHUB_OUTPUT
      echo "passed=$passed" >> $GITHUB_OUTPUT
      echo "failed=$failed" >> $GITHUB_OUTPUT
      echo "skipped=$skipped" >> $GITHUB_OUTPUT
    fi
    
    echo "duration=$duration" >> $GITHUB_OUTPUT
    
    if [ $exit_code -eq 0 ]; then
      echo "status=success" >> $GITHUB_OUTPUT
    else
      echo "status=failure" >> $GITHUB_OUTPUT
    fi
    
    cat test_output.txt
    exit $exit_code

- name: Extract coverage percentage
  id: coverage
  if: always()
  working-directory: ./save-n-bite-frontend
  run: |
    if [ -f coverage/coverage-summary.json ]; then
      coverage_percent=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
      echo "percent=$coverage_percent" >> $GITHUB_OUTPUT
    fi
```

#### **Add at the end**:

```yaml
- name: Calculate workflow metrics
  if: always()
  id: workflow_metrics
  run: |
    end_time=$(date +%s)
    start_time=${{ steps.workflow_start.outputs.start_time }}
    duration=$((end_time - start_time))
    echo "duration=$duration" >> $GITHUB_OUTPUT
    echo "status=${{ steps.jest_tests.outputs.status }}" >> $GITHUB_OUTPUT

- name: Export workflow metrics
  if: always() && vars.PUSHGATEWAY_URL != ''
  continue-on-error: true
  env:
    PUSHGATEWAY_URL: ${{ vars.PUSHGATEWAY_URL }}
  run: |
    pip3 install requests > /dev/null 2>&1 || true
    cd $GITHUB_WORKSPACE/monitoring/scripts
    
    # Export workflow metrics
    python3 export_metrics.py workflow \
      "${{ steps.workflow_metrics.outputs.status }}" \
      "${{ steps.workflow_metrics.outputs.duration }}" || true
    
    # Export test metrics
    python3 export_metrics.py test \
      "${{ steps.jest_tests.outputs.total }}" \
      "${{ steps.jest_tests.outputs.passed }}" \
      "${{ steps.jest_tests.outputs.failed }}" \
      "${{ steps.jest_tests.outputs.skipped }}" \
      "${{ steps.jest_tests.outputs.duration }}" \
      --app "frontend" || true
    
    # Export coverage metrics
    if [ -n "${{ steps.coverage.outputs.percent }}" ]; then
      python3 export_metrics.py coverage \
        "${{ steps.coverage.outputs.percent }}" \
        --app "frontend" || true
    fi

- name: Check test results
  if: steps.jest_tests.outputs.status == 'failure'
  run: exit 1
```

---

### **3. Deployment Workflow** (`deployment.yml`)

#### **Add at the beginning**:

```yaml
- name: Record workflow start time
  id: workflow_start
  run: echo "start_time=$(date +%s)" >> $GITHUB_OUTPUT
```

#### **Modify Docker build steps** to capture metrics:

```yaml
- name: Build and push backend image
  id: backend_build
  continue-on-error: true
  run: |
    start=$(date +%s)
    
    docker build \
      -t ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:${{ github.sha }} \
      -t ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:latest \
      -f ./save-n-bite-backend/Dockerfile.prod \
      ./save-n-bite-backend
    
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
      docker push ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:${{ github.sha }}
      docker push ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:latest
      push_exit=$?
      
      end=$(date +%s)
      duration=$((end - start))
      
      # Get image size
      size_bytes=$(docker image inspect ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:latest --format='{{.Size}}')
      size_mb=$(echo "scale=2; $size_bytes / 1024 / 1024" | bc)
      
      echo "status=success" >> $GITHUB_OUTPUT
      echo "duration=$duration" >> $GITHUB_OUTPUT
      echo "size_mb=$size_mb" >> $GITHUB_OUTPUT
      
      exit $push_exit
    else
      end=$(date +%s)
      duration=$((end - start))
      echo "status=failure" >> $GITHUB_OUTPUT
      echo "duration=$duration" >> $GITHUB_OUTPUT
      echo "size_mb=0" >> $GITHUB_OUTPUT
      exit $exit_code
    fi

# Repeat similar pattern for frontend build
```

#### **Add at the end**:

```yaml
- name: Calculate workflow metrics
  if: always()
  id: workflow_metrics
  run: |
    end_time=$(date +%s)
    start_time=${{ steps.workflow_start.outputs.start_time }}
    duration=$((end_time - start_time))
    echo "duration=$duration" >> $GITHUB_OUTPUT
    
    if [[ "${{ steps.backend_build.outputs.status }}" == "success" && \
          "${{ steps.frontend_build.outputs.status }}" == "success" ]]; then
      echo "status=success" >> $GITHUB_OUTPUT
    else
      echo "status=failure" >> $GITHUB_OUTPUT
    fi

- name: Export deployment metrics
  if: always() && vars.PUSHGATEWAY_URL != ''
  continue-on-error: true
  env:
    PUSHGATEWAY_URL: ${{ vars.PUSHGATEWAY_URL }}
  run: |
    pip3 install requests > /dev/null 2>&1 || true
    cd $GITHUB_WORKSPACE/monitoring/scripts
    
    # Export workflow metrics
    python3 export_metrics.py workflow \
      "${{ steps.workflow_metrics.outputs.status }}" \
      "${{ steps.workflow_metrics.outputs.duration }}" || true
    
    # Export backend build metrics
    python3 export_metrics.py build \
      "backend" \
      "${{ steps.backend_build.outputs.status }}" \
      "${{ steps.backend_build.outputs.duration }}" || true
    
    # Export frontend build metrics
    python3 export_metrics.py build \
      "frontend" \
      "${{ steps.frontend_build.outputs.status }}" \
      "${{ steps.frontend_build.outputs.duration }}" || true
    
    # Export Docker image metrics
    if [ -n "${{ steps.backend_build.outputs.size_mb }}" ]; then
      python3 export_metrics.py docker \
        "backend" \
        "${{ steps.backend_build.outputs.size_mb }}" \
        "${{ steps.backend_build.outputs.duration }}" \
        --tag "${{ github.sha }}" || true
    fi
    
    if [ -n "${{ steps.frontend_build.outputs.size_mb }}" ]; then
      python3 export_metrics.py docker \
        "frontend" \
        "${{ steps.frontend_build.outputs.size_mb }}" \
        "${{ steps.frontend_build.outputs.duration }}" \
        --tag "${{ github.sha }}" || true
    fi
    
    # Export deployment status
    python3 export_metrics.py deployment \
      "production" \
      "${{ steps.workflow_metrics.outputs.status }}" \
      "${{ steps.workflow_metrics.outputs.duration }}" || true

- name: Check build results
  if: steps.backend_build.outputs.status == 'failure' || steps.frontend_build.outputs.status == 'failure'
  run: exit 1
```

---

## 🔑 Key Changes Summary

### **Every Workflow Needs:**

1. **Start time tracking** (at beginning):
   ```yaml
   - name: Record workflow start time
     id: workflow_start
     run: echo "start_time=$(date +%s)" >> $GITHUB_OUTPUT
   ```

2. **Step outputs** (in your main steps):
   ```yaml
   echo "status=success" >> $GITHUB_OUTPUT
   echo "duration=123" >> $GITHUB_OUTPUT
   ```

3. **Metrics export** (at end):
   ```yaml
   - name: Export workflow metrics
     if: always() && vars.PUSHGATEWAY_URL != ''
     continue-on-error: true
     env:
       PUSHGATEWAY_URL: ${{ vars.PUSHGATEWAY_URL }}
     run: |
       pip3 install requests > /dev/null 2>&1 || true
       cd $GITHUB_WORKSPACE/monitoring/scripts
       python3 export_metrics.py workflow "$status" "$duration"
   ```

### **Important Notes:**

- ✅ Always use `continue-on-error: true` for metrics steps
- ✅ Always use `if: always()` for metrics export
- ✅ Always use `|| true` at end of python commands
- ✅ Check `vars.PUSHGATEWAY_URL != ''` before export
- ✅ Install requests: `pip3 install requests > /dev/null 2>&1 || true`

---

## 📊 What Gets Tracked

| Workflow | Metrics Exported |
|----------|------------------|
| **Backend Tests** | Workflow status, duration, test counts, coverage |
| **Frontend CI** | Workflow status, duration, test counts, coverage |
| **Deployment** | Workflow status, build times, image sizes, deployment status |
| **Integration Tests** | Test counts, duration, coverage (if added) |

---

## ✅ Verification

After making changes:

1. **Commit and push**
2. **Trigger a workflow**
3. **Check GitHub Actions logs** - look for "Export workflow metrics" step
4. **Open Grafana** - http://localhost:3000
5. **View dashboard** - Dashboards → CI/CD
6. **Adjust time range** - Set to "Last 5 minutes"
7. **See your metrics!** 📈

---

## 🚀 Recommended Approach

**For first-time setup:**

1. Use the **Quick Option** (copy enhanced workflows)
2. Test with one workflow first (e.g., frontend-ci)
3. Verify metrics appear in Grafana
4. Then update remaining workflows

**This ensures:**
- ✅ Faster setup
- ✅ Proven working examples
- ✅ Less chance of syntax errors
- ✅ Easy to revert if needed

---

**Ready to integrate?** Start with the Quick Option at the top! 🎯
