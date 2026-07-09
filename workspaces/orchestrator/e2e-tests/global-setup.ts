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

const BACKEND_HEALTH_URL = 'http://localhost:7007/api/orchestrator/health';
const SONATAFLOW_HEALTH_URL = 'http://localhost:8899/q/health';
const TIMEOUT_MS = process.env.CI ? 600_000 : 180_000;
const POLL_INTERVAL_MS = 5_000;

async function waitForHealth(url: string, description: string): Promise<void> {
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Service not ready yet.
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Timed out waiting for ${description} after ${TIMEOUT_MS}ms`);
}

export default async function globalSetup(): Promise<void> {
  if (process.env.PLAYWRIGHT_URL) {
    return;
  }

  await waitForHealth(BACKEND_HEALTH_URL, 'orchestrator backend health');
  await waitForHealth(SONATAFLOW_HEALTH_URL, 'SonataFlow health');
}
