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
 * FLPATH-4213: Export agent copies all generated files
 *
 * Validates that the publish phase pushes ALL git-tracked files to the
 * target repo — including deeply nested paths like molecule tests,
 * collections requirements, and project-level files. This verifies
 * the fix in rhdh-plugins#3181 which changed the export agent from
 * copying only files in the ansible/ folder to iterating over all
 * git-tracked files.
 *
 * Test flow: create project → init → analyze → migrate → publish → verify target repo
 */

import { test, expect, request } from '@playwright/test';

const SOURCE_REPO =
  process.env.X2A_SOURCE_REPO || 'https://github.com/chef/chef-examples.git';
const TARGET_REPO =
  process.env.X2A_TARGET_REPO ||
  'https://github.com/rhdh-orchestrator-test/x2a-e2e-target.git';
const TARGET_OWNER = 'rhdh-orchestrator-test';
const TARGET_REPO_NAME = 'x2a-e2e-target';
const POLL_INTERVAL = 5000;
const INIT_TIMEOUT = 120_000;
const PHASE_TIMEOUT = 300_000;

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

function getGitHubToken(): string {
  return (
    process.env.RHDH_ORCHESTRATOR_GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
  );
}

async function createProject(baseURL: string) {
  const headers = await apiHeaders(baseURL);
  const name = `x2a-export-e2e-${Date.now()}`;
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.post('/api/x2a/projects', {
    headers,
    data: {
      name,
      abbreviation: 'x2a',
      description: 'FLPATH-4213 export all files test',
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

async function triggerProjectInit(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ghToken = getGitHubToken();
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.post(`/api/x2a/projects/${projectId}/run`, {
    headers,
    data: {
      sourceRepoAuth: { token: ghToken },
      targetRepoAuth: { token: ghToken },
    },
  });
  const status = resp.status();
  const data = resp.ok() ? await resp.json() : null;
  await ctx.dispose();
  return { status, data };
}

async function triggerModulePhase(
  baseURL: string,
  projectId: string,
  moduleId: string,
  phase: 'analyze' | 'migrate' | 'publish',
) {
  const headers = await apiHeaders(baseURL);
  const ghToken = getGitHubToken();
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
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

interface ModulePhaseInfo {
  status: string;
  commitId?: string;
  artifacts?: Array<{ type: string; value: string }>;
}

async function pollModulePhase(
  baseURL: string,
  projectId: string,
  moduleId: string,
  phase: 'analyze' | 'migrate' | 'publish',
  timeoutMs: number,
): Promise<ModulePhaseInfo> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const deadline = Date.now() + timeoutMs;
  let lastStatus = 'unknown';
  while (Date.now() < deadline) {
    const resp = await ctx.get(
      `/api/x2a/projects/${projectId}/modules/${moduleId}`,
      { headers },
    );
    const data = await resp.json();
    const phaseData = data?.[phase];
    if (phaseData) {
      lastStatus = phaseData.status;
      if (['success', 'error', 'failed'].includes(lastStatus)) {
        await ctx.dispose();
        return {
          status: lastStatus,
          commitId: phaseData.commitId,
          artifacts: phaseData.artifacts,
        };
      }
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  await ctx.dispose();
  return { status: lastStatus };
}

interface Module {
  id: string;
  name: string;
  sourcePath: string;
  status: string;
  technology?: string;
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

async function getGitHubCommitFiles(commitSha: string): Promise<string[]> {
  const ghToken = getGitHubToken();
  const ctx = await request.newContext({
    baseURL: 'https://api.github.com',
    extraHTTPHeaders: {
      Authorization: `token ${ghToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  const resp = await ctx.get(
    `/repos/${TARGET_OWNER}/${TARGET_REPO_NAME}/commits/${commitSha}`,
  );
  if (!resp.ok()) {
    await ctx.dispose();
    return [];
  }
  const data = await resp.json();
  await ctx.dispose();
  return (data.files ?? []).map((f: { filename: string }) => f.filename);
}

test.describe('X2Ansible - FLPATH-4213 Export All Files @live', () => {
  const baseURL = process.env.PLAYWRIGHT_URL ?? 'http://localhost:7007';

  test.describe.configure({ mode: 'serial' });

  let projectId = '';
  let targetModuleId = '';
  let targetModuleName = '';
  let publishCommitSha = '';

  test('Setup: create project and initialize', async () => {
    test.setTimeout(INIT_TIMEOUT + 30_000);

    const project = await createProject(baseURL);
    projectId = project.id;
    // eslint-disable-next-line no-console
    console.log(`Created project: ${project.name} (${projectId})`);

    const { status, data } = await triggerProjectInit(baseURL, projectId);
    expect(status).toBe(200);
    expect(data?.jobId).toBeDefined();

    const finalState = await pollProjectState(baseURL, projectId, INIT_TIMEOUT);
    expect(
      ['success', 'initialized'].includes(finalState),
      `Init failed: state=${finalState}`,
    ).toBeTruthy();

    const modules = await getModules(baseURL, projectId);
    expect(modules.length).toBeGreaterThan(0);

    // Pick a simple module — prefer a single .yml file (fastest to convert)
    const singleYmlModule = modules.find(m => m.sourcePath.endsWith('.yml'));
    // Fall back to smallest path (likely simplest module)
    const target =
      singleYmlModule ??
      modules.sort((a, b) => a.sourcePath.length - b.sourcePath.length)[0];
    targetModuleId = target.id;
    targetModuleName = target.name;
    // eslint-disable-next-line no-console
    console.log(
      `Target module: ${targetModuleName} (${targetModuleId}), source: ${target.sourcePath}`,
    );
  });

  test('Analyze: create migration plan for module', async () => {
    test.setTimeout(PHASE_TIMEOUT);
    expect(projectId && targetModuleId).toBeTruthy();

    const { status, data } = await triggerModulePhase(
      baseURL,
      projectId,
      targetModuleId,
      'analyze',
    );
    expect(status).toBe(200);
    expect(data?.jobId).toBeDefined();
    // eslint-disable-next-line no-console
    console.log(`Analyze triggered: jobId=${data.jobId}`);

    const result = await pollModulePhase(
      baseURL,
      projectId,
      targetModuleId,
      'analyze',
      PHASE_TIMEOUT,
    );
    expect(result.status, `Analyze failed: status=${result.status}`).toBe(
      'success',
    );
    // eslint-disable-next-line no-console
    console.log(`Analyze complete: status=${result.status}`);
  });

  test('Migrate: convert module to Ansible', async () => {
    test.setTimeout(PHASE_TIMEOUT);
    expect(projectId && targetModuleId).toBeTruthy();

    const { status, data } = await triggerModulePhase(
      baseURL,
      projectId,
      targetModuleId,
      'migrate',
    );
    expect(status).toBe(200);
    expect(data?.jobId).toBeDefined();
    // eslint-disable-next-line no-console
    console.log(`Migrate triggered: jobId=${data.jobId}`);

    const result = await pollModulePhase(
      baseURL,
      projectId,
      targetModuleId,
      'migrate',
      PHASE_TIMEOUT,
    );
    expect(result.status, `Migrate failed: status=${result.status}`).toBe(
      'success',
    );
    expect(result.artifacts?.length).toBeGreaterThan(0);
    // eslint-disable-next-line no-console
    console.log(
      `Migrate complete: status=${result.status}, artifacts=${result.artifacts?.length}`,
    );
  });

  test('Publish: push all files to target repository', async () => {
    test.setTimeout(PHASE_TIMEOUT);
    expect(projectId && targetModuleId).toBeTruthy();

    const { status, data } = await triggerModulePhase(
      baseURL,
      projectId,
      targetModuleId,
      'publish',
    );
    expect(status).toBe(200);
    expect(data?.jobId).toBeDefined();
    // eslint-disable-next-line no-console
    console.log(`Publish triggered: jobId=${data.jobId}`);

    const result = await pollModulePhase(
      baseURL,
      projectId,
      targetModuleId,
      'publish',
      PHASE_TIMEOUT,
    );
    // Publish may report 'error' if AAP sync fails, but git push can still succeed
    expect(
      ['success', 'error'].includes(result.status),
      `Publish did not complete: status=${result.status}`,
    ).toBeTruthy();
    expect(
      result.commitId,
      'Publish must produce a commit in target repo',
    ).toBeDefined();

    publishCommitSha = result.commitId!;
    // eslint-disable-next-line no-console
    console.log(
      `Publish complete: status=${result.status}, commit=${publishCommitSha}`,
    );
  });

  test('Verify: all generated files appear in target repo commit', async () => {
    test.setTimeout(30_000);
    expect(publishCommitSha).toBeTruthy();

    const files = await getGitHubCommitFiles(publishCommitSha);
    expect(files.length).toBeGreaterThan(0);
    // eslint-disable-next-line no-console
    console.log(`Files in publish commit: ${files.length}`);
    files.forEach(f => console.log(`  ${f}`)); // eslint-disable-line no-console

    // Verify role structure files exist (tasks/main.yml is the core converted file)
    const hasTasksMain = files.some(f => f.includes('/tasks/main.yml'));
    expect(
      hasTasksMain,
      'Target repo must contain roles/*/tasks/main.yml',
    ).toBeTruthy();

    // Verify molecule test files are included (nested deeply under roles/)
    const hasMolecule = files.some(f => f.includes('/molecule/'));
    expect(
      hasMolecule,
      'Target repo must contain molecule test files (deeply nested)',
    ).toBeTruthy();

    // Verify project-level files are included (outside roles/ directory)
    const hasProjectFiles = files.some(
      f =>
        f.endsWith('/ansible.cfg') ||
        f.endsWith('/requirements.yml') ||
        f.endsWith('/README.md'),
    );
    expect(
      hasProjectFiles,
      'Target repo must include project-level files (ansible.cfg, README, etc.)',
    ).toBeTruthy();
  });

  test('Verify: files span multiple directory depths', async () => {
    test.setTimeout(30_000);
    expect(publishCommitSha).toBeTruthy();

    const files = await getGitHubCommitFiles(publishCommitSha);

    // Count unique directory depths to verify deep file inclusion
    const depths = new Set(files.map(f => f.split('/').length));
    // eslint-disable-next-line no-console
    console.log(`Directory depths present: ${[...depths].sort().join(', ')}`);

    // Files should span at least 3 different depths:
    // e.g., project/ansible-project/file (3), project/ansible-project/roles/name/file (5),
    //        project/ansible-project/roles/name/molecule/default/file (7)
    expect(
      depths.size,
      `Expected files at multiple depths, got ${depths.size}`,
    ).toBeGreaterThanOrEqual(3);
  });

  test('Verify: standard ansible role structure is correct', async () => {
    test.setTimeout(30_000);
    expect(publishCommitSha).toBeTruthy();

    const files = await getGitHubCommitFiles(publishCommitSha);

    // Standard Ansible role directories that should be present
    const expectedPaths = [
      '/tasks/main.yml',
      '/meta/main.yml',
      '/handlers/main.yml',
    ];

    for (const expected of expectedPaths) {
      const found = files.some(f => f.includes(expected));
      // eslint-disable-next-line no-console
      console.log(`  ${expected}: ${found ? 'FOUND' : 'MISSING'}`);
      expect(
        found,
        `Standard ansible path ${expected} not found in published files`,
      ).toBeTruthy();
    }
  });
});
