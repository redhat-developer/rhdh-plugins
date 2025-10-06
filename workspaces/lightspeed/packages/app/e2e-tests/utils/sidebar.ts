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

export async function assertChatDialogInitialState(page: Page) {
  await expect(page.getByLabel('Chatbot', { exact: true })).toContainText(
    'Developer Lightspeed',
  );
  await expect(
    page.getByRole('button', { name: 'Chat history menu' }),
  ).toBeVisible();
  await assertDrawerState(page, 'open');
}

export async function closeChatDrawer(page: Page) {
  const closeButton = page.getByRole('button', { name: 'Close drawer panel' });
  await closeButton.click();
}

export async function openChatDrawer(page: Page) {
  const toggleButton = page.getByRole('button', { name: 'Chat history menu' });
  await toggleButton.click();
}

export async function assertDrawerState(page: Page, state: 'open' | 'closed') {
  const expectations = {
    open: (locator: Locator) => expect(locator).toBeVisible(),
    closed: (locator: Locator) => expect(locator).toBeHidden(),
  };

  const checks = [
    page.getByRole('button', { name: 'Close drawer panel' }),
    page.getByRole('textbox', { name: 'Search previous conversations' }),
    page.getByRole('separator', { name: 'Resize' }),
  ];

  for (const locator of checks) {
    await expectations[state](locator);
  }
}

export async function verifySidePanelConversation(page: Page) {
  const sidePanel = page.locator('.pf-v6-c-drawer__panel-main');
  await expect(sidePanel).toBeVisible();

  const newButton = sidePanel.getByRole('button', { name: 'new chat' });
  await expect(newButton).toBeEnabled({ timeout: 60000 });

  const conversation = sidePanel.locator('li.pf-chatbot__menu-item--active');
  await expect(conversation).toBeVisible();
}
