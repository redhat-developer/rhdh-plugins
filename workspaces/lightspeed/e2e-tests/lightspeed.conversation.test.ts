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

import { test, expect, Page } from '@playwright/test';
import {
  conversations,
  contents,
  demoChatContent,
  botResponse,
  moreConversations,
  thinkingContent,
  assistantResponse,
} from './fixtures/responses';
import {
  sendMessage,
  verifyFeedbackButtons,
  submitFeedback,
  assertClipboardContains,
} from './utils/testHelper';
import {
  expectChatInputValue,
  expectChatStopButtonVisible,
  chatStopButton,
  waitForChatMessageLoadingHidden,
} from './pages/LightspeedPage';
import { verifySidePanelConversation } from './utils/sidebar';
import {
  openChatContextMenu,
  openChatContextMenuByName,
  verifyChatContextMenuOptions,
  selectRenameAction,
  verifyRenameChatForm,
  submitChatRename,
  verifyChatRenamed,
  verifyEmptyPinnedChatsMessage,
  verifyPinnedChatsNotEmpty,
  selectPinAction,
  verifyChatPinned,
  verifyPinActionAvailable,
  selectDeleteAction,
  verifyDeleteConfirmation,
  cancelChatDeletion,
  confirmChatDeletion,
  verifyChatDeleted,
  openChatbotSettings,
  verifyChatbotSettingsVisible,
  verifyPinnedSectionVisible,
  verifyPinnedSectionHidden,
  verifyDisablePinnedChatsOption,
  verifyEnablePinnedChatsOption,
  selectDisablePinnedChats,
  selectEnablePinnedChats,
  verifyUnpinActionAvailable,
  selectUnpinAction,
  searchChats,
  verifyEmptySearchResults,
  verifyNoResultsFoundMessage,
  verifyChatUnpinned,
  clearSearch,
  openSortDropdown,
  verifySortDropdownOptions,
  selectSortOption,
  verifySortDropdownVisible,
  closeSortDropdown,
  verifyConversationsSortedAlphabetically,
} from './utils/chatManagement';
import {
  mockChatHistory,
  mockChatHistoryWithRedactedThinking,
  mockConversations,
  mockQueryWithResponseDelay,
} from './utils/devMode';
import { LightspeedMessages } from './utils/translations';
import { runAccessibilityTests } from './utils/accessibility';
import {
  bootstrapLightspeedE2ePage,
  LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
} from './utils/lightspeedE2eSetup';

test.describe('Lightspeed conversation', () => {
  let translations: LightspeedMessages;
  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    translations = boot.translations;
  });

  test.describe('Conversation', () => {
    test.beforeEach(async () => {
      await mockConversations(sharedPage, conversations, true);
      await mockChatHistory(sharedPage, contents);
    });

    test('Bot response, feedback submission, and copy to clipboard', async () => {
      await sendMessage(
        LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
        sharedPage,
        translations,
      );

      const userMessage = sharedPage.locator('.pf-chatbot__message--user');
      const botMessage = sharedPage.locator('.pf-chatbot__message--bot');
      const copyButton = sharedPage.getByRole('button', { name: 'Copy' });

      await expect(userMessage).toBeVisible();
      await expect(userMessage).toContainText(LIGHTSPEED_E2E_DEFAULT_BOT_QUERY);

      await expect(botMessage).toBeVisible();
      await expect(botMessage).toContainText(botResponse);
      await verifyFeedbackButtons(sharedPage);
      await submitFeedback(sharedPage, 'Good response', translations);
      await submitFeedback(sharedPage, 'Bad response', translations);
      await copyButton.click();
      await assertClipboardContains(sharedPage, botResponse);
    });

    test('Conversation is created and shown in side panel', async () => {
      await sendMessage('test', sharedPage, translations);
      await verifySidePanelConversation(sharedPage, translations);
    });

    test('Verify scroll controls in Conversation', async ({
      browser,
    }, testInfo) => {
      await mockChatHistory(sharedPage, demoChatContent);

      const message = demoChatContent[0].messages[0].content;
      await sendMessage(message, sharedPage, translations, false);

      const jumpTopButton = sharedPage.getByRole('button', {
        name: translations['aria.scroll.up'],
      });
      const jumpBottomButton = sharedPage.getByRole('button', {
        name: translations['aria.scroll.down'],
      });

      await runAccessibilityTests(sharedPage, testInfo);
      await expect(jumpTopButton).toBeVisible();
      await jumpTopButton.click();
      await sharedPage.waitForTimeout(500);
      await expect(
        sharedPage.locator('span').filter({ hasText: message }),
      ).toBeVisible();

      await verifySidePanelConversation(sharedPage, translations);
      await expect(jumpBottomButton).toBeVisible();
      await jumpBottomButton.click();

      const responseMessage = sharedPage
        .locator('div.pf-chatbot__message-response')
        .last();
      await expect(responseMessage).toHaveText(/OpenShift deployment/);
    });

    test('Filter and switch conversations', async () => {
      await mockConversations(sharedPage, moreConversations);
      await sendMessage('test', sharedPage, translations);
      const sidePanel = sharedPage.locator('.pf-v6-c-drawer__panel-main');

      const currentChat = sidePanel.locator('li.pf-chatbot__menu-item--active');
      await expect(currentChat).toHaveText(moreConversations[0].topic_summary);

      const chats = sidePanel.locator('li.pf-chatbot__menu-item');
      await expect(chats).toHaveCount(3);

      const searchText = moreConversations[1].topic_summary;
      const searchBox = sidePanel.getByPlaceholder(
        translations['chatbox.search.placeholder'],
      );
      await searchBox.fill('new');
      const validChat = sidePanel
        .locator('li.pf-chatbot__menu-item')
        .filter({ hasText: searchText })
        .first();

      const chatItems = await chats.all();
      for (const chat of chatItems) {
        const text = await chat.textContent();
        if (text?.includes(translations['chatbox.emptyState.noPinnedChats'])) {
          continue;
        }
        await expect(chat).toContainText(searchText);
      }
      await validChat.click();

      const userMessage = sharedPage.locator('.pf-chatbot__message--user');
      const botMessage = sharedPage.locator('.pf-chatbot__message--bot');

      await expect(userMessage).toContainText(contents[0].messages[0].content);
      await expect(botMessage).toContainText(assistantResponse);
    });

    test('Stop ends in-progress reply and restores the prompt in the input', async () => {
      const stopFlowPrompt = 'Stop button restores prompt in input';

      await mockQueryWithResponseDelay(
        sharedPage,
        stopFlowPrompt,
        conversations,
        5_000,
      );
      await sendMessage(stopFlowPrompt, sharedPage, translations, false);
      await expectChatStopButtonVisible(sharedPage);
      await chatStopButton(sharedPage).click();
      await expectChatInputValue(sharedPage, translations, stopFlowPrompt);
      await waitForChatMessageLoadingHidden(sharedPage);
    });

    test.describe('Chat Management', () => {
      const testChatName = 'Test Rename';

      test('Verify chat actions menu', async () => {
        await sharedPage.reload();
        await openChatContextMenu(sharedPage);
        await verifyChatContextMenuOptions(sharedPage, translations);
      });

      test('Verify Rename chat and its actions', async () => {
        await selectRenameAction(sharedPage, translations);
        await verifyRenameChatForm(sharedPage, translations);
        await submitChatRename(sharedPage, testChatName, translations);
        await verifyChatRenamed(sharedPage, testChatName);
      });

      test('Verify pin chat and its actions', async () => {
        await verifyEmptyPinnedChatsMessage(sharedPage, translations);
        await openChatContextMenu(sharedPage);
        await verifyPinActionAvailable(sharedPage, translations);
        await selectPinAction(sharedPage, translations);
        await verifyChatPinned(sharedPage, testChatName);
        await verifyPinnedChatsNotEmpty(sharedPage, translations);
      });

      test('Verify delete chat and its actions', async () => {
        await verifyChatRenamed(sharedPage, testChatName);
        await openChatContextMenuByName(sharedPage, testChatName, translations);
        await selectDeleteAction(sharedPage, translations);
        await verifyDeleteConfirmation(sharedPage, translations);
        await cancelChatDeletion(sharedPage, translations);
        await verifyChatRenamed(sharedPage, testChatName);

        await openChatContextMenuByName(sharedPage, testChatName, translations);
        await selectDeleteAction(sharedPage, translations);
        await confirmChatDeletion(sharedPage, translations);
        await verifyChatDeleted(sharedPage, testChatName);
      });

      test('Verify disable pinned chats section via settings', async () => {
        await verifyPinnedSectionVisible(sharedPage, translations);
        await verifyEmptyPinnedChatsMessage(sharedPage, translations);
        await verifyChatbotSettingsVisible(sharedPage, translations);
        await openChatbotSettings(sharedPage, translations);
        await verifyDisablePinnedChatsOption(sharedPage, translations);
        await selectDisablePinnedChats(sharedPage, translations);
        await verifyPinnedSectionHidden(sharedPage, translations);
        await verifyPinnedChatsNotEmpty(sharedPage, translations);
      });

      test('Verify enable pinned chats section via settings', async () => {
        await verifyPinnedSectionHidden(sharedPage, translations);
        await verifyPinnedChatsNotEmpty(sharedPage, translations);
        await openChatbotSettings(sharedPage, translations);
        await verifyEnablePinnedChatsOption(sharedPage, translations);
        await selectEnablePinnedChats(sharedPage, translations);
        await verifyPinnedSectionVisible(sharedPage, translations);
        await verifyEmptyPinnedChatsMessage(sharedPage, translations);
      });

      test.describe('Search no-results scenarios', () => {
        test('Verify search results when chats are not pinned', async () => {
          await searchChats(sharedPage, 'dummy search', translations);
          await verifyEmptySearchResults(sharedPage, translations);
        });

        test('Verify search results when chats are pinned', async () => {
          await sharedPage.reload();
          await openChatContextMenu(sharedPage);
          await selectPinAction(sharedPage, translations);
          await searchChats(sharedPage, 'dummy search', translations);
          await verifyNoResultsFoundMessage(sharedPage, translations);
        });
      });

      test('Verify unpin chat action removes chat from pinned section', async () => {
        await clearSearch(sharedPage);
        await openChatContextMenu(sharedPage);
        await verifyUnpinActionAvailable(sharedPage, translations);
        await selectUnpinAction(sharedPage, translations);
        await verifyChatUnpinned(sharedPage, translations);
      });

      test('Verify sort dropdown is available', async () => {
        await verifySortDropdownVisible(sharedPage, translations);
        await openSortDropdown(sharedPage, translations);
        await verifySortDropdownOptions(sharedPage, translations);
        await closeSortDropdown(sharedPage);
      });

      test('Verify conversations are sorted correctly', async () => {
        await openSortDropdown(sharedPage, translations);
        await selectSortOption(sharedPage, 'alphabeticalAsc', translations);
        await verifyConversationsSortedAlphabetically(
          sharedPage,
          translations,
          'asc',
        );

        await openSortDropdown(sharedPage, translations);
        await selectSortOption(sharedPage, 'alphabeticalDesc', translations);
        await verifyConversationsSortedAlphabetically(
          sharedPage,
          translations,
          'desc',
        );

        await openSortDropdown(sharedPage, translations);
        await selectSortOption(sharedPage, 'newest', translations);
      });
    });

    test('Verify thinking section is displayed in bot response', async () => {
      await mockChatHistoryWithRedactedThinking(sharedPage);
      await sharedPage.reload();
      const botMessage = sharedPage.locator('.pf-chatbot__message--bot').last();
      await expect(botMessage).toBeVisible();
      await expect(
        sharedPage.getByRole('button', {
          name: translations['reasoning.thinking'],
        }),
      ).toBeVisible();
      await expect(sharedPage.locator('#deep-thinking-1')).toBeVisible();
      await expect(
        sharedPage.getByLabel(translations['reasoning.thinking']),
      ).toContainText(thinkingContent);
    });
  });
});
