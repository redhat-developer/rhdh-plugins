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
  models,
  conversations,
  contents,
  demoChatContent,
  botResponse,
  moreConversations,
  mockedShields,
  E2E_MCP_VALID_TOKEN,
  mcpServerScenarios,
  tokenCredentialNoUrlScenario,
  tokenCredentialValidationScenario,
  type McpServersListMock,
  thinkingContent,
  assistantResponse,
  generateQueryResponseWithMcpToolCall,
  modelBaseUrl,
} from './fixtures/responses';
import {
  openLightspeed,
  sendMessage,
  verifyFeedbackButtons,
  submitFeedback,
  assertClipboardContains,
  switchToLocale,
} from './utils/testHelper';
import {
  openChatbot,
  selectDisplayMode,
  openChatHistoryDrawer,
  closeChatHistoryDrawer,
  expectBackstagePageVisible,
  expectChatbotControlsVisible,
  verifyDisplayModeMenuOptions,
  expectChatInputAreaVisible,
  expectChatInputValue,
  expectChatStopButtonVisible,
  expectEmptyChatHistory,
  expectConversationArea,
  chatStopButton,
  verifyMcpSettingsPanel,
  waitForChatMessageLoadingHidden,
  openMcpSettingsPanel,
  closeMcpSettingsPanel,
  mcpServerToggle,
  mcpServerRow,
  clickMcpServersStatusColumn,
  clickMcpServersNameColumn,
  mcpServersTableBodyRows,
  type DisplayMode,
} from './pages/LightspeedPage';
import { McpConfigureTokenPage } from './pages/McpConfigureTokenPage';
import {
  uploadFiles,
  uploadAndAssertDuplicate,
  supportedFileTypes,
  validateFailedUpload,
  assertVisibilityState,
} from './utils/fileUpload';
import {
  assertChatDialogInitialState,
  closeChatDrawer,
  openChatDrawer,
  assertDrawerState,
  verifySidePanelConversation,
} from './utils/sidebar';
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
import { login } from './utils/login';
import {
  mockChatHistory,
  mockConversations,
  mockFeedbackStatus,
  mockMcpServers,
  mockModels,
  mockQuery,
  mockQueryWithResponseDelay,
  mockShields,
} from './utils/devMode';
import {
  LightspeedMessages,
  evaluateMessage,
  formatMcpToolCountStatus,
  getTranslations,
} from './utils/translations';
import { runAccessibilityTests } from './utils/accessibility';

test.describe('Lightspeed tests', () => {
  const botQuery = 'Please respond';
  let translations: LightspeedMessages;
  let sharedPage: Page;
  let locale: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    locale = await sharedPage.evaluate(() => globalThis.navigator.language);
    translations = getTranslations(locale);

    await mockModels(sharedPage, models);
    await mockConversations(sharedPage);
    await mockChatHistory(sharedPage);
    await mockQuery(sharedPage, botQuery, conversations);
    await mockShields(sharedPage, mockedShields);
    await mockMcpServers(sharedPage);
    await mockFeedbackStatus(sharedPage);

    await sharedPage.goto('/');
    await login(sharedPage, process.env.RHDH_USER, process.env.RHDH_PASSWORD);

    await switchToLocale(sharedPage, locale);
    await openLightspeed(sharedPage);
  });

  test.describe('Chatbot Display Modes', () => {
    test.beforeEach(async () => {
      await sharedPage.goto('/');
    });

    test('should display chatbot in overlay mode with backstage page visible', async () => {
      await expectBackstagePageVisible(sharedPage);
      await openChatbot(sharedPage);

      await expectConversationArea(sharedPage, translations, 'Overlay');
      await expectChatInputAreaVisible(sharedPage, translations);
      await expectBackstagePageVisible(sharedPage);
      await expectChatbotControlsVisible(sharedPage, translations);

      await openChatHistoryDrawer(sharedPage, translations);
      await expectEmptyChatHistory(sharedPage, translations);
      await closeChatHistoryDrawer(sharedPage, translations);

      await verifyDisplayModeMenuOptions(sharedPage, translations);
    });

    test('should display chatbot in dock to window mode with backstage page visible', async () => {
      await openChatbot(sharedPage);
      await selectDisplayMode(sharedPage, translations, 'Dock to window');

      await expectConversationArea(sharedPage, translations, 'Dock to window');
      await expectBackstagePageVisible(sharedPage);
      await expectChatInputAreaVisible(sharedPage, translations);
      await expectChatbotControlsVisible(sharedPage, translations);

      await openChatHistoryDrawer(sharedPage, translations);
      await expectEmptyChatHistory(sharedPage, translations);
      await closeChatHistoryDrawer(sharedPage, translations);
    });

    test('should display chatbot in fullscreen mode with backstage page hidden', async () => {
      await openChatbot(sharedPage);
      await selectDisplayMode(sharedPage, translations, 'Fullscreen');

      await expectConversationArea(sharedPage, translations, 'Fullscreen');
      await expectEmptyChatHistory(sharedPage, translations);
      await expectBackstagePageVisible(sharedPage, false);
    });
  });

  test.describe('Chatbot MCP settings', () => {
    /** Applies mock + opens chatbot + runs panel assertions (single source for `mcpList` vs mock). */
    async function runMcpPanelScenario(mcpList: McpServersListMock) {
      await mockMcpServers(sharedPage, mcpList);
      await openChatbot(sharedPage);
      await verifyMcpSettingsPanel(sharedPage, translations, mcpList);
    }

    /** Opens the chatbot and sets display mode before MCP configure-server token flows. */
    async function openChatbotInDisplayMode(mode: DisplayMode) {
      await openChatbot(sharedPage);
      await selectDisplayMode(sharedPage, translations, mode);
    }

    test.beforeEach(async () => {
      await sharedPage.goto('/');
    });

    test.afterEach(async () => {
      await mockMcpServers(sharedPage);
    });

    test('Overlay', async () => {
      await expectBackstagePageVisible(sharedPage);
      await openChatbot(sharedPage);
      await verifyMcpSettingsPanel(sharedPage, translations);
    });

    test('Dock to Window', async () => {
      await openChatbot(sharedPage);
      await selectDisplayMode(sharedPage, translations, 'Dock to window');
      await verifyMcpSettingsPanel(sharedPage, translations);
    });

    test('Fullscreen', async () => {
      await openChatbot(sharedPage);
      await selectDisplayMode(sharedPage, translations, 'Fullscreen');
      await verifyMcpSettingsPanel(sharedPage, translations);
    });

    test('Empty list', async () => {
      await runMcpPanelScenario(mcpServerScenarios.empty);
    });

    test.describe('Two-row mocks', () => {
      test('All healthy', async () => {
        await runMcpPanelScenario(mcpServerScenarios.allHealthy);
      });

      test('Failed + OK', async () => {
        await runMcpPanelScenario(mcpServerScenarios.errorAndOk);
      });

      test('Disabled + active', async () => {
        await runMcpPanelScenario(mcpServerScenarios.disabledAndOk);
      });

      test('Both need token', async () => {
        await runMcpPanelScenario(mcpServerScenarios.twoTokenRequired);
      });
    });

    test('Sort works as expected', async () => {
      await mockMcpServers(sharedPage, mcpServerScenarios.allHealthy);
      await openChatbot(sharedPage);
      await openMcpSettingsPanel(sharedPage, translations);

      const rows = mcpServersTableBodyRows(sharedPage, translations);
      await expect(rows.nth(0)).toContainText('alpha-mcp');
      await expect(rows.nth(1)).toContainText('beta-mcp');

      await clickMcpServersNameColumn(sharedPage, translations);
      await expect(rows.nth(0)).toContainText('beta-mcp');
      await expect(rows.nth(1)).toContainText('alpha-mcp');

      await closeMcpSettingsPanel(sharedPage, translations);
    });

    test('Toggle works as expected', async () => {
      const serverName = 'mcp-integration-tools';
      await openChatbot(sharedPage);
      await openMcpSettingsPanel(sharedPage, translations);

      const row = mcpServerRow(sharedPage, serverName, translations);
      await clickMcpServersStatusColumn(sharedPage, translations);
      await mcpServerToggle(sharedPage, serverName, translations).click();
      await expect(
        row.getByText(translations['mcp.settings.status.disabled'], {
          exact: true,
        }),
      ).toBeVisible();

      await mcpServerToggle(sharedPage, serverName, translations).click();
      await expect(
        row.getByText(formatMcpToolCountStatus(translations, 14), {
          exact: true,
        }),
      ).toBeVisible();

      await closeMcpSettingsPanel(sharedPage, translations);
    });

    test.describe('Configure MCP server token', () => {
      let mcpToken: McpConfigureTokenPage;

      test.beforeEach(() => {
        mcpToken = new McpConfigureTokenPage(sharedPage, translations);
      });

      test('Valid token saves and row shows tools — Overlay', async () => {
        await mcpToken.gotoMcpSettings(
          tokenCredentialValidationScenario,
          'Overlay',
        );

        const serverName = 'credential-test-mcp';
        await mcpToken.seeRowStatus(
          serverName,
          translations['mcp.settings.status.tokenRequired'],
        );

        await mcpToken.openEditServer(serverName);
        await mcpToken.typeToken(E2E_MCP_VALID_TOKEN);
        await mcpToken.save();

        await mcpToken.seeTokenHidden();
        await mcpToken.seeRowStatus(
          serverName,
          formatMcpToolCountStatus(translations, 5),
        );

        await mcpToken.closeMcpPanel();
      });

      test('Invalid token then valid token — Dock to window', async () => {
        await mcpToken.gotoMcpSettings(
          tokenCredentialValidationScenario,
          'Dock to window',
        );

        const serverName = 'credential-test-mcp';
        await mcpToken.openEditServer(serverName);

        await mcpToken.typeToken('bad-token');
        await mcpToken.save();
        await mcpToken.seeMessage(
          translations['mcp.settings.token.invalidCredentials'],
        );

        await mcpToken.typeToken(E2E_MCP_VALID_TOKEN);
        await mcpToken.save();
        await mcpToken.seeTokenHidden();
        await mcpToken.seeRowStatus(
          serverName,
          formatMcpToolCountStatus(translations, 5),
        );

        await mcpToken.closeMcpPanel();
      });

      test('Cancel discards without saving — Fullscreen', async () => {
        await mcpToken.gotoMcpSettings(
          tokenCredentialValidationScenario,
          'Fullscreen',
        );

        const serverName = 'credential-test-mcp';
        await mcpToken.openEditServer(serverName);
        await mcpToken.typeToken('draft-token');
        await mcpToken.cancel();

        await mcpToken.seeModalClosed();
        await mcpToken.seeRowStatus(
          serverName,
          translations['mcp.settings.status.tokenRequired'],
        );

        await mcpToken.closeMcpPanel();
      });

      test('Server validation failure shows error — Overlay', async () => {
        await mcpToken.gotoMcpSettings(
          tokenCredentialValidationScenario,
          'Overlay',
          {
            failServerValidateFor: 'credential-test-mcp',
            failServerValidateError:
              translations['mcp.settings.token.validationFailed'],
          },
        );

        const serverName = 'credential-test-mcp';
        await mcpToken.openEditServer(serverName);
        await mcpToken.typeToken(E2E_MCP_VALID_TOKEN);
        await mcpToken.save();

        await mcpToken.seeMessage(
          translations['mcp.settings.token.validationFailed'],
        );
        await mcpToken.cancel();
        await mcpToken.closeMcpPanel();
      });

      test('Missing server URL shows error — Dock to window', async () => {
        await mcpToken.gotoMcpSettings(
          tokenCredentialNoUrlScenario,
          'Dock to window',
        );

        const serverName = 'no-url-mcp';
        await mcpToken.openEditServer(serverName);
        await mcpToken.typeToken(E2E_MCP_VALID_TOKEN);
        await mcpToken.save();

        await mcpToken.seeMessage(
          translations['mcp.settings.token.urlUnavailableForValidation'],
        );
        await mcpToken.cancel();
        await mcpToken.closeMcpPanel();
      });

      test('Clear token input empties PAT — Fullscreen', async () => {
        await mcpToken.gotoMcpSettings(
          tokenCredentialNoUrlScenario,
          'Fullscreen',
        );

        await mcpToken.openEditServer('no-url-mcp');
        await mcpToken.typeThenClearToken('e2e-draft-personal-access-token');

        await mcpToken.cancel();
        await mcpToken.closeMcpPanel();
      });
    });
  });

  test('Lightspeed is available', async ({ browser }, testInfo) => {
    await openLightspeed(sharedPage);
    await expect(sharedPage).toHaveURL(/\/lightspeed/);

    const headings = sharedPage.getByRole('heading');
    await expect(headings.first()).toContainText(
      translations['chatbox.header.title'],
    );
    await expect(
      headings.filter({ has: sharedPage.locator('.pf-chatbot__question') }),
    ).toContainText(translations['chatbox.welcome.description']);

    await runAccessibilityTests(sharedPage, testInfo);
  });

  test('Verify disclaimer to be visible', async () => {
    await expect(sharedPage.getByLabel('Scrollable message log'))
      .toMatchAriaSnapshot(`
      - 'heading "Info alert: ${translations['aria.important']}" [level=4]'
      - text: ${translations['disclaimer.withValidation']}
      `);
  });

  test('Models are available', async () => {
    const model = models[1].provider_resource_id;
    const dropdown = sharedPage.locator(
      `button[aria-label="${translations['aria.chatbotSelector']}"]`,
    );
    await expect(dropdown).toHaveText(models[0].provider_resource_id);

    await dropdown.click();
    await sharedPage.getByText(model).click();
    await expect(dropdown).toHaveText(model);
  });

  test('Verify sidebar: initial state, close and reopen', async ({
    browser,
  }, testInfo) => {
    await test.step('Verify initial state of sidebar', async () => {
      await assertChatDialogInitialState(sharedPage, translations);
    });

    await test.step('Close the sidebar and verify elements are hidden', async () => {
      await closeChatDrawer(sharedPage, translations);
      await runAccessibilityTests(sharedPage, testInfo);
      await assertDrawerState(sharedPage, 'closed', translations);
    });

    await test.step('Reopen the sidebar and verify elements are visible again', async () => {
      await openChatDrawer(sharedPage, translations);
      await assertDrawerState(sharedPage, 'open', translations);
    });
  });

  test('verify default prompts are visible', async () => {
    const greeting = evaluateMessage(
      translations['chatbox.welcome.greeting'],
      translations['user.guest'],
    );
    await expect(sharedPage.getByLabel('Scrollable message log'))
      .toMatchAriaSnapshot(`
      - region "Scrollable message log":
        - 'heading "Info alert: ${translations['aria.important']}" [level=4]'
        - text: ${translations['disclaimer.withValidation']}
        - heading "${greeting} ${translations['chatbox.welcome.description']}" [level=1]
        - button /.+/
        - text: /.+/
        - button /.+/
        - text: /.+/
        - button /.+/
        - text: /.+/
    `);
    const messageLog = sharedPage.locator('div.pf-v6-c-card__title-text');
    const textContents = await messageLog.allTextContents();

    const nonEmptyTexts = textContents.filter(text => text.trim().length > 0);

    expect(nonEmptyTexts.length).toBe(3);
  });

  test.describe('File Attachment Validation', () => {
    const testFiles = [
      { path: '../../package.json', name: 'package.json' },
      { path: __filename, name: 'fileAttachment.spec.ts' },
    ];

    function validationTestCase(path: string, name: string) {
      test(`should validate file: ${name}`, async ({ browser }, testInfo) => {
        const fileExtension = `.${name.split('.').pop()}`;
        await uploadFiles(sharedPage, [path]);

        if (supportedFileTypes.includes(fileExtension)) {
          await uploadAndAssertDuplicate(
            sharedPage,
            path,
            name,
            translations,
            testInfo,
          );
        } else {
          await validateFailedUpload(sharedPage, translations);
          // Unsupported files will not be available to preview.
          const filePreview = sharedPage
            .locator('span', { hasText: name.split('.')[0] })
            .first();

          await expect(filePreview).not.toBeVisible();
        }
      });
    }

    for (const { path, name } of testFiles) {
      validationTestCase(path, name);
    }

    test(`Multiple file upload`, async () => {
      const file1 = `packages/app-legacy/e2e-tests/fixtures/uploads/${locale}.upload1.json`;
      const file2 = `packages/app-legacy/e2e-tests/fixtures/uploads/${locale}.upload2.json`;
      await uploadFiles(sharedPage, [file1, file2]);

      const heading = sharedPage.getByRole('heading', {
        name: `Danger alert: ${translations['chatbox.fileUpload.failed']}`,
      });
      const text = sharedPage.getByText(
        translations['file.upload.error.multipleFiles'],
      );
      const closeBtn = sharedPage.getByRole('button', {
        name: 'Close Danger alert:',
      });

      await assertVisibilityState('visible', heading, text, closeBtn);

      await closeBtn.click();

      await assertVisibilityState('hidden', heading, text, closeBtn);
    });
  });

  test.describe('Conversation', () => {
    test.beforeEach(async () => {
      await mockConversations(sharedPage, conversations, true);
      await mockChatHistory(sharedPage, contents);
    });

    test('Bot response, feedback submission, and copy to clipboard', async () => {
      await sendMessage(botQuery, sharedPage, translations);

      const userMessage = sharedPage.locator('.pf-chatbot__message--user');
      const botMessage = sharedPage.locator('.pf-chatbot__message--bot');
      const copyButton = sharedPage.getByRole('button', { name: 'Copy' });

      await expect(userMessage).toBeVisible();
      await expect(userMessage).toContainText(botQuery);

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

    test('Verify thinking section is displayed in bot response', async () => {
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
        // Skip empty state messages (e.g., "No pinned chats")
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
        // Verify alphabetical ascending sort (A-Z)
        await openSortDropdown(sharedPage, translations);
        await selectSortOption(sharedPage, 'alphabeticalAsc', translations);
        await verifyConversationsSortedAlphabetically(
          sharedPage,
          translations,
          'asc',
        );

        // Verify alphabetical descending sort (Z-A)
        await openSortDropdown(sharedPage, translations);
        await selectSortOption(sharedPage, 'alphabeticalDesc', translations);
        await verifyConversationsSortedAlphabetically(
          sharedPage,
          translations,
          'desc',
        );

        // Reset to newest first
        await openSortDropdown(sharedPage, translations);
        await selectSortOption(sharedPage, 'newest', translations);
      });
    });
  });

  test('MCP tool calling renders in UI', async () => {
    const mcpToolCallPrompt = 'test mcp tool call';

    await mockConversations(sharedPage, conversations, true);
    await mockChatHistory(sharedPage, []);
    await openLightspeed(sharedPage);

    await sharedPage.unroute(`${modelBaseUrl}/v1/query`);
    await sharedPage.route(`${modelBaseUrl}/v1/query`, async route => {
      const payload = route.request().postDataJSON();
      if (payload.conversation_id) {
        conversations[1].conversation_id = payload.conversation_id;
      }
      const conversationId =
        conversations[1].conversation_id ?? conversations[0].conversation_id;
      await route.fulfill({
        body: generateQueryResponseWithMcpToolCall(conversationId),
      });
    });

    await sendMessage(mcpToolCallPrompt, sharedPage, translations);

    await expect(
      sharedPage.getByRole('button', {
        name: evaluateMessage(
          translations['toolCall.header'],
          'mcp_list_tools',
        ),
      }),
    ).toBeVisible();

    await sharedPage.unroute(`${modelBaseUrl}/v1/query`);
    await mockQuery(sharedPage, botQuery, conversations);
  });
});
