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
  githubOnlyScorecardResponse,
  jiraOnlyScorecardResponse,
} from './utils/scorecardResponseUtils';

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
    await scorecardPage.validateScorecardAria();

    await scorecardPage.verifyScorecardValues({
      'Github open PRs': '9',
      'Jira open blocking tickets': '8',
    });
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

  test('Display only the Jira scorecard when only Jira metrics are returned', async ({
    page,
  }) => {
    await mockScorecardResponse(page, jiraOnlyScorecardResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog();
    await catalogPage.openComponent('rhdh-app');
    await scorecardPage.openTab();

    const isJiraVisible = await scorecardPage.isScorecardVisible(
      'Jira open blocking tickets',
    );
    expect(isJiraVisible).toBe(true);

    const isGithubVisible = await scorecardPage.isScorecardVisible(
      'Github open PRs',
    );
    expect(isGithubVisible).toBe(false);
  });

  test('Display only the GitHub scorecard when only GitHub metrics are returned', async ({
    page,
  }) => {
    await mockScorecardResponse(page, githubOnlyScorecardResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog();
    await catalogPage.openComponent('rhdh-app');
    await scorecardPage.openTab();

    const isJiraVisible = await scorecardPage.isScorecardVisible(
      'Jira open blocking tickets',
    );
    expect(isJiraVisible).toBe(false);

    const isGithubVisible = await scorecardPage.isScorecardVisible(
      'Github open PRs',
    );
    expect(isGithubVisible).toBe(true);
  });
});
