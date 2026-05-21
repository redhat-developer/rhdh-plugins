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
 * FLPATH-4211: Edit Project feature
 *
 * Tests the PATCH /projects/:projectId endpoint added in rhdh-plugins#3130.
 * Verifies that project name, ownedBy, and description can be updated via API.
 */

import { test, expect, request } from '@playwright/test';

const SOURCE_REPO =
  process.env.X2A_SOURCE_REPO || 'https://github.com/chef/chef-examples.git';
const TARGET_REPO =
  process.env.X2A_TARGET_REPO ||
  'https://github.com/rhdh-orchestrator-test/x2a-e2e-target.git';

let guestToken = '';

async function getGuestToken(baseURL: string): Promise<string> {
  if (guestToken) return guestToken;
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
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

async function createProject(baseURL: string, suffix: string) {
  const headers = await apiHeaders(baseURL);
  const name = `x2a-edit-e2e-${suffix}-${Date.now()}`;
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const resp = await ctx.post('/api/x2a/projects', {
    headers,
    data: {
      name,
      abbreviation: 'x2a',
      description: `FLPATH-4211 edit project test: ${suffix}`,
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

async function getProject(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const resp = await ctx.get(`/api/x2a/projects/${projectId}`, { headers });
  expect(resp.ok(), `Failed to get project: ${resp.status()}`).toBeTruthy();
  const data = await resp.json();
  await ctx.dispose();
  return data;
}

async function patchProject(
  baseURL: string,
  projectId: string,
  body: Record<string, string>,
) {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const resp = await ctx.patch(`/api/x2a/projects/${projectId}`, {
    headers,
    data: body,
  });
  const data = resp.ok() ? await resp.json() : null;
  const status = resp.status();
  await ctx.dispose();
  return { status, data };
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

test.describe('X2Ansible - FLPATH-4211 Edit Project @live', () => {
  const baseURL = process.env.PLAYWRIGHT_URL || 'http://localhost:3000';
  const createdProjects: string[] = [];

  test.afterAll(async () => {
    for (const pid of createdProjects) {
      await deleteProject(baseURL, pid).catch(() => {});
    }
  });

  test('should update project name via PATCH', async () => {
    const project = await createProject(baseURL, 'rename');
    createdProjects.push(project.id);
    // eslint-disable-next-line no-console
    console.log(`Created project: ${project.name} (${project.id})`);

    const newName = `x2a-edit-renamed-${Date.now()}`;
    const { status, data } = await patchProject(baseURL, project.id, {
      name: newName,
    });
    // eslint-disable-next-line no-console
    console.log(`PATCH name response: ${status}`);
    expect(status).toBe(200);
    expect(data.name).toBe(newName);

    const fetched = await getProject(baseURL, project.id);
    expect(fetched.name).toBe(newName);
    // eslint-disable-next-line no-console
    console.log(`Verified project name updated to: ${fetched.name}`);
  });

  test('should update project description via PATCH', async () => {
    const project = await createProject(baseURL, 'desc');
    createdProjects.push(project.id);

    const newDesc = 'Updated description for FLPATH-4211 test';
    const { status, data } = await patchProject(baseURL, project.id, {
      description: newDesc,
    });
    // eslint-disable-next-line no-console
    console.log(`PATCH description response: ${status}`);
    expect(status).toBe(200);
    expect(data.description).toBe(newDesc);

    const fetched = await getProject(baseURL, project.id);
    expect(fetched.description).toBe(newDesc);
    // eslint-disable-next-line no-console
    console.log(`Verified description updated`);
  });

  test('should update project ownedBy via PATCH', async () => {
    const project = await createProject(baseURL, 'owner');
    createdProjects.push(project.id);

    const newOwner = 'user:default/test-user';
    const { status, data } = await patchProject(baseURL, project.id, {
      ownedBy: newOwner,
    });
    // eslint-disable-next-line no-console
    console.log(`PATCH ownedBy response: ${status}`);
    expect(status).toBe(200);
    expect(data.ownedBy).toBe(newOwner);

    const fetched = await getProject(baseURL, project.id);
    expect(fetched.ownedBy).toBe(newOwner);
    // eslint-disable-next-line no-console
    console.log(`Verified ownedBy updated to: ${fetched.ownedBy}`);
  });

  test('should update multiple fields at once via PATCH', async () => {
    const project = await createProject(baseURL, 'multi');
    createdProjects.push(project.id);

    const updates = {
      name: `x2a-edit-multi-${Date.now()}`,
      description: 'Multi-field update test',
      ownedBy: 'user:default/multi-test',
    };
    const { status, data } = await patchProject(baseURL, project.id, updates);
    // eslint-disable-next-line no-console
    console.log(`PATCH multi-field response: ${status}`);
    expect(status).toBe(200);
    expect(data.name).toBe(updates.name);
    expect(data.description).toBe(updates.description);
    expect(data.ownedBy).toBe(updates.ownedBy);

    const fetched = await getProject(baseURL, project.id);
    expect(fetched.name).toBe(updates.name);
    expect(fetched.description).toBe(updates.description);
    expect(fetched.ownedBy).toBe(updates.ownedBy);
    // eslint-disable-next-line no-console
    console.log('Verified all fields updated in single PATCH');
  });

  test('should return 400 for empty PATCH body', async () => {
    const project = await createProject(baseURL, 'empty');
    createdProjects.push(project.id);

    const headers = await apiHeaders(baseURL);
    const ctx = await request.newContext({
      baseURL,
      ignoreHTTPSErrors: true,
    });
    const resp = await ctx.patch(`/api/x2a/projects/${project.id}`, {
      headers,
      data: {},
    });
    // eslint-disable-next-line no-console
    console.log(`PATCH empty body response: ${resp.status()}`);
    expect(resp.status()).toBe(400);
    await ctx.dispose();
  });

  test('should return 404 for PATCH on non-existent project', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const { status } = await patchProject(baseURL, fakeId, {
      name: 'ghost',
    });
    // eslint-disable-next-line no-console
    console.log(`PATCH non-existent project response: ${status}`);
    expect(status).toBe(404);
  });

  test('should preserve unchanged fields after PATCH', async () => {
    const project = await createProject(baseURL, 'preserve');
    createdProjects.push(project.id);

    const original = await getProject(baseURL, project.id);
    const originalDesc = original.description;
    const originalOwner = original.ownedBy;

    const newName = `x2a-edit-preserve-${Date.now()}`;
    await patchProject(baseURL, project.id, { name: newName });

    const fetched = await getProject(baseURL, project.id);
    expect(fetched.name).toBe(newName);
    expect(fetched.description).toBe(originalDesc);
    expect(fetched.ownedBy).toBe(originalOwner);
    // eslint-disable-next-line no-console
    console.log('Verified unchanged fields preserved after partial PATCH');
  });

  test('should not change dirName when project name is updated', async () => {
    const project = await createProject(baseURL, 'dirname');
    createdProjects.push(project.id);

    const original = await getProject(baseURL, project.id);
    const originalDirName = original.dirName;
    // eslint-disable-next-line no-console
    console.log(`Original dirName: ${originalDirName}`);

    const newName = `x2a-edit-dirname-changed-${Date.now()}`;
    await patchProject(baseURL, project.id, { name: newName });

    const fetched = await getProject(baseURL, project.id);
    expect(fetched.name).toBe(newName);
    expect(fetched.dirName).toBe(originalDirName);
    // eslint-disable-next-line no-console
    console.log(
      `Verified dirName unchanged (${fetched.dirName}) after name update`,
    );
  });
});
