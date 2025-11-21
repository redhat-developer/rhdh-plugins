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

  async verifyText(text: string | RegExp, exact: boolean = true) {
    await expect(this.page.getByText(text, { exact })).toBeVisible();
  }
  async clickButtonByLabel(label: string | RegExp) {
    await this.page.getByRole('button', { name: label }).first().click();
  }
  async clickButtonByText(
    text: string | RegExp,
    options: { exact: boolean } = { exact: false },
  ) {
    await this.page
      .getByRole('button', { name: text, exact: options?.exact })
      .first()
      .click();
  }
  async verifyButtonURL(
    label: string | RegExp,
    url: string,
    options: { exact: boolean } = { exact: true },
  ) {
    expect(
      await this.page
        .getByRole('button', { name: label, exact: options.exact })
        .first()
        .getAttribute('href'),
    ).toContain(url);
  }
  async verifyHeading(heading: string | RegExp, exact: boolean = true) {
    await expect(
      this.page.getByRole('heading', { name: heading, exact }),
    ).toBeVisible();
  }
  async clickByDataTestId(dataTestId: string) {
    await this.page.getByTestId(dataTestId).first().click();
  }
}

export async function switchToLocale(
  page: Page,
  locale: string,
): Promise<void> {
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('option', { name: locale }).click();
  await page.locator('a').filter({ hasText: 'Home' }).click();
}
