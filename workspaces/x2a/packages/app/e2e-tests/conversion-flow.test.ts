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
import { X2AnsiblePage } from './pages/X2AnsiblePage';

test.describe('X2Ansible - Conversion Flow @live', () => {
  let x2aPage: X2AnsiblePage;

  test.beforeEach(async ({ page }) => {
    x2aPage = new X2AnsiblePage(page);
  });

  test.describe('Navigation and Page Load', () => {
    test('should navigate to X2A page and display Conversion Hub', async () => {
      await x2aPage.navigateToX2AByUrl();
      await x2aPage.verifyConversionHubPage();
    });

    test('should navigate to X2A page via sidebar', async () => {
      await x2aPage.navigateFromSidebar();
      await x2aPage.verifyConversionHubPage();
    });

    test('should display Start first conversion button', async () => {
      await x2aPage.navigateToX2AByUrl();
      await x2aPage.verifyConversionHubPage();

      const startFirst = x2aPage.page.getByRole('button', {
        name: /start first conversion/i,
      });
      const newProject = x2aPage.page.getByRole('button', {
        name: /new project/i,
      });
      await expect(startFirst.or(newProject).first()).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Template Scaffolder', () => {
    test('should load the scaffolder template when starting a conversion', async () => {
      await x2aPage.navigateToX2AByUrl();
      await x2aPage.clickStartFirstConversion();
      await x2aPage.verifyTemplateFormLoaded();
    });

    test('should display all required form fields in step 1', async () => {
      await x2aPage.navigateToX2AByUrl();
      await x2aPage.clickStartFirstConversion();
      await x2aPage.verifyTemplateFormLoaded();

      await expect(x2aPage.page.getByLabel('Name')).toBeVisible({
        timeout: 30000,
      });
      await expect(x2aPage.page.getByLabel('Description')).toBeVisible();
      await expect(x2aPage.page.getByLabel('Abbreviation')).toBeVisible();
      await expect(x2aPage.page.getByLabel('Owned by group')).toBeVisible();
    });

    test('should have Next button on step 1', async () => {
      await x2aPage.navigateToX2AByUrl();
      await x2aPage.clickStartFirstConversion();
      await x2aPage.verifyTemplateFormLoaded();

      await expect(
        x2aPage.page.getByRole('button', { name: 'Next' }),
      ).toBeVisible();
    });
  });

  test.describe('Happy Path - Full Conversion Wizard', () => {
    test('should complete the full conversion wizard', async () => {
      test.setTimeout(180000);

      await x2aPage.navigateToX2AByUrl();
      await x2aPage.verifyConversionHubPage();
      await x2aPage.clickStartFirstConversion();
      await x2aPage.verifyTemplateFormLoaded();

      // Step 1: Job name and description
      await x2aPage.fillProjectName('chef-examples-e2e-test');
      await x2aPage.fillDescription(
        'E2E test conversion of Chef examples repo',
      );
      await x2aPage.fillAbbreviation('x2a');
      await x2aPage.fillOwnedByGroup('guests');

      await x2aPage.clickNext();

      // Step 2: Source and target repositories
      await x2aPage.verifyRepositoryStepVisible();
      await x2aPage.dismissGitHubLoginDialog();

      await x2aPage.fillSourceRepoOwner('chef');
      await x2aPage.fillSourceRepoName('chef-examples');

      await x2aPage.clickNext();

      // Step 3: Conversion parameters (optional prompt)
      await x2aPage.dismissGitHubLoginDialog();
      await x2aPage.verifyConversionParamsVisible();
      await x2aPage.clickNext();

      // Step 4: Review
      await x2aPage.verifyReviewStepVisible();

      await expect(
        x2aPage.page.getByText('chef-examples-e2e-test'),
      ).toBeVisible();

      await x2aPage.clickCreate();

      await x2aPage.verifyTaskSubmitted();
    });
  });
});
