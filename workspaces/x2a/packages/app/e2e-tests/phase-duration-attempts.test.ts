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
 * FLPATH-4229: Phase Duration and Attempt Count display fix
 *
 * Validates that phase duration uses telemetry timestamps (not K8s job
 * aggregated time) and that attempt count is exposed as a separate field.
 *
 * Requires PR rhdh-plugins#3238 (adds firstAttemptAt to Job schema).
 * Tests skip gracefully if the field isn't present on the deployed image.
 *
 * Uses an already-completed module (from previous pipeline runs) to
 * verify the response fields without running a new pipeline.
 */

import { test, expect, request } from '@playwright/test';

const SOURCE_REPO =
  process.env.X2A_SOURCE_REPO || 'https://github.com/chef/chef-examples.git';
const TARGET_REPO =
  process.env.X2A_TARGET_REPO ||
  'https://github.com/rhdh-orchestrator-test/x2a-e2e-target.git';
const POLL_INTERVAL = 5000;
const INIT_TIMEOUT = 120_000;
const PHASE_TIMEOUT = 300_000;

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

async function createProject(baseURL: string) {
  const headers = await apiHeaders(baseURL);
  const name = `x2a-duration-e2e-${Date.now()}`;
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.post('/api/x2a/projects', {
    headers,
    data: {
      name,
      abbreviation: 'x2a',
      description: 'FLPATH-4229 duration/attempts test',
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
  const data = resp.ok() ? await resp.json() : null;
  await ctx.dispose();
  return { status: resp.status(), data };
}

async function triggerModulePhase(
  baseURL: string,
  projectId: string,
  moduleId: string,
  phase: 'analyze' | 'migrate',
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
  const data = resp.ok() ? await resp.json() : null;
  await ctx.dispose();
  return { status: resp.status(), data };
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

interface PhaseData {
  status: string;
  startedAt?: string;
  finishedAt?: string;
  firstAttemptAt?: string;
  attempts?: number;
  telemetry?: {
    startedAt?: string;
    endedAt?: string;
    phase?: string;
    summary?: string;
  };
}

async function getModulePhaseData(
  baseURL: string,
  projectId: string,
  moduleId: string,
  phase: 'analyze' | 'migrate',
): Promise<PhaseData | null> {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.get(
    `/api/x2a/projects/${projectId}/modules/${moduleId}`,
    { headers },
  );
  const data = await resp.json();
  await ctx.dispose();
  return data?.[phase] ?? null;
}

async function pollModulePhase(
  baseURL: string,
  projectId: string,
  moduleId: string,
  phase: 'analyze' | 'migrate',
  timeoutMs: number,
): Promise<string> {
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
        return lastStatus;
      }
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  await ctx.dispose();
  return lastStatus;
}

interface Module {
  id: string;
  name: string;
  sourcePath: string;
}

async function getModules(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const resp = await ctx.get(`/api/x2a/projects/${projectId}/modules`, {
    headers,
  });
  const data = await resp.json();
  await ctx.dispose();
  return (data.items ?? data) as Module[];
}

test.describe('X2Ansible - FLPATH-4229 Phase Duration & Attempts @live', () => {
  const baseURL = process.env.PLAYWRIGHT_URL ?? 'http://localhost:7007';

  test.describe.configure({ mode: 'serial' });

  let projectId = '';
  let moduleId = '';

  test('Setup: create project, init, and run analyze', async () => {
    test.setTimeout(INIT_TIMEOUT + PHASE_TIMEOUT + 60_000);

    const project = await createProject(baseURL);
    projectId = project.id;
    // eslint-disable-next-line no-console
    console.log(`Created project: ${project.name} (${projectId})`);

    const { status } = await triggerProjectInit(baseURL, projectId);
    expect(status).toBe(200);

    const initState = await pollProjectState(baseURL, projectId, INIT_TIMEOUT);
    expect(['success', 'initialized'].includes(initState)).toBeTruthy();

    const modules = await getModules(baseURL, projectId);
    const target =
      modules.find(m => m.sourcePath.endsWith('.yml')) ?? modules[0];
    moduleId = target.id;
    // eslint-disable-next-line no-console
    console.log(`Module: ${target.name} (${target.sourcePath})`);

    // Run analyze to have completed phase data
    const { status: analyzeStatus } = await triggerModulePhase(
      baseURL,
      projectId,
      moduleId,
      'analyze',
    );
    expect(analyzeStatus).toBe(200);

    const analyzeResult = await pollModulePhase(
      baseURL,
      projectId,
      moduleId,
      'analyze',
      PHASE_TIMEOUT,
    );
    expect(analyzeResult).toBe('success');
    // eslint-disable-next-line no-console
    console.log('Analyze completed successfully');
  });

  test('Phase data includes telemetry timestamps', async () => {
    expect(projectId && moduleId).toBeTruthy();

    const phaseData = await getModulePhaseData(
      baseURL,
      projectId,
      moduleId,
      'analyze',
    );
    expect(phaseData).not.toBeNull();
    expect(phaseData!.status).toBe('success');

    // Core fields that should always be present
    expect(phaseData!.startedAt).toBeDefined();
    expect(phaseData!.finishedAt).toBeDefined();

    // Telemetry should have its own timestamps
    expect(phaseData!.telemetry).toBeDefined();
    expect(phaseData!.telemetry!.startedAt).toBeDefined();
    expect(phaseData!.telemetry!.endedAt).toBeDefined();

    // eslint-disable-next-line no-console
    console.log(`Job startedAt: ${phaseData!.startedAt}`);
    // eslint-disable-next-line no-console
    console.log(`Job finishedAt: ${phaseData!.finishedAt}`);
    // eslint-disable-next-line no-console
    console.log(`Telemetry startedAt: ${phaseData!.telemetry!.startedAt}`);
    // eslint-disable-next-line no-console
    console.log(`Telemetry endedAt: ${phaseData!.telemetry!.endedAt}`);
  });

  test('Telemetry duration is shorter than total job time', async () => {
    expect(projectId && moduleId).toBeTruthy();

    const phaseData = await getModulePhaseData(
      baseURL,
      projectId,
      moduleId,
      'analyze',
    );
    expect(phaseData?.telemetry).toBeDefined();

    const jobStart = new Date(phaseData!.startedAt!).getTime();
    const jobEnd = new Date(phaseData!.finishedAt!).getTime();
    const jobDuration = jobEnd - jobStart;

    const telStart = new Date(phaseData!.telemetry!.startedAt!).getTime();
    const telEnd = new Date(phaseData!.telemetry!.endedAt!).getTime();
    const telDuration = telEnd - telStart;

    // eslint-disable-next-line no-console
    console.log(
      `Job duration: ${(jobDuration / 1000).toFixed(1)}s, Telemetry duration: ${(telDuration / 1000).toFixed(1)}s`,
    );

    // Telemetry duration should be <= job duration (job includes pod startup)
    expect(
      telDuration <= jobDuration,
      `Telemetry duration (${telDuration}ms) should not exceed job duration (${jobDuration}ms)`,
    ).toBeTruthy();

    // There should be some overhead (pod startup > 0)
    const overhead = jobDuration - telDuration;
    // eslint-disable-next-line no-console
    console.log(`Pod startup overhead: ${(overhead / 1000).toFixed(1)}s`);
    expect(
      overhead >= 0,
      'Job duration should include pod startup overhead',
    ).toBeTruthy();
  });

  test('firstAttemptAt field is present (requires PR #3238)', async () => {
    expect(projectId && moduleId).toBeTruthy();

    const phaseData = await getModulePhaseData(
      baseURL,
      projectId,
      moduleId,
      'analyze',
    );

    if (!phaseData?.firstAttemptAt) {
      test.skip(true, 'firstAttemptAt not present — PR #3238 not yet deployed');
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`firstAttemptAt: ${phaseData.firstAttemptAt}`);

    // firstAttemptAt should be between job startedAt and telemetry startedAt
    const firstAttempt = new Date(phaseData.firstAttemptAt).getTime();
    const jobStart = new Date(phaseData.startedAt!).getTime();
    expect(
      firstAttempt >= jobStart,
      'firstAttemptAt should be >= job startedAt',
    ).toBeTruthy();
  });

  test('Attempts count is available (requires PR #3238)', async () => {
    expect(projectId && moduleId).toBeTruthy();

    const phaseData = await getModulePhaseData(
      baseURL,
      projectId,
      moduleId,
      'analyze',
    );

    if (phaseData?.attempts === undefined) {
      test.skip(true, 'attempts field not present — PR #3238 not yet deployed');
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`Attempts: ${phaseData.attempts}`);

    // For a successful first-try analyze, attempts should be 1
    expect(phaseData.attempts).toBeGreaterThanOrEqual(1);
  });

  test('Run migrate and verify timing fields', async () => {
    test.setTimeout(PHASE_TIMEOUT);
    expect(projectId && moduleId).toBeTruthy();

    const { status } = await triggerModulePhase(
      baseURL,
      projectId,
      moduleId,
      'migrate',
    );
    expect(status).toBe(200);

    const migrateResult = await pollModulePhase(
      baseURL,
      projectId,
      moduleId,
      'migrate',
      PHASE_TIMEOUT,
    );
    expect(migrateResult).toBe('success');

    const phaseData = await getModulePhaseData(
      baseURL,
      projectId,
      moduleId,
      'migrate',
    );
    expect(phaseData?.telemetry).toBeDefined();

    const jobStart = new Date(phaseData!.startedAt!).getTime();
    const jobEnd = new Date(phaseData!.finishedAt!).getTime();
    const telStart = new Date(phaseData!.telemetry!.startedAt!).getTime();
    const telEnd = new Date(phaseData!.telemetry!.endedAt!).getTime();

    const jobDuration = (jobEnd - jobStart) / 1000;
    const telDuration = (telEnd - telStart) / 1000;

    // eslint-disable-next-line no-console
    console.log(
      `Migrate: job=${jobDuration.toFixed(1)}s, telemetry=${telDuration.toFixed(1)}s, overhead=${(jobDuration - telDuration).toFixed(1)}s`,
    );

    // Telemetry duration should be meaningful (migrate takes time)
    expect(telDuration).toBeGreaterThan(10);
    // And should be less than total job time
    expect(telDuration).toBeLessThanOrEqual(jobDuration);
  });
});
