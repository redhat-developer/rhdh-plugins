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

export class TestUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async loginAsGuest() {
    await this.page.goto('/');
    await this.waitForLoad(240000);

    this.page.on('dialog', async dialog => {
      // eslint-disable-next-line no-console
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    await this.clickButton('Enter');
    await this.verifyHeading('My Company Catalog');
  }

  async waitForLoad(timeout = 120000) {
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
        if (error instanceof Error && error.name === 'TimeoutError') {
          // eslint-disable-next-line no-console
          console.log(
            `Loading selector ${selector} not found or already hidden`,
          );
        } else {
          throw error;
        }
      }
    }
  }

  async clickButton(buttonText: string): Promise<void> {
    await this.page.getByRole('button', { name: buttonText }).click();
  }

  async verifyHeading(headingText: string): Promise<void> {
    await expect(this.page.getByText(headingText)).toBeVisible();
  }
}
