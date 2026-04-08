#!/usr/bin/env node
/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_SLUG = 'redhat-developer/rhdh-plugins';
const NPM_SCOPE = '@red-hat-developer-hub/';

const ROOT = path.join(__dirname, '..');
const ARCHIVED_FILE = path.join(ROOT, '.github', 'archived-plugins.json');
const ARCHIVED_WORKSPACES_FILE = path.join(ROOT, 'ARCHIVED_WORKSPACES.md');
const CODEOWNERS = path.join(ROOT, '.github', 'CODEOWNERS');
const RENOVATE_JSON = path.join(ROOT, '.github', 'renovate.json');
const RENOVATE_PRESETS_DIR = path.join(
  ROOT,
  '.github',
  'renovate-presets',
  'workspace',
);

function printUsage() {
  console.log(`Usage:
  node scripts/archive.js <workspace> [plugin-dir-or-package-suffix] ["reason"]

Examples:
  node scripts/archive.js my-workspace
  node scripts/archive.js my-workspace "Superseded by another plugin"
  node scripts/archive.js my-workspace bulk-import "No longer maintained"
  node scripts/archive.js my-workspace backstage-plugin-bulk-import "No longer maintained"

The second argument is treated as a custom reason if it contains spaces.
Otherwise it selects a single plugin under workspaces/<workspace>/plugins/
(by directory name or @red-hat-developer-hub package name suffix).
`);
}

function treeUrlForGitTag(gitTag, workspace) {
  const encoded = gitTag.replace(/@/g, '%40');
  return `https://github.com/${REPO_SLUG}/tree/${encoded}/workspaces/${workspace}`;
}

function matchesPluginTarget(pluginDir, packageName, target) {
  if (!target) {
    return true;
  }
  if (!packageName.startsWith(NPM_SCOPE)) {
    return false;
  }
  const suffix = packageName.slice(NPM_SCOPE.length);
  if (pluginDir === target) {
    return true;
  }
  if (suffix === target) {
    return true;
  }
  if (suffix === `backstage-plugin-${target}`) {
    return true;
  }
  if (
    suffix.startsWith('backstage-plugin-') &&
    suffix.slice('backstage-plugin-'.length) === target
  ) {
    return true;
  }
  return false;
}

async function appendToArchivedWorkspacesMd(entries) {
  console.log('Updating ARCHIVED_WORKSPACES.md...');

  const tableRows = entries.map(entry => {
    const { workspace, pluginName, reason, gitTag } = entry;
    const pkg = `\`${pluginName}\``;
    const why = reason || 'No longer maintained';
    const sourceLink = `[${gitTag}](${treeUrlForGitTag(gitTag, workspace)})`;
    return `| ${workspace} | ${pkg} | ${why} | ${sourceLink} |`;
  });

  const block = `${tableRows.join('\n')}\n`;
  await fs.appendFile(ARCHIVED_WORKSPACES_FILE, block);

  console.log(`Added ${entries.length} row(s) to ARCHIVED_WORKSPACES.md`);
}

async function removeWorkspaceFromCodeowners(workspace) {
  console.log(`Removing /workspaces/${workspace} from CODEOWNERS...`);
  const content = await fs.readFile(CODEOWNERS, 'utf8');
  const lines = content.split('\n');
  const escaped = workspace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const workspacePattern = new RegExp(`^/workspaces/${escaped}\\s`);
  const filteredLines = lines.filter(line => !workspacePattern.test(line));
  await fs.writeFile(CODEOWNERS, filteredLines.join('\n'));
  console.log('Updated CODEOWNERS');
}

async function removeWorkspaceFromRenovateJson(workspace) {
  const presetRef = `github>${REPO_SLUG}//.github/renovate-presets/workspace/rhdh-${workspace}-presets`;
  const content = await fs.readFile(RENOVATE_JSON, 'utf8');
  const lines = content.split('\n');
  const filtered = lines.filter(line => !line.includes(presetRef));
  if (filtered.length === lines.length) {
    console.log(
      `No Renovate preset reference found for workspace "${workspace}" (skipping renovate.json).`,
    );
  } else {
    await fs.writeFile(RENOVATE_JSON, filtered.join('\n'));
    console.log('Updated renovate.json');
  }
}

async function removeRenovatePresetFile(workspace) {
  const presetPath = path.join(
    RENOVATE_PRESETS_DIR,
    `rhdh-${workspace}-presets.json`,
  );
  try {
    await fs.unlink(presetPath);
    console.log(`Removed ${path.relative(ROOT, presetPath)}`);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
    console.log(
      `No preset file at ${path.relative(ROOT, presetPath)} (skipped).`,
    );
  }
}

async function getPackagesFromWorkspace(workspace, targetPlugin = null) {
  const plugins = [];
  const pluginsDir = path.join(ROOT, 'workspaces', workspace, 'plugins');

  let pluginDirs;
  try {
    pluginDirs = await fs.readdir(pluginsDir);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return plugins;
    }
    throw e;
  }

  for (const pluginDir of pluginDirs) {
    const pluginPath = path.join(pluginsDir, pluginDir);
    const stat = await fs.stat(pluginPath);

    if (!stat.isDirectory()) {
      continue;
    }

    const packageJsonPath = path.join(pluginPath, 'package.json');
    let packageData;
    try {
      packageData = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    } catch {
      continue;
    }

    if (!packageData.name?.startsWith(NPM_SCOPE)) {
      continue;
    }

    if (!matchesPluginTarget(pluginDir, packageData.name, targetPlugin)) {
      continue;
    }

    plugins.push({
      name: packageData.name,
      version: packageData.version,
      workspace,
      plugin: pluginDir,
    });
  }

  return plugins;
}

async function addArchivedEntry(entries) {
  const content = await fs.readFile(ARCHIVED_FILE, 'utf8');
  const archivedData = JSON.parse(content);

  for (const entry of entries) {
    console.log(`Adding archived entry for ${entry.pluginName}`);
    archivedData.archived.push(entry);
  }

  await fs.writeFile(ARCHIVED_FILE, JSON.stringify(archivedData, null, 2));
  console.log(`Updated ${path.relative(ROOT, ARCHIVED_FILE)}`);
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printUsage();
    return;
  }

  const workspace = positionals[0];
  if (!workspace) {
    printUsage();
    process.exit(1);
  }

  let plugin = positionals[1];
  let reason = positionals[2] || 'No longer maintained';

  if (plugin && plugin.includes(' ')) {
    reason = plugin;
    plugin = null;
  }

  console.log(`Archiving in workspace ${workspace}...`);
  console.log(`Reason: ${reason}`);

  const packages = await getPackagesFromWorkspace(workspace, plugin);

  if (packages.length === 0) {
    console.log(
      'No matching @red-hat-developer-hub packages found to archive.',
    );
    process.exit(1);
  }

  const fullWorkspace = !plugin;

  const entries = packages.map(pkg => ({
    pluginName: pkg.name,
    version: pkg.version,
    workspace: pkg.workspace,
    plugin: pkg.plugin,
    gitTag: `${pkg.name}@${pkg.version}`,
    reason,
    archivedDate: new Date().toISOString().split('T')[0],
  }));

  await addArchivedEntry(entries);
  await appendToArchivedWorkspacesMd(entries);

  if (fullWorkspace) {
    console.log(
      '\nFull workspace archival: updating CODEOWNERS and Renovate configuration...',
    );
    await removeWorkspaceFromCodeowners(workspace);
    await removeRenovatePresetFile(workspace);
    await removeWorkspaceFromRenovateJson(workspace);
  }

  console.log(
    `\nSuccessfully recorded ${entries.length} package(s) as archived:`,
  );
  entries.forEach(entry => {
    console.log(
      `  - ${entry.pluginName} (${entry.workspace}/${entry.plugin}) — tag ${entry.gitTag}`,
    );
  });
  console.log(
    '\nNext: delete the workspace or plugin directory from the repository (and update any related documentation), then open a PR. After merge, confirm npm deprecation via the Deprecate Archived Plugins workflow.',
  );
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
