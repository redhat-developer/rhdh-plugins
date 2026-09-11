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

import { test, expect, request } from '@playwright/test';
import { X2AnsiblePage } from './pages/X2AnsiblePage';
import { performLogin } from './fixtures/auth';

const POLL_INTERVAL = 10_000;
const INIT_TIMEOUT = 300_000;
const PHASE_TIMEOUT = 420_000;
const SOURCE_REPO =
  process.env.X2A_SOURCE_REPO || 'https://github.com/chef/chef-examples.git';
const TARGET_REPO =
  process.env.X2A_TARGET_REPO ||
  'https://github.com/rhdh-orchestrator-test/x2a-e2e-target.git';

interface ProjectState {
  projectId: string;
  projectName: string;
  moduleId: string;
  moduleName: string;
  token: string;
}

const state: ProjectState = {
  projectId: '',
  projectName: '',
  moduleId: '',
  moduleName: '',
  token: '',
};

async function getGuestToken(baseURL: string): Promise<string> {
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const resp = await ctx.post('/api/auth/guest/refresh');
  const data = await resp.json();
  await ctx.dispose();
  return data?.backstageIdentity?.token ?? '';
}

async function apiHeaders(baseURL: string) {
  if (!state.token) {
    state.token = await getGuestToken(baseURL);
  }
  return {
    Authorization: `Bearer ${state.token}`,
    'Content-Type': 'application/json',
  };
}

async function createProject(baseURL: string) {
  const headers = await apiHeaders(baseURL);
  const name = `x2a-ui-e2e-${Date.now()}`;
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const resp = await ctx.post('/api/x2a/projects', {
    headers,
    data: {
      name,
      abbreviation: 'x2a',
      description: `UI E2E pipeline test: ${name}`,
      sourceRepoUrl: SOURCE_REPO,
      targetRepoUrl: TARGET_REPO,
      sourceRepoBranch: 'main',
      targetRepoBranch: 'main',
    },
  });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  await ctx.dispose();
  return data;
}

async function triggerInit(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ghToken = process.env.GITHUB_TOKEN || 'placeholder';
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const resp = await ctx.post(`/api/x2a/projects/${projectId}/run`, {
    headers,
    data: {
      sourceRepoAuth: { token: ghToken },
      targetRepoAuth: { token: ghToken },
    },
  });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  await ctx.dispose();
  return data;
}

async function pollProjectState(
  baseURL: string,
  projectId: string,
  timeoutMs: number,
): Promise<string> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
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
  throw new Error(
    `Project ${projectId} did not reach terminal state within ${timeoutMs}ms (last: ${lastState})`,
  );
}

async function getModules(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const resp = await ctx.get(`/api/x2a/projects/${projectId}/modules`, {
    headers,
  });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  await ctx.dispose();
  return data;
}

async function triggerModulePhase(
  baseURL: string,
  projectId: string,
  moduleId: string,
  phase: 'analyze' | 'migrate' | 'publish',
) {
  const headers = await apiHeaders(baseURL);
  const ghToken = process.env.GITHUB_TOKEN || 'placeholder';
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const resp = await ctx.post(
    `/api/x2a/projects/${projectId}/modules/${moduleId}/run`,
    {
      headers,
      data: {
        phase,
        sourceRepoAuth: { token: ghToken },
        targetRepoAuth: { token: ghToken },
      },
    },
  );
  expect(
    resp.ok(),
    `Failed to trigger ${phase}: ${resp.status()}`,
  ).toBeTruthy();
  const data = await resp.json();
  await ctx.dispose();
  return data;
}

async function pollModuleStatus(
  baseURL: string,
  projectId: string,
  moduleId: string,
  timeoutMs: number,
): Promise<string> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const deadline = Date.now() + timeoutMs;
  let lastStatus = '';
  while (Date.now() < deadline) {
    const resp = await ctx.get(
      `/api/x2a/projects/${projectId}/modules/${moduleId}`,
      { headers },
    );
    if (resp.ok()) {
      const data = await resp.json();
      lastStatus = data?.status ?? 'unknown';
      if (['success', 'failed', 'error'].includes(lastStatus)) {
        await ctx.dispose();
        return lastStatus;
      }
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  await ctx.dispose();
  throw new Error(
    `Module did not reach terminal state within ${timeoutMs}ms (last: ${lastStatus})`,
  );
}

async function deleteProject(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  await ctx.delete(`/api/x2a/projects/${projectId}`, { headers });
  await ctx.dispose();
}

test.describe.serial('X2Ansible - Pipeline Phases @live', () => {
  let x2aPage: X2AnsiblePage;
  const baseURL = process.env.PLAYWRIGHT_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    x2aPage = new X2AnsiblePage(page);
  });

  test.afterAll(async () => {
    if (state.projectId) {
      await deleteProject(baseURL, state.projectId).catch(() => {});
    }
  });

  test('Phase 1: Create project and trigger init via API', async () => {
    test.setTimeout(INIT_TIMEOUT + 60_000);

    const project = await createProject(baseURL);
    state.projectId = project.id;
    state.projectName = project.name;
    // eslint-disable-next-line no-console
    console.log(`Created project: ${project.name} (${project.id})`);

    const initData = await triggerInit(baseURL, project.id);
    // eslint-disable-next-line no-console
    console.log(`Init triggered: jobId=${initData.jobId}`);

    const finalState = await pollProjectState(
      baseURL,
      project.id,
      INIT_TIMEOUT,
    );
    // eslint-disable-next-line no-console
    console.log(`Init completed with state: ${finalState}`);

    expect(
      ['success', 'initialized'].includes(finalState),
      `Init did not succeed, state=${finalState}`,
    ).toBeTruthy();

    const modules = await getModules(baseURL, project.id);
    // eslint-disable-next-line no-console
    console.log(`Discovered ${modules.length} modules`);
    expect(modules.length).toBeGreaterThan(0);
    state.moduleId = modules[0].id;
    state.moduleName = modules[0].name;
    // eslint-disable-next-line no-console
    console.log(
      `Discovered ${modules.length} modules. Using: ${modules[0].name} (${modules[0].id})`,
    );
  });

  test('Phase 2: Run Analyze and verify via UI', async ({ page }) => {
    test.setTimeout(PHASE_TIMEOUT + 60_000);
    expect(
      state.moduleId,
      'Module ID not set — init phase may have failed',
    ).toBeTruthy();

    // eslint-disable-next-line no-console
    console.log('Triggering Analyze phase via API...');
    const result = await triggerModulePhase(
      baseURL,
      state.projectId,
      state.moduleId,
      'analyze',
    );
    // eslint-disable-next-line no-console
    console.log(`Analyze triggered: jobId=${result.jobId}`);

    const status = await pollModuleStatus(
      baseURL,
      state.projectId,
      state.moduleId,
      PHASE_TIMEOUT,
    );
    // eslint-disable-next-line no-console
    console.log(`Analyze API status: ${status}`);
    expect(status, `Analyze failed with status=${status}`).toBe('success');

    await performLogin(page);
    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(state.projectId, state.moduleId);
    await x2aPage.waitForPhaseStatus('Analyze', 'Success', 30_000);
    // eslint-disable-next-line no-console
    console.log('Analyze phase verified in UI');
  });

  test('Phase 3: Run Migrate and verify via UI', async ({ page }) => {
    test.setTimeout(PHASE_TIMEOUT + 60_000);
    expect(state.moduleId, 'Module ID not set').toBeTruthy();

    // eslint-disable-next-line no-console
    console.log('Triggering Migrate phase via API...');
    const result = await triggerModulePhase(
      baseURL,
      state.projectId,
      state.moduleId,
      'migrate',
    );
    // eslint-disable-next-line no-console
    console.log(`Migrate triggered: jobId=${result.jobId}`);

    const status = await pollModuleStatus(
      baseURL,
      state.projectId,
      state.moduleId,
      PHASE_TIMEOUT,
    );
    // eslint-disable-next-line no-console
    console.log(`Migrate API status: ${status}`);
    expect(status, `Migrate failed with status=${status}`).toBe('success');

    await performLogin(page);
    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(state.projectId, state.moduleId);
    await x2aPage.waitForPhaseStatus('Migrate', 'Success', 30_000);
    // eslint-disable-next-line no-console
    console.log('Migrate phase verified in UI');
  });

  test('Phase 4: Run Publish and verify via UI', async ({ page }) => {
    test.setTimeout(PHASE_TIMEOUT + 60_000);
    expect(state.moduleId, 'Module ID not set').toBeTruthy();

    // eslint-disable-next-line no-console
    console.log('Triggering Publish phase via API...');
    const result = await triggerModulePhase(
      baseURL,
      state.projectId,
      state.moduleId,
      'publish',
    );
    // eslint-disable-next-line no-console
    console.log(`Publish triggered: jobId=${result.jobId}`);

    const status = await pollModuleStatus(
      baseURL,
      state.projectId,
      state.moduleId,
      PHASE_TIMEOUT,
    );
    // eslint-disable-next-line no-console
    console.log(`Publish API status: ${status}`);
    expect(status, `Publish failed with status=${status}`).toBe('success');

    await performLogin(page);
    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(state.projectId, state.moduleId);
    await x2aPage.waitForPhaseStatus('Publish', 'Success', 30_000);
    // eslint-disable-next-line no-console
    console.log('Publish phase verified in UI');
  });

  test('Phase 5: Verify all phases completed', async ({ page }) => {
    test.setTimeout(60_000);
    expect(state.moduleId, 'Module ID not set').toBeTruthy();

    await performLogin(page);
    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(state.projectId, state.moduleId);

    const analyzeStatus = await x2aPage.getPhaseStatus('Analyze');
    // eslint-disable-next-line no-console
    console.log(`Analyze status: ${analyzeStatus}`);
    expect(analyzeStatus).toContain('Success');

    const migrateStatus = await x2aPage.getPhaseStatus('Migrate');
    // eslint-disable-next-line no-console
    console.log(`Migrate status: ${migrateStatus}`);
    expect(migrateStatus).toContain('Success');

    const publishStatus = await x2aPage.getPhaseStatus('Publish');
    // eslint-disable-next-line no-console
    console.log(`Publish status: ${publishStatus}`);
    expect(publishStatus).toContain('Success');

    // eslint-disable-next-line no-console
    console.log('All pipeline phases verified successfully');
  });
});
