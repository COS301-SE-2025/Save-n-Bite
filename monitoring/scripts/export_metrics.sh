#!/bin/bash
# Export CI/CD Metrics to Prometheus Pushgateway
# This script should be called from GitHub Actions workflows

set -e

# Configuration
PUSHGATEWAY_URL="${PUSHGATEWAY_URL:-http://localhost:9091}"
JOB_NAME="${GITHUB_WORKFLOW:-cicd_workflow}"
INSTANCE="${GITHUB_RUN_ID:-unknown}"
REPOSITORY="${GITHUB_REPOSITORY:-unknown}"
BRANCH="${GITHUB_REF_NAME:-unknown}"
WORKFLOW_NAME="${GITHUB_WORKFLOW:-unknown}"
RUN_NUMBER="${GITHUB_RUN_NUMBER:-0}"
ACTOR="${GITHUB_ACTOR:-unknown}"

# Function to push a metric to Pushgateway
push_metric() {
    local metric_name=$1
    local metric_value=$2
    local metric_type=${3:-gauge}
    local help_text=${4:-"CI/CD metric"}
    local additional_labels=${5:-""}
    
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/${JOB_NAME}/instance/${INSTANCE}"
# HELP ${metric_name} ${help_text}
# TYPE ${metric_name} ${metric_type}
${metric_name}{repository="${REPOSITORY}",branch="${BRANCH}",workflow="${WORKFLOW_NAME}",run_number="${RUN_NUMBER}",actor="${ACTOR}"${additional_labels}} ${metric_value}
EOF
}

# Function to push workflow status
push_workflow_status() {
    local status=$1  # success, failure, cancelled
    local duration=$2
    
    # Status metric (0 = success, 1 = failure, 2 = cancelled)
    local status_value=0
    case "$status" in
        success) status_value=0 ;;
        failure) status_value=1 ;;
        cancelled) status_value=2 ;;
    esac
    
    push_metric "github_actions_workflow_status" "$status_value" "gauge" "Workflow status (0=success, 1=failure, 2=cancelled)" ",status=\"${status}\""
    push_metric "github_actions_workflow_duration_seconds" "$duration" "gauge" "Workflow duration in seconds"
    push_metric "github_actions_workflow_runs_total" "1" "counter" "Total workflow runs" ",status=\"${status}\""
    
    echo "✅ Pushed workflow status: ${status} (duration: ${duration}s)"
}

# Function to push build status
push_build_status() {
    local component=$1  # backend, frontend
    local status=$2     # success, failure
    local duration=$3
    
    local status_value=0
    [ "$status" == "failure" ] && status_value=1
    
    push_metric "github_actions_build_status" "$status_value" "gauge" "Build status (0=success, 1=failure)" ",component=\"${component}\",status=\"${status}\""
    push_metric "github_actions_build_duration_seconds" "$duration" "gauge" "Build duration in seconds" ",component=\"${component}\""
    
    echo "✅ Pushed build status for ${component}: ${status}"
}

# Function to push test results
push_test_results() {
    local total=$1
    local passed=$2
    local failed=$3
    local skipped=$4
    local duration=$5
    local app=${6:-"unknown"}
    
    push_metric "github_actions_tests_total" "$total" "gauge" "Total number of tests" ",app=\"${app}\""
    push_metric "github_actions_tests_passed" "$passed" "gauge" "Number of passed tests" ",app=\"${app}\""
    push_metric "github_actions_tests_failed" "$failed" "gauge" "Number of failed tests" ",app=\"${app}\""
    push_metric "github_actions_tests_skipped" "$skipped" "gauge" "Number of skipped tests" ",app=\"${app}\""
    push_metric "github_actions_test_duration_seconds" "$duration" "gauge" "Test duration in seconds" ",app=\"${app}\""
    
    echo "✅ Pushed test results for ${app}: ${passed}/${total} passed"
}

# Function to push test coverage
push_test_coverage() {
    local coverage_percent=$1
    local app=${2:-"unknown"}
    local lines_covered=$3
    local lines_total=$4
    
    push_metric "github_actions_test_coverage_percent" "$coverage_percent" "gauge" "Test coverage percentage" ",app=\"${app}\""
    
    if [ -n "$lines_covered" ] && [ -n "$lines_total" ]; then
        push_metric "github_actions_test_coverage_lines_covered" "$lines_covered" "gauge" "Lines of code covered by tests" ",app=\"${app}\""
        push_metric "github_actions_test_coverage_lines_total" "$lines_total" "gauge" "Total lines of code" ",app=\"${app}\""
    fi
    
    echo "✅ Pushed test coverage for ${app}: ${coverage_percent}%"
}

# Function to push deployment status
push_deployment_status() {
    local environment=$1  # production, staging, etc.
    local status=$2       # success, failure
    local duration=$3
    
    local status_value=0
    [ "$status" == "failure" ] && status_value=1
    
    push_metric "github_actions_deployment_status" "$status_value" "gauge" "Deployment status (0=success, 1=failure)" ",environment=\"${environment}\",status=\"${status}\""
    push_metric "github_actions_deployment_duration_seconds" "$duration" "gauge" "Deployment duration in seconds" ",environment=\"${environment}\""
    
    echo "✅ Pushed deployment status for ${environment}: ${status}"
}

# Function to push Docker image build metrics
push_docker_metrics() {
    local component=$1   # backend, frontend
    local image_size=$2  # in MB
    local build_time=$3  # in seconds
    local tag=$4
    
    push_metric "github_actions_docker_image_size_mb" "$image_size" "gauge" "Docker image size in MB" ",component=\"${component}\",tag=\"${tag}\""
    push_metric "github_actions_docker_build_time_seconds" "$build_time" "gauge" "Docker build time in seconds" ",component=\"${component}\""
    
    echo "✅ Pushed Docker metrics for ${component}: ${image_size}MB (${build_time}s)"
}

# Main execution based on command arguments
case "${1:-}" in
    workflow)
        push_workflow_status "$2" "$3"
        ;;
    build)
        push_build_status "$2" "$3" "$4"
        ;;
    test)
        push_test_results "$2" "$3" "$4" "$5" "$6" "$7"
        ;;
    coverage)
        push_test_coverage "$2" "$3" "$4" "$5"
        ;;
    deployment)
        push_deployment_status "$2" "$3" "$4"
        ;;
    docker)
        push_docker_metrics "$2" "$3" "$4" "$5"
        ;;
    *)
        echo "Usage: $0 {workflow|build|test|coverage|deployment|docker} [args...]"
        echo ""
        echo "Commands:"
        echo "  workflow <status> <duration>                                  - Push workflow status"
        echo "  build <component> <status> <duration>                        - Push build status"
        echo "  test <total> <passed> <failed> <skipped> <duration> <app>   - Push test results"
        echo "  coverage <percent> <app> [lines_covered] [lines_total]      - Push test coverage"
        echo "  deployment <environment> <status> <duration>                 - Push deployment status"
        echo "  docker <component> <size_mb> <build_time> <tag>             - Push Docker metrics"
        echo ""
        echo "Environment variables:"
        echo "  PUSHGATEWAY_URL   - Pushgateway URL (default: http://localhost:9091)"
        echo "  GITHUB_*          - GitHub Actions environment variables (auto-set)"
        exit 1
        ;;
esac
