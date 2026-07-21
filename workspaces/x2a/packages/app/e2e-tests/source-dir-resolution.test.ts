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
 * FLPATH-4215: Source dir resolution when source_dir is "."
 *
 * Uses chef-examples-metadata repo which has a cookbook at the repo root
 * (metadata.rb, recipes/, attributes/) so x2a discovers a module with
 * sourcePath="." — the exact scenario the fix (x2a-convertor#194) addresses.
 *
 * Before the fix, the export agent failed to resolve paths for the migration
 * plan context when source_dir was ".". The fix adds source-path frontmatter
 * to migration plans and passes the high-level plan to the export agent.
 */

import { test, expect, request } from '@playwright/test';
import { X2AnsiblePage } from './pages/X2AnsiblePage';
import { performLogin } from './fixtures/auth';

const POLL_INTERVAL = 10_000;
const INIT_TIMEOUT = 300_000;
const PHASE_TIMEOUT = 420_000;
const SOURCE_TYPE = process.env.X2A_SOURCE_TYPE || 'chef';
const SOURCE_REPO_METADATA =
  process.env.X2A_SOURCE_REPO_METADATA ||
  'https://github.com/x2ansible/chef-examples-metadata.git';
const TARGET_REPO =
  process.env.X2A_TARGET_REPO ||
  'https://github.com/rhdh-orchestrator-test/x2a-e2e-target.git';

interface ProjectState {
  projectId: string;
  projectName: string;
  moduleId: string;
  moduleName: string;
  modulePath: string;
  token: string;
}

const state: ProjectState = {
  projectId: '',
  projectName: '',
  moduleId: '',
  moduleName: '',
  modulePath: '',
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
  const name = `x2a-srcdir-e2e-${Date.now()}`;
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const resp = await ctx.post('/api/x2a/projects', {
    headers,
    data: {
      name,
      abbreviation: 'x2a',
      description: `FLPATH-4215: source_dir=. resolution test: ${name}`,
      sourceRepoUrl: SOURCE_REPO_METADATA,
      targetRepoUrl: TARGET_REPO,
      sourceRepoBranch: 'master',
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

test.describe
  .serial('X2Ansible - FLPATH-4215 Source Dir Resolution @live', () => {
  test.skip(
    SOURCE_TYPE !== 'chef',
    `FLPATH-4215 requires chef-examples-metadata repo (current stream: ${SOURCE_TYPE})`,
  );

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

  test('Phase 1: Create project from root-level cookbook repo and init', async () => {
    test.setTimeout(INIT_TIMEOUT + 60_000);

    const project = await createProject(baseURL);
    state.projectId = project.id;
    state.projectName = project.name;
    // eslint-disable-next-line no-console
    console.log(
      `FLPATH-4215: Created project from ${SOURCE_REPO_METADATA}: ${project.name} (${project.id})`,
    );

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
      `Init did not succeed for ${SOURCE_REPO_METADATA}, state=${finalState}`,
    ).toBeTruthy();

    const modules = await getModules(baseURL, project.id);
    // eslint-disable-next-line no-console
    console.log(`Discovered ${modules.length} modules:`);
    for (const mod of modules) {
      // eslint-disable-next-line no-console
      console.log(
        `  module: ${mod.name}  sourcePath: ${mod.sourcePath ?? '?'}  id: ${mod.id}`,
      );
    }
    expect(modules.length).toBeGreaterThan(0);

    state.moduleId = modules[0].id;
    state.moduleName = modules[0].name;
    state.modulePath = modules[0].sourcePath ?? '';
    // eslint-disable-next-line no-console
    console.log(
      `Using module: ${state.moduleName} (sourcePath=${state.modulePath})`,
    );
  });

  test('Phase 2: Analyze root-level module', async ({ page }) => {
    test.setTimeout(PHASE_TIMEOUT + 60_000);
    expect(
      state.moduleId,
      'Module ID not set — init phase may have failed',
    ).toBeTruthy();

    // eslint-disable-next-line no-console
    console.log(
      `FLPATH-4215: Triggering Analyze for module ${state.moduleName} (sourcePath=${state.modulePath})`,
    );
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

  test('Phase 3: Migrate root-level module (core source_dir=. validation)', async ({
    page,
  }) => {
    test.setTimeout(PHASE_TIMEOUT + 60_000);
    expect(state.moduleId, 'Module ID not set').toBeTruthy();

    // eslint-disable-next-line no-console
    console.log(
      `FLPATH-4215: Triggering Migrate for root-level module ${state.moduleName} — ` +
        'this is the core test: before the fix, the export agent would fail ' +
        'to resolve source_dir="."',
    );
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
    expect(
      status,
      `FLPATH-4215: Migrate failed for root-level module (source_dir='.'). ` +
        `This indicates the export agent source dir resolution fix is not working. ` +
        `status=${status}`,
    ).toBe('success');

    await performLogin(page);
    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(state.projectId, state.moduleId);
    await x2aPage.waitForPhaseStatus('Migrate', 'Success', 30_000);
    // eslint-disable-next-line no-console
    console.log(
      'FLPATH-4215 verified: Migrate succeeded for root-level module',
    );
  });

  test('Phase 4: Verify all completed phases', async ({ page }) => {
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

    // eslint-disable-next-line no-console
    console.log(
      'FLPATH-4215: All pipeline phases verified for root-level module',
    );
  });
});
