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

/**
 * RHIDP-14132 / RHDHPLAN-1189 — OKP product-docs RAG citations (mocked LCORE).
 * Covers online + offline OKP URL shapes in one chat response (no-citation /
 * SourcesChip paths are already covered by BYOK / unit suites).
 */

import { expect, test, type Page } from '@playwright/test';

import {
  botResponse,
  conversations,
  OKP_E2E_OFFLINE_DOC_TITLE,
  OKP_E2E_OFFLINE_DOC_URL,
  OKP_E2E_ONLINE_DOC_TITLE,
  OKP_E2E_ONLINE_DOC_URL,
  OKP_E2E_RAG_SOURCE,
  okpOfflineReferencedDocuments,
  okpOnlineReferencedDocuments,
} from './fixtures/responses';
import { botMessageRegion } from './pages/LightspeedPage';
import {
  mockChatHistory,
  mockConversations,
  mockQuery,
  mockQueryWithReferencedDocuments,
} from './utils/devMode';
import {
  bootstrapLightspeedE2ePage,
  LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
} from './utils/lightspeedE2eSetup';
import { sendMessage } from './utils/testHelper';
import type { LightspeedMessages } from './utils/translations';

const OKP_CITATION_PROMPT =
  'How do I get started with Red Hat Developer Hub? Cite product docs.';

const okpOnlineAndOfflineReferencedDocuments = [
  ...okpOnlineReferencedDocuments,
  ...okpOfflineReferencedDocuments,
];

test.describe('OKP product-docs RAG source citations', () => {
  let sharedPage: Page;
  let translations: LightspeedMessages;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    translations = boot.translations;
  });

  test.beforeEach(async () => {
    await mockConversations(sharedPage, conversations, true);
    await mockChatHistory(sharedPage, []);
    await mockQuery(
      sharedPage,
      LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
      conversations,
    );
  });

  test('OKP online and offline citations render links and rag labels', async () => {
    await mockQueryWithReferencedDocuments(
      sharedPage,
      OKP_CITATION_PROMPT,
      conversations,
      okpOnlineAndOfflineReferencedDocuments,
    );

    await sendMessage(OKP_CITATION_PROMPT, sharedPage, translations);

    const botMessage = botMessageRegion(sharedPage);
    await expect(botMessage).toContainText(botResponse);
    await expect(botMessage.locator('.pf-chatbot__sources-card')).toHaveCount(
      1,
    );

    await expect(botMessage.getByText(OKP_E2E_ONLINE_DOC_TITLE)).toBeVisible();
    await expect(
      botMessage.getByRole('link', { name: OKP_E2E_ONLINE_DOC_TITLE }),
    ).toHaveAttribute('href', OKP_E2E_ONLINE_DOC_URL);
    await expect(
      botMessage.getByText(OKP_E2E_RAG_SOURCE, { exact: true }),
    ).toBeVisible();

    await botMessage.getByRole('button', { name: 'Go to next page' }).click();

    await expect(botMessage.getByText(OKP_E2E_OFFLINE_DOC_TITLE)).toBeVisible();
    await expect(
      botMessage.getByRole('link', { name: OKP_E2E_OFFLINE_DOC_TITLE }),
    ).toHaveAttribute('href', OKP_E2E_OFFLINE_DOC_URL);
    await expect(
      botMessage.getByText(OKP_E2E_RAG_SOURCE, { exact: true }),
    ).toBeVisible();
  });
});
