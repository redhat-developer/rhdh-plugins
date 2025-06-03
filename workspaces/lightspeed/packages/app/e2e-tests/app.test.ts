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

import { test, expect } from '@playwright/test';
import { openLightspeed, sendMessage } from './utils/testHelper';

test.beforeEach(async ({ page }) => {
  await page.goto('/');

  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();
});

test('App should render the welcome page', async ({ page }) => {
  await expect(page.getByText('Catalog')).toBeVisible();
});

test('Verify scroll controls in Conversation', async ({ page }) => {
  await openLightspeed(page);
  await page.waitForLoadState('networkidle');
  const message = 'let me know about openshift deplyment in detail';
  await sendMessage(message, page);
  const loadingIndicator = page.locator('div.pf-chatbot__message-loading');
  await expect(loadingIndicator).toBeVisible();

  const menuItem = page.locator('.pf-v6-c-menu__item');
  await expect(menuItem).toBeVisible({ timeout: 15000 });

  const jumpTopButton = page.getByRole('button', { name: 'Jump top' });
  const jumpBottomButton = page.getByRole('button', { name: 'Jump bottom' });

  await expect(jumpTopButton).toBeVisible();
  await jumpTopButton.click();

  await page.waitForTimeout(500);
  await expect(page.locator('span').filter({ hasText: message })).toBeVisible();

  await expect(jumpBottomButton).toBeVisible();
  await jumpBottomButton.click();

  const responseMessage = page
    .locator('div.pf-chatbot__message-response')
    .last();
  await expect(responseMessage).toHaveText(/OpenShift deployment/);
});
