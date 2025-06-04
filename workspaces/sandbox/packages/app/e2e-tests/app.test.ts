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

import { test, expect, Page, type Locator } from '@playwright/test';
import { LoginPage } from './Utils/loginPage';

const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

let page: Page;

// Load credentials and base URL from environment variables
const id = process.env.SSO_USERNAME!;
const pw = process.env.SSO_PASSWORD!;
const baseUrl = process.env.BASE_URL!;
const env = process.env.ENVIRONMENT!;

test.describe('sandbox plugin', () => {
  // Before all tests: launch browser, create new page, and log in
  test.beforeAll('', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1700, height: 940 }, // e.g. MacBook Pro screen resolution (CSS px)
    });
    page = await context.newPage();

    const loginPage = new LoginPage(page, env);
    await loginPage.navigate(baseUrl); // Navigate to base URL
    await loginPage.login(id, pw, env); // Log in with credentials
  });

  // Test the homepage layout and welcome text
  test('Test Homepage', async () => {
    await page.locator('a').filter({ hasText: 'Home' }).isVisible();

    // Verify ARIA snapshot for the main article content
    await expect(page.getByRole('article')).toMatchAriaSnapshot(`
      - img "Red Hat Trial"
      - heading "Try Red Hat products" [level=1]
      - paragraph: Explore, experiment, and see what's possible
      - paragraph: /Click on "Try it" to initiate your free, no commitment \\d+-day trial\\./
    `);
  });

  // Test Header
  test('Test Header', async () => {
    // Opens and verifies that 'Red Hat Developer Hub' popup is not broken
    const [rhdhPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: 'Red Hat Developer Hub , Opens' }).click(),
    ]);
    await expect(rhdhPage.locator('h1')).toContainText('Red Hat Developer Hub');

    // Opens and verifies that 'Contact Red Hat Sales' popup is not broken
    const [salesPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Contact Red Hat Sales' }).click(),
    ]);
    await expect(salesPage.locator('h1')).toContainText('Contact Red Hat');
  });

  test('Signup user and home page verification', async () => {
    const articleHeader = page.getByRole('article');
    const loadingIcon = page.locator('svg.v5-MuiCircularProgress-svg').first();
    const card = page.getByText('OpenShift Comprehensive cloud');
    await expect(card).toBeVisible(); // Ensure card is visible
    await expect(page.getByText('OpenShift AI Scalable AI and')).toBeVisible();
    await expect(page.getByText('Dev Spaces Cloud Development')).toBeVisible();
    await expect(
      page.getByText(
        'Ansible Automation Platform Scalable, centralized automation solution Available',
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        'OpenShift Virtualization Migrate traditional VM workloads to OpenShift Unified',
      ),
    ).toBeVisible();
    await expect(page.getByRole('article')).toContainText(
      'Click on "Try it" to initiate your free, no commitment 30-day trial.',
    );
    await card.getByRole('button', { name: 'Try it' }).click();
    await loadingIcon.waitFor({ state: 'hidden' });

    // Verify expected texts
    await expect(articleHeader).toContainText('Welcome');
    await expect(articleHeader).toContainText(
      'Your free trial expires in 30 days',
    );
  });

  test('Test DevSandbox', async () => {
    // Try to click the 'Try it' button and wait for the popup
    const tryItButton = page.getByRole('button', { name: 'Try it' }).first();

    // Open the article in a new popup and wait for it to fully load
    const devSandboxPage = await clickAndWaitForPopup(page, tryItButton);
    // Wait for the new page's 'load' event to ensure it's completely loaded
    await devSandboxPage.waitForLoadState('load', { timeout: 30000 });
    // Wait for a specific element that should be visible after the page is fully loaded
    const loadElement = devSandboxPage.getByRole('img', {
      name: 'Red Hat OpenShift Service on',
    });
    await loadElement.waitFor();

    await expect(devSandboxPage.getByRole('heading')).toContainText(
      'Log in with…',
    );
    await expect(devSandboxPage.getByRole('link')).toContainText('DevSandbox');
    await devSandboxPage.close();
  });

  // Test Activities page and open each article in a popup
  test('Test Activites Page', async () => {
    // Navigate to the Activities page
    await page.getByRole('link', { name: 'Activities' }).click();
    await expect(page.locator('h3')).toContainText('Featured');

    // Locate all article cards
    const articles = page.getByRole('heading', { level: 5 });

    const noOfArtricles = await articles.count();
    // Proceed only if there is at least one article on the page
    for (let index = 0; index < noOfArtricles; index++) {
      // Extract the title of each article card
      const articleTitle = await articles.nth(index).textContent();

      // Open the article in a new popup and wait for it to fully load
      const popupPage = await clickAndWaitForPopup(page, articles.nth(index));
      // Assert the popup heading matches the expected article title
      await expect(popupPage.locator('h1')).toContainText(
        `Overview: ${articleTitle}`,
      );
      await popupPage.close();
    }
  });

  async function clickAndWaitForPopup(currentPage: Page, elelocator: Locator) {
    const [popupPage] = await Promise.all([
      currentPage.waitForEvent('popup'),
      elelocator.click(),
    ]);
    return popupPage;
  }
});
