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

  // Button interaction methods
  async clickButton(buttonText: string): Promise<void> {
    await this.page.getByRole('button', { name: buttonText }).click();
  }

  /**
   * Verifies text within a card by card heading.
   *
   * @param cardHeading - The heading text of the card
   * @param text - The text to verify within the card
   * @param exact - Whether to match text exactly (default: true)
   */
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

  /**
   * Verifies a link within a card by card heading and link text.
   *
   * @param cardHeading - The heading text of the card
   * @param linkText - The text of the link to verify
   * @param exact - Whether to match link text exactly (default: true)
   */
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

  /**
   * Verifies a link's URL within a card.
   *
   * @param cardHeading - The heading text of the card
   * @param linkText - The text of the link
   * @param expectedUrl - The expected URL (can be partial match)
   * @param exact - Whether to match link text exactly (default: true)
   */
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
      // If href is not available, verify the link is clickable and has the correct text
      const linkUrl = await link.evaluate((el: HTMLAnchorElement) => el.href);
      expect(linkUrl).toContain(expectedUrl);
    }
  }
}
