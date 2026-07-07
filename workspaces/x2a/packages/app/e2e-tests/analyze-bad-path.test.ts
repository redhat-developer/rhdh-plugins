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
 * FLPATH-4228: Analyze phase validation on non-existing module paths
 *
 * Validates that the analyze phase correctly fails when a module's
 * source path no longer exists in the repository. The fix in
 * x2a-convertor#206 ensures the convertor exits non-zero instead of
 * silently producing an empty migration plan.
 *
 * Test strategy:
 * 1. Create a temp branch in the test repo with a simple Chef recipe
 * 2. Create an X2A project pointing to that branch
 * 3. Init discovers the module (path exists)
 * 4. Delete the source file from the branch via GitHub API
 * 5. Run analyze — path no longer exists, should fail with error
 * 6. Verify valid modules still succeed (regression)
 */

import { test, expect, request } from '@playwright/test';

const TARGET_OWNER = 'rhdh-orchestrator-test';
const TARGET_REPO_NAME = 'x2a-e2e-target';
const REPO_URL = `https://github.com/${TARGET_OWNER}/${TARGET_REPO_NAME}.git`;
const POLL_INTERVAL = 5000;
const INIT_TIMEOUT = 300_000;
const PHASE_TIMEOUT = 180_000;

let guestToken = '';

function getGitHubToken(): string {
  return (
    process.env.RHDH_ORCHESTRATOR_GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
  );
}

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

// --- GitHub API helpers ---

async function githubApi(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const ghToken = getGitHubToken();
  const ctx = await request.newContext({
    baseURL: 'https://api.github.com',
    extraHTTPHeaders: {
      Authorization: `token ${ghToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  let resp;
  const url = `/repos/${TARGET_OWNER}/${TARGET_REPO_NAME}${path}`;
  if (method === 'GET') {
    resp = await ctx.get(url);
  } else if (method === 'POST') {
    resp = await ctx.post(url, { data: body });
  } else if (method === 'PUT') {
    resp = await ctx.put(url, { data: body });
  } else if (method === 'DELETE') {
    resp = await ctx.delete(url, { data: body });
  } else {
    throw new Error(`Unsupported method: ${method}`);
  }
  const status = resp.status();
  const data = status !== 204 ? await resp.json().catch(() => null) : null;
  await ctx.dispose();
  return { status, data };
}

async function createOrphanBranchWithFile(
  branchName: string,
  filePath: string,
  content: string,
): Promise<void> {
  // Create blob
  const { data: blobData } = await githubApi('POST', '/git/blobs', {
    content: Buffer.from(content).toString('base64'),
    encoding: 'base64',
  });
  const blobSha = (blobData as { sha: string }).sha;

  // Create tree with just our file
  const { data: treeData } = await githubApi('POST', '/git/trees', {
    tree: [
      {
        path: filePath,
        mode: '100644',
        type: 'blob',
        sha: blobSha,
      },
    ],
  });
  const treeSha = (treeData as { sha: string }).sha;

  // Create commit (orphan — no parents)
  const { data: commitData } = await githubApi('POST', '/git/commits', {
    message: `test: orphan commit for FLPATH-4228 (${branchName})`,
    tree: treeSha,
    parents: [],
  });
  const commitSha = (commitData as { sha: string }).sha;

  // Create branch ref
  const { status } = await githubApi('POST', '/git/refs', {
    ref: `refs/heads/${branchName}`,
    sha: commitSha,
  });
  expect(
    [201, 422].includes(status),
    `Failed to create branch: ${status}`,
  ).toBeTruthy();
}

async function createFileInBranch(
  branchName: string,
  filePath: string,
  content: string,
  message: string,
) {
  const encoded = Buffer.from(content).toString('base64');
  const { status } = await githubApi('PUT', `/contents/${filePath}`, {
    message,
    content: encoded,
    branch: branchName,
  });
  expect(status).toBe(201);
}

async function deleteFileFromBranch(
  branchName: string,
  filePath: string,
  message: string,
) {
  // Get file SHA first
  const { data: fileData } = await githubApi(
    'GET',
    `/contents/${filePath}?ref=${branchName}`,
  );
  const fileSha = (fileData as { sha: string }).sha;
  const { status } = await githubApi('DELETE', `/contents/${filePath}`, {
    message,
    sha: fileSha,
    branch: branchName,
  });
  expect(status).toBe(200);
}

async function deleteBranch(branchName: string) {
  await githubApi('DELETE', `/git/refs/heads/${branchName}`);
}

// --- X2A API helpers ---

async function createProject(baseURL: string, branch: string) {
  const headers = await apiHeaders(baseURL);
  const name = `x2a-badpath-e2e-${Date.now()}`;
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.post('/api/x2a/projects', {
    headers,
    data: {
      name,
      abbreviation: 'x2a',
      description: 'FLPATH-4228 bad path test',
      sourceRepoUrl: REPO_URL,
      targetRepoUrl: REPO_URL,
      sourceRepoBranch: branch,
      targetRepoBranch: branch,
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

async function pollModulePhase(
  baseURL: string,
  projectId: string,
  moduleId: string,
  phase: 'analyze' | 'migrate' | 'publish',
  timeoutMs: number,
): Promise<{ status: string }> {
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
        return { status: lastStatus };
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

test.describe('X2Ansible - FLPATH-4228 Analyze Bad Path Validation @live', () => {
  const baseURL = process.env.PLAYWRIGHT_URL ?? 'http://localhost:7007';

  test.describe.configure({ mode: 'serial' });

  const testBranch = `e2e-bad-path-${Date.now()}`;
  let projectId = '';
  let targetModuleId = '';

  test('Setup: create orphan branch with Ansible playbook', async () => {
    test.setTimeout(30_000);

    // An Ansible playbook that X2A will discover as a module
    const playbookContent = [
      '---',
      '# FLPATH-4228 test playbook',
      '- name: Configure e2e test service',
      '  hosts: all',
      '  become: true',
      '  tasks:',
      '    - name: Install httpd',
      '      ansible.builtin.package:',
      '        name: httpd',
      '        state: present',
      '',
      '    - name: Start httpd service',
      '      ansible.builtin.service:',
      '        name: httpd',
      '        state: started',
      '        enabled: true',
      '',
      '    - name: Deploy config file',
      '      ansible.builtin.template:',
      '        src: templates/test.conf.j2',
      '        dest: /etc/httpd/conf.d/test.conf',
      '        owner: root',
      '        mode: "0644"',
      '      notify: Restart httpd',
      '',
      '  handlers:',
      '    - name: Restart httpd',
      '      ansible.builtin.service:',
      '        name: httpd',
      '        state: restarted',
    ].join('\n');

    // Create an orphan branch with ONLY our test file — avoids scanning
    // hundreds of previously-published files during init
    await createOrphanBranchWithFile(
      testBranch,
      'e2e-bad-path-test/httpd_setup.yml',
      playbookContent,
    );
    // eslint-disable-next-line no-console
    console.log(
      `Created orphan branch ${testBranch} with e2e-bad-path-test/httpd_setup.yml`,
    );
  });

  test('Init: create project and discover module', async () => {
    test.setTimeout(INIT_TIMEOUT + 60_000);

    const project = await createProject(baseURL, testBranch);
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
    // eslint-disable-next-line no-console
    console.log(
      `Modules discovered: ${modules.map(m => `${m.name} (${m.sourcePath})`).join(', ')}`,
    );

    expect(
      modules.length,
      'Init should discover at least 1 module from test-cookbook',
    ).toBeGreaterThan(0);

    // Find our specific test module (the playbook file we created)
    const testModule = modules.find(
      m =>
        m.sourcePath.includes('e2e-bad-path-test') ||
        m.sourcePath.includes('httpd_setup'),
    );
    expect(
      testModule,
      `e2e-bad-path-test module not found. Discovered: ${modules.map(m => `${m.name}(${m.sourcePath})`).join(', ')}`,
    ).toBeDefined();
    targetModuleId = testModule!.id;
    // eslint-disable-next-line no-console
    console.log(
      `Target module: ${testModule!.name} (${testModule!.sourcePath})`,
    );
  });

  test('Delete source file to create non-existing path scenario', async () => {
    test.setTimeout(15_000);
    expect(projectId && targetModuleId).toBeTruthy();

    await deleteFileFromBranch(
      testBranch,
      'e2e-bad-path-test/httpd_setup.yml',
      'test: remove playbook to simulate non-existing path',
    );
    // eslint-disable-next-line no-console
    console.log('Deleted e2e-bad-path-test/httpd_setup.yml from branch');
  });

  test('Analyze: should fail on non-existing module path', async () => {
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
    // eslint-disable-next-line no-console
    console.log(`Analyze result: status=${result.status}`);

    // After the convertor fix (#206), analyze should report error/failed
    expect(
      ['error', 'failed'].includes(result.status),
      `Expected analyze to fail on deleted path, got status=${result.status}`,
    ).toBeTruthy();
  });

  test('Regression: valid module path still succeeds', async () => {
    test.setTimeout(PHASE_TIMEOUT + INIT_TIMEOUT);

    // Use the chef-examples repo which has known-good modules
    const SOURCE_REPO = 'https://github.com/chef/chef-examples.git';
    const headers = await apiHeaders(baseURL);
    const name = `x2a-regression-e2e-${Date.now()}`;
    const ctx = await request.newContext({
      baseURL,
      ignoreHTTPSErrors: true,
    });
    const resp = await ctx.post('/api/x2a/projects', {
      headers,
      data: {
        name,
        abbreviation: 'x2a',
        description: 'FLPATH-4228 regression check',
        sourceRepoUrl: SOURCE_REPO,
        targetRepoUrl: REPO_URL,
        sourceRepoBranch: 'main',
        targetRepoBranch: 'main',
      },
    });
    expect(resp.ok()).toBeTruthy();
    const project = await resp.json();
    await ctx.dispose();
    // eslint-disable-next-line no-console
    console.log(`Regression project: ${project.name} (${project.id})`);

    const ghToken = getGitHubToken();
    const initCtx = await request.newContext({
      baseURL,
      ignoreHTTPSErrors: true,
    });
    const initResp = await initCtx.post(`/api/x2a/projects/${project.id}/run`, {
      headers,
      data: {
        sourceRepoAuth: { token: ghToken },
        targetRepoAuth: { token: ghToken },
      },
    });
    expect(initResp.ok()).toBeTruthy();
    await initCtx.dispose();

    const state = await pollProjectState(baseURL, project.id, INIT_TIMEOUT);
    expect(['success', 'initialized'].includes(state)).toBeTruthy();

    const modules = await getModules(baseURL, project.id);
    expect(modules.length, 'Should discover modules').toBeGreaterThan(0);
    // Prefer a .yml module if available, otherwise take the first one
    const target =
      modules.find(m => m.sourcePath.endsWith('.yml')) ?? modules[0];
    // eslint-disable-next-line no-console
    console.log(`Regression module: ${target.name} (${target.sourcePath})`);

    const { status: runStatus, data: runData } = await triggerModulePhase(
      baseURL,
      project.id,
      target.id,
      'analyze',
    );
    expect(runStatus).toBe(200);
    expect(runData?.jobId).toBeDefined();

    const result = await pollModulePhase(
      baseURL,
      project.id,
      target.id,
      'analyze',
      PHASE_TIMEOUT,
    );
    // eslint-disable-next-line no-console
    console.log(`Regression analyze: status=${result.status}`);
    expect(result.status, 'Valid module path should analyze successfully').toBe(
      'success',
    );
  });

  test.afterAll(async () => {
    // Clean up: delete test branch
    try {
      await deleteBranch(testBranch);
      // eslint-disable-next-line no-console
      console.log(`Cleaned up branch: ${testBranch}`);
    } catch {
      // eslint-disable-next-line no-console
      console.log(`Warning: failed to delete branch ${testBranch}`);
    }
  });
});
