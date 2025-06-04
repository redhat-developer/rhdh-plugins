#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RHDH_DIR = process.env.RHDH_DIR
  ? path.resolve(process.env.RHDH_DIR)
  : path.resolve(__dirname, '../../../..', 'rhdh');

const DYNAMIC_PLUGINS_ROOT = path.resolve(RHDH_DIR, 'dynamic-plugins-root');

const FRONTEND_PLUGIN = path.resolve(__dirname, '../plugins/orchestrator');
const FRONTEND_WIDGETS_PLUGIN = path.resolve(
  __dirname,
  '../plugins/orchestrator-form-widgets',
);
const BACKEND_PLUGIN = path.resolve(
  __dirname,
  '../plugins/orchestrator-backend',
);
const BACKEND_SCAFFOLDER_MODULE_PLUGIN = path.resolve(
  __dirname,
  '../plugins/scaffolder-backend-module-orchestrator',
);

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created dynamic plugins root: ${dir}`);
  } else {
    console.log(`📁 Using dynamic plugins root: ${dir}`);
  }
}

function exportPlugin(dir) {
  console.log(`🚀 Exporting plugin from ${dir}`);
  const result = spawnSync(
    'yarn',
    [
      'export-dynamic',
      '--dynamic-plugins-root',
      DYNAMIC_PLUGINS_ROOT,
      '--dev',
      '--clean',
    ],
    {
      cwd: dir,
      stdio: 'inherit',
      shell: true,
    },
  );
  if (result.status !== 0) {
    console.error(`❌ Export failed for ${dir}`);
    process.exit(result.status);
  }
}

function main() {
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
  exportPlugin(FRONTEND_PLUGIN);
  exportPlugin(FRONTEND_WIDGETS_PLUGIN);
  exportPlugin(BACKEND_PLUGIN);
  exportPlugin(BACKEND_SCAFFOLDER_MODULE_PLUGIN);
  console.log('✅ Plugins exported.');
}

main();
