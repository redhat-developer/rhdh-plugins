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
import { performGuestLogin } from '../fixtures/auth';

export class X2AnsiblePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login() {
    await performGuestLogin(this.page);
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
    await this.page.locator('nav a[href*="x2a"]').click();
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await this.page.waitForTimeout(2000);
  }

  async verifyConversionHubPage() {
    const heading = this.page.getByText('Conversion Hub');
    await expect(heading).toBeVisible({ timeout: 15000 });
  }

  async clickStartFirstConversion() {
    const button = this.page.getByRole('button', {
      name: /start first conversion/i,
    });
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await this.waitForPageLoad();
  }

  async verifyTemplateFormLoaded() {
    await expect(
      this.page.getByText('Chef-to-Ansible Conversion Project'),
    ).toBeVisible({ timeout: 15000 });
  }

  // --- Step 1: Job name and description ---

  async fillProjectName(name: string) {
    const field = this.page.getByLabel('Name');
    await expect(field).toBeVisible({ timeout: 5000 });
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
    await expect(button.first()).toBeVisible({ timeout: 5000 });
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
    const rejectButton = this.page.getByRole('button', {
      name: 'Reject All',
    });
    if (await rejectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectButton.click();
      await this.page.waitForTimeout(500);
    }
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
}
