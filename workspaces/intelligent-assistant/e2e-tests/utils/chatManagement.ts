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

import { Page, expect, type Locator } from '@playwright/test';
import { LightspeedMessages, evaluateMessage } from './translations';

export const sidePanelLocator = (page: Page): Locator =>
  page.locator('.pf-v6-c-drawer__panel-main');

export const chatsMenu = (
  page: Page,
  translations: LightspeedMessages,
): Locator =>
  sidePanelLocator(page).getByRole('menu', {
    name: translations['conversation.category.recent'],
    exact: true,
  });

export const pinnedChatsMenu = (
  page: Page,
  translations: LightspeedMessages,
): Locator =>
  sidePanelLocator(page).getByRole('menu', {
    name: translations['conversation.category.pinnedChats'],
    exact: true,
  });

export const savedPromptsMenuItems = (
  page: Page,
  _translations: LightspeedMessages,
): Locator =>
  sidePanelLocator(page)
    .locator('.lightspeed-saved-prompts-group')
    .locator('.pf-chatbot__menu-item');

export const pinnedChatsMenuItems = (
  page: Page,
  translations: LightspeedMessages,
): Locator =>
  pinnedChatsMenu(page, translations).locator('li.pf-chatbot__menu-item');

export const recentChatsMenuItems = (
  page: Page,
  translations: LightspeedMessages,
): Locator => chatsMenu(page, translations).locator('li.pf-chatbot__menu-item');

export const openChatContextMenu = async (
  page: Page,
  translations: LightspeedMessages,
  chatIndex = 0,
) => {
  await chatsMenu(page, translations)
    .locator('.pf-chatbot__history-actions')
    .nth(chatIndex)
    .click();
};

export const openPinnedChatContextMenu = async (
  page: Page,
  translations: LightspeedMessages,
  chatIndex = 0,
) => {
  await pinnedChatsMenu(page, translations)
    .locator('.pf-chatbot__history-actions')
    .nth(chatIndex)
    .click();
};

export const openChatContextMenuByName = async (
  page: Page,
  chatName: string,
  translations: LightspeedMessages,
) => {
  await sidePanelLocator(page)
    .locator('li.pf-chatbot__menu-item')
    .filter({ hasText: chatName })
    .locator('.pf-chatbot__history-actions')
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
  const dialog = page.getByRole('dialog', {
    name: translations['conversation.rename.confirm.title'],
  });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole('textbox', {
      name: translations['conversation.rename.placeholder'],
    }),
  ).toBeVisible();
  await expect(dialog).toMatchAriaSnapshot(`
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

export const verifyChatRenamed = async (
  page: Page,
  chatName: string,
  _translations: LightspeedMessages,
) => {
  await expect(
    sidePanelLocator(page)
      .locator('li.pf-chatbot__menu-item')
      .filter({ hasText: chatName }),
  ).toBeVisible();
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

export const verifyChatPinned = async (
  page: Page,
  chatName: string,
  translations: LightspeedMessages,
) => {
  const pinnedChat = pinnedChatsMenuItems(page, translations).first();
  await expect(pinnedChat).toContainText(chatName);
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
  chatName = '',
) => {
  const title = evaluateMessage(
    translations['conversation.delete.confirm.title'],
    chatName,
  );
  await expect(page.locator('#delete-modal')).toContainText(title);
  await expect(page.locator('#delete-modal-confirmation')).toContainText(
    translations['conversation.delete.confirm.message'],
  );
  await expect(page.getByLabel(title)).toMatchAriaSnapshot(`
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

export const verifyChatDeleted = async (
  page: Page,
  chatName: string,
  _translations: LightspeedMessages,
) => {
  await expect(
    sidePanelLocator(page)
      .locator('li.pf-chatbot__menu-item')
      .filter({ hasText: chatName }),
  ).not.toBeVisible();
};

export const openChatbotSettings = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('button', { name: translations['aria.options.label'] })
    .click();
};

export const verifyChatbotSettingsVisible = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('button', { name: translations['aria.options.label'] }),
  ).toBeVisible();
};

export const verifyPinnedSectionVisible = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('heading', {
      name: translations['conversation.category.pinnedChats'],
      exact: true,
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
      exact: true,
    }),
  ).not.toBeVisible();
};

export const verifyDisablePinnedChatsOption = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('menuitem', {
      name: `${translations['settings.pinned.disable']} ${translations['settings.pinned.enabled.description']}`,
    }),
  ).toBeVisible();
};

export const verifyEnablePinnedChatsOption = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('menuitem', {
      name: `${translations['settings.pinned.enable']} ${translations['settings.pinned.disabled.description']}`,
    }),
  ).toBeVisible();
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
  await expect(
    pinnedChatsMenu(page, translations).getByRole('menuitem', {
      name: translations['chatbox.emptyState.noPinnedChats'],
    }),
  ).toBeVisible();
  await expect(
    chatsMenu(page, translations).getByRole('menuitem', {
      name: translations['common.noSearchResults'],
    }),
  ).toBeVisible();
};

export const verifyNoResultsFoundMessage = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('heading', {
      name: translations['chatbox.emptyState.noResults.title'],
    }),
  ).toBeVisible();
  await expect(
    page.getByText(translations['chatbox.emptyState.noResults.body']),
  ).toBeVisible();
};

export const verifyChatUnpinned = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    pinnedChatsMenu(page, translations).getByRole('menuitem', {
      name: translations['chatbox.emptyState.noPinnedChats'],
    }),
  ).toBeVisible();
};

export type SortOption =
  'newest' | 'oldest' | 'alphabeticalAsc' | 'alphabeticalDesc';

export const openSortDropdown = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page.getByRole('button', { name: translations['sort.label'] }).click();
};

export const verifySortDropdownOptions = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(page.locator('#sort-select')).toMatchAriaSnapshot(`
    - listbox:
      - option "${translations['sort.newest']}"
      - option "${translations['sort.oldest']}"
      - option "${translations['sort.alphabeticalAsc']}"
      - option "${translations['sort.alphabeticalDesc']}"
    `);
};

export const selectSortOption = async (
  page: Page,
  sortOption: SortOption,
  translations: LightspeedMessages,
) => {
  const sortOptionLabels: Record<SortOption, keyof LightspeedMessages> = {
    newest: 'sort.newest',
    oldest: 'sort.oldest',
    alphabeticalAsc: 'sort.alphabeticalAsc',
    alphabeticalDesc: 'sort.alphabeticalDesc',
  };
  await page
    .getByRole('option', { name: translations[sortOptionLabels[sortOption]] })
    .click();
};

export const getConversationNames = async (
  page: Page,
  translations: LightspeedMessages,
): Promise<string[]> => {
  const chatItems = await recentChatsMenuItems(page, translations).all();
  const names: string[] = [];

  for (const item of chatItems) {
    const text = await item.textContent();
    if (text) {
      names.push(text.trim());
    }
  }

  return names;
};

export const verifyConversationsSortedAlphabetically = async (
  page: Page,
  translations: LightspeedMessages,
  order: 'asc' | 'desc' = 'asc',
) => {
  const conversationNames = await getConversationNames(page, translations);

  const sortedNames = [...conversationNames].sort((a, b) =>
    order === 'asc'
      ? a.localeCompare(b, undefined, { sensitivity: 'base' })
      : b.localeCompare(a, undefined, { sensitivity: 'base' }),
  );

  expect(conversationNames).toEqual(sortedNames);
};

export const verifySortDropdownVisible = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('button', { name: translations['sort.label'] }),
  ).toBeVisible();
};

export const closeSortDropdown = async (page: Page) => {
  await page.keyboard.press('Escape');
};
