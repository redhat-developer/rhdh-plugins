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
  BYOK_E2E_DOC_TITLE,
  BYOK_E2E_DOC_URL,
  BYOK_E2E_RAG_ID,
  botResponse,
  byokReferencedDocumentWithoutSource,
  byokReferencedDocuments,
  conversations,
} from './fixtures/responses';
import {
  botMessageRegion,
  expectInlineRagSourceLabels,
  expectNoInlineSourceCards,
  expectSourcesPopoverRagLabels,
  openSourcesPopover,
} from './pages/LightspeedPage';
import {
  NotebookSurfacePage,
  NOTEBOOK_UNTITLED_GRID_NAME,
} from './pages/NotebookSurfacePage';
import {
  mockChatHistory,
  mockConversations,
  mockQuery,
  mockQueryWithReferencedDocuments,
  withNotebookTabSeededConversation,
} from './utils/devMode';
import {
  bootstrapLightspeedE2ePage,
  LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
} from './utils/lightspeedE2eSetup';
import {
  localeNotebookUpload1Path,
  NOTEBOOK_EDITOR_URL_RE,
} from './utils/notebooks';
import { openLightspeed, sendMessage } from './utils/testHelper';
import {
  formatSourcesChipLabel,
  type LightspeedMessages,
} from './utils/translations';

const BYOK_MATCH_PROMPT = 'What does my custom knowledge document cover?';
const NO_BYOK_MATCH_PROMPT = 'Tell me a generic fact with no citations';

test.describe('BYOK RAG source labeling (RHIDP-14772)', () => {
  let sharedPage: Page;
  let translations: LightspeedMessages;
  let locale: string;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    translations = boot.translations;
    locale = boot.locale;
  });

  test.beforeEach(async () => {
    await mockConversations(sharedPage, conversations, true);
    await mockChatHistory(sharedPage, []);
    await mockQuery(
      sharedPage,
      LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
      conversations,
    );
    await openLightspeed(sharedPage);
  });

  test('attributed BYOK response shows rag_id labels on inline source cards', async () => {
    await mockQueryWithReferencedDocuments(
      sharedPage,
      BYOK_MATCH_PROMPT,
      conversations,
      byokReferencedDocuments,
    );

    await sendMessage(BYOK_MATCH_PROMPT, sharedPage, translations);

    const botMessage = botMessageRegion(sharedPage);
    await expect(botMessage).toContainText(botResponse);
    await expect(botMessage.getByText(BYOK_E2E_DOC_TITLE)).toBeVisible();
    await expect(
      botMessage.getByRole('link', { name: BYOK_E2E_DOC_TITLE }),
    ).toHaveAttribute('href', BYOK_E2E_DOC_URL);
    await expectInlineRagSourceLabels(sharedPage, [
      BYOK_E2E_RAG_ID,
      'product-docs',
    ]);
  });

  test('response without BYOK citations renders with no source cards', async () => {
    await sendMessage(NO_BYOK_MATCH_PROMPT, sharedPage, translations);

    const botMessage = botMessageRegion(sharedPage);
    await expect(botMessage).toContainText(botResponse);
    await expectNoInlineSourceCards(sharedPage);
  });

  test('referenced documents without source omit rag_id labels', async () => {
    await mockQueryWithReferencedDocuments(
      sharedPage,
      BYOK_MATCH_PROMPT,
      conversations,
      byokReferencedDocumentWithoutSource,
    );

    await sendMessage(BYOK_MATCH_PROMPT, sharedPage, translations);

    const botMessage = botMessageRegion(sharedPage);
    await expect(botMessage.getByText('generic-doc.md')).toBeVisible();
    await expect(botMessage.getByText(BYOK_E2E_RAG_ID)).toHaveCount(0);
  });

  test('notebook sources popover lists rag_id labels next to document titles', async ({}, testInfo) => {
    const { fileName } = localeNotebookUpload1Path(testInfo.project.name);
    const notebooks = new NotebookSurfacePage(sharedPage, translations, locale);
    let endMocks: (() => Promise<void>) | undefined;

    try {
      endMocks = await withNotebookTabSeededConversation(sharedPage, {
        conversationId: 'byok-rag-label-e2e',
        chatHistory: [
          {
            provider: 'vllm',
            model: 'llama3.2:3b',
            messages: [
              {
                content: `Tell me about ${fileName}`,
                type: 'user',
                referenced_documents: null,
              },
              {
                content: `Summary from ${fileName}.`,
                type: 'assistant',
                referenced_documents: [
                  {
                    doc_title: fileName,
                    doc_url: 'https://example.com/my-doc',
                    source: BYOK_E2E_RAG_ID,
                  },
                ],
              },
            ],
            started_at: '2026-05-04T12:08:13Z',
            completed_at: '2026-05-04T12:08:26Z',
          },
        ],
      });

      await notebooks.gotoFullscreenNotebooksTab();
      await notebooks.clickPrimaryNotebookCreate();
      await expect(sharedPage).toHaveURL(NOTEBOOK_EDITOR_URL_RE);

      const chipLabel = formatSourcesChipLabel(translations, 1);
      await expect(
        sharedPage.getByRole('button', { name: chipLabel }),
      ).toBeVisible();
      await openSourcesPopover(sharedPage, translations);
      await expectSourcesPopoverRagLabels(sharedPage, translations, [
        BYOK_E2E_RAG_ID,
      ]);
      await expect(
        sharedPage.getByRole('dialog', {
          name: translations['sources.modal.title'],
        }),
      ).toContainText(fileName);

      await notebooks.clickCloseNotebookEditor();
      const card = notebooks.newestUntitledNotebookCard();
      await notebooks.notebookCardOverflowMenuButton(card).click();
      await notebooks.deleteNotebookOverflowMenuItem().click();
      await notebooks
        .notebookDeleteConfirmationDialog(NOTEBOOK_UNTITLED_GRID_NAME)
        .confirmDeletion();
    } finally {
      await endMocks?.();
    }
  });
});
