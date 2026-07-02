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

test.describe('X2Ansible - Navigation @live', () => {
  let x2aPage: X2AnsiblePage;

  test.beforeEach(async ({ page }) => {
    x2aPage = new X2AnsiblePage(page);
  });

  test('should navigate to X2A page via direct URL', async () => {
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.verifyConversionHubPage();
  });

  test('should navigate to X2A via sidebar link', async () => {
    await x2aPage.navigateFromSidebar();
    await x2aPage.verifyConversionHubPage();
  });

  test('should show correct URL when on X2A page', async () => {
    await x2aPage.navigateToX2AByUrl();
    expect(x2aPage.page.url()).toContain('/x2a');
  });

  test('should navigate to scaffolder and back', async () => {
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.verifyConversionHubPage();

    await x2aPage.clickStartFirstConversion();
    await x2aPage.verifyTemplateFormLoaded();

    await x2aPage.page.goBack();
    await x2aPage.waitForPageLoad();
    await x2aPage.verifyConversionHubPage();
  });

  test('should navigate through wizard steps and back', async () => {
    await x2aPage.navigateToX2AByUrl();
    await x2aPage.clickStartFirstConversion();
    await x2aPage.verifyTemplateFormLoaded();

    await x2aPage.fillProjectName('nav-test');
    await x2aPage.fillOwnedByGroup('guests');
    await x2aPage.clickNext();
    await x2aPage.verifyRepositoryStepVisible();
    await x2aPage.dismissGitHubLoginDialog();

    await x2aPage.clickBack();
    await x2aPage.verifyTemplateFormLoaded();
  });
});
