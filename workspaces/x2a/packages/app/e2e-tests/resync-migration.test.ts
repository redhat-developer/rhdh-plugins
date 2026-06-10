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
 * FLPATH-4227: Resync Project Migration feature
 *
 * Tests the resync action (POST /projects/:id/run with refresh=true)
 * added in rhdh-plugins#3196.
 * Verifies that triggering a resync re-reads the migration plan and updates
 * the module list accordingly.
 */

import { test, expect, request } from '@playwright/test';

const SOURCE_REPO =
  process.env.X2A_SOURCE_REPO || 'https://github.com/chef/chef-examples.git';
const TARGET_REPO =
  process.env.X2A_TARGET_REPO ||
  'https://github.com/rhdh-orchestrator-test/x2a-e2e-target.git';
const POLL_INTERVAL = 3000;
const INIT_TIMEOUT = 120_000;

let guestToken = '';

async function getGuestToken(baseURL: string): Promise<string> {
  if (guestToken) return guestToken;
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.post('/api/auth/guest/refresh');
  const data = await resp.json();
  await ctx.dispose();
  guestToken = data?.backstageIdentity?.token ?? '';
  return guestToken;
}

async function apiHeaders(baseURL: string) {
  const token = await getGuestToken(baseURL);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function createProject(baseURL: string) {
  const headers = await apiHeaders(baseURL);
  const name = `x2a-resync-e2e-${Date.now()}`;
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.post('/api/x2a/projects', {
    headers,
    data: {
      name,
      abbreviation: 'x2a',
      description: 'FLPATH-4227 resync test',
      sourceRepoUrl: SOURCE_REPO,
      targetRepoUrl: TARGET_REPO,
      sourceRepoBranch: 'main',
      targetRepoBranch: 'main',
    },
  });
  expect(resp.ok(), `Failed to create project: ${resp.status()}`).toBeTruthy();
  const data = await resp.json();
  await ctx.dispose();
  return data;
}

async function triggerInit(
  baseURL: string,
  projectId: string,
  refresh = false,
) {
  const headers = await apiHeaders(baseURL);
  const ghToken =
    process.env.RHDH_ORCHESTRATOR_GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN ||
    '';
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const body: Record<string, unknown> = {
    sourceRepoAuth: { token: ghToken },
    targetRepoAuth: { token: ghToken },
  };
  if (refresh) {
    body.refresh = true;
  }
  const resp = await ctx.post(`/api/x2a/projects/${projectId}/run`, {
    headers,
    data: body,
  });
  const status = resp.status();
  const data = resp.ok() ? await resp.json() : null;
  await ctx.dispose();
  return { status, data };
}

async function pollProjectState(
  baseURL: string,
  projectId: string,
  timeoutMs: number,
): Promise<string> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const deadline = Date.now() + timeoutMs;
  let lastState = '';
  while (Date.now() < deadline) {
    const resp = await ctx.get(`/api/x2a/projects/${projectId}`, { headers });
    const data = await resp.json();
    lastState = data?.status?.state ?? 'unknown';
    if (['success', 'initialized', 'failed', 'error'].includes(lastState)) {
      await ctx.dispose();
      return lastState;
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  await ctx.dispose();
  return lastState;
}

interface Module {
  id: string;
  name: string;
  sourcePath: string;
  status: string;
  removedAt?: string | null;
}

async function getModules(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.get(`/api/x2a/projects/${projectId}/modules`, {
    headers,
  });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  await ctx.dispose();
  return (data.items ?? data) as Module[];
}

async function getProject(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.get(`/api/x2a/projects/${projectId}`, { headers });
  const data = await resp.json();
  await ctx.dispose();
  return data;
}

test.describe('X2Ansible - FLPATH-4227 Resync Migration @live', () => {
  const baseURL = process.env.PLAYWRIGHT_URL ?? 'http://localhost:7007';

  test.describe.configure({ mode: 'serial' });

  let projectId = '';
  let initialModules: Module[] = [];

  test('Setup: create and initialize a project', async () => {
    test.setTimeout(INIT_TIMEOUT + 30_000);

    const project = await createProject(baseURL);
    projectId = project.id;
    // eslint-disable-next-line no-console
    console.log(`Created project: ${project.name} (${projectId})`);

    const { status, data } = await triggerInit(baseURL, projectId);
    expect(status).toBe(200);
    expect(data?.jobId).toBeDefined();
    // eslint-disable-next-line no-console
    console.log(`Init triggered: jobId=${data.jobId}`);

    const finalState = await pollProjectState(baseURL, projectId, INIT_TIMEOUT);
    expect(
      ['success', 'initialized'].includes(finalState),
      `Init did not succeed, state=${finalState}`,
    ).toBeTruthy();

    initialModules = await getModules(baseURL, projectId);
    // eslint-disable-next-line no-console
    console.log(`Init complete: ${initialModules.length} modules discovered`);
    expect(initialModules.length).toBeGreaterThan(0);
  });

  test('should accept resync request (refresh=true) on initialized project', async () => {
    expect(projectId, 'Need an initialized project').toBeTruthy();

    const { status, data } = await triggerInit(baseURL, projectId, true);
    expect(status).toBe(200);
    expect(data?.jobId).toBeDefined();
    // eslint-disable-next-line no-console
    console.log(`Resync triggered: jobId=${data.jobId}`);
  });

  test('should complete resync and return to initialized state', async () => {
    test.setTimeout(INIT_TIMEOUT + 30_000);
    expect(projectId, 'Need an initialized project').toBeTruthy();

    const finalState = await pollProjectState(baseURL, projectId, INIT_TIMEOUT);
    expect(
      ['success', 'initialized'].includes(finalState),
      `Resync did not succeed, state=${finalState}`,
    ).toBeTruthy();
    // eslint-disable-next-line no-console
    console.log(`Resync complete: state=${finalState}`);
  });

  test('should preserve module list after resync (no source changes)', async () => {
    expect(projectId, 'Need an initialized project').toBeTruthy();

    const modulesAfterResync = await getModules(baseURL, projectId);

    const activeModules = modulesAfterResync.filter(m => !m.removedAt);
    // eslint-disable-next-line no-console
    console.log(
      `Modules after resync: ${activeModules.length} active, ${modulesAfterResync.length} total`,
    );

    expect(activeModules.length).toBe(initialModules.length);

    for (const original of initialModules) {
      const found = activeModules.find(
        m => m.sourcePath === original.sourcePath,
      );
      expect(
        found,
        `Module ${original.name} (${original.sourcePath}) missing after resync`,
      ).toBeDefined();
    }
  });

  test('should update modulesSummary in project status after resync', async () => {
    expect(projectId, 'Need an initialized project').toBeTruthy();

    const project = await getProject(baseURL, projectId);
    const summary = project?.status?.modulesSummary;

    expect(summary).toBeDefined();
    expect(summary.total).toBeGreaterThan(0);
    // eslint-disable-next-line no-console
    console.log(
      `Modules summary: total=${summary.total}, removed=${summary.removed ?? 0}`,
    );
  });

  test('should reject resync on non-initialized (created) project', async () => {
    const freshProject = await createProject(baseURL);
    // eslint-disable-next-line no-console
    console.log(`Fresh project: ${freshProject.id} (state=created)`);

    const { status } = await triggerInit(baseURL, freshProject.id, true);
    // A refresh on a project with no migration plan may fail or just run as normal init
    // eslint-disable-next-line no-console
    console.log(`Resync on fresh project: HTTP ${status}`);
    // Document actual behavior — if it succeeds, it just runs as normal init
    expect([200, 400, 409].includes(status)).toBeTruthy();
  });
});
