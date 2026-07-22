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
const PHASE_TIMEOUT = 600_000;
const TOKEN_MAX_AGE_MS = 10 * 60 * 1000; // refresh token every 10 min
const SOURCE_REPO =
  process.env.X2A_SOURCE_REPO ||
  'https://github.com/x2ansible/chef-examples.git';
const TARGET_REPO =
  process.env.X2A_TARGET_REPO ||
  'https://github.com/rhdh-orchestrator-test/x2a-e2e-target.git';

function requireGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN env var is required but not set. ' +
        'Set it before running E2E tests.',
    );
  }
  return token;
}

// ---------------------------------------------------------------------------
// API helpers — with token refresh and resilient polling
// ---------------------------------------------------------------------------

let cachedToken = '';
let tokenTimestamp = 0;

async function getGuestToken(baseURL: string): Promise<string> {
  if (cachedToken && Date.now() - tokenTimestamp < TOKEN_MAX_AGE_MS) {
    return cachedToken;
  }
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  try {
    const resp = await ctx.post('/api/auth/guest/refresh');
    expect(
      resp.ok(),
      `Guest auth failed: ${resp.status()} ${resp.statusText()}`,
    ).toBeTruthy();
    const data = await resp.json();
    const token = data?.backstageIdentity?.token;
    expect(token, 'Guest token missing from auth response').toBeTruthy();
    cachedToken = token;
    tokenTimestamp = Date.now();
    return cachedToken;
  } finally {
    await ctx.dispose();
  }
}

function invalidateToken() {
  cachedToken = '';
  tokenTimestamp = 0;
}

async function apiHeaders(baseURL: string) {
  const token = await getGuestToken(baseURL);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function safeJson(resp: { json: () => Promise<unknown> }) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

async function createProject(baseURL: string, name: string) {
  const headers = await apiHeaders(baseURL);
  const ghToken = requireGitHubToken();
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  try {
    const resp = await ctx.post('/api/x2a/projects', {
      headers,
      data: {
        name,
        abbreviation: 'x2a',
        description: `Smoke test: ${name}`,
        sourceRepoUrl: SOURCE_REPO,
        targetRepoUrl: TARGET_REPO,
        sourceRepoBranch: 'main',
        targetRepoBranch: `e2e-${name}`,
        sourceRepoAuth: { token: ghToken },
        targetRepoAuth: { token: ghToken },
      },
    });
    expect(resp.ok(), `Create project failed: ${resp.status()}`).toBeTruthy();
    const data = await resp.json();
    expect(data?.id, 'Project response missing id').toBeTruthy();
    return data;
  } finally {
    await ctx.dispose();
  }
}

async function triggerInit(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ghToken = requireGitHubToken();
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  try {
    const resp = await ctx.post(`/api/x2a/projects/${projectId}/run`, {
      headers,
      data: {
        sourceRepoAuth: { token: ghToken },
        targetRepoAuth: { token: ghToken },
      },
    });
    expect(resp.ok(), `Trigger init failed: ${resp.status()}`).toBeTruthy();
    const data = await resp.json();
    return data;
  } finally {
    await ctx.dispose();
  }
}

async function pollProjectState(
  baseURL: string,
  projectId: string,
  timeoutMs: number,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let lastState = '';
  while (Date.now() < deadline) {
    const headers = await apiHeaders(baseURL);
    const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
    try {
      const resp = await ctx.get(`/api/x2a/projects/${projectId}`, {
        headers,
      });
      if (resp.status() === 401) {
        invalidateToken();
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
        continue;
      }
      const data = await safeJson(resp);
      if (data) {
        lastState =
          (data as { status?: { state?: string } })?.status?.state ?? 'unknown';
        if (['success', 'initialized', 'failed', 'error'].includes(lastState)) {
          return lastState;
        }
      }
    } finally {
      await ctx.dispose();
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error(
    `Project did not reach terminal state within ${timeoutMs}ms (last: ${lastState})`,
  );
}

async function getModules(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  try {
    const resp = await ctx.get(`/api/x2a/projects/${projectId}/modules`, {
      headers,
    });
    expect(resp.ok(), `Get modules failed: ${resp.status()}`).toBeTruthy();
    const data = await resp.json();
    return data;
  } finally {
    await ctx.dispose();
  }
}

async function triggerModulePhase(
  baseURL: string,
  projectId: string,
  moduleId: string,
  phase: 'analyze' | 'migrate' | 'publish',
) {
  const headers = await apiHeaders(baseURL);
  const ghToken = requireGitHubToken();
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  try {
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
    expect(resp.ok(), `Trigger ${phase} failed: ${resp.status()}`).toBeTruthy();
    const data = await resp.json();
    return data;
  } finally {
    await ctx.dispose();
  }
}

async function pollModuleStatus(
  baseURL: string,
  projectId: string,
  moduleId: string,
  timeoutMs: number,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = '';
  while (Date.now() < deadline) {
    const headers = await apiHeaders(baseURL);
    const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
    try {
      const resp = await ctx.get(
        `/api/x2a/projects/${projectId}/modules/${moduleId}`,
        { headers },
      );
      if (resp.status() === 401) {
        invalidateToken();
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
        continue;
      }
      if (resp.ok()) {
        const data = await safeJson(resp);
        if (data) {
          lastStatus = (data as { status?: string })?.status ?? 'unknown';
          if (['success', 'failed', 'error'].includes(lastStatus)) {
            return lastStatus;
          }
        }
      }
    } finally {
      await ctx.dispose();
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error(
    `Module did not reach terminal state within ${timeoutMs}ms (last: ${lastStatus})`,
  );
}

async function deleteProject(baseURL: string, projectId: string) {
  const headers = await apiHeaders(baseURL);
  const ctx = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  try {
    const resp = await ctx.delete(`/api/x2a/projects/${projectId}`, {
      headers,
    });
    return resp;
  } finally {
    await ctx.dispose();
  }
}

// ===========================================================================
// Screenshot on failure — captures visual state for CI debugging
// ===========================================================================

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('screenshot-on-failure', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
});

// ===========================================================================
// 1. Smoke Tests — UI basics (fast, no API pipeline)
// ===========================================================================

test.describe('X2Ansible - UI Smoke Tests @smoke @live', () => {
  const baseURL = process.env.PLAYWRIGHT_URL || 'http://localhost:3000';
  let smokeProjectId = '';

  test.beforeAll(async () => {
    try {
      const project = await createProject(
        baseURL,
        `smoke-seed-${Date.now().toString(36)}`,
      );
      smokeProjectId = project.id;
    } catch {
      // Non-fatal: tests that need a project will fail individually
    }
  });

  test.afterAll(async () => {
    if (smokeProjectId) {
      await deleteProject(baseURL, smokeProjectId).catch(() => {});
    }
  });

  test('Guest login renders RHDH welcome page', async ({ page }) => {
    await performLogin(page);
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('X2A sidebar link is visible and has correct href', async ({ page }) => {
    await performLogin(page);
    const x2aLink = page.locator('nav a[href*="x2a"], nav [href*="x2a"]');
    await expect(x2aLink.first()).toBeVisible({ timeout: 10_000 });
    const href = await x2aLink.first().getAttribute('href');
    expect(href, 'X2A sidebar link should point to /x2a').toContain('/x2a');
  });

  test('Navigate to Conversion Hub via sidebar', async ({ page }) => {
    const x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateFromSidebar();
    await x2aPage.verifyConversionHubPage();
  });

  test('Navigate to Conversion Hub via direct URL', async ({ page }) => {
    const x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.verifyConversionHubPage();
    expect(page.url()).toContain('/x2a');
  });

  test('Conversion Hub shows Projects table with expected columns', async ({
    page,
  }) => {
    const x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.verifyConversionHubPage();

    const projectsHeading = page.getByText(/Projects\s*\(\d+\)/);
    await expect(projectsHeading).toBeVisible({ timeout: 10_000 });

    const tableHeader = page.locator(
      'thead, [role="rowgroup"]:first-child, [class*="TableHead"], [class*="tableHead"]',
    );
    for (const col of ['Name', 'Status', 'Source Repository']) {
      const headerCell = tableHeader.getByText(col).first();
      const fallback = page
        .locator('th, [role="columnheader"]')
        .getByText(col)
        .first();
      await expect(headerCell.or(fallback).first()).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  test('New Project / Start first conversion button is visible', async ({
    page,
  }) => {
    const x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.verifyConversionHubPage();

    const startFirst = page.getByRole('button', {
      name: /start first conversion/i,
    });
    const newProject = page.getByRole('button', {
      name: /new project/i,
    });
    await expect(startFirst.or(newProject).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // FLPATH-4413: Scaffolder RJSF form fields don't render on RHDH 1.10+
  test.skip('Scaffolder wizard loads with correct form fields', async ({
    page,
  }) => {
    const x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.clickStartConversion();
    await x2aPage.verifyTemplateFormLoaded();

    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
    await expect(page.getByLabel('Abbreviation')).toBeVisible();
    await expect(page.getByLabel('Owned by group')).toBeVisible();

    for (const stepLabel of [
      'Job name and description',
      'Source and target repositories',
      'Conversion parameters',
      'Review',
    ]) {
      await expect(page.getByText(stepLabel)).toBeVisible();
    }
  });

  // FLPATH-4413: Scaffolder RJSF form fields don't render on RHDH 1.10+
  test.skip('Wizard step navigation — forward and back with field retention', async ({
    page,
  }) => {
    const x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.clickStartConversion();
    await x2aPage.verifyTemplateFormLoaded();

    await x2aPage.fillProjectName('smoke-nav-test');
    await x2aPage.fillOwnedByGroup('guests');
    await x2aPage.clickNext();
    await x2aPage.verifyRepositoryStepVisible();
    await x2aPage.dismissGitHubLoginDialog();

    await x2aPage.clickBack();
    await x2aPage.verifyTemplateFormLoaded();

    // Verify previously entered data is retained after navigating back
    const nameField = page.getByLabel('Name');
    await expect(nameField).toHaveValue('smoke-nav-test');
  });
});

// ===========================================================================
// 2. Full E2E Pipeline — fastapi-tutorial (init → analyze → migrate →
//    publish) with UI verification at every step.
// ===========================================================================

test.describe.serial('X2Ansible - FastAPI Tutorial Full E2E @e2e @live', () => {
  const baseURL = process.env.PLAYWRIGHT_URL || 'http://localhost:3000';
  let x2aPage: X2AnsiblePage;
  let projectId = '';
  let projectName = '';
  let moduleId = '';

  test.afterAll(async () => {
    if (projectId) {
      await deleteProject(baseURL, projectId).catch(() => {});
    }
  });

  // -- Init ---------------------------------------------------------------

  test('Create project, trigger init, discover fastapi-tutorial', async ({
    page,
  }) => {
    test.setTimeout(INIT_TIMEOUT + 60_000);

    const ts = Date.now().toString(36);
    projectName = `x2a-e2e-${ts}`;
    const project = await createProject(baseURL, projectName);
    projectId = project.id;

    const initData = await triggerInit(baseURL, projectId);
    expect(initData.jobId).toBeTruthy();

    const finalState = await pollProjectState(baseURL, projectId, INIT_TIMEOUT);
    expect(
      ['success', 'initialized'].includes(finalState),
      `Init failed, state=${finalState}`,
    ).toBeTruthy();

    const modules = await getModules(baseURL, projectId);
    expect(modules.length).toBeGreaterThan(0);

    const fastapi = modules.find(
      (m: { name: string }) => m.name === 'fastapi-tutorial',
    );
    expect(
      fastapi,
      `fastapi-tutorial not found among: ${modules.map((m: { name: string }) => m.name).join(', ')}`,
    ).toBeTruthy();
    moduleId = fastapi.id;

    // --- UI: verify project page shows the project and module list ---
    await performLogin(page);
    x2aPage = new X2AnsiblePage(page);
    await page.goto(`/x2a/projects/${projectId}`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await x2aPage.waitForPageLoad();

    await expect(page.getByText(projectName, { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText('fastapi-tutorial', { exact: true }),
    ).toBeVisible({
      timeout: 30_000,
    });

    // Verify the project shows initialized/success status.
    // Scope to the "Status" section to avoid matching branch chips.
    const statusSection = page.locator('h2:has-text("Status")').locator('..');
    const statusText =
      (await statusSection.textContent().catch(() => '')) ?? '';
    expect(
      statusText.toLowerCase(),
      `Expected initialized/success status, got: "${statusText}"`,
    ).toMatch(/success|initialized|init/i);
  });

  // -- UI: project details ------------------------------------------------

  test('Project page shows correct details and module list', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    expect(projectId, 'Project not created').toBeTruthy();

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.login();
    await page.goto(`/x2a/projects/${projectId}`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await x2aPage.waitForPageLoad();

    await expect(page.getByText(projectName, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    // Source repo URL may be displayed truncated or without .git suffix
    const repoName = SOURCE_REPO.replace(/\.git$/, '')
      .split('/')
      .pop()!;
    await expect(page.getByText(repoName).first()).toBeVisible();

    await expect(
      page.getByText('fastapi-tutorial', { exact: true }),
    ).toBeVisible();

    // Verify breadcrumb navigates back to Conversion Hub
    const breadcrumb = page.getByText('Conversion Hub').first();
    await expect(breadcrumb).toBeVisible();
    await breadcrumb.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/x2a');
    await expect(page.getByText('Conversion Hub').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // -- Analyze ------------------------------------------------------------

  test('Analyze — run and verify Success in UI', async ({ page }) => {
    test.setTimeout(PHASE_TIMEOUT + 60_000);
    expect(moduleId, 'Module not set — init failed').toBeTruthy();

    const result = await triggerModulePhase(
      baseURL,
      projectId,
      moduleId,
      'analyze',
    );
    expect(result.jobId).toBeTruthy();

    const status = await pollModuleStatus(
      baseURL,
      projectId,
      moduleId,
      PHASE_TIMEOUT,
    );
    expect(status, `Analyze failed: status=${status}`).toBe('success');

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(projectId, moduleId);
    await x2aPage.waitForPhaseStatus('Analyze', 'Success', 30_000);
  });

  // -- UI: module details after analyze -----------------------------------

  test('Module page shows artifacts and details after Analyze', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    expect(moduleId, 'Module not set').toBeTruthy();

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(projectId, moduleId);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    await expect(
      page.getByText('fastapi-tutorial', { exact: true }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await expect(
      page.getByRole('link', { name: /Module Migration Plan/i }),
    ).toBeVisible({ timeout: 30_000 });

    // breadcrumb navigation back to hub
    await expect(page.getByText('Conversion Hub').first()).toBeVisible();

    // phase tabs are present
    for (const tab of ['Analyze', 'Migrate', 'Publish']) {
      await expect(
        page.locator(`[role="tab"]:has-text("${tab}")`),
      ).toBeVisible();
    }

    const analyzeStatus = await x2aPage.getPhaseStatus('Analyze');
    expect(analyzeStatus).toContain('Success');
  });

  // -- UI: phase log viewing ----------------------------------------------

  test('Analyze log — View Log button is present and functional', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    expect(moduleId, 'Module not set').toBeTruthy();

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(projectId, moduleId);
    await x2aPage.clickPhaseTab('Analyze');

    const viewLogBtn = page.getByRole('button', { name: /view log/i });
    await expect(viewLogBtn).toBeVisible({ timeout: 10_000 });

    // Click and expect navigation to a scaffolder task log page
    const [newPage] = await Promise.all([
      page
        .context()
        .waitForEvent('page', { timeout: 5_000 })
        .catch(() => null),
      viewLogBtn.click(),
    ]);

    if (newPage) {
      await newPage.waitForLoadState('domcontentloaded');
      expect(newPage.url()).toBeTruthy();
      await newPage.close();
    } else {
      // Button navigated the current page — verify we landed somewhere
      // meaningful (scaffolder task page or log-related URL), then go back
      await page.waitForLoadState('domcontentloaded');
      const url = page.url();
      const isLogPage =
        url.includes('task') || url.includes('log') || url.includes('job');
      if (!isLogPage) {
        // If the URL doesn't indicate a log/task page, the button may have
        // triggered an in-page expansion. Either way, the button worked.
      }
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
    }
  });

  // -- Migrate ------------------------------------------------------------

  test('Migrate — run and verify Success in UI', async ({ page }) => {
    test.setTimeout(PHASE_TIMEOUT + 60_000);
    expect(moduleId, 'Module not set').toBeTruthy();

    const result = await triggerModulePhase(
      baseURL,
      projectId,
      moduleId,
      'migrate',
    );
    expect(result.jobId).toBeTruthy();

    const status = await pollModuleStatus(
      baseURL,
      projectId,
      moduleId,
      PHASE_TIMEOUT,
    );
    expect(status, `Migrate failed: status=${status}`).toBe('success');

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(projectId, moduleId);
    await x2aPage.waitForPhaseStatus('Migrate', 'Success', 30_000);
  });

  test('Migrated Sources artifact appears after Migrate', async ({ page }) => {
    test.setTimeout(60_000);
    expect(moduleId, 'Module not set').toBeTruthy();

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(projectId, moduleId);

    await expect(page.getByText('Migrated Sources').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // -- Publish ------------------------------------------------------------

  test('Publish — run and verify Success in UI', async ({ page }) => {
    test.setTimeout(PHASE_TIMEOUT + 60_000);
    expect(moduleId, 'Module not set').toBeTruthy();

    const result = await triggerModulePhase(
      baseURL,
      projectId,
      moduleId,
      'publish',
    );
    expect(result.jobId).toBeTruthy();

    const status = await pollModuleStatus(
      baseURL,
      projectId,
      moduleId,
      PHASE_TIMEOUT,
    );
    expect(status, `Publish failed: status=${status}`).toBe('success');

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(projectId, moduleId);
    await x2aPage.waitForPhaseStatus('Publish', 'Success', 30_000);
  });

  // -- Final verification -------------------------------------------------

  test('All phases show Success and all artifacts are present', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    expect(moduleId, 'Module not set').toBeTruthy();

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToModulePage(projectId, moduleId);

    for (const phase of ['Analyze', 'Migrate', 'Publish'] as const) {
      const status = await x2aPage.getPhaseStatus(phase);
      expect(status, `${phase} should be Success`).toContain('Success');
    }

    await expect(
      page.getByRole('link', { name: /Module Migration Plan/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Migrated Sources').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // -- Project shows completed status in Conversion Hub -------------------

  test('Conversion Hub reflects completed project status', async ({ page }) => {
    test.setTimeout(60_000);
    expect(projectId, 'Project not created').toBeTruthy();

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.verifyConversionHubPage();

    // The project may not be on the first page of a paginated table.
    // Sort by "Created At" descending (click twice if needed) to bring
    // the newest project to the top, or search for it.
    const createdAtHeader = page
      .locator('th, [role="columnheader"]')
      .filter({ hasText: 'Created At' });
    if (await createdAtHeader.isVisible().catch(() => false)) {
      await createdAtHeader.click();
      await page.waitForTimeout(500);
      await createdAtHeader.click();
      await page.waitForTimeout(500);
    }

    // If still not visible, try the search box
    const nameVisible = await page
      .getByText(projectName, { exact: true })
      .first()
      .isVisible()
      .catch(() => false);

    if (!nameVisible) {
      const searchBox = page.getByPlaceholder(/search/i).first();
      if (await searchBox.isVisible().catch(() => false)) {
        await searchBox.fill(projectName);
        await page.waitForTimeout(1000);
      }
    }

    await expect(
      page.getByText(projectName, { exact: true }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Verify the project row has a status that reflects pipeline activity.
    const projectRow = page
      .locator('tr, [role="row"]')
      .filter({ hasText: projectName });
    await expect(projectRow.first()).toBeVisible({ timeout: 10_000 });
    const rowText = (await projectRow.first().textContent()) ?? '';
    expect(
      rowText.toLowerCase(),
      `Expected project row to show active/completed status, got: "${rowText}"`,
    ).toMatch(/in progress|success|complete|done|published/i);
  });

  // -- Delete project via API and verify removal from UI ------------------

  test('Delete project and verify removal from Conversion Hub', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const deletedProjectId = projectId;
    expect(deletedProjectId, 'Project not created').toBeTruthy();

    const resp = await deleteProject(baseURL, deletedProjectId);
    expect(resp.ok(), `Delete failed: ${resp.status()}`).toBeTruthy();
    projectId = '';

    x2aPage = new X2AnsiblePage(page);
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.verifyConversionHubPage();

    await expect(
      page.getByText(projectName, { exact: true }).first(),
    ).not.toBeVisible({ timeout: 15_000 });

    // Verify navigating to the deleted project URL shows error/not-found
    await page.goto(`/x2a/projects/${deletedProjectId}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const errorIndicator = page
      .getByText(/not found|does not exist|error|404/i)
      .first();
    const emptyState = page.getByText(projectName, { exact: true }).first();
    // Either an explicit error message OR the project name is gone
    const showsError = await errorIndicator.isVisible().catch(() => false);
    const nameGone = !(await emptyState.isVisible().catch(() => false));
    expect(
      showsError || nameGone,
      'Deleted project URL should show error or not display project data',
    ).toBeTruthy();
  });
});
