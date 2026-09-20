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

/** Stop the local MCP Registry started by deploy-mcp-registry.ts. */

const { spawnSync } = require('node:child_process');
const { existsSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const REPO_DIR = process.env.REPO_DIR?.trim() || '/tmp/mcp-registry';
const IMAGE =
  process.env.MCP_REGISTRY_IMAGE?.trim() ||
  'ghcr.io/modelcontextprotocol/registry:main';

function commandExists(command: string): boolean {
  return (
    spawnSync('sh', ['-c', `command -v "${command}" >/dev/null 2>&1`])
      .status === 0
  );
}

function composeVersionOk(bin: string): boolean {
  return (
    spawnSync(bin, ['compose', 'version'], { stdio: 'ignore' }).status === 0
  );
}

function resolveCompose(): [string, ...string[]] {
  if (commandExists('podman') && composeVersionOk('podman')) {
    return ['podman', 'compose'];
  }
  if (commandExists('docker') && composeVersionOk('docker')) {
    return ['docker', 'compose'];
  }
  throw new Error("need 'podman compose' or 'docker compose'");
}

if (!existsSync(join(REPO_DIR, '.git'))) {
  if (!existsSync(REPO_DIR)) {
    const result = spawnSync(
      'git',
      [
        'clone',
        'https://github.com/modelcontextprotocol/registry.git',
        REPO_DIR,
      ],
      { stdio: 'inherit' },
    );
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  } else {
    console.error(`error: ${REPO_DIR} exists but is not a git repository`);
    process.exit(1);
  }
}

let compose: [string, ...string[]];
try {
  compose = resolveCompose();
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

const overrideDir = mkdtempSync(join(tmpdir(), 'mcp-registry-'));
const overridePath = join(overrideDir, 'override.yml');
writeFileSync(
  overridePath,
  `services:\n  registry:\n    image: ${IMAGE}\n`,
  'utf8',
);

try {
  console.log(`Stopping MCP Registry in ${REPO_DIR}...`);
  const [bin, ...prefix] = compose;
  const result = spawnSync(
    bin,
    [...prefix, '-f', 'docker-compose.yml', '-f', overridePath, 'down'],
    { cwd: REPO_DIR, stdio: 'inherit' },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log('MCP Registry stopped.');
} finally {
  rmSync(overrideDir, { recursive: true, force: true });
}
