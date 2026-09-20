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

/**
 * Start a local MCP Registry for provider development.
 *
 * Upstream `make dev-compose` builds the registry image with ko into the Docker
 * daemon. ko does not work with podman, so this script uses the published GHCR
 * image and the upstream docker-compose.yml (postgres + registry) instead.
 *
 * Set MCP_REGISTRY_DATA_DIR to mount a custom host directory over /data (instead
 * of the checkout's ./data, which includes the default seed.json). When set,
 * seeding defaults to data/seed.json with registry validation disabled unless
 * MCP_REGISTRY_SEED_FROM / MCP_REGISTRY_ENABLE_REGISTRY_VALIDATION are already
 * set.
 */

const { spawnSync } = require('node:child_process');
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} = require('node:fs');
const { homedir } = require('node:os');
const { join, resolve } = require('node:path');

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
const DATA_DIR = process.env.MCP_REGISTRY_DATA_DIR?.trim();
const REGISTRY_URL =
  process.env.MCP_REGISTRY_URL?.trim() || 'http://localhost:8080';
const API_VERSION = process.env.MCP_REGISTRY_API_VERSION?.trim() || 'v0.1';
const READY_TIMEOUT_MS = Number(
  process.env.MCP_REGISTRY_READY_TIMEOUT_MS?.trim() || 300_000,
);

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

function resolveDataDir(): string | undefined {
  if (!DATA_DIR) {
    return undefined;
  }
  const absoluteDataDir = resolve(DATA_DIR);
  if (
    !existsSync(absoluteDataDir) ||
    !statSync(absoluteDataDir).isDirectory()
  ) {
    console.error(
      `error: MCP_REGISTRY_DATA_DIR must be an existing directory: ${absoluteDataDir}`,
    );
    process.exit(1);
  }
  return absoluteDataDir;
}

function buildOverrideYaml(image: string, dataDir?: string): string {
  const lines = ['services:', '  registry:', `    image: ${image}`];
  if (dataDir) {
    // Replace upstream ./data:/data:ro with a custom host directory.
    // `:z` is required for Podman/SELinux so the container (uid 65532) can
    // read the bind-mounted seed files; without it open() returns EACCES.
    lines.push(
      '    volumes:',
      `      - ${JSON.stringify(`${dataDir}:/data:ro,z`)}`,
    );
  }
  return `${lines.join('\n')}\n`;
}

/** Private cache dir under $HOME — avoid world-writable /tmp (S5443). */
function createPrivateTempDir(prefix: string): string {
  mkdirSync(CACHE_ROOT, { recursive: true, mode: 0o700 });
  return mkdtempSync(join(CACHE_ROOT, prefix));
}

/**
 * Block until the registry HTTP API answers. `compose up -d` returns before
 * migrations/seed finish; the process only listens on :8080 after import.
 */
function waitForRegistryReady(baseUrl: string, timeoutMs: number): void {
  const curl = requireBinary('curl');
  const sleep = requireBinary('sleep');
  const probeUrl = `${baseUrl.replace(
    /\/$/,
    '',
  )}/${API_VERSION}/servers?limit=1`;
  const deadline = Date.now() + timeoutMs;
  console.log(`Waiting for MCP Registry at ${probeUrl}...`);
  while (Date.now() < deadline) {
    const probe = spawnSync(
      curl,
      ['-sf', '--connect-timeout', '1', '--max-time', '3', probeUrl],
      { encoding: 'utf8' },
    );
    if (probe.status === 0) {
      console.log('MCP Registry is ready.');
      return;
    }
    spawnSync(sleep, ['1']);
  }
  throw new Error(
    `MCP Registry did not become ready at ${probeUrl} within ${timeoutMs}ms`,
  );
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

/** Clone or update the registry checkout to MCP_REGISTRY_REPO_REVISION. */
function ensureRegistryCheckout(): void {
  if (!existsSync(join(REPO_DIR, '.git'))) {
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
    return;
  }

  console.log(`Checking out ${REPO_REVISION} in ${REPO_DIR}...`);
  runGit(['fetch', '--depth', '1', 'origin', REPO_REVISION], REPO_DIR);
  runGit(['checkout', '--force', 'FETCH_HEAD'], REPO_DIR);
}

ensureRegistryCheckout();

const dataDir = resolveDataDir();

let compose: [string, ...string[]];
try {
  compose = resolveCompose();
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

const overrideDir = createPrivateTempDir('mcp-registry-');
const overridePath = join(overrideDir, 'override.yml');
writeFileSync(overridePath, buildOverrideYaml(IMAGE, dataDir), {
  encoding: 'utf8',
  mode: 0o600,
});

const composeEnv = { ...process.env };
if (dataDir) {
  // Match upstream offline seeding:
  // MCP_REGISTRY_SEED_FROM=data/seed.json MCP_REGISTRY_ENABLE_REGISTRY_VALIDATION=false
  if (!composeEnv.MCP_REGISTRY_SEED_FROM?.trim()) {
    composeEnv.MCP_REGISTRY_SEED_FROM = 'data/seed.json';
  }
  if (!composeEnv.MCP_REGISTRY_ENABLE_REGISTRY_VALIDATION?.trim()) {
    composeEnv.MCP_REGISTRY_ENABLE_REGISTRY_VALIDATION = 'false';
  }
}

try {
  const seedNote = dataDir ? ` with data from ${dataDir}` : '';
  console.log(
    `Starting MCP Registry from ${IMAGE}${seedNote} (${REGISTRY_URL})...`,
  );
  const [bin, ...prefix] = compose;
  const result = spawnSync(
    bin,
    [...prefix, '-f', 'docker-compose.yml', '-f', overridePath, 'up', '-d'],
    { cwd: REPO_DIR, stdio: 'inherit', env: composeEnv },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  try {
    waitForRegistryReady(REGISTRY_URL, READY_TIMEOUT_MS);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
  console.log(
    `MCP Registry started in background. Use '${compose.join(
      ' ',
    )} -f ${REPO_DIR}/docker-compose.yml logs' to view logs.`,
  );
} finally {
  rmSync(overrideDir, { recursive: true, force: true });
}
