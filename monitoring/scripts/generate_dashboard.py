#!/usr/bin/env python3
"""
Generate Grafana Dashboard JSON for Save-n-Bite CI/CD Monitoring
This script creates a comprehensive dashboard for monitoring GitHub Actions pipelines
"""

import json
import os
from pathlib import Path


def create_cicd_dashboard():
    """Create the main CI/CD pipeline monitoring dashboard"""
    
    dashboard = {
        "annotations": {
            "list": [
                {
                    "builtIn": 1,
                    "datasource": {
                        "type": "datasource",
                        "uid": "grafana"
                    },
                    "enable": True,
                    "hide": True,
                    "iconColor": "rgba(0, 211, 255, 1)",
                    "name": "Annotations & Alerts",
                    "type": "dashboard"
                }
            ]
        },
        "editable": True,
        "fiscalYearStartMonth": 0,
        "graphTooltip": 1,
        "id": None,
        "links": [],
        "liveNow": False,
        "panels": [
            # Row 1: Overview Metrics
            {
                "datasource": {
                    "type": "prometheus",
                    "uid": "Prometheus"
                },
                "fieldConfig": {
                    "defaults": {
                        "color": {
                            "mode": "thresholds"
                        },
                        "mappings": [],
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                                {
                                    "color": "green",
                                    "value": None
                                },
                                {
                                    "color": "red",
                                    "value": 1
                                }
                            ]
                        },
                        "unit": "short"
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 6,
                    "w": 6,
                    "x": 0,
                    "y": 0
                },
                "id": 1,
                "options": {
                    "colorMode": "value",
                    "graphMode": "area",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": {
                        "calcs": [
                            "lastNotNull"
                        ],
                        "fields": "",
                        "values": False
                    },
                    "textMode": "auto"
                },
                "pluginVersion": "10.0.0",
                "targets": [
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "sum(github_actions_workflow_status{status=\"success\"})",
                        "refId": "A"
                    }
                ],
                "title": "Successful Workflows (24h)",
                "type": "stat"
            },
            {
                "datasource": {
                    "type": "prometheus",
                    "uid": "Prometheus"
                },
                "fieldConfig": {
                    "defaults": {
                        "color": {
                            "mode": "thresholds"
                        },
                        "mappings": [],
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                                {
                                    "color": "green",
                                    "value": None
                                },
                                {
                                    "color": "yellow",
                                    "value": 1
                                },
                                {
                                    "color": "red",
                                    "value": 3
                                }
                            ]
                        },
                        "unit": "short"
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 6,
                    "w": 6,
                    "x": 6,
                    "y": 0
                },
                "id": 2,
                "options": {
                    "colorMode": "value",
                    "graphMode": "area",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": {
                        "calcs": [
                            "lastNotNull"
                        ],
                        "fields": "",
                        "values": False
                    },
                    "textMode": "auto"
                },
                "pluginVersion": "10.0.0",
                "targets": [
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "sum(github_actions_workflow_status{status=\"failure\"})",
                        "refId": "A"
                    }
                ],
                "title": "Failed Workflows (24h)",
                "type": "stat"
            },
            {
                "datasource": {
                    "type": "prometheus",
                    "uid": "Prometheus"
                },
                "fieldConfig": {
                    "defaults": {
                        "color": {
                            "mode": "palette-classic"
                        },
                        "custom": {
                            "axisCenteredZero": False,
                            "axisColorMode": "text",
                            "axisLabel": "",
                            "axisPlacement": "auto",
                            "barAlignment": 0,
                            "drawStyle": "line",
                            "fillOpacity": 10,
                            "gradientMode": "none",
                            "hideFrom": {
                                "tooltip": False,
                                "viz": False,
                                "legend": False
                            },
                            "lineInterpolation": "linear",
                            "lineWidth": 1,
                            "pointSize": 5,
                            "scaleDistribution": {
                                "type": "linear"
                            },
                            "showPoints": "auto",
                            "spanNulls": False,
                            "stacking": {
                                "group": "A",
                                "mode": "none"
                            },
                            "thresholdsStyle": {
                                "mode": "off"
                            }
                        },
                        "mappings": [],
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                                {
                                    "color": "green",
                                    "value": None
                                }
                            ]
                        },
                        "unit": "s"
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 6,
                    "w": 12,
                    "x": 12,
                    "y": 0
                },
                "id": 3,
                "options": {
                    "legend": {
                        "calcs": [],
                        "displayMode": "list",
                        "placement": "bottom",
                        "showLegend": True
                    },
                    "tooltip": {
                        "mode": "single",
                        "sort": "none"
                    }
                },
                "targets": [
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "avg(github_actions_workflow_duration_seconds) by (workflow)",
                        "legendFormat": "{{workflow}}",
                        "refId": "A"
                    }
                ],
                "title": "Average Workflow Duration",
                "type": "timeseries"
            },
            # Row 2: Test Coverage and Results
            {
                "datasource": {
                    "type": "prometheus",
                    "uid": "Prometheus"
                },
                "fieldConfig": {
                    "defaults": {
                        "color": {
                            "mode": "thresholds"
                        },
                        "mappings": [],
                        "max": 100,
                        "min": 0,
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                                {
                                    "color": "red",
                                    "value": None
                                },
                                {
                                    "color": "yellow",
                                    "value": 70
                                },
                                {
                                    "color": "green",
                                    "value": 80
                                }
                            ]
                        },
                        "unit": "percent"
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 8,
                    "w": 12,
                    "x": 0,
                    "y": 6
                },
                "id": 4,
                "options": {
                    "orientation": "auto",
                    "reduceOptions": {
                        "calcs": [
                            "lastNotNull"
                        ],
                        "fields": "",
                        "values": False
                    },
                    "showThresholdLabels": False,
                    "showThresholdMarkers": True
                },
                "pluginVersion": "10.0.0",
                "targets": [
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "github_actions_test_coverage_percent",
                        "legendFormat": "{{job}} - {{app}}",
                        "refId": "A"
                    }
                ],
                "title": "Test Coverage by Component",
                "type": "gauge"
            },
            {
                "datasource": {
                    "type": "prometheus",
                    "uid": "Prometheus"
                },
                "fieldConfig": {
                    "defaults": {
                        "color": {
                            "mode": "palette-classic"
                        },
                        "custom": {
                            "hideFrom": {
                                "tooltip": False,
                                "viz": False,
                                "legend": False
                            }
                        },
                        "mappings": []
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 8,
                    "w": 12,
                    "x": 12,
                    "y": 6
                },
                "id": 5,
                "options": {
                    "legend": {
                        "displayMode": "list",
                        "placement": "right",
                        "showLegend": True,
                        "values": []
                    },
                    "pieType": "pie",
                    "tooltip": {
                        "mode": "single",
                        "sort": "none"
                    }
                },
                "targets": [
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "sum(github_actions_tests_passed)",
                        "legendFormat": "Passed",
                        "refId": "A"
                    },
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "sum(github_actions_tests_failed)",
                        "legendFormat": "Failed",
                        "refId": "B"
                    },
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "sum(github_actions_tests_skipped)",
                        "legendFormat": "Skipped",
                        "refId": "C"
                    }
                ],
                "title": "Test Results Distribution",
                "type": "piechart"
            },
            # Row 3: Workflow Status Over Time
            {
                "datasource": {
                    "type": "prometheus",
                    "uid": "Prometheus"
                },
                "fieldConfig": {
                    "defaults": {
                        "color": {
                            "mode": "palette-classic"
                        },
                        "custom": {
                            "axisCenteredZero": False,
                            "axisColorMode": "text",
                            "axisLabel": "",
                            "axisPlacement": "auto",
                            "barAlignment": 0,
                            "drawStyle": "line",
                            "fillOpacity": 10,
                            "gradientMode": "none",
                            "hideFrom": {
                                "tooltip": False,
                                "viz": False,
                                "legend": False
                            },
                            "lineInterpolation": "linear",
                            "lineWidth": 2,
                            "pointSize": 5,
                            "scaleDistribution": {
                                "type": "linear"
                            },
                            "showPoints": "auto",
                            "spanNulls": False,
                            "stacking": {
                                "group": "A",
                                "mode": "none"
                            },
                            "thresholdsStyle": {
                                "mode": "off"
                            }
                        },
                        "mappings": [],
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                                {
                                    "color": "green",
                                    "value": None
                                }
                            ]
                        },
                        "unit": "short"
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 8,
                    "w": 24,
                    "x": 0,
                    "y": 14
                },
                "id": 6,
                "options": {
                    "legend": {
                        "calcs": [
                            "mean",
                            "lastNotNull",
                            "max"
                        ],
                        "displayMode": "table",
                        "placement": "right",
                        "showLegend": True
                    },
                    "tooltip": {
                        "mode": "multi",
                        "sort": "none"
                    }
                },
                "targets": [
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "rate(github_actions_workflow_runs_total[5m]) * 60",
                        "legendFormat": "{{workflow}} - {{status}}",
                        "refId": "A"
                    }
                ],
                "title": "Workflow Runs Rate (per minute)",
                "type": "timeseries"
            },
            # Row 4: Build and Deployment Status
            {
                "datasource": {
                    "type": "prometheus",
                    "uid": "Prometheus"
                },
                "fieldConfig": {
                    "defaults": {
                        "color": {
                            "mode": "thresholds"
                        },
                        "mappings": [
                            {
                                "options": {
                                    "0": {
                                        "color": "green",
                                        "text": "Success"
                                    },
                                    "1": {
                                        "color": "red",
                                        "text": "Failed"
                                    }
                                },
                                "type": "value"
                            }
                        ],
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                                {
                                    "color": "green",
                                    "value": None
                                },
                                {
                                    "color": "red",
                                    "value": 1
                                }
                            ]
                        },
                        "unit": "short"
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 8,
                    "w": 8,
                    "x": 0,
                    "y": 22
                },
                "id": 7,
                "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": {
                        "calcs": [
                            "lastNotNull"
                        ],
                        "fields": "",
                        "values": False
                    },
                    "textMode": "auto"
                },
                "pluginVersion": "10.0.0",
                "targets": [
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "github_actions_build_status{component=\"backend\"}",
                        "refId": "A"
                    }
                ],
                "title": "Backend Build Status",
                "type": "stat"
            },
            {
                "datasource": {
                    "type": "prometheus",
                    "uid": "Prometheus"
                },
                "fieldConfig": {
                    "defaults": {
                        "color": {
                            "mode": "thresholds"
                        },
                        "mappings": [
                            {
                                "options": {
                                    "0": {
                                        "color": "green",
                                        "text": "Success"
                                    },
                                    "1": {
                                        "color": "red",
                                        "text": "Failed"
                                    }
                                },
                                "type": "value"
                            }
                        ],
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                                {
                                    "color": "green",
                                    "value": None
                                },
                                {
                                    "color": "red",
                                    "value": 1
                                }
                            ]
                        },
                        "unit": "short"
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 8,
                    "w": 8,
                    "x": 8,
                    "y": 22
                },
                "id": 8,
                "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": {
                        "calcs": [
                            "lastNotNull"
                        ],
                        "fields": "",
                        "values": False
                    },
                    "textMode": "auto"
                },
                "pluginVersion": "10.0.0",
                "targets": [
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "github_actions_build_status{component=\"frontend\"}",
                        "refId": "A"
                    }
                ],
                "title": "Frontend Build Status",
                "type": "stat"
            },
            {
                "datasource": {
                    "type": "prometheus",
                    "uid": "Prometheus"
                },
                "fieldConfig": {
                    "defaults": {
                        "color": {
                            "mode": "thresholds"
                        },
                        "mappings": [
                            {
                                "options": {
                                    "0": {
                                        "color": "green",
                                        "text": "Success"
                                    },
                                    "1": {
                                        "color": "red",
                                        "text": "Failed"
                                    }
                                },
                                "type": "value"
                            }
                        ],
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                                {
                                    "color": "green",
                                    "value": None
                                },
                                {
                                    "color": "red",
                                    "value": 1
                                }
                            ]
                        },
                        "unit": "short"
                    },
                    "overrides": []
                },
                "gridPos": {
                    "h": 8,
                    "w": 8,
                    "x": 16,
                    "y": 22
                },
                "id": 9,
                "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": {
                        "calcs": [
                            "lastNotNull"
                        ],
                        "fields": "",
                        "values": False
                    },
                    "textMode": "auto"
                },
                "pluginVersion": "10.0.0",
                "targets": [
                    {
                        "datasource": {
                            "type": "prometheus",
                            "uid": "Prometheus"
                        },
                        "expr": "github_actions_deployment_status",
                        "refId": "A"
                    }
                ],
                "title": "Deployment Status",
                "type": "stat"
            },
            # Row 5: Logs Panel
            {
                "datasource": {
                    "type": "loki",
                    "uid": "Loki"
                },
                "gridPos": {
                    "h": 10,
                    "w": 24,
                    "x": 0,
                    "y": 30
                },
                "id": 10,
                "options": {
                    "dedupStrategy": "none",
                    "enableLogDetails": True,
                    "prettifyLogMessage": False,
                    "showCommonLabels": False,
                    "showLabels": False,
                    "showTime": True,
                    "sortOrder": "Descending",
                    "wrapLogMessage": False
                },
                "targets": [
                    {
                        "datasource": {
                            "type": "loki",
                            "uid": "Loki"
                        },
                        "expr": "{job=\"cicd\"}",
                        "refId": "A"
                    }
                ],
                "title": "CI/CD Logs",
                "type": "logs"
            }
        ],
        "schemaVersion": 38,
        "style": "dark",
        "tags": [
            "cicd",
            "github-actions",
            "save-n-bite"
        ],
        "templating": {
            "list": [
                {
                    "current": {
                        "selected": False,
                        "text": "All",
                        "value": "$__all"
                    },
                    "datasource": {
                        "type": "prometheus",
                        "uid": "Prometheus"
                    },
                    "definition": "label_values(github_actions_workflow_status, workflow)",
                    "hide": 0,
                    "includeAll": True,
                    "label": "Workflow",
                    "multi": True,
                    "name": "workflow",
                    "options": [],
                    "query": {
                        "query": "label_values(github_actions_workflow_status, workflow)",
                        "refId": "PrometheusVariableQueryEditor-VariableQuery"
                    },
                    "refresh": 1,
                    "regex": "",
                    "skipUrlSync": False,
                    "sort": 0,
                    "type": "query"
                },
                {
                    "current": {
                        "selected": False,
                        "text": "All",
                        "value": "$__all"
                    },
                    "datasource": {
                        "type": "prometheus",
                        "uid": "Prometheus"
                    },
                    "definition": "label_values(github_actions_workflow_status, branch)",
                    "hide": 0,
                    "includeAll": True,
                    "label": "Branch",
                    "multi": True,
                    "name": "branch",
                    "options": [],
                    "query": {
                        "query": "label_values(github_actions_workflow_status, branch)",
                        "refId": "PrometheusVariableQueryEditor-VariableQuery"
                    },
                    "refresh": 1,
                    "regex": "",
                    "skipUrlSync": False,
                    "sort": 0,
                    "type": "query"
                }
            ]
        },
        "time": {
            "from": "now-24h",
            "to": "now"
        },
        "timepicker": {},
        "timezone": "browser",
        "title": "Save-n-Bite CI/CD Pipeline Dashboard",
        "uid": "savenbite-cicd",
        "version": 1,
        "weekStart": ""
    }
    
    return dashboard


def save_dashboard(dashboard, output_dir):
    """Save the dashboard JSON to a file"""
    os.makedirs(output_dir, exist_ok=True)
    output_path = Path(output_dir) / "cicd-pipeline-dashboard.json"
    
    with open(output_path, 'w') as f:
        json.dump(dashboard, f, indent=2)
    
    print(f"✅ Dashboard saved to: {output_path}")
    return output_path


if __name__ == "__main__":
    # Generate the dashboard
    dashboard = create_cicd_dashboard()
    
    # Save to the dashboards directory
    script_dir = Path(__file__).parent
    dashboards_dir = script_dir.parent / "grafana" / "dashboards"
    
    save_dashboard(dashboard, dashboards_dir)
    print("\n🎉 Grafana dashboard generated successfully!")
    print("📊 Dashboard: Save-n-Bite CI/CD Pipeline Dashboard")
    print("🔗 Import this dashboard into Grafana or place in the provisioning directory")
