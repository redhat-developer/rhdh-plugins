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

import { test, expect, Page, type BrowserContext } from '@playwright/test';
import {
  Orchestrator,
  type NewComponentInputs,
  type JavaMetadata,
} from './pages/orchestrator';
import { runAccessibilityTests } from './utils/accessibility';
import { OrchestratorHelper } from './utils/helper';
import { OrchestratorMessages, getTranslations } from './utils/translations';

const LOCALE_DISPLAY_NAMES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countHeadingPattern(template: string): RegExp {
  const regexBody = template.split('{{count}}').map(escapeRegExp).join('\\d+');
  return new RegExp(`^${regexBody}$`);
}

function parseCountFromHeading(text: string, template: string): number {
  const [prefix, suffix = ''] = template.split('{{count}}');
  const match = text
    .trim()
    .match(
      new RegExp(`^${escapeRegExp(prefix)}(\\d+)${escapeRegExp(suffix)}$`),
    );
  return parseInt(match?.[1] ?? '0', 10);
}

/**
 * Get the display name for a locale code
 */
function getLocaleDisplayName(locale: string): string {
  const baseLocale = locale.split('-')[0];
  return LOCALE_DISPLAY_NAMES[baseLocale] || locale;
}

test.describe('Orchestrator workflow runs', () => {
  let orchestrator: Orchestrator;
  let orchestratorHelper: OrchestratorHelper;
  let translations: OrchestratorMessages;
  let sharedPage!: Page;
  let sharedContext!: BrowserContext;

  async function switchToLocale(page: Page, locale: string): Promise<void> {
    const baseLocale = locale.split('-')[0];
    if (baseLocale === 'en') return;

    const displayName = getLocaleDisplayName(locale);
    const localeDisplayPattern = new RegExp(
      `^(${Object.values(LOCALE_DISPLAY_NAMES).map(escapeRegExp).join('|')})$`,
    );

    await page.goto('/settings');
    await page.waitForURL('**/settings**', { timeout: 60_000 });
    const languageButton = page
      .getByRole('button', { name: localeDisplayPattern })
      .first();
    await expect(languageButton).toBeVisible({ timeout: 60_000 });

    if ((await languageButton.textContent())?.trim() === displayName) {
      await page.goto('/');
      return;
    }

    await languageButton.click();
    await page.getByRole('option', { name: displayName }).click();
    await expect(languageButton).toHaveText(displayName, { timeout: 15_000 });
    await page.goto('/');
  }

  test.beforeAll(async ({ browser }, testInfo) => {
    const projectLocale =
      typeof testInfo.project.use.locale === 'string'
        ? testInfo.project.use.locale.split('-')[0]
        : 'en';

    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    translations = getTranslations(projectLocale);
    orchestratorHelper = new OrchestratorHelper(sharedPage, translations);
    await orchestratorHelper.loginAsGuest(sharedPage);
    await switchToLocale(sharedPage, projectLocale);
    orchestrator = new Orchestrator(sharedPage, translations, projectLocale);
  });

  test.beforeEach(async () => {
    await orchestrator.navigateToOrchestrator();
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  // mock empty overview so SWR never caches real workflows for this case
  test('Empty state when no workflows are configured', async () => {
    const overviewRoute = '**/api/orchestrator/v2/workflows/overview**';
    await sharedPage.route(overviewRoute, async route => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ overviews: [], paginationInfo: {} }),
      });
    });

    try {
      // Full reload clears persisted SWR cache from parent beforeEach's real fetch
      await sharedPage.reload({ waitUntil: 'domcontentloaded' });
      await orchestrator.expectOrchestratorUnderAdministration();
      await sharedPage
        .getByRole('heading', { name: translations.page.title })
        .first()
        .waitFor({ state: 'visible', timeout: 30_000 });
      await orchestrator.navigateToWorkflowRunTab(
        translations.page.tabs.workflows,
      );
      await expect(
        sharedPage.getByText(translations.emptyState.workflows.title),
      ).toBeVisible({ timeout: 60_000 });
      await expect(
        sharedPage.getByText(translations.emptyState.workflows.description),
      ).toBeVisible();
      await expect(
        sharedPage.getByRole('link', {
          name: translations.emptyState.workflows.viewDocumentation,
        }),
      ).toBeVisible();
    } finally {
      await sharedPage.unroute(overviewRoute);
    }
  });

  test.describe('Orchestrator > Workflow runs page', () => {
    test.beforeEach(async () => {
      const workflowsOverviewResponse = sharedPage.waitForResponse(
        response =>
          response.url().includes('/api/orchestrator/v2/workflows/overview') &&
          response.request().method() === 'POST' &&
          response.ok(),
        { timeout: 60_000 },
      );
      await orchestrator.navigateToWorkflowRunTab(
        translations.page.tabs.workflows,
      );
      await workflowsOverviewResponse;
      await expect(
        sharedPage.locator('table tbody tr:not(:has(td[colspan]))').first(),
      ).toBeVisible({ timeout: 60_000 });
    });

    test('Verify workflow runs table', async ({}, testInfo) => {
      await runAccessibilityTests(sharedPage, testInfo);
      await orchestratorHelper.verifyTableHeadingAndRows([
        translations.table.headers.name,
        translations.table.headers.workflowStatus,
        translations.table.headers.version,
        translations.table.headers.runsLastMonth,
        translations.table.headers.successRatio,
        'Actions',
      ]);

      // Verify Input-schema action is removed from Workflows table
      await expect(
        sharedPage.getByRole('columnheader', {
          name: translations.table.actions.viewInputSchema,
        }),
      ).not.toBeVisible();

      // Workflows (x) count on the Workflows tab
      const workflowsCountTab = sharedPage.getByRole('tab', {
        name: countHeadingPattern(translations.table.title.workflows),
      });
      await expect(workflowsCountTab).toBeVisible();
      const workflowCount = parseCountFromHeading(
        (await workflowsCountTab.textContent()) ?? '',
        translations.table.title.workflows,
      );
      expect(workflowCount).toBeGreaterThan(0);

      const workflowName = 'Hello World workflow';
      await orchestrator.searchWorkflow(workflowName);
      await expect(
        sharedPage
          .getByRole('row', { name: workflowName })
          .getByRole('button', {
            name: translations.table.actions.run,
            exact: true,
          })
          .first(),
      ).toBeVisible();
      await expect(
        sharedPage.getByRole('row', { name: workflowName }),
      ).toContainText(translations.workflow.status.available);
      await expect(
        sharedPage.getByRole('row', { name: workflowName }),
      ).toContainText('1.0');

      // Empty runs state for a workflow with no prior runs
      const zeroRunWorkflow = 'Assessment Workflow';
      await orchestrator.searchWorkflow(zeroRunWorkflow);
      await orchestrator.openWorkflowFromTable(zeroRunWorkflow);
      await orchestrator.navigateToWorkflowRunTab(
        translations.page.tabs.workflowRuns,
      );
      await expect(
        sharedPage.getByText(translations.emptyState.runs.title),
      ).toBeVisible();
    });

    test('Run details status remains Running after navigate away and back', async () => {
      const workflowName = 'Wait or Error';

      await orchestrator.searchWorkflow(workflowName);
      await orchestrator.openWorkflowFromTable(workflowName);
      await orchestrator.clickRunWorkflowFromDetails();

      // Data Input Schema: State = Wait
      const stateField = sharedPage.getByLabel('State', { exact: true });
      await expect(stateField).toBeVisible({ timeout: 30_000 });
      await stateField.click();
      await sharedPage
        .getByRole('option', { name: 'Wait', exact: true })
        .click();
      await orchestrator.submitWorkflowRunForm();

      await expect(sharedPage).toHaveURL(/\/orchestrator\/instances\/.+/, {
        timeout: 60_000,
      });
      await expect(
        sharedPage.getByText(translations.table.status.running, {
          exact: true,
        }),
      ).toBeVisible({ timeout: 30_000 });

      // Navigate away via direct runs URL → latest Running run
      await sharedPage.goto('/orchestrator/workflows/wait-or-error/runs');
      await sharedPage
        .getByTestId('loading-indicator')
        .waitFor({ state: 'hidden', timeout: 60_000 });

      const runningRow = sharedPage
        .getByRole('row')
        .filter({ hasText: translations.table.status.running })
        .first();
      await expect(runningRow).toBeVisible({ timeout: 30_000 });
      await runningRow.getByRole('link').first().click();

      await expect(sharedPage).toHaveURL(/\/orchestrator\/instances\/.+/);
      await expect(
        sharedPage.getByText(translations.table.status.running, {
          exact: true,
        }),
      ).toBeVisible();
    });

    test('Run Test Object Type Support in ui:props workflow', async () => {
      const workflowName = 'Test Object Type Support in ui:props';
      const workflowInputs = {
        name: 'test-name',
        email: 'test@test.com',
        simpleText: 'sample testing',
        objectExample: '{"kind":"demo","id":42,"tags":["a","b"]}',
      };

      await orchestrator.runUiPropsWorkflow(workflowName, workflowInputs);

      await expect(sharedPage).toHaveURL(/\/orchestrator\/instances\/.+/);
      await orchestratorHelper.verifyBreadcrumbLink(workflowName);
      await orchestrator.verifyUiPropsWorkflowInstanceDetails(workflowName);
      await expect(
        sharedPage.getByRole('button', {
          name: translations.run.logs.viewLogs,
        }),
      ).toBeVisible();
      await orchestrator.verifyUiPropsWorkflowRunVariables(workflowInputs);
    });

    test('Greeting workflow execution and workflow tab validation', async () => {
      const workflowName = 'Greeting workflow';

      await orchestrator.runGreetingWorkflow(workflowName);
      await orchestrator.navigateToOrchestrator();
      await orchestrator.navigateToWorkflowRunTab(
        translations.page.tabs.workflows,
      );
      await orchestrator.searchWorkflow(workflowName);
      await orchestrator.validateGreetingWorkflowTableRow(workflowName);
      await sharedPage
        .getByRole('row', { name: workflowName })
        .getByRole('link', { name: workflowName })
        .first()
        .click();
      await orchestrator.validateWorkflowDetails(workflowName);
    });

    test('Greeting workflow re-run and run details validation', async () => {
      const workflowName = 'Greeting workflow';

      await orchestrator.runGreetingWorkflow(workflowName);
      await orchestrator.reRunGreetingWorkflow();
      await orchestrator.verifyWorkflowRunDetails();
    });

    test('Sample Retry Test', async () => {
      const workflowName = 'Sample Retry Test';

      await orchestrator.runSampleRetryTest(workflowName);
      await orchestrator.verifySampleRetryTest();
    });

    test('Add workflow run by entity', async ({}, testInfo) => {
      await orchestrator.navigateToCatalog();
      await expect(
        sharedPage
          .getByRole('row', { name: 'my-component' })
          .getByRole('link', {
            name: 'user:guest',
          })
          .first(),
      ).toBeVisible();
      await sharedPage.getByRole('link', { name: 'my-component' }).click();
      await expect(sharedPage.getByText('my-component')).toBeVisible();
      if (process.env.APP_MODE === 'legacy') {
        await sharedPage
          .getByRole('tab', { name: 'Workflows' })
          .first()
          .click();
      } else {
        // Copied values from https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/app-defaults/plugins/app-react/src/translations
        // until app-defaults (or Backstage) support that plugins add their own translations
        // for catalog entity tab titles.
        const baseLocale =
          typeof testInfo.project.use.locale === 'string'
            ? testInfo.project.use.locale.split('-')[0]
            : 'en';
        const workflowTranslationsFromAppReact = {
          de: 'Workflows',
          en: 'Workflows',
          es: 'Workflows',
          fr: 'Workflows',
          it: 'Workflow',
          ja: 'ワークフロー',
        } as Record<string, string>;
        const workflowsTabTitle =
          workflowTranslationsFromAppReact[baseLocale] || 'Workflows';
        await sharedPage
          .getByRole('link', { name: workflowsTabTitle })
          .first()
          .click();
      }
      await expect(
        sharedPage
          .getByRole('row', { name: 'Hello World Workflow' })
          .locator('button'),
      ).toBeVisible();
      await sharedPage
        .getByRole('row', { name: 'Hello World Workflow' })
        .locator('button')
        .first()
        .click();
      await orchestratorHelper.clickButton(translations.workflow.buttons.run);
      await orchestratorHelper.verifyBreadcrumbLink('Hello World Workflow');
    });

    // Aborted vs Completed on progress graph
    test('Progress graph distinguishes aborted vs completed steps', async () => {
      const workflowName = 'Wait or Error';

      await orchestrator.searchWorkflow(workflowName);
      await orchestrator.openWorkflowFromTable(workflowName);
      await orchestrator.clickRunWorkflowFromDetails();

      const stateField = sharedPage.getByLabel('State', { exact: true });
      await expect(stateField).toBeVisible({ timeout: 30_000 });
      await stateField.click();
      await sharedPage
        .getByRole('option', { name: 'Wait', exact: true })
        .click();
      await orchestrator.submitWorkflowRunForm();

      await expect(sharedPage).toHaveURL(/\/orchestrator\/instances\/.+/, {
        timeout: 60_000,
      });
      await expect(
        sharedPage.getByText(translations.table.status.running, {
          exact: true,
        }),
      ).toBeVisible({ timeout: 30_000 });

      await sharedPage
        .getByRole('button', { name: translations.run.abort.button })
        .click();
      const abortDialog = sharedPage.getByRole('dialog');
      await expect(
        abortDialog.getByText(translations.run.abort.title),
      ).toBeVisible();
      // de/es: abort.button === common.cancel, so pick the first (confirm) action
      await abortDialog
        .getByRole('button', { name: translations.run.abort.button })
        .first()
        .click();

      await expect(
        sharedPage
          .getByText(translations.table.status.aborted, { exact: true })
          .first(),
      ).toBeVisible({ timeout: 60_000 });

      const graph = sharedPage.locator('.react-flow').first();
      await expect(graph).toBeVisible();

      const completedNode = graph.locator('.react-flow__node', {
        hasText: 'ChooseOnState',
      });
      await expect(
        completedNode.getByText(translations.table.status.completed, {
          exact: true,
        }),
      ).toBeVisible();

      const abortedNode = graph.locator('.react-flow__node', {
        hasText: 'WaitFlow',
      });
      await expect(
        abortedNode.getByText(translations.table.status.aborted, {
          exact: true,
        }),
      ).toBeVisible();
    });

    test('Unavailable workflow shows tooltip and disables Run', async () => {
      // Simulate ping failure (PR #3632 / ansible-job-template) via overview mocks.
      // Real YAML delete + SonataFlow restart forces a Maven rebuild and exceeds
      // health timeouts; mocks keep the suite stable without a dedicated fixture.
      const workflowId = 'ansible-job-template';
      const workflowName = 'Ansible Job Template';
      const unavailableAvailability = {
        isAvailable: false,
        statusCode: 503,
        urlToFetch: `http://localhost:8899/management/processes/${workflowId}`,
        reason: 'Service Unavailable',
      };

      const markUnavailable = <T extends Record<string, unknown>>(
        overview: T,
      ) => ({
        ...overview,
        workflowId,
        name: workflowName,
        isAvailable: false,
        availability: unavailableAvailability,
      });

      const overviewListRoute = '**/api/orchestrator/v2/workflows/overview';
      const overviewByIdRoute = `**/api/orchestrator/v2/workflows/${workflowId}/overview**`;

      await sharedPage.route(overviewListRoute, async route => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const response = await route.fetch();
        const body = (await response.json()) as {
          overviews?: Record<string, unknown>[];
          paginationInfo?: unknown;
        };
        const overviews = (body.overviews ?? []).map(overview =>
          overview.workflowId === workflowId
            ? markUnavailable(overview)
            : overview,
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...body, overviews }),
        });
      });

      await sharedPage.route(overviewByIdRoute, async route => {
        if (route.request().method() !== 'GET') {
          await route.continue();
          return;
        }
        const response = await route.fetch();
        const existing = (await response.json()) as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(markUnavailable(existing)),
        });
      });

      try {
        await sharedPage.reload({ waitUntil: 'domcontentloaded' });
        await sharedPage
          .getByRole('heading', { name: translations.page.title })
          .first()
          .waitFor({ state: 'visible', timeout: 30_000 });
        await orchestrator.navigateToWorkflowRunTab(
          translations.page.tabs.workflows,
        );
        await orchestrator.searchWorkflow(workflowName);

        const workflowRow = sharedPage.getByRole('row').filter({
          has: sharedPage.getByRole('link', {
            name: new RegExp(
              `^${workflowName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i',
            ),
          }),
        });
        await expect(
          workflowRow.getByText(translations.workflow.status.unavailable, {
            exact: true,
          }),
        ).toBeVisible();

        await workflowRow
          .getByText(translations.workflow.status.unavailable, { exact: true })
          .hover();
        const tooltip = sharedPage.getByRole('tooltip');
        await expect(
          tooltip.getByText(translations.workflow.unavailable.title),
        ).toBeVisible();
        // Material Table run action has no accessible name when disabled
        await expect(workflowRow.getByRole('button').first()).toBeDisabled();

        await orchestrator.openWorkflowFromTable(workflowName);
        await expect(
          sharedPage.getByText(translations.workflow.status.unavailable, {
            exact: true,
          }),
        ).toBeVisible();
        // Tooltip becomes the accessible name when Run is disabled for availability
        await expect(
          sharedPage.getByRole('button', {
            name: translations.workflow.unavailable.runTooltip,
          }),
        ).toBeDisabled();
      } finally {
        await sharedPage.unroute(overviewListRoute);
        await sharedPage.unroute(overviewByIdRoute);
      }
    });

    test('Backward navigation in multi-step stepper', async () => {
      const workflowName = 'Quarkus Backend application';
      const newComponentInputs: NewComponentInputs = {
        organizationName: 'test-name',
        repositoryName: 'test-repo',
        description: 'test-description',
        owner: 'test-owner',
        system: 'test-system',
        port: '8000',
      };
      const javaMetadata: JavaMetadata = {
        groupId: 'test-group',
        artifactId: 'test-artifact',
        javaPackageNamespace: 'test-package',
        version: '1.0.0',
      };

      await orchestrator.searchWorkflow(workflowName);
      await orchestrator.openWorkflowFromTable(workflowName);
      await orchestrator.verifyWorkflowDetails();
      await orchestrator.clickRunWorkflowFromDetails();
      await orchestrator.fillNewComponentInputs(newComponentInputs);
      await orchestratorHelper.clickButton(translations.common.next);
      await expect(
        sharedPage.getByRole('button', {
          name: 'Step 1 Provide information about the new component',
        }),
      ).toBeEnabled();
      await orchestrator.fillJavaMetadata(javaMetadata);
      await sharedPage
        .getByRole('button', {
          name: 'Step 1 Provide information about the new component',
        })
        .click();
      await orchestrator.verifyNewComponentInputs(newComponentInputs);
      await expect(
        sharedPage.getByRole('button', {
          name: 'Step 2 Provide information about the Java metadata',
        }),
      ).not.toBeVisible();
      await expect(
        sharedPage.getByLabel(
          'Step 2 Provide information about the Java metadata',
        ),
      ).toBeVisible();
      await orchestratorHelper.clickButton(translations.common.next);
      await expect(
        sharedPage.getByLabel(
          'Step 2 Provide information about the Java metadata',
        ),
      ).not.toHaveClass(/Mui-disabled/);
      await orchestratorHelper.clickButton(translations.common.next);
      await orchestratorHelper.clickButton(translations.common.back);
      await orchestrator.verifyJavaMetadata(javaMetadata);
      await orchestratorHelper.clickButton(translations.common.next);
      await expect(
        sharedPage.getByLabel(`Step 4 ${translations.common.review}`),
      ).toHaveClass(/Mui-disabled/);
      await orchestratorHelper.clickButton(translations.common.next);
      await expect(
        sharedPage.getByLabel(`Step 4 ${translations.common.review}`),
      ).not.toHaveClass(/Mui-disabled/);
      const allInputs = [
        ...Object.values(newComponentInputs),
        ...Object.values(javaMetadata),
      ];
      for (const input of allInputs) {
        await expect(sharedPage.getByText(input)).toBeVisible();
      }
    });

    test('ActiveBoolean widget fetches and displays dynamic boolean values', async () => {
      const workflowName = 'Test ActiveBoolean Widget';

      await orchestrator.searchWorkflow(workflowName);
      await orchestrator.openWorkflowFromTable(workflowName);
      await orchestrator.verifyWorkflowDetails();
      await orchestrator.clickRunWorkflowFromDetails();

      // Step 1: Basic ActiveBoolean Tests
      await expect(
        sharedPage.getByText('Basic ActiveBoolean Tests'),
      ).toBeVisible({ timeout: 30_000 });
      await expect(
        sharedPage.getByRole('checkbox', {
          name: /Basic Feature Flag/i,
        }),
      ).toBeVisible({ timeout: 30_000 });
      // Feature with Static Default may show error due to API rate limits (429)
      // Check for either checkbox or description heading (which always renders)
      const featureWithDefaultCheckbox = sharedPage.getByRole('checkbox', {
        name: /Feature with Static Default/i,
      });
      const featureWithDefaultHeading = sharedPage.getByRole('heading', {
        name: /Has a static default/i,
      });
      await expect(
        featureWithDefaultCheckbox.or(featureWithDefaultHeading).first(),
      ).toBeVisible();
      await expect(
        sharedPage.getByRole('checkbox', {
          name: /String to Boolean Coercion/i,
        }),
      ).toBeVisible();
      await expect(
        sharedPage.getByRole('checkbox', {
          name: /Number to Boolean Coercion/i,
        }),
      ).toBeVisible();

      // Navigate to Step 2: Retrigger and Dependency Tests
      await orchestratorHelper.clickButton(translations.common.next);
      await expect(
        sharedPage.getByText('Retrigger and Dependency Tests'),
      ).toBeVisible({ timeout: 30_000 });

      // Verify Product ID dropdown is present with default value
      const productIdDropdown = sharedPage.getByRole('button', {
        name: /Product ID.*5/i,
      });
      await expect(productIdDropdown).toBeVisible();

      // Verify Tenant-Specific Feature checkbox responds to retrigger
      const dependentFeatureCheckbox = sharedPage.getByRole('checkbox', {
        name: /Tenant-Specific Feature/i,
      });
      await expect(dependentFeatureCheckbox).toBeVisible({ timeout: 30_000 });

      // Change Product ID to trigger refetch
      await productIdDropdown.click();
      await sharedPage.getByRole('option', { name: '10' }).click();
      await sharedPage.waitForTimeout(2000);
      await expect(dependentFeatureCheckbox).toBeVisible();

      // Navigate to Step 3: Error Handling Tests
      await orchestratorHelper.clickButton(translations.common.next);
      await expect(sharedPage.getByText('Error Handling Tests')).toBeVisible({
        timeout: 30_000,
      });
      await expect(
        sharedPage.getByRole('checkbox', {
          name: /Silent Error Handling/i,
        }),
      ).toBeVisible();
      await expect(
        sharedPage.getByRole('checkbox', {
          name: /Feature with Retry/i,
        }),
      ).toBeVisible();

      // Navigate to Step 4: Advanced Tests
      await orchestratorHelper.clickButton(translations.common.next);
      await expect(sharedPage.getByText('Advanced Tests')).toBeVisible({
        timeout: 30_000,
      });

      // Verify Read-Only Feature Flag checkbox is present and disabled
      const readOnlyCheckbox = sharedPage.getByRole('checkbox', {
        name: /Read-Only Feature Flag/i,
      });
      await expect(readOnlyCheckbox).toBeVisible();
      await expect(readOnlyCheckbox).toBeDisabled();
      await orchestratorHelper.clickButton(translations.common.next);
      await expect(
        sharedPage.getByText(translations.run.title).first(),
      ).toBeVisible({ timeout: 30_000 });
      await orchestratorHelper.clickButton(translations.common.run);
      await expect(sharedPage).toHaveURL(/\/orchestrator\/instances\/.+/, {
        timeout: 60_000,
      });
      await orchestratorHelper.verifyBreadcrumbLink(workflowName);
    });
  });

  test.describe('Orchestrator > All runs page', () => {
    test.beforeEach(async () => {
      await orchestrator.navigateToWorkflowRunTab(
        translations.page.tabs.allRuns,
      );
    });

    test('Verify all runs tab', async ({}, testInfo) => {
      await orchestrator.navigateToWorkflowRunTab(
        translations.page.tabs.workflows,
      );
      await orchestrator.searchWorkflow('Hello World workflow');
      await sharedPage
        .getByRole('row', { name: 'Hello World workflow' })
        .getByRole('button', {
          name: translations.table.actions.run,
          exact: true,
        })
        .click();
      await orchestrator.submitWorkflowRunFromReview();
      await orchestratorHelper.verifyBreadcrumbLink('Hello World workflow');
      await orchestrator.navigateToOrchestrator();
      await orchestrator.navigateToWorkflowRunTab(
        translations.page.tabs.allRuns,
      );
      await expect(
        sharedPage.getByText(
          countHeadingPattern(translations.table.title.allRuns),
        ),
      ).toBeVisible();
      await runAccessibilityTests(sharedPage, testInfo);
      // Run by / Entity filters on All runs
      await expect(
        sharedPage.getByLabel(translations.table.filters.runBy),
      ).toBeVisible();
      await expect(
        sharedPage.getByLabel(translations.table.filters.entity),
      ).toBeVisible();
      await orchestrator.verifyWorkflowRunTabDetails();

      // Verify Entity link navigates to catalog entity page
      const entityLink = sharedPage
        .getByRole('row')
        .first()
        .getByRole('link', { name: /my-component/i });
      if (await entityLink.isVisible()) {
        await entityLink.click();
        await expect(sharedPage).toHaveURL(/\/catalog\//);
        await orchestrator.navigateToOrchestrator();
        await orchestrator.navigateToWorkflowRunTab(
          translations.page.tabs.allRuns,
        );
      }
    });

    test('All runs tab workflow details validation', async () => {
      await sharedPage
        .getByRole('link', { name: 'Hello World workflow' })
        .first()
        .click();
      await orchestratorHelper.verifyHeading('Hello World workflow');
      await orchestrator.verifyWorkflowDetails();
      await orchestrator.navigateToWorkflowRunTab(
        translations.page.tabs.workflowRuns,
      );
      await sharedPage
        .getByTestId('loading-indicator')
        .waitFor({ state: 'hidden', timeout: 60_000 });
      const runLocator = sharedPage
        .getByText(
          countHeadingPattern(translations.table.title.allWorkflowRuns),
        )
        .first();
      const runCount = parseCountFromHeading(
        (await runLocator.textContent({ timeout: 60_000 })) ?? '',
        translations.table.title.allWorkflowRuns,
      );
      await orchestrator.verifyWorkflowRunTab(runCount);
      await orchestrator.navigateToWorkflowRunTab(
        translations.page.tabs.workflowDetails,
      );
      await sharedPage
        .getByRole('button', {
          name: translations.table.actions.run,
          exact: true,
        })
        .first()
        .click();
      await orchestrator.submitWorkflowRunFromReview();
      await orchestratorHelper.verifyBreadcrumbLink('Hello World workflow');
      await sharedPage.goto(`/orchestrator/workflows/hello_world/runs`);
      await sharedPage
        .getByTestId('loading-indicator')
        .waitFor({ state: 'hidden', timeout: 60_000 });
      await orchestrator.verifyWorkflowRunsTabHeading(runCount + 1);
    });
  });
});
