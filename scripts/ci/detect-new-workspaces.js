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
import fs from 'fs';
import path from 'path';
import { format as prettierFormat } from 'prettier';

const workspacesDir = path.resolve('workspaces');
const presetsDir = path.resolve('.github', 'renovate-presets', 'workspace');
const renovateJsonPath = path.resolve('.github', 'renovate.json');

function listWorkspaceNames() {
  if (!fs.existsSync(workspacesDir)) return [];
  return fs
    .readdirSync(workspacesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => name !== 'noop')
    .sort();
}

function isWorkspaceCovered(workspaceName) {
  const presetFile = path.join(
    presetsDir,
    `rhdh-${workspaceName}-presets.json`,
  );
  return fs.existsSync(presetFile);
}

function toTitleCase(source) {
  return source
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map(token => token.charAt(0).toLocaleUpperCase('en-US') + token.slice(1))
    .join(' ');
}

async function ensureRenovateExtends(presetRef) {
  let content = fs.readFileSync(renovateJsonPath, 'utf8');

  if (content.includes(`"${presetRef}"`)) {
    return false;
  }

  const descIndex = content.indexOf('"all RHDH Plugins workspaces"');
  if (descIndex === -1) {
    throw new Error('Could not find "all RHDH Plugins workspaces" rule');
  }

  const extendsIndex = content.indexOf('"extends":', descIndex);
  const arrayStart = content.indexOf('[', extendsIndex);
  const arrayEnd = content.indexOf(']', arrayStart);

  if (extendsIndex === -1 || arrayStart === -1 || arrayEnd === -1) {
    throw new Error('Could not find extends array');
  }

  const before = content.substring(0, arrayEnd).trimEnd();
  const after = content.substring(arrayEnd);
  content = `${before},\n        "${presetRef}"\n      ${after}`;

  fs.writeFileSync(renovateJsonPath, content, 'utf8');
  return true;
}

if (!fs.existsSync(presetsDir)) fs.mkdirSync(presetsDir, { recursive: true });

function buildPresetJson(workspaceName) {
  const displayName = toTitleCase(workspaceName.replace(/^rhdh-/, ''));
  return {
    packageRules: [
      {
        description: `all ${displayName} minor updates`,
        matchFileNames: [`workspaces/${workspaceName}/**`],
        extends: [
          `github>redhat-developer/rhdh-plugins//.github/renovate-presets/base/rhdh-minor-presets(${displayName})`,
        ],
        addLabels: ['team/rhdh', `${workspaceName}`],
      },
      {
        description: `all ${displayName} patch updates`,
        matchFileNames: [`workspaces/${workspaceName}/**`],
        extends: [
          `github>redhat-developer/rhdh-plugins//.github/renovate-presets/base/rhdh-patch-presets(${displayName})`,
        ],
        addLabels: ['team/rhdh', `${workspaceName}`],
      },
      {
        description: `all ${displayName} dev dependency updates`,
        matchFileNames: [`workspaces/${workspaceName}/**`],
        extends: [
          `github>redhat-developer/rhdh-plugins//.github/renovate-presets/base/rhdh-devdependency-presets(${displayName})`,
        ],
        addLabels: ['team/rhdh', `${workspaceName}`],
      },
    ],
  };
}

function findUncoveredWorkspaces() {
  return listWorkspaceNames().filter(ws => !isWorkspaceCovered(ws));
}

const argv = process.argv.slice(2);
switch (argv[0]) {
  case '--apply': {
    const ws = argv[1];
    if (!ws) {
      console.error('ERROR: --apply requires a workspace name');
      process.exit(2);
    }
    if (isWorkspaceCovered(ws)) {
      console.log(JSON.stringify({ workspace: ws, skipped: true }));
      process.exit(0);
    }

    const presetFilePath = path.join(presetsDir, `rhdh-${ws}-presets.json`);
    const presetJson = buildPresetJson(ws);
    const formattedPreset = await prettierFormat(JSON.stringify(presetJson), {
      parser: 'json',
    });
    fs.writeFileSync(presetFilePath, formattedPreset, 'utf8');
    const presetRef = `github>redhat-developer/rhdh-plugins//.github/renovate-presets/workspace/rhdh-${ws}-presets`;
    await ensureRenovateExtends(presetRef);
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `workspace=${ws}\n`);
    }
    console.log(JSON.stringify({ workspace: ws }));
    break;
  }
  case '--list': {
    const queue = findUncoveredWorkspaces();
    console.log(JSON.stringify(queue));
    break;
  }
  default: {
    console.error(
      `Unknown command: ${argv[0]}. Use --list (default) or --apply <workspace>.`,
    );
    break;
  }
}
