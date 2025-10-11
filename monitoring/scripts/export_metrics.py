#!/usr/bin/env python3
"""
Export CI/CD Metrics to Prometheus Pushgateway
This script pushes metrics from GitHub Actions to Prometheus
"""

import os
import sys
import argparse
import requests
from typing import Dict, Optional


class MetricsExporter:
    """Export CI/CD metrics to Prometheus Pushgateway"""
    
    def __init__(self, pushgateway_url: str = None):
        self.pushgateway_url = pushgateway_url or os.getenv('PUSHGATEWAY_URL', 'http://localhost:9091')
        self.job_name = os.getenv('GITHUB_WORKFLOW', 'cicd_workflow')
        self.instance = os.getenv('GITHUB_RUN_ID', 'unknown')
        self.repository = os.getenv('GITHUB_REPOSITORY', 'unknown')
        self.branch = os.getenv('GITHUB_REF_NAME', 'unknown')
        self.workflow_name = os.getenv('GITHUB_WORKFLOW', 'unknown')
        self.run_number = os.getenv('GITHUB_RUN_NUMBER', '0')
        self.actor = os.getenv('GITHUB_ACTOR', 'unknown')
    
    def _get_base_labels(self) -> Dict[str, str]:
        """Get base labels for all metrics"""
        return {
            'repository': self.repository,
            'branch': self.branch,
            'workflow': self.workflow_name,
            'run_number': self.run_number,
            'actor': self.actor
        }
    
    def _format_labels(self, additional_labels: Dict[str, str] = None) -> str:
        """Format labels for Prometheus metric"""
        labels = self._get_base_labels()
        if additional_labels:
            labels.update(additional_labels)
        
        label_str = ','.join([f'{k}="{v}"' for k, v in labels.items()])
        return label_str
    
    def _push_metric(self, metric_name: str, metric_value: float, 
                    metric_type: str = 'gauge', help_text: str = 'CI/CD metric',
                    additional_labels: Dict[str, str] = None):
        """Push a single metric to Pushgateway"""
        
        labels = self._format_labels(additional_labels)
        
        metric_data = f"""# HELP {metric_name} {help_text}
# TYPE {metric_name} {metric_type}
{metric_name}{{{labels}}} {metric_value}
"""
        
        url = f"{self.pushgateway_url}/metrics/job/{self.job_name}/instance/{self.instance}"
        
        try:
            response = requests.post(url, data=metric_data, headers={'Content-Type': 'text/plain'})
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f"❌ Error pushing metric {metric_name}: {e}", file=sys.stderr)
            return False
    
    def push_workflow_status(self, status: str, duration: float):
        """Push workflow status metrics"""
        # Status mapping: success=0, failure=1, cancelled=2
        status_map = {'success': 0, 'failure': 1, 'cancelled': 2}
        status_value = status_map.get(status, 1)
        
        self._push_metric(
            'github_actions_workflow_status',
            status_value,
            'gauge',
            'Workflow status (0=success, 1=failure, 2=cancelled)',
            {'status': status}
        )
        
        self._push_metric(
            'github_actions_workflow_duration_seconds',
            duration,
            'gauge',
            'Workflow duration in seconds'
        )
        
        self._push_metric(
            'github_actions_workflow_runs_total',
            1,
            'counter',
            'Total workflow runs',
            {'status': status}
        )
        
        print(f"✅ Pushed workflow status: {status} (duration: {duration}s)")
    
    def push_build_status(self, component: str, status: str, duration: float):
        """Push build status metrics"""
        status_value = 0 if status == 'success' else 1
        
        self._push_metric(
            'github_actions_build_status',
            status_value,
            'gauge',
            'Build status (0=success, 1=failure)',
            {'component': component, 'status': status}
        )
        
        self._push_metric(
            'github_actions_build_duration_seconds',
            duration,
            'gauge',
            'Build duration in seconds',
            {'component': component}
        )
        
        print(f"✅ Pushed build status for {component}: {status}")
    
    def push_test_results(self, total: int, passed: int, failed: int, 
                         skipped: int, duration: float, app: str = 'unknown'):
        """Push test results metrics"""
        
        metrics = [
            ('github_actions_tests_total', total, 'Total number of tests'),
            ('github_actions_tests_passed', passed, 'Number of passed tests'),
            ('github_actions_tests_failed', failed, 'Number of failed tests'),
            ('github_actions_tests_skipped', skipped, 'Number of skipped tests'),
            ('github_actions_test_duration_seconds', duration, 'Test duration in seconds')
        ]
        
        for metric_name, value, help_text in metrics:
            self._push_metric(metric_name, value, 'gauge', help_text, {'app': app})
        
        print(f"✅ Pushed test results for {app}: {passed}/{total} passed")
    
    def push_test_coverage(self, coverage_percent: float, app: str = 'unknown',
                          lines_covered: Optional[int] = None, 
                          lines_total: Optional[int] = None):
        """Push test coverage metrics"""
        
        self._push_metric(
            'github_actions_test_coverage_percent',
            coverage_percent,
            'gauge',
            'Test coverage percentage',
            {'app': app}
        )
        
        if lines_covered is not None and lines_total is not None:
            self._push_metric(
                'github_actions_test_coverage_lines_covered',
                lines_covered,
                'gauge',
                'Lines of code covered by tests',
                {'app': app}
            )
            
            self._push_metric(
                'github_actions_test_coverage_lines_total',
                lines_total,
                'gauge',
                'Total lines of code',
                {'app': app}
            )
        
        print(f"✅ Pushed test coverage for {app}: {coverage_percent}%")
    
    def push_deployment_status(self, environment: str, status: str, duration: float):
        """Push deployment status metrics"""
        status_value = 0 if status == 'success' else 1
        
        self._push_metric(
            'github_actions_deployment_status',
            status_value,
            'gauge',
            'Deployment status (0=success, 1=failure)',
            {'environment': environment, 'status': status}
        )
        
        self._push_metric(
            'github_actions_deployment_duration_seconds',
            duration,
            'gauge',
            'Deployment duration in seconds',
            {'environment': environment}
        )
        
        print(f"✅ Pushed deployment status for {environment}: {status}")
    
    def push_docker_metrics(self, component: str, image_size_mb: float, 
                           build_time: float, tag: str = 'latest'):
        """Push Docker image build metrics"""
        
        self._push_metric(
            'github_actions_docker_image_size_mb',
            image_size_mb,
            'gauge',
            'Docker image size in MB',
            {'component': component, 'tag': tag}
        )
        
        self._push_metric(
            'github_actions_docker_build_time_seconds',
            build_time,
            'gauge',
            'Docker build time in seconds',
            {'component': component}
        )
        
        print(f"✅ Pushed Docker metrics for {component}: {image_size_mb}MB ({build_time}s)")


def main():
    parser = argparse.ArgumentParser(description='Export CI/CD metrics to Prometheus Pushgateway')
    parser.add_argument('--pushgateway-url', help='Pushgateway URL', 
                       default=os.getenv('PUSHGATEWAY_URL', 'http://localhost:9091'))
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Workflow command
    workflow_parser = subparsers.add_parser('workflow', help='Push workflow status')
    workflow_parser.add_argument('status', choices=['success', 'failure', 'cancelled'])
    workflow_parser.add_argument('duration', type=float, help='Duration in seconds')
    
    # Build command
    build_parser = subparsers.add_parser('build', help='Push build status')
    build_parser.add_argument('component', help='Component name (backend, frontend)')
    build_parser.add_argument('status', choices=['success', 'failure'])
    build_parser.add_argument('duration', type=float, help='Duration in seconds')
    
    # Test command
    test_parser = subparsers.add_parser('test', help='Push test results')
    test_parser.add_argument('total', type=int, help='Total tests')
    test_parser.add_argument('passed', type=int, help='Passed tests')
    test_parser.add_argument('failed', type=int, help='Failed tests')
    test_parser.add_argument('skipped', type=int, help='Skipped tests')
    test_parser.add_argument('duration', type=float, help='Duration in seconds')
    test_parser.add_argument('--app', default='unknown', help='App name')
    
    # Coverage command
    coverage_parser = subparsers.add_parser('coverage', help='Push test coverage')
    coverage_parser.add_argument('percent', type=float, help='Coverage percentage')
    coverage_parser.add_argument('--app', default='unknown', help='App name')
    coverage_parser.add_argument('--lines-covered', type=int, help='Lines covered')
    coverage_parser.add_argument('--lines-total', type=int, help='Total lines')
    
    # Deployment command
    deploy_parser = subparsers.add_parser('deployment', help='Push deployment status')
    deploy_parser.add_argument('environment', help='Environment (production, staging)')
    deploy_parser.add_argument('status', choices=['success', 'failure'])
    deploy_parser.add_argument('duration', type=float, help='Duration in seconds')
    
    # Docker command
    docker_parser = subparsers.add_parser('docker', help='Push Docker metrics')
    docker_parser.add_argument('component', help='Component name')
    docker_parser.add_argument('size_mb', type=float, help='Image size in MB')
    docker_parser.add_argument('build_time', type=float, help='Build time in seconds')
    docker_parser.add_argument('--tag', default='latest', help='Image tag')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    exporter = MetricsExporter(args.pushgateway_url)
    
    try:
        if args.command == 'workflow':
            exporter.push_workflow_status(args.status, args.duration)
        elif args.command == 'build':
            exporter.push_build_status(args.component, args.status, args.duration)
        elif args.command == 'test':
            exporter.push_test_results(args.total, args.passed, args.failed, 
                                      args.skipped, args.duration, args.app)
        elif args.command == 'coverage':
            exporter.push_test_coverage(args.percent, args.app, 
                                       args.lines_covered, args.lines_total)
        elif args.command == 'deployment':
            exporter.push_deployment_status(args.environment, args.status, args.duration)
        elif args.command == 'docker':
            exporter.push_docker_metrics(args.component, args.size_mb, 
                                        args.build_time, args.tag)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
