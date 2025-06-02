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
import { Page, expect, Locator } from '@playwright/test';
import { getElementByRole, getLabelByName } from './locatorUtils';

export async function assertChatDialogInitialState(page: Page) {
  await expect(getLabelByName(page, 'Chatbot', true)).toContainText(
    'Developer Hub Lightspeed',
  );
  await expect(getElementByRole(page, 'button', 'Toggle menu')).toBeVisible();
  await assertDrawerState(page, 'open');
}

export async function closeChatDrawer(page: Page) {
  const closeButton = getElementByRole(page, 'button', 'Close drawer panel');
  await closeButton.click();
}

export async function openChatDrawer(page: Page) {
  const toggleButton = getElementByRole(page, 'button', 'Toggle menu');
  await toggleButton.click();
}

export async function assertDrawerState(page: Page, state: 'open' | 'closed') {
  const expectations = {
    open: (locator: Locator) => expect(locator).toBeVisible(),
    closed: (locator: Locator) => expect(locator).toBeHidden(),
  };

  const checks = [
    getElementByRole(page, 'button', 'Close drawer panel'),
    getElementByRole(page, 'textbox', 'Filter menu items'),
    getElementByRole(page, 'separator', 'Resize'),
  ];

  for (const locator of checks) {
    await expectations[state](locator);
  }
}
