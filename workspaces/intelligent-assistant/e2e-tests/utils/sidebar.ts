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
import {
  chatHistoryDrawerCloseButton,
  chatHistoryMenuButton,
  closeChatHistoryDrawer,
  isChatHistoryDrawerOpen,
  openChatHistoryDrawer,
} from './chatHistoryDrawer';
import { LightspeedMessages } from './translations';

export async function assertChatDialogInitialState(
  page: Page,
  translations: LightspeedMessages,
) {
  await expect(page.getByLabel('Chatbot', { exact: true })).toContainText(
    translations['chatbox.header.title'],
  );

  const menu = chatHistoryMenuButton(page, translations);
  const drawerClose = chatHistoryDrawerCloseButton(page, translations);

  if (await menu.isVisible().catch(() => false)) {
    await expect(menu).toBeVisible();
  } else {
    await expect(drawerClose).toBeVisible();
  }

  await assertDrawerState(page, 'open', translations);

  const drawerPanel = page.locator('.pf-v6-c-drawer__panel-main');

  await expect(
    drawerPanel.getByRole('button', {
      name: translations['menu.newConversation'],
    }),
  ).toBeDisabled();
  await expect(
    drawerPanel.getByRole('button', { name: translations['sort.label'] }),
  ).toBeVisible();
  await expect(
    drawerPanel.getByRole('heading', {
      name: new RegExp(translations['conversation.category.savedPrompts']),
    }),
  ).toBeVisible();
  await expect(
    drawerPanel
      .locator('.lightspeed-saved-prompts-group')
      .getByRole('menuitem', {
        name: translations['savedPrompts.sidebar.empty'],
      }),
  ).toBeDisabled();
  await expect(
    drawerPanel.getByRole('heading', {
      name: translations['conversation.category.pinnedChats'],
      level: 3,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    drawerPanel.getByRole('menuitem', {
      name: translations['chatbox.emptyState.noPinnedChats'],
    }),
  ).toBeDisabled();
  await expect(
    drawerPanel.getByRole('heading', {
      name: translations['conversation.category.recent'],
      level: 3,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    drawerPanel.getByRole('menuitem', {
      name: translations['chatbox.emptyState.noRecentChats'],
    }),
  ).toBeDisabled();
}

export async function closeChatDrawer(
  page: Page,
  translations: LightspeedMessages,
) {
  await closeChatHistoryDrawer(page, translations);
}

export async function openChatDrawer(
  page: Page,
  translations: LightspeedMessages,
) {
  await openChatHistoryDrawer(page, translations);
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

  const search = page.getByPlaceholder(
    translations['chatbox.search.placeholder'],
  );
  const drawerClose = chatHistoryDrawerCloseButton(page, translations);
  const resizeSeparator = page.locator('.pf-v6-c-drawer__splitter');

  await expectations[state](search);
  await expectations[state](resizeSeparator);

  if (state === 'open' && (await isChatHistoryDrawerOpen(page, translations))) {
    if (await drawerClose.isVisible().catch(() => false)) {
      await expect(drawerClose).toBeVisible();
    } else {
      await expect(chatHistoryMenuButton(page, translations)).toBeVisible();
    }
  } else if (state === 'closed') {
    await expect(drawerClose).toBeHidden();
  }
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
