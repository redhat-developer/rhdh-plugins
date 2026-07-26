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

import { execSync } from 'child_process';

const BACKEND_HEALTH_URL = 'http://localhost:7007/api/orchestrator/health';
const SONATAFLOW_HEALTH_URL = 'http://localhost:8899/q/health';
const SONATAFLOW_CONTAINER = 'backstage-internal-sonataflow';
const TIMEOUT_MS = process.env.CI ? 600_000 : 180_000;
const POLL_INTERVAL_MS = 5_000;

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
  await waitForHealth(SONATAFLOW_HEALTH_URL, 'SonataFlow health');
}
