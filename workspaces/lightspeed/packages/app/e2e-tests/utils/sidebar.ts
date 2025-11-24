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
import { LightspeedMessages } from './translations';

export async function assertChatDialogInitialState(
  page: Page,
  translations: LightspeedMessages,
) {
  await expect(page.getByLabel('Chatbot', { exact: true })).toContainText(
    translations['chatbox.header.title'],
  );
  await expect(
    page.getByRole('button', { name: translations['aria.chatHistoryMenu'] }),
  ).toBeVisible();
  await assertDrawerState(page, 'open', translations);
}

export async function closeChatDrawer(
  page: Page,
  translations: LightspeedMessages,
) {
  const closeButton = page.getByRole('button', {
    name: translations['aria.closeDrawerPanel'],
  });
  await closeButton.click();
}

export async function openChatDrawer(
  page: Page,
  translations: LightspeedMessages,
) {
  const toggleButton = page.getByRole('button', {
    name: translations['aria.chatHistoryMenu'],
  });
  await toggleButton.click();
}

export async function assertDrawerState(
  page: Page,
  state: 'open' | 'closed',
  translations: LightspeedMessages,
) {
  const expectations = {
    open: (locator: Locator) => expect(locator).toBeVisible(),
    closed: (locator: Locator) => expect(locator).toBeHidden(),
  };

  const checks = [
    page.getByRole('button', {
      name: translations['aria.closeDrawerPanel'],
    }),
    page.getByPlaceholder(translations['chatbox.search.placeholder']),
  ];

  for (const locator of checks) {
    await expectations[state](locator);
  }

  const resizeSeparator = page.locator('.pf-v6-c-drawer__splitter');
  await expectations[state](resizeSeparator);
}

export async function verifySidePanelConversation(
  page: Page,
  translations: LightspeedMessages,
) {
  const sidePanel = page.locator('.pf-v6-c-drawer__panel-main');
  await expect(sidePanel).toBeVisible();

  const newButton = sidePanel.getByRole('button', {
    name: translations['menu.newConversation'],
  });
  await expect(newButton).toBeEnabled({ timeout: 60000 });

  const conversation = sidePanel.locator('li.pf-chatbot__menu-item--active');
  await expect(conversation).toBeVisible();
}
