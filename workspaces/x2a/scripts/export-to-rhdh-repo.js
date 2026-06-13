#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { MultiSelect, Select } = require('enquirer');

const RHDH_CLI_VERSION = '1.9.1';
const EMBED_COMMON = '@red-hat-developer-hub/backstage-plugin-x2a-common';
const EMBED_NODE = '@red-hat-developer-hub/backstage-plugin-x2a-node';

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

const PLUGINS = [
  {
    name: 'Frontend Plugin (x2a)',
    dir: 'x2a',
    targetDir: 'red-hat-developer-hub-backstage-plugin-x2a',
    embedPackages: [EMBED_COMMON],
  },
  {
    name: 'Backend Plugin (x2a-backend)',
    dir: 'x2a-backend',
    targetDir: 'red-hat-developer-hub-backstage-plugin-x2a-backend',
    embedPackages: [EMBED_COMMON, EMBED_NODE],
  },
  {
    name: 'DCR Frontend Plugin (x2a-dcr)',
    dir: 'x2a-dcr',
    targetDir: 'red-hat-developer-hub-backstage-plugin-x2a-dcr',
    embedPackages: [EMBED_COMMON],
  },
  {
    name: 'MCP Extras Backend Plugin (x2a-mcp-extras)',
    dir: 'x2a-mcp-extras',
    targetDir: 'red-hat-developer-hub-backstage-plugin-x2a-mcp-extras',
    embedPackages: [EMBED_COMMON, EMBED_NODE],
  },
  {
    name: 'Scaffolder Backend Module (scaffolder-backend-module-x2a)',
    dir: 'scaffolder-backend-module-x2a',
    targetDir:
      'red-hat-developer-hub-backstage-plugin-scaffolder-backend-module-x2a',
    embedPackages: [EMBED_COMMON],
  },
];

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
    choices: PLUGINS.map(p => ({ name: p.name, value: p.dir })),
    result(answer) {
      return answer.map(name => this.find(name).value);
    },
  });
  const selectedDirs = await prompt.run();
  return PLUGINS.filter(p => selectedDirs.includes(p.dir));
}

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

function cleanDistDynamic(pluginPath) {
  const distDynamic = path.join(pluginPath, 'dist-dynamic');
  if (fs.existsSync(distDynamic)) {
    fs.rmSync(distDynamic, { recursive: true });
  }
}

function copyDirSync(src, dest) {
  ensureDirExists(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function exportPlugin(plugin, dynamicPluginsRoot) {
  const pluginPath = path.resolve(__dirname, '../plugins', plugin.dir);

  console.log(`🚀 Exporting plugin: ${plugin.dir}`);
  cleanDistDynamic(pluginPath);

  const embedArgs = plugin.embedPackages.flatMap(pkg => [
    '--embed-package',
    pkg,
  ]);

  const result = spawnSync(
    'npx',
    [
      `@red-hat-developer-hub/cli@${RHDH_CLI_VERSION}`,
      'plugin',
      'export',
      ...embedArgs,
    ],
    {
      cwd: pluginPath,
      stdio: 'inherit',
      shell: true,
    },
  );
  if (result.status !== 0) {
    console.error(`❌ Export failed for ${plugin.dir}`);
    process.exit(result.status);
  }

  const distDynamic = path.join(pluginPath, 'dist-dynamic');
  const targetPath = path.join(dynamicPluginsRoot, plugin.targetDir);

  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true });
  }
  console.log(`📦 Copying dist-dynamic → ${targetPath}`);
  copyDirSync(distDynamic, targetPath);
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
  const selectedPlugins = await choosePlugins();

  if (!fs.existsSync(RHDH_DIR)) {
    console.error(`❌ RHDH repo not found at: ${RHDH_DIR}`);
    process.exit(1);
  }

  console.log('🛠️ Compiling TypeScript in workspaces/x2a');
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

  for (const plugin of selectedPlugins) {
    exportPlugin(plugin, DYNAMIC_PLUGINS_ROOT);
  }

  console.log('✅ Plugins exported.');
}

main();
