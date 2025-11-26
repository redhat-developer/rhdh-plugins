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
import { LightspeedMessages } from './translations';

export const openChatContextMenu = async (page: Page, chatIndex = 0) => {
  await page
    .locator('.pf-v6-c-menu-toggle.pf-m-plain.pf-chatbot__history-actions')
    .nth(chatIndex)
    .click();
};

export const openChatContextMenuByName = async (
  page: Page,
  chatName: string,
  translations: LightspeedMessages,
) => {
  await page
    .locator('li')
    .filter({ hasText: chatName })
    .locator('div')
    .getByLabel(translations['aria.options.label'])
    .click();
};

export const verifyChatContextMenuOptions = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - menuitem "${translations['conversation.rename']}"
    - menuitem "${translations['conversation.addToPinnedChats']}"
    - menuitem "${translations['conversation.delete']}"
    `);
};

export const selectRenameAction = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('menuitem', { name: translations['conversation.rename'] })
    .click();
};

export const verifyRenameChatForm = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(page.locator('#rename-modal')).toContainText(
    translations['conversation.rename.confirm.title'],
  );
  await expect(
    page.getByRole('textbox', {
      name: translations['conversation.rename.placeholder'],
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel(translations['conversation.rename.confirm.title']),
  ).toMatchAriaSnapshot(`
    - button "${translations['conversation.rename.confirm.action']}" [disabled]
    - button "${translations['common.cancel']}"
    `);
};

export const submitChatRename = async (
  page: Page,
  newName: string,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('textbox', {
      name: translations['conversation.rename.placeholder'],
    })
    .fill(newName);
  await expect(
    page.getByRole('textbox', {
      name: translations['conversation.rename.placeholder'],
    }),
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: translations['conversation.rename.confirm.action'],
    })
    .click();
};

export const verifyChatRenamed = async (page: Page, chatName: string) => {
  await expect(page.locator('li').filter({ hasText: chatName })).toBeVisible();
};

export const verifyEmptyPinnedChatsMessage = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('menuitem', {
      name: translations['chatbox.emptyState.noPinnedChats'],
    }),
  ).toBeVisible();
};

export const verifyPinnedChatsNotEmpty = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('menuitem', {
      name: translations['chatbox.emptyState.noPinnedChats'],
    }),
  ).not.toBeVisible();
};

export const selectPinAction = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('menuitem', {
      name: translations['conversation.addToPinnedChats'],
      exact: true,
    })
    .click();
};

export const selectUnpinAction = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('menuitem', {
      name: translations['conversation.removeFromPinnedChats'],
      exact: true,
    })
    .click();
};

export const verifyChatPinned = async (page: Page, chatName: string) => {
  const sidePanel = page.locator('.pf-v6-c-drawer__panel-main');
  const validChat = sidePanel.locator('li.pf-chatbot__menu-item').first();
  await expect(validChat).toContainText(chatName);
};

export const verifyPinActionAvailable = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('menuitem', {
      name: translations['conversation.addToPinnedChats'],
      exact: true,
    }),
  ).toBeVisible();
};

export const verifyUnpinActionAvailable = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('menuitem', {
      name: translations['conversation.removeFromPinnedChats'],
      exact: true,
    }),
  ).toBeVisible();
};

export const selectDeleteAction = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('menuitem', { name: translations['conversation.delete'] })
    .click();
};

export const verifyDeleteConfirmation = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(page.locator('#delete-modal')).toContainText(
    translations['conversation.delete.confirm.title'],
  );
  await expect(page.locator('#delete-modal-body-confirmation')).toContainText(
    translations['conversation.delete.confirm.message'],
  );
  await expect(
    page.getByLabel(translations['conversation.delete.confirm.title']),
  ).toMatchAriaSnapshot(`
    - button "${translations['conversation.delete.confirm.action']}"
    - button "${translations['common.cancel']}"
    `);
};

export const cancelChatDeletion = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('button', { name: translations['common.cancel'] })
    .click();
};

export const confirmChatDeletion = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('button', {
      name: translations['conversation.delete.confirm.action'],
    })
    .click();
};

export const verifyChatDeleted = async (page: Page, chatName: string) => {
  await expect(
    page.locator('li').filter({ hasText: chatName }),
  ).not.toBeVisible();
};

export const openChatbotSettings = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('button', { name: translations['aria.settings.label'] })
    .click();
};

export const verifyChatbotSettingsVisible = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('button', { name: translations['aria.settings.label'] }),
  ).toBeVisible();
};

export const verifyPinnedSectionVisible = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('heading', {
      name: translations['conversation.category.pinnedChats'],
    }),
  ).toBeVisible();
};

export const verifyPinnedSectionHidden = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('heading', {
      name: translations['conversation.category.pinnedChats'],
    }),
  ).not.toBeVisible();
};

export const verifyDisablePinnedChatsOption = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(page.getByLabel('Chatbot', { exact: true }))
    .toMatchAriaSnapshot(`
    - menu:
      - menuitem "${translations['settings.pinned.disable']} ${translations['settings.pinned.enabled.description']}"
    `);
};

export const verifyEnablePinnedChatsOption = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(page.getByLabel('Chatbot', { exact: true }))
    .toMatchAriaSnapshot(`
    - menu:
      - menuitem "${translations['settings.pinned.enable']} ${translations['settings.pinned.disabled.description']}"
    `);
};

export const selectDisablePinnedChats = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('menuitem', { name: translations['settings.pinned.disable'] })
    .click();
};

export const selectEnablePinnedChats = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('menuitem', { name: translations['settings.pinned.enable'] })
    .click();
};

export const searchChats = async (
  page: Page,
  searchQuery: string,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('textbox', { name: translations['chatbox.search.placeholder'] })
    .fill(searchQuery);
};

export const clearSearch = async (page: Page) => {
  await page.getByRole('button', { name: 'Reset' }).click();
};

export const verifyEmptySearchResults = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(page.getByLabel(translations['conversation.category.recent']))
    .toMatchAriaSnapshot(`
    - heading "${translations['conversation.category.pinnedChats']}"
    - menu:
      - menuitem "${translations['chatbox.emptyState.noPinnedChats']}" 
    - heading "${translations['conversation.category.recent']}"
    - menu:
      - menuitem "${translations['common.noSearchResults']}" 
    `);
};

export const verifyNoResultsFoundMessage = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(page.getByLabel(translations['button.newChat']))
    .toMatchAriaSnapshot(`
    - heading "${translations['chatbox.emptyState.noResults.title']}"
    - text: ${translations['chatbox.emptyState.noResults.body']}
    `);
};

export const verifyChatUnpinned = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page
      .getByRole('menu')
      .filter({ hasText: translations['chatbox.emptyState.noPinnedChats'] }),
  ).toBeVisible();
};
