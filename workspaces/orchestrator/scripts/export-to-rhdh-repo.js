#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { MultiSelect, Select } = require('enquirer');

const repos = {
  rhdh: {
    type: 'rhdh',
    pluginsFolder: 'dynamic-plugins-root',
  },
  'rhdh-local': {
    type: 'rhdh-local',
    pluginsFolder: 'local-plugins',
  },
};

async function chooseRepo() {
  const prompt = new Select({
    name: 'repo',
    message: 'Which RHDH repo do you want to use?',
    choices: Object.keys(repos),
  });

  const selectedKey = await prompt.run();
  return repos[selectedKey];
}

async function choosePlugins() {
  const prompt = new MultiSelect({
    name: 'plugins',
    message: 'Select plugins to export',
    choices: PLUGINS,
    result(answer) {
      return answer.map(name => this.find(name).value);
    },
  });
  return prompt.run();
}

const PLUGINS = [
  {
    name: 'Frontend Plugin',
    value: path.resolve(__dirname, '../plugins/orchestrator'),
  },
  {
    name: 'Frontend Widgets Plugin',
    value: path.resolve(__dirname, '../plugins/orchestrator-form-widgets'),
  },
  {
    name: 'Backend Plugin',
    value: path.resolve(__dirname, '../plugins/orchestrator-backend'),
  },
  {
    name: 'Scaffolder Backend Module Plugin',
    value: path.resolve(
      __dirname,
      '../plugins/scaffolder-backend-module-orchestrator',
    ),
  },
];

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created dynamic plugins root: ${dir}`);
  } else {
    console.log(`📁 Using dynamic plugins root: ${dir}`);
  }
}

function exportPlugin(pluginPath, dynamicPluginsRoot) {
  console.log(`🚀 Exporting plugin from ${pluginPath}`);
  const result = spawnSync(
    'yarn',
    [
      'export-dynamic',
      '--dynamic-plugins-root',
      dynamicPluginsRoot,
      '--dev',
      '--clean',
    ],
    {
      cwd: pluginPath,
      stdio: 'inherit',
      shell: true,
    },
  );
  if (result.status !== 0) {
    console.error(`❌ Export failed for ${pluginPath}`);
    process.exit(result.status);
  }
}

async function main() {
  const chosen_repo = await chooseRepo();

  const RHDH_DIR = process.env.RHDH_DIR
    ? path.resolve(process.env.RHDH_DIR)
    : path.resolve(__dirname, '../../../..', chosen_repo.type);

  const DYNAMIC_PLUGINS_ROOT = path.resolve(
    RHDH_DIR,
    chosen_repo.pluginsFolder,
  );
  const selectedPluginPaths = await choosePlugins();

  if (!fs.existsSync(RHDH_DIR)) {
    console.error(`❌ RHDH repo not found at: ${RHDH_DIR}`);
    process.exit(1);
  }
  console.log('🛠️ Compiling TypeScript in workspaces/orchestrator');
  const tscResult = spawnSync('yarn', ['tsc'], {
    cwd: path.resolve(__dirname, '../'),
    stdio: 'inherit',
    shell: true,
  });

  if (tscResult.status !== 0) {
    console.error('❌ TypeScript compilation failed.');
    process.exit(tscResult.status);
  }

  ensureDirExists(DYNAMIC_PLUGINS_ROOT);

  for (const pluginPath of selectedPluginPaths) {
    exportPlugin(pluginPath, DYNAMIC_PLUGINS_ROOT);
  }

  console.log('✅ Plugins exported.');
}

main();
