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

import { Page, expect } from '@playwright/test';
import { performLogin } from '../fixtures/auth';

export class X2AnsiblePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login() {
    await performLogin(this.page);
  }

  async navigateToX2A() {
    await this.login();
    await this.page.locator('nav a[href*="x2a"]').click();
    await this.waitForPageLoad();
  }

  async navigateToX2AByUrl() {
    await this.login();
    await this.page.goto('/x2a');
    await this.waitForPageLoad();
  }

  async navigateFromSidebar() {
    await this.login();
    const x2aLink = this.page.locator('nav a[href*="x2a"], nav [href*="x2a"]');
    await expect(x2aLink.first()).toBeVisible({ timeout: 10000 });
    await x2aLink.first().click();
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await this.page.waitForTimeout(2000);
  }

  async verifyConversionHubPage() {
    const heading = this.page.getByRole('heading', {
      name: 'Conversion Hub',
    });
    await expect(heading).toBeVisible({ timeout: 15000 });
  }

  async clickStartConversion() {
    const startFirst = this.page.getByRole('button', {
      name: /start first conversion/i,
    });
    const newProject = this.page.getByRole('button', {
      name: /new project/i,
    });
    const button = startFirst.or(newProject);
    await expect(button.first()).toBeVisible({ timeout: 10000 });
    await button.first().click();
    await this.waitForPageLoad();
  }

  /** @deprecated use clickStartConversion() */
  async clickStartFirstConversion() {
    return this.clickStartConversion();
  }

  async verifyTemplateFormLoaded() {
    await expect(
      this.page.getByText('Chef-to-Ansible Conversion Project'),
    ).toBeVisible({ timeout: 15000 });
  }

  // --- Step 1: Job name and description ---

  async fillProjectName(name: string) {
    const field = this.page.getByLabel('Name');
    await expect(field).toBeVisible({ timeout: 30000 });
    await field.fill(name);
  }

  async fillDescription(description: string) {
    const field = this.page.getByLabel('Description');
    await expect(field).toBeVisible({ timeout: 5000 });
    await field.fill(description);
  }

  async fillAbbreviation(abbreviation: string) {
    const field = this.page.getByLabel('Abbreviation');
    await expect(field).toBeVisible({ timeout: 5000 });
    await field.clear();
    await field.fill(abbreviation);
  }

  async fillOwnedByGroup(group: string) {
    const field = this.page.getByLabel('Owned by group');
    await expect(field).toBeVisible({ timeout: 5000 });
    await field.fill(group);
  }

  async clickNext() {
    const nextButton = this.page.getByRole('button', { name: 'Next' });
    const reviewButton = this.page.getByRole('button', { name: 'Review' });
    const button = nextButton.or(reviewButton);
    await expect(button.first()).toBeVisible({ timeout: 10000 });
    await button.first().click();
    await this.page.waitForTimeout(2000);
  }

  async clickBack() {
    const button = this.page.getByRole('button', { name: 'Back' });
    await expect(button).toBeVisible({ timeout: 5000 });
    await button.click();
    await this.page.waitForTimeout(1000);
  }

  // --- Step 2: Source and target repositories ---

  async verifyRepositoryStepVisible() {
    await expect(
      this.page.getByText('Conversion source repository', { exact: true }),
    ).toBeVisible({ timeout: 10000 });
  }

  async dismissGitHubLoginDialog() {
    const dialog = this.page.locator('[role="dialog"]');
    const isDialogVisible = await dialog
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (isDialogVisible) {
      const dismissBtn = this.page.locator(
        '[role="dialog"] button:has-text("Reject All"), ' +
          '[role="dialog"] button:has-text("Close"), ' +
          '[role="dialog"] button:has-text("Cancel"), ' +
          '[role="dialog"] button[aria-label="Close"]',
      );
      if (
        await dismissBtn
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await dismissBtn.first().click();
      } else {
        await this.page.keyboard.press('Escape');
      }
      await this.page.waitForTimeout(1000);
    }

    const popup = this.page
      .context()
      .pages()
      .find(p => p !== this.page);
    if (popup && !popup.isClosed()) {
      await popup.close();
      await this.page.waitForTimeout(500);
    }
  }

  async handleGitHubLoginDialog() {
    const loginButton = this.page.getByRole('button', {
      name: /Log in/i,
    });
    if (!(await loginButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }
    const popupPromise = this.page.waitForEvent('popup', { timeout: 15000 });
    await loginButton.click();
    const popup = await popupPromise.catch(() => null);
    if (!popup) return;

    try {
      await popup.waitForEvent('close', { timeout: 3000 });
    } catch {
      if (!popup.isClosed()) {
        const authorizeButton = popup.locator('button:has-text("Authorize")');
        if (
          await authorizeButton
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false)
        ) {
          await popup
            .evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const auth = buttons.find(
                b =>
                  b.textContent?.includes('Authorize') &&
                  !b.textContent?.includes('Cancel'),
              );
              auth?.click();
            })
            .catch(() => {});
        }
        if (!popup.isClosed()) {
          await popup.waitForEvent('close', { timeout: 30000 }).catch(() => {});
        }
      }
    }
    await this.page.waitForTimeout(1000);
  }

  async fillSourceRepoOwner(owner: string) {
    const combobox = this.page
      .locator('div', { hasText: /^Owner/ })
      .locator('input[role="textbox"], input')
      .first();
    await expect(combobox).toBeVisible({ timeout: 5000 });
    await combobox.fill(owner);
  }

  async fillSourceRepoName(repo: string) {
    const combobox = this.page
      .locator('div', { hasText: /^Repository/ })
      .locator('input[role="textbox"], input')
      .first();
    await expect(combobox).toBeVisible({ timeout: 5000 });
    await combobox.fill(repo);
  }

  async fillSourceRepoBranch(branch: string) {
    const field = this.page.getByLabel('Conversion source repository branch');
    if (await field.isVisible().catch(() => false)) {
      await field.clear();
      await field.fill(branch);
    }
  }

  // --- Step 3: Conversion parameters ---

  async verifyConversionParamsVisible() {
    await expect(
      this.page.getByText('User prompt', { exact: true }),
    ).toBeVisible({ timeout: 10000 });
  }

  async fillUserPrompt(prompt: string) {
    const textarea = this.page.getByLabel('User prompt');
    await textarea.fill(prompt);
  }

  // --- Review step ---

  async verifyReviewStepVisible() {
    await expect(this.page.getByText('Review')).toBeVisible({
      timeout: 10000,
    });
  }

  async clickCreate() {
    const button = this.page.getByRole('button', { name: 'Create' });
    await expect(button).toBeVisible({ timeout: 5000 });
    await button.click();
  }

  // --- Output / Results ---

  async verifyTaskSubmitted() {
    await expect(
      this.page.getByText(/Run of.*Chef-to-Ansible Conversion Project/),
    ).toBeVisible({ timeout: 30000 });
  }

  async verifyTaskSucceeded() {
    const manageLink = this.page.getByRole('link', {
      name: 'Manage the project',
    });
    await expect(manageLink).toBeVisible({ timeout: 120000 });
  }

  async verifyTaskError(expectedError?: string) {
    if (expectedError) {
      await expect(this.page.getByText(expectedError)).toBeVisible({
        timeout: 30000,
      });
    } else {
      await expect(this.page.locator('alert')).toBeVisible({ timeout: 30000 });
    }
  }

  async getStepCount(): Promise<number> {
    const steps = this.page.locator('[class*="MuiStep"]');
    return steps.count();
  }

  // --- Module Page (phase execution) ---

  async navigateToModulePage(projectId: string, moduleId: string) {
    await this.login();
    await this.page.goto(`/x2a/projects/${projectId}/modules/${moduleId}`);
    await this.waitForPageLoad();
    await this.dismissGitHubLoginDialog();
  }

  async clickPhaseTab(phase: 'Analyze' | 'Migrate' | 'Publish') {
    const tab = this.page.locator(`[role="tab"]:has-text("${phase}")`);
    await expect(tab).toBeVisible({ timeout: 10000 });
    const isDisabled = await tab.getAttribute('aria-disabled');
    if (isDisabled === 'true') {
      throw new Error(
        `${phase} tab is disabled — prerequisite phase not complete`,
      );
    }
    await tab.click();
    await this.page.waitForTimeout(500);
  }

  async clickRunPhaseButton(buttonText: string) {
    const button = this.page.getByRole('button', { name: buttonText });
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await this.page.waitForTimeout(2000);
  }

  async waitForPhaseStatus(
    phase: 'Analyze' | 'Migrate' | 'Publish',
    expectedStatus: string,
    timeoutMs = 420000,
  ) {
    await this.clickPhaseTab(phase);
    await this.page.waitForTimeout(1000);
    const statusLocator = this.page
      .getByText(new RegExp(expectedStatus, 'i'))
      .first();
    try {
      await expect(statusLocator).toBeVisible({ timeout: timeoutMs });
    } catch {
      const body = await this.page.content();
      const snippet = body.slice(0, 2000);
      // eslint-disable-next-line no-console
      console.log(
        `waitForPhaseStatus('${phase}', '${expectedStatus}') failed. Page snippet:\n${snippet}`,
      );
      throw new Error(
        `Phase ${phase}: expected "${expectedStatus}" not found on page`,
      );
    }
  }

  async getPhaseStatus(
    phase: 'Analyze' | 'Migrate' | 'Publish',
  ): Promise<string> {
    await this.clickPhaseTab(phase);
    await this.page.waitForTimeout(1000);
    const tabPanel = this.page.locator('[role="tabpanel"]:visible');
    const chip = tabPanel
      .locator('[class*="Chip"], [class*="chip"], [class*="status"]')
      .first();
    return (await chip.textContent()) ?? 'unknown';
  }

  async runAnalyze() {
    await this.clickPhaseTab('Analyze');
    await this.clickRunPhaseButton('Create module migration plan');
    await this.dismissGitHubLoginDialog();
  }

  async runMigrate() {
    await this.clickPhaseTab('Migrate');
    await this.clickRunPhaseButton('Migrate module sources');
    await this.dismissGitHubLoginDialog();
  }

  async runPublish() {
    await this.clickPhaseTab('Publish');
    await this.clickRunPhaseButton('Publish to target repository');
    await this.dismissGitHubLoginDialog();
  }
}
