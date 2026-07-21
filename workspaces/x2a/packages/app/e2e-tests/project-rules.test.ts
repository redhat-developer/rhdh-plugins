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
 * FLPATH-4210: Project Rules & Priorities feature
 *
 * Tests the /rules/ API endpoints added in rhdh-plugins#3144.
 * Verifies CRUD operations, input validation, and rule-project association.
 */

import { test, expect, request } from '@playwright/test';

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

interface Rule {
  id: string;
  title: string;
  description: string;
  required: boolean;
  createdAt: string;
  updatedAt: string;
}

async function createRule(
  baseURL: string,
  body: { title: string; description: string; required?: boolean },
): Promise<{ status: number; data: Rule | null }> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.post('/api/x2a/rules', { headers, data: body });
  const status = resp.status();
  const data = status === 201 ? ((await resp.json()) as Rule) : null;
  await ctx.dispose();
  return { status, data };
}

async function listRules(
  baseURL: string,
): Promise<{ status: number; items: Rule[] }> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.get('/api/x2a/rules', { headers });
  const data = await resp.json();
  await ctx.dispose();
  return { status: resp.status(), items: data.items ?? [] };
}

async function getRule(
  baseURL: string,
  ruleId: string,
): Promise<{ status: number; data: Rule | null }> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.get(`/api/x2a/rules/${ruleId}`, { headers });
  const data = resp.ok() ? ((await resp.json()) as Rule) : null;
  await ctx.dispose();
  return { status: resp.status(), data };
}

async function updateRule(
  baseURL: string,
  ruleId: string,
  body: { title: string; description: string; required: boolean },
): Promise<{ status: number; data: Rule | null }> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.put(`/api/x2a/rules/${ruleId}`, {
    headers,
    data: body,
  });
  const data = resp.ok() ? ((await resp.json()) as Rule) : null;
  await ctx.dispose();
  return { status: resp.status(), data };
}

async function deleteRule(
  baseURL: string,
  ruleId: string,
): Promise<{ status: number }> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.delete(`/api/x2a/rules/${ruleId}`, { headers });
  await ctx.dispose();
  return { status: resp.status() };
}

// FLPATH-4210: Rules API not available on all RHDH versions.
// Skip until rules endpoint is confirmed stable across version matrix.
test.describe.skip('X2Ansible - FLPATH-4210 Project Rules @live', () => {
  const baseURL = process.env.PLAYWRIGHT_URL ?? 'http://localhost:7007';
  const createdRuleIds: string[] = [];

  test.afterAll(async () => {
    for (const id of createdRuleIds) {
      await deleteRule(baseURL, id).catch(() => {});
    }
  });

  test('should create a rule with title and description', async () => {
    const { status, data } = await createRule(baseURL, {
      title: `E2E Rule ${Date.now()}`,
      description: 'Always generate YAML output format',
    });

    expect(status).toBe(201);
    expect(data).not.toBeNull();
    expect(data!.id).toBeDefined();
    expect(data!.title).toContain('E2E Rule');
    expect(data!.description).toBe('Always generate YAML output format');
    expect(data!.required).toBe(false);
    expect(data!.createdAt).toBeDefined();
    expect(data!.updatedAt).toBeDefined();

    createdRuleIds.push(data!.id);
    // eslint-disable-next-line no-console
    console.log(`Created rule: ${data!.id}`);
  });

  test('should create a required rule', async () => {
    const { status, data } = await createRule(baseURL, {
      title: `E2E Required Rule ${Date.now()}`,
      description: 'Must include molecule tests for all roles',
      required: true,
    });

    expect(status).toBe(201);
    expect(data).not.toBeNull();
    expect(data!.required).toBe(true);

    createdRuleIds.push(data!.id);
    // eslint-disable-next-line no-console
    console.log(`Created required rule: ${data!.id}`);
  });

  test('should list rules including created ones', async () => {
    const { status, items } = await listRules(baseURL);

    expect(status).toBe(200);
    expect(items.length).toBeGreaterThanOrEqual(createdRuleIds.length);

    for (const id of createdRuleIds) {
      const found = items.find(r => r.id === id);
      expect(found, `Rule ${id} should appear in list`).toBeDefined();
    }
  });

  test('should get a single rule by ID', async () => {
    const ruleId = createdRuleIds[0];
    expect(ruleId, 'Need a created rule').toBeDefined();

    const { status, data } = await getRule(baseURL, ruleId);

    expect(status).toBe(200);
    expect(data).not.toBeNull();
    expect(data!.id).toBe(ruleId);
    expect(data!.title).toContain('E2E Rule');
  });

  test('should update rule via PUT', async () => {
    const ruleId = createdRuleIds[0];
    expect(ruleId, 'Need a created rule').toBeDefined();

    const newTitle = `Updated Rule ${Date.now()}`;
    const { status, data } = await updateRule(baseURL, ruleId, {
      title: newTitle,
      description: 'Updated via PUT',
      required: true,
    });

    expect(status).toBe(200);
    expect(data).not.toBeNull();
    expect(data!.title).toBe(newTitle);
    expect(data!.description).toBe('Updated via PUT');
    expect(data!.required).toBe(true);
    // eslint-disable-next-line no-console
    console.log(`PUT updated rule: ${ruleId}`);
  });

  test('should toggle required flag via PUT', async () => {
    const ruleId = createdRuleIds[0];
    expect(ruleId, 'Need a created rule').toBeDefined();

    const { data: current } = await getRule(baseURL, ruleId);
    expect(current).not.toBeNull();

    const { status } = await updateRule(baseURL, ruleId, {
      title: current!.title,
      description: current!.description,
      required: !current!.required,
    });
    expect(status).toBe(200);

    const { data: updated } = await getRule(baseURL, ruleId);
    expect(updated!.required).toBe(!current!.required);
  });

  test('should return 400 for PUT without required field', async () => {
    const ruleId = createdRuleIds[0];
    expect(ruleId, 'Need a created rule').toBeDefined();

    const headers = await apiHeaders(baseURL);
    const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
    const resp = await ctx.put(`/api/x2a/rules/${ruleId}`, {
      headers,
      data: { title: 'Missing required field', description: 'test' },
    });
    expect(resp.status()).toBe(400);
    await ctx.dispose();
  });

  test('should return 400 for POST without description', async () => {
    const headers = await apiHeaders(baseURL);
    const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
    const resp = await ctx.post('/api/x2a/rules', {
      headers,
      data: { title: 'Missing description rule' },
    });

    expect(resp.status()).toBe(400);
    await ctx.dispose();
  });

  test('should return 400 for POST without title', async () => {
    const headers = await apiHeaders(baseURL);
    const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
    const resp = await ctx.post('/api/x2a/rules', {
      headers,
      data: { description: 'Missing title rule' },
    });

    expect(resp.status()).toBe(400);
    await ctx.dispose();
  });

  test('should return 404 for GET non-existent rule', async () => {
    const { status } = await getRule(
      baseURL,
      '00000000-0000-0000-0000-000000000000',
    );
    expect(status).toBe(404);
  });

  test('should return 404 for DELETE non-existent rule', async () => {
    const { status } = await deleteRule(
      baseURL,
      '00000000-0000-0000-0000-000000000000',
    );
    expect(status).toBe(404);
  });

  test('should delete a rule and confirm removal', async () => {
    const { data: rule } = await createRule(baseURL, {
      title: `E2E Delete Test ${Date.now()}`,
      description: 'This rule will be deleted',
    });
    expect(rule).not.toBeNull();

    const { status: deleteStatus } = await deleteRule(baseURL, rule!.id);
    expect(deleteStatus).toBe(200);

    const { status: getStatus } = await getRule(baseURL, rule!.id);
    expect(getStatus).toBe(404);

    // eslint-disable-next-line no-console
    console.log(`Deleted rule ${rule!.id} confirmed gone`);
  });

  test('should preserve createdAt and update updatedAt on PUT', async () => {
    const ruleId = createdRuleIds[0];
    expect(ruleId, 'Need a created rule').toBeDefined();

    const { data: before } = await getRule(baseURL, ruleId);
    expect(before).not.toBeNull();

    await new Promise(r => setTimeout(r, 1100));

    await updateRule(baseURL, ruleId, {
      title: `Timestamp check ${Date.now()}`,
      description: before!.description,
      required: before!.required,
    });
    const { data: after } = await getRule(baseURL, ruleId);
    expect(after).not.toBeNull();

    expect(after!.createdAt).toBe(before!.createdAt);
    expect(new Date(after!.updatedAt).getTime()).toBeGreaterThan(
      new Date(before!.updatedAt).getTime(),
    );
  });
});
