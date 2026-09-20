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
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { homedir } = require('node:os');
const { join } = require('node:path');

/** Fixed, typically non-writable dirs — avoid PATH-based binary lookup (S4036). */
const SAFE_BIN_DIRS = ['/usr/bin', '/bin', '/usr/local/bin'];

const CACHE_ROOT = join(homedir(), '.cache', 'rhdh-ai-integrations');
const DEFAULT_REPO_DIR = join(CACHE_ROOT, 'mcp-registry');

const REPO_DIR = process.env.MCP_REGISTRY_REPO_DIR?.trim() || DEFAULT_REPO_DIR;
const REPO_URL =
  process.env.MCP_REGISTRY_REPO_URL?.trim() ||
  'https://github.com/modelcontextprotocol/registry.git';
const REPO_REVISION =
  process.env.MCP_REGISTRY_REPO_REVISION?.trim() || 'v1.8.1';
const IMAGE_NAME =
  process.env.MCP_REGISTRY_IMAGE_NAME?.trim() ||
  'ghcr.io/modelcontextprotocol/registry';
const IMAGE_TAG = process.env.MCP_REGISTRY_IMAGE_TAG?.trim() || '1.8.1';
const IMAGE = `${IMAGE_NAME}:${IMAGE_TAG}`;

function findBinary(name: string): string | undefined {
  for (const dir of SAFE_BIN_DIRS) {
    const candidate = join(dir, name);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function requireBinary(name: string): string {
  const path = findBinary(name);
  if (!path) {
    throw new Error(
      `command not found in ${SAFE_BIN_DIRS.join(', ')}: ${name}`,
    );
  }
  return path;
}

function composeVersionOk(binPath: string): boolean {
  return (
    spawnSync(binPath, ['compose', 'version'], { stdio: 'ignore' }).status === 0
  );
}

function resolveCompose(): [string, ...string[]] {
  const podman = findBinary('podman');
  if (podman && composeVersionOk(podman)) {
    return [podman, 'compose'];
  }
  const docker = findBinary('docker');
  if (docker && composeVersionOk(docker)) {
    return [docker, 'compose'];
  }
  throw new Error("need 'podman compose' or 'docker compose'");
}

/** Private cache dir under $HOME — avoid world-writable /tmp (S5443). */
function createPrivateTempDir(prefix: string): string {
  mkdirSync(CACHE_ROOT, { recursive: true, mode: 0o700 });
  return mkdtempSync(join(CACHE_ROOT, prefix));
}

function runGit(args: string[], cwd?: string): void {
  const git = requireBinary('git');
  const result = spawnSync(git, args, {
    cwd,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/** Clone the registry checkout if missing (same URL/revision as deploy). */
function ensureRegistryCheckout(): void {
  if (existsSync(join(REPO_DIR, '.git'))) {
    return;
  }
  if (existsSync(REPO_DIR)) {
    console.error(`error: ${REPO_DIR} exists but is not a git repository`);
    process.exit(1);
  }
  console.log(`Cloning ${REPO_URL} (${REPO_REVISION}) into ${REPO_DIR}...`);
  runGit([
    'clone',
    '--branch',
    REPO_REVISION,
    '--depth',
    '1',
    REPO_URL,
    REPO_DIR,
  ]);
}

ensureRegistryCheckout();

let compose: [string, ...string[]];
try {
  compose = resolveCompose();
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

const overrideDir = createPrivateTempDir('mcp-registry-');
const overridePath = join(overrideDir, 'override.yml');
writeFileSync(overridePath, `services:\n  registry:\n    image: ${IMAGE}\n`, {
  encoding: 'utf8',
  mode: 0o600,
});

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
