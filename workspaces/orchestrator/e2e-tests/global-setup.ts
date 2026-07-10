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

import { execSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';

const BACKEND_HEALTH_URL = 'http://localhost:7007/api/orchestrator/health';
const SONATAFLOW_HEALTH_URL = 'http://localhost:8899/q/health';
const TIMEOUT_MS = process.env.CI ? 600_000 : 180_000;
const POLL_INTERVAL_MS = 5_000;

const SONATAFLOW_CONTAINER = 'backstage-internal-sonataflow';
const SONATAFLOW_IMAGE =
  'quay.io/kubesmarts/incubator-kie-sonataflow-devmode:main';
const WORKFLOWS_GIT =
  'https://github.com/rhdhorchestrator/backstage-orchestrator-workflows.git';
const WORKFLOWS_MOUNT =
  '/home/kogito/serverless-workflow-project/src/main/resources';

const workspaceRoot = join(__dirname, '..');
const workflowsRepoPath = join(
  workspaceRoot,
  'packages/backend/.devModeTemp/repository',
);

async function isHealthy(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForHealth(url: string, description: string): Promise<void> {
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await isHealthy(url)) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  logSonataFlowDiagnostics();
  throw new Error(`Timed out waiting for ${description} after ${TIMEOUT_MS}ms`);
}

function runDocker(args: string[]): void {
  const result = spawnSync('docker', args, { stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `docker ${args.join(' ')} failed with code ${result.status}`,
    );
  }
}

function ensureWorkflowsRepository(): string {
  const workflowsPath = join(workflowsRepoPath, 'workflows');

  if (existsSync(workflowsPath)) {
    return workflowsPath;
  }

  mkdirSync(dirname(workflowsRepoPath), { recursive: true });
  if (existsSync(workflowsRepoPath)) {
    rmSync(workflowsRepoPath, { recursive: true, force: true });
  }

  execSync(`git clone --depth 1 ${WORKFLOWS_GIT} ${workflowsRepoPath}`, {
    stdio: 'inherit',
  });
  rmSync(join(workflowsRepoPath, '.git'), { recursive: true, force: true });

  return workflowsPath;
}

function startSonataFlowContainer(workflowsPath: string): void {
  spawnSync('docker', ['rm', '-f', SONATAFLOW_CONTAINER], { stdio: 'ignore' });

  if (process.env.CI) {
    runDocker(['pull', SONATAFLOW_IMAGE]);
  }

  runDocker([
    'run',
    '-d',
    '--name',
    SONATAFLOW_CONTAINER,
    '--add-host',
    'host.docker.internal:host-gateway',
    '-e',
    'QUARKUS_HTTP_PORT=8899',
    '-p',
    '8899:8899',
    '-e',
    'KOGITO_SERVICE_URL=http://localhost:8899',
    '-v',
    `${workflowsPath}:${WORKFLOWS_MOUNT}`,
    '-e',
    'KOGITO.CODEGEN.PROCESS.FAILONERROR=false',
    '-e',
    'QUARKUS_EMBEDDED_POSTGRESQL_DATA_DIR=/home/kogito/persistence',
    '-e',
    'NOTIFICATIONS_BEARER_TOKEN=bXljdXJscGFzc3dkCg==',
    '-e',
    'BACKSTAGE_NOTIFICATIONS_URL=http://host.docker.internal:7007',
    SONATAFLOW_IMAGE,
  ]);
}

function logSonataFlowDiagnostics(): void {
  try {
    console.log(
      execSync(`docker ps -a --filter name=${SONATAFLOW_CONTAINER}`, {
        encoding: 'utf8',
      }),
    );
    console.log(
      execSync(`docker logs ${SONATAFLOW_CONTAINER} 2>&1 | tail -80`, {
        encoding: 'utf8',
      }),
    );
  } catch {
    // Best-effort diagnostics only.
  }
}

export default async function globalSetup(): Promise<void> {
  if (process.env.PLAYWRIGHT_URL) {
    return;
  }

  await waitForHealth(BACKEND_HEALTH_URL, 'orchestrator backend health');

  if (!(await isHealthy(SONATAFLOW_HEALTH_URL))) {
    const workflowsPath = ensureWorkflowsRepository();
    startSonataFlowContainer(workflowsPath);
  }

  await waitForHealth(SONATAFLOW_HEALTH_URL, 'SonataFlow health');
}
