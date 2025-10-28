/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { UIhelper } from './ui-helper.js';
import { Page } from '@playwright/test';

export class Common {
  page: Page;
  uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
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
    await this.uiHelper.clickButton('Enter');

    // Then verify the welcome message appears
    await this.uiHelper.verifyHeading('Welcome back');
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

  async signOut() {
    await this.page.click('[data-testid="user-settings-menu"]');
    await this.page.click('[data-testid="sign-out"]');
    await this.uiHelper.verifyHeading('Welcome back');
  }
}
