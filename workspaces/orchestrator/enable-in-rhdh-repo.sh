#!/bin/bash

set -e

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
RHDH_DIR="${RHDH_DIR:-$PLUGIN_DIR/../../../rhdh}"
DYNAMIC_PLUGINS_ROOT="$RHDH_DIR/dynamic-plugins-root"
CONFIG_YAML="$RHDH_DIR/app-config.yaml"

FRONTEND_PLUGIN_DIR="$PLUGIN_DIR/plugins/orchestrator"
BACKEND_PLUGIN_DIR="$PLUGIN_DIR/plugins/orchestrator-backend"

echo "=== Using RHDH_DIR: $RHDH_DIR ==="

echo "=== Exporting frontend dynamic plugin ==="
cd "$FRONTEND_PLUGIN_DIR"
yarn export-dynamic --dynamic-plugins-root "$DYNAMIC_PLUGINS_ROOT" --dev --clean

echo "=== Exporting backend dynamic plugin ==="
cd "$BACKEND_PLUGIN_DIR"
yarn export-dynamic --dynamic-plugins-root "$DYNAMIC_PLUGINS_ROOT" --dev --clean

if grep -q '^orchestrator:' "$CONFIG_YAML"; then
  echo "=== 'orchestrator' config already exists in app-config.yaml — skipping append ==="
else
  echo "=== Appending configuration to app-config.yaml ==="
  cat <<EOF >> "$CONFIG_YAML"

orchestrator:
  sonataFlowService:
    baseUrl: http://localhost
    port: 8899
    autoStart: true
    workflowsSource:
      gitRepositoryUrl: https://github.com/rhdhorchestrator/backstage-orchestrator-workflows.git
      localPath: ./.devModeTemp/repository
  dataIndexService:
    url: http://localhost:8899

dynamicPlugins:
  rootDirectory: dynamic-plugins-root
  frontend:
    red-hat-developer-hub.backstage-plugin-orchestrator:
      appIcons:
        - name: orchestratorIcon
          importName: OrchestratorIcon
      dynamicRoutes:
        - path: /orchestrator
          importName: OrchestratorPage
          menuItem:
            icon: orchestratorIcon
            text: Orchestrator
EOF
  echo "=== Config appended to app-config.yaml ==="
fi

echo "=== Done. Frontend and backend plugins exported ==="
