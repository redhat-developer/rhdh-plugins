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

/**
 * Generic test utilities for page interactions and test setup
 */
export class TestUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Page navigation and setup
  async goto(url: string) {
    await this.page.goto(url);
  }

  async loginAsGuest() {
    await this.page.goto('/');
    await this.waitForLoad(240000);

    // Handle any dialogs that might appear
    this.page.on('dialog', async dialog => {
      // eslint-disable-next-line no-console
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    // Click the Enter button first
    await this.clickButton('Enter');

    // Then verify the welcome message appears
    await this.verifyHeading('Welcome back');
  }

  async signOut() {
    await this.page.click('[data-testid="user-settings-menu"]');
    await this.page.click('[data-testid="sign-out"]');
    await this.verifyHeading('Welcome back');
  }

  async waitForLoad(timeout = 120000) {
    // Wait for common loading indicators to disappear
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.MuiCircularProgress-root',
      '[role="progressbar"]',
    ];

    for (const selector of loadingSelectors) {
      try {
        await this.page.waitForSelector(selector, {
          state: 'hidden',
          timeout: timeout,
        });
      } catch (error) {
        // Ignore timeout errors for loading selectors
        // eslint-disable-next-line no-console
        console.log(`Loading selector ${selector} not found or already hidden`);
      }
    }
  }

  // Text verification methods
  async verifyHeading(heading: string): Promise<void> {
    await expect(this.page.getByText(heading)).toBeVisible();
  }

  async verifyText(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async isTextVisible(text: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.getByText(text).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // Button interaction methods
  async clickButton(buttonText: string): Promise<void> {
    await this.page.getByRole('button', { name: buttonText }).click();
  }

  // UI element wait methods
  async waitForSideBarVisible(): Promise<void> {
    // Wait for the navigation sidebar to be visible
    await expect(
      this.page.locator('nav[aria-label="sidebar nav"]'),
    ).toBeVisible();
  }

  async waitForLoginBtnDisappear(): Promise<void> {
    await expect(
      this.page.getByRole('button', { name: 'Log in' }),
    ).toBeHidden();
  }

  // Expose page for advanced usage
  getPage(): Page {
    return this.page;
  }
}
