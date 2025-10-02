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

import { test, expect } from '@playwright/test';
import { mockScorecardResponse } from './utils/apiUtils';
import { ComponentImportPage } from './pages/ComponentImportPage';
import { CatalogPage } from './pages/CatalogPage';
import { ScorecardPage } from './pages/ScorecardPage';
import { setupRBAC } from './utils/rbacSetup';
import {
  customScorecardResponse,
  emptyScorecardResponse,
  unavailableMetricResponse,
  invalidThresholdResponse,
} from './utils/scorecardResponseUtils';

test.describe.serial('Pre-RBAC Access Tests', () => {
  test('Display access denied message when RBAC is not configured', async ({
    page,
  }) => {
    const catalogPage = new CatalogPage(page);
    await page.goto('/');
    await catalogPage.navigateToCatalog();
    await catalogPage.openComponent('Red Hat Developer Hub');
    await page.getByText('Scorecard').click();

    await expect(page.getByText('Missing permission')).toBeVisible();
    await expect(page.getByRole('article')).toContainText(
      'To view Scorecard plugin, contact your administrator to give the scorecard.metric.read permission.',
    );
  });
});

test.describe.serial('Scorecard Plugin Tests', () => {
  let catalogPage: CatalogPage;
  let importPage: ComponentImportPage;
  let scorecardPage: ScorecardPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await setupRBAC(page);

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    catalogPage = new CatalogPage(page);
    importPage = new ComponentImportPage(page);
    scorecardPage = new ScorecardPage(page);
  });

  test('Import component and validate scorecard tabs for GitHub PRs and Jira tickets', async ({
    page,
  }) => {
    await mockScorecardResponse(page, customScorecardResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog();
    await importPage.startComponentImport();
    await importPage.analyzeComponent(
      'https://github.com/rhdh-pai-qe/backstage-catalog/blob/main/catalog-info.yaml',
    );
    await importPage.viewImportedComponent();
    await scorecardPage.openTab();

    await scorecardPage.verifyScorecardValues({
      'GitHub open PRs': '9',
      'Jira open blocking tickets': '8',
    });

    for (const metric of scorecardPage.scorecardMetrics) {
      await scorecardPage.validateScorecardAriaFor(metric);
    }
  });

  test('Display empty state when scorecard API returns no metrics', async ({
    page,
  }) => {
    await mockScorecardResponse(page, emptyScorecardResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog();
    await catalogPage.openComponent('rhdh-app');
    await scorecardPage.openTab();

    await scorecardPage.expectEmptyState();
  });

  test('Displays error state for unavailable data while rendering metrics', async ({
    page,
  }) => {
    await mockScorecardResponse(page, unavailableMetricResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog();
    await catalogPage.openComponent('rhdh-app');
    await scorecardPage.openTab();

    const jiraMetric = scorecardPage.scorecardMetrics[1];
    const githubMetric = scorecardPage.scorecardMetrics[0];

    const isJiraVisible = await scorecardPage.isScorecardVisible(
      jiraMetric.title,
    );
    expect(isJiraVisible).toBe(true);

    const isGithubVisible = await scorecardPage.isScorecardVisible(
      githubMetric.title,
    );
    expect(isGithubVisible).toBe(true);

    const errorLocator = page.getByRole('heading', {
      name: 'Metric data unavailable',
    });
    await expect(errorLocator).toBeVisible();

    await errorLocator.hover();
    const errorMetric = unavailableMetricResponse.find(
      metric => metric.id === 'github.open_prs',
    );

    if (errorMetric && 'error' in errorMetric) {
      const errorTooltip = errorMetric.error;
      expect(errorTooltip).toBeTruthy();
      await expect(page.getByText(errorTooltip!)).toBeVisible();
    }

    await scorecardPage.validateScorecardAriaFor(jiraMetric);
  });

  test('Display error state for invalid threshold config while rendering metrics', async ({
    page,
  }) => {
    await mockScorecardResponse(page, invalidThresholdResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog();
    await catalogPage.openComponent('rhdh-app');
    await scorecardPage.openTab();

    const githubMetric = scorecardPage.scorecardMetrics[0];
    const jiraMetric = scorecardPage.scorecardMetrics[1];

    const isGithubVisible = await scorecardPage.isScorecardVisible(
      githubMetric.title,
    );
    expect(isGithubVisible).toBe(true);

    const isJiraVisible = await scorecardPage.isScorecardVisible(
      jiraMetric.title,
    );
    expect(isJiraVisible).toBe(true);

    const errorLocator = page.getByRole('heading', {
      name: 'Invalid thresholds',
    });
    await expect(errorLocator).toBeVisible();

    await errorLocator.hover();
    const errorTooltip = invalidThresholdResponse.find(
      metric => metric.id === 'github.open_prs',
    )?.result?.thresholdResult;

    if (errorTooltip && 'error' in errorTooltip) {
      expect(errorTooltip.error).toBeTruthy();
      await expect(page.getByText(errorTooltip.error)).toBeVisible();
    }

    await scorecardPage.validateScorecardAriaFor(jiraMetric);
  });
});
