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
 * Mirrors lightspeed.byok-rag-sources.test.ts; covers online + offline OKP URL shapes.
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
import {
  botMessageRegion,
  expectInlineRagSourceLabels,
  expectNoInlineSourceCards,
} from './pages/LightspeedPage';
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

const OKP_ONLINE_PROMPT =
  'How do I get started with Red Hat Developer Hub? Cite product docs.';
const OKP_OFFLINE_PROMPT =
  'How do I configure authentication in Developer Hub? Cite product docs.';
const NO_OKP_CITATION_PROMPT = 'Tell me a generic fact with no citations';

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

  test('OKP online mode shows docs.redhat.com citation link and rag label', async () => {
    await mockQueryWithReferencedDocuments(
      sharedPage,
      OKP_ONLINE_PROMPT,
      conversations,
      okpOnlineReferencedDocuments,
    );

    await sendMessage(OKP_ONLINE_PROMPT, sharedPage, translations);

    const botMessage = botMessageRegion(sharedPage);
    await expect(botMessage).toContainText(botResponse);
    await expect(botMessage.getByText(OKP_E2E_ONLINE_DOC_TITLE)).toBeVisible();
    await expect(
      botMessage.getByRole('link', { name: OKP_E2E_ONLINE_DOC_TITLE }),
    ).toHaveAttribute('href', OKP_E2E_ONLINE_DOC_URL);
    await expectInlineRagSourceLabels(sharedPage, [OKP_E2E_RAG_SOURCE]);
  });

  test('OKP offline mode shows OKP portal citation link and rag label', async () => {
    await mockQueryWithReferencedDocuments(
      sharedPage,
      OKP_OFFLINE_PROMPT,
      conversations,
      okpOfflineReferencedDocuments,
    );

    await sendMessage(OKP_OFFLINE_PROMPT, sharedPage, translations);

    const botMessage = botMessageRegion(sharedPage);
    await expect(botMessage).toContainText(botResponse);
    await expect(botMessage.getByText(OKP_E2E_OFFLINE_DOC_TITLE)).toBeVisible();
    await expect(
      botMessage.getByRole('link', { name: OKP_E2E_OFFLINE_DOC_TITLE }),
    ).toHaveAttribute('href', OKP_E2E_OFFLINE_DOC_URL);
    await expectInlineRagSourceLabels(sharedPage, [OKP_E2E_RAG_SOURCE]);
  });

  test('response without OKP citations renders with no source cards', async () => {
    await sendMessage(NO_OKP_CITATION_PROMPT, sharedPage, translations);

    const botMessage = botMessageRegion(sharedPage);
    await expect(botMessage).toContainText(botResponse);
    await expectNoInlineSourceCards(sharedPage);
  });
});
