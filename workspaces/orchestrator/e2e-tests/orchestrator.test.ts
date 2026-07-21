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
import { Orchestrator } from './pages/orchestrator';
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

    test('Add workflow run by entity', async () => {
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
      await sharedPage.getByRole('tab', { name: 'Workflows' }).first().click();
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
      await orchestrator.verifyWorkflowRunTabDetails();
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
