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

import { expect, test, type Page } from '@playwright/test';

import {
  NOTEBOOK_E2E_RAG_CONVERSATION_ID,
  notebookRagConversationAssistantPlainTextForUploadTitle,
  notebookRagConversationChatHistoryForUploadTitle,
  notebookRagConversationUserPromptForUploadTitle,
} from './fixtures/responses';
import {
  NotebookSurfacePage,
  NOTEBOOK_UNTITLED_GRID_NAME,
} from './pages/NotebookSurfacePage';
import { withNotebookTabSeededConversation } from './utils/devMode';
import { bootstrapLightspeedE2ePage } from './utils/lightspeedE2eSetup';
import {
  localeNotebookUpload1Path,
  NOTEBOOK_EDITOR_URL_RE,
} from './utils/notebooks';
import type { LightspeedMessages } from './utils/translations';
import {
  assertClipboardContains,
  submitFeedback,
  verifyFeedbackButtons,
} from './utils/testHelper';

test.describe('Lightspeed notebooks conversation', () => {
  let sharedPage: Page;
  let translations: LightspeedMessages;
  let notebooks: NotebookSurfacePage;
  let endMocks: (() => Promise<void>) | undefined;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    translations = boot.translations;
    notebooks = new NotebookSurfacePage(sharedPage, translations);
  });

  test.afterAll(async () => {
    await endMocks?.();
  });

  test('notebook tab: seeded conversation, feedback, clipboard, and delete notebook', async ({}, testInfo) => {
    const { fileName } = localeNotebookUpload1Path(testInfo.project.name);
    const assistantPlain =
      notebookRagConversationAssistantPlainTextForUploadTitle(fileName);
    const chatHistory =
      notebookRagConversationChatHistoryForUploadTitle(fileName);

    endMocks = await withNotebookTabSeededConversation(sharedPage, {
      conversationId: NOTEBOOK_E2E_RAG_CONVERSATION_ID,
      chatHistory,
    });

    await notebooks.gotoFullscreenNotebooksTab();
    await notebooks.clickPrimaryNotebookCreate();
    await expect(sharedPage).toHaveURL(NOTEBOOK_EDITOR_URL_RE);

    const region = notebooks.chatbotRegion();
    const userMessage = region.locator('.pf-chatbot__message--user');
    const botMessage = region.locator('.pf-chatbot__message--bot');
    const copyButton = sharedPage.getByRole('button', { name: 'Copy' });

    await expect(userMessage).toContainText(
      notebookRagConversationUserPromptForUploadTitle(fileName),
      { timeout: 5_000 },
    );
    await expect(botMessage).toContainText(assistantPlain, {
      timeout: 5_000,
    });

    await verifyFeedbackButtons(sharedPage);
    await submitFeedback(sharedPage, 'Good response', translations);
    await submitFeedback(sharedPage, 'Bad response', translations);

    await copyButton.click();
    await assertClipboardContains(sharedPage, assistantPlain);

    await notebooks.clickCloseNotebookEditor();
    const untitledCountBeforeDelete = await notebooks
      .untitledNotebookCards()
      .count();

    const cardCreatedThisTest = notebooks.newestUntitledNotebookCard();
    await notebooks.notebookCardOverflowMenuButton(cardCreatedThisTest).click();
    await notebooks.deleteNotebookOverflowMenuItem().click();

    const confirmDelete = notebooks.notebookDeleteConfirmationDialog(
      NOTEBOOK_UNTITLED_GRID_NAME,
    );
    await confirmDelete.expectDialogVisible();
    await confirmDelete.expectPermanentDeletionWarningText();
    await confirmDelete.confirmDeletion();

    await notebooks.expectUntitledNotebookCardCount(
      untitledCountBeforeDelete - 1,
    );
  });
});
