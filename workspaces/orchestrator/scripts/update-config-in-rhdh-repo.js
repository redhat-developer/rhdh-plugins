#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const RHDH_DIR = process.env.RHDH_DIR
  ? path.resolve(process.env.RHDH_DIR)
  : path.resolve(__dirname, '../../../..', 'rhdh');

const LOCAL_CONFIG = path.join(RHDH_DIR, 'app-config.local.yaml');
const INITIAL_CONFIG = path.join(__dirname, 'config-for-rhdh-repo.yaml');

const pluginKey = 'red-hat-developer-hub.backstage-plugin-orchestrator';
const widgetsPluginKey =
  'red-hat-developer-hub.backstage-plugin-orchestrator-form-widgets';

const orchestratorDynamicPlugins = {
  rootDirectory: 'dynamic-plugins-root',
  frontend: {
    [widgetsPluginKey]: {},
    [pluginKey]: {
      appIcons: [
        {
          name: 'orchestratorIcon',
          importName: 'OrchestratorIcon',
        },
      ],
      dynamicRoutes: [
        {
          path: '/orchestrator',
          importName: 'OrchestratorPage',
          menuItem: {
            icon: 'orchestratorIcon',
            text: 'Orchestrator',
          },
        },
      ],
    },
  },
};

const orchestratorConfig = {
  sonataFlowService: {
    baseUrl: 'http://localhost',
    port: 8899,
    autoStart: true,
    workflowsSource: {
      gitRepositoryUrl:
        'https://github.com/rhdhorchestrator/backstage-orchestrator-workflows.git',
      localPath: path.resolve(
        __dirname,
        '../packages/backend/.devModeTemp/repository',
      ),
    },
  },
  dataIndexService: {
    url: 'http://localhost:8899',
  },
};

function createLocalConfigIfMissing() {
  if (!fs.existsSync(LOCAL_CONFIG)) {
    if (!fs.existsSync(INITIAL_CONFIG)) {
      console.error('❌ Missing app-config.example.yaml');
      process.exit(1);
    }
    fs.copyFileSync(INITIAL_CONFIG, LOCAL_CONFIG);
    console.log('📝 Created app-config.local.yaml from example');
  }
}

function updateConfig() {
  const raw = fs.readFileSync(LOCAL_CONFIG, 'utf8');
  const config = yaml.load(raw) || {};

  // Merge dynamicPlugins
  if (!config.dynamicPlugins) {
    config.dynamicPlugins = orchestratorDynamicPlugins;
    console.log('✅ Added dynamicPlugins section.');
  } else {
    config.dynamicPlugins.rootDirectory ??= 'dynamic-plugins-root';
    config.dynamicPlugins.frontend ??= {};

    if (!config.dynamicPlugins.frontend[pluginKey]) {
      config.dynamicPlugins.frontend[pluginKey] =
        orchestratorDynamicPlugins.frontend[pluginKey];
      console.log(`✅ Added frontend plugin: ${pluginKey}`);
    }

    if (!config.dynamicPlugins.frontend[widgetsPluginKey]) {
      config.dynamicPlugins.frontend[widgetsPluginKey] =
        orchestratorDynamicPlugins.frontend[widgetsPluginKey];
      console.log(`✅ Added frontend plugin: ${widgetsPluginKey}`);
    }
  }

  // Merge orchestrator config
  config.orchestrator = {
    ...(config.orchestrator || {}),
    ...orchestratorConfig,
  };

  const updated = yaml.dump(config, { lineWidth: -1 });
  fs.writeFileSync(LOCAL_CONFIG, updated, 'utf8');
  console.log(`✅ Updated ${LOCAL_CONFIG} with orchestrator config.`);
}

function main() {
  if (!fs.existsSync(RHDH_DIR)) {
    console.error(`❌ RHDH repo not found at: ${RHDH_DIR}`);
    process.exit(1);
  }
  createLocalConfigIfMissing();
  updateConfig();
}

main();
