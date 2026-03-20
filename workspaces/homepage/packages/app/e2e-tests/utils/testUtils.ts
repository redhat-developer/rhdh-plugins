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

const LOCALE_DISPLAY_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
};

function getLocaleDisplayName(locale: string): string {
  const baseLocale = locale.split('-')[0];
  return LOCALE_DISPLAY_NAMES[baseLocale] || locale;
}

export class TestUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async loginAsGuest(url?: string) {
    await this.page.goto(url ?? '/');
    await this.waitForLoad(240000);

    this.page.on('dialog', async dialog => {
      // eslint-disable-next-line no-console
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    await this.clickButton('Enter');
    await this.verifyHeading('Welcome back');
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

  async switchToLocale(locale: string): Promise<void> {
    const baseLocale = locale.split('-')[0];
    if (baseLocale !== 'en') {
      const displayName = getLocaleDisplayName(locale);
      await this.page.getByRole('link', { name: 'Settings' }).click();
      await this.page.getByRole('button', { name: 'English' }).click();
      await this.page.getByRole('option', { name: displayName }).click();
      await this.page.locator('a').filter({ hasText: 'Home' }).click();
    }
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

  async verifyTextInCard(
    cardHeading: string,
    text: string | RegExp,
    exact = true,
  ): Promise<void> {
    const cardLocator = this.page
      .locator(`div[class*="MuiCard-root"]`)
      .filter({ hasText: cardHeading })
      .first();

    const textLocator = cardLocator.getByText(text, { exact }).first();
    await textLocator.scrollIntoViewIfNeeded();
    await expect(textLocator).toBeVisible();
  }

  async verifyLinkInCard(
    cardHeading: string,
    linkText: string,
    exact = true,
  ): Promise<void> {
    const cardLocator = this.page
      .locator(`div[class*="MuiCard-root"]`)
      .filter({ hasText: cardHeading })
      .first();

    const link = cardLocator
      .locator('a')
      .getByText(linkText, { exact })
      .first();

    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  }

  async verifyLinkURLInCard(
    cardHeading: string,
    linkText: string,
    expectedUrl: string | RegExp,
    exact = true,
  ): Promise<void> {
    const cardLocator = this.page
      .locator(`div[class*="MuiCard-root"]`)
      .filter({ hasText: cardHeading })
      .first();

    const link = cardLocator
      .locator('a')
      .getByText(linkText, { exact })
      .first();

    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    if (href) {
      expect(href).toContain(expectedUrl);
    } else {
      const linkUrl = await link.evaluate((el: HTMLAnchorElement) => el.href);
      expect(linkUrl).toContain(expectedUrl);
    }
  }
}
