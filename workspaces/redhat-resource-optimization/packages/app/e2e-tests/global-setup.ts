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
 * Playwright globalSetup — runs once before all workers are spawned.
 *
 * Detects the deployed ROS plugin version by probing the backend API
 * and sets ROS_DYNAMIC_PLUGINS_VERSION so routes.ts and skip-guards
 * pick up the correct values.
 */
async function globalSetup() {
  const baseUrl = process.env.PLAYWRIGHT_URL;
  if (!baseUrl || process.env.ROS_DYNAMIC_PLUGINS_VERSION) {
    return;
  }

  const probe = async (path: string): Promise<number> => {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      });
      return res.status;
    } catch {
      return 0;
    }
  };

  // The cost-management backend plugin registers /api/cost-management/*.
  // The legacy plugin registers /api/redhat-resource-optimization/*.
  // A non-404 response (401, 200, 3xx) means the route exists.
  const [cmStatus, roStatus] = await Promise.all([
    probe('/api/cost-management'),
    probe('/api/redhat-resource-optimization'),
  ]);

  const cmExists = cmStatus !== 0 && cmStatus !== 404;
  const roExists = roStatus !== 0 && roStatus !== 404;

  if (roExists && !cmExists) {
    process.env.ROS_DYNAMIC_PLUGINS_VERSION = '1.2.0-detected';
    // eslint-disable-next-line no-console
    console.log(
      '[global-setup] Detected legacy ROS plugin (redhat-resource-optimization)',
    );
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `[global-setup] API probe: cost-management=${cmStatus}, redhat-resource-optimization=${roStatus}`,
    );
  }
}

export default globalSetup;
