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

export class UIhelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyHeading(heading: string): Promise<void> {
    await expect(this.page.getByText(heading)).toBeVisible();
  }

  async verifyText(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async clickButton(buttonText: string): Promise<void> {
    await this.page.getByRole('button', { name: buttonText }).click();
  }

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

  async isTextVisible(text: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.getByText(text).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }
}
