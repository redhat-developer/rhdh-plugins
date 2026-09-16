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
  openChatbot,
  expectChatInputValue,
  waitForBackstageCatalogReady,
} from './pages/LightspeedPage';
import { openChatDrawer } from './utils/sidebar';
import {
  openSavedPromptsSettingsTab,
  savedPromptSidebarItem,
} from './utils/chatManagement';
import { seedSavedPrompts } from './utils/devMode';
import {
  bootstrapLightspeedE2ePage,
  type LightspeedE2eBootstrap,
} from './utils/lightspeedE2eSetup';
import { LightspeedMessages } from './utils/translations';

const seededSavedPrompt = {
  id: 'sp-e2e-1',
  name: 'Deploy checklist',
  content: 'Walk me through a safe deployment.',
  created_at: '2026-03-10T12:00:00.000Z',
  updated_at: '2026-03-10T12:00:00.000Z',
};

async function ensureGuestLoggedIn(page: Page) {
  const enter = page.getByRole('button', { name: 'Enter' });
  if (await enter.isVisible().catch(() => false)) {
    await enter.click();
  }
}

async function openOverlayChatWithSavedPrompts(
  page: Page,
  translations: LightspeedMessages,
) {
  await page.goto('/catalog');
  await ensureGuestLoggedIn(page);
  await waitForBackstageCatalogReady(page);
  seedSavedPrompts(page, [seededSavedPrompt]);
  await openChatbot(page, translations);
}

test.describe('Intelligent assistant saved prompts', () => {
  let sharedPage: Page;
  let translations: LightspeedMessages;

  test.beforeAll(async ({ browser }) => {
    const boot: LightspeedE2eBootstrap = await bootstrapLightspeedE2ePage(
      browser,
      { openFullscreenChat: false },
    );
    sharedPage = boot.page;
    translations = boot.translations;
  });

  test.beforeEach(async () => {
    await openOverlayChatWithSavedPrompts(sharedPage, translations);
  });

  test('shows seeded saved prompts in the chat history sidebar', async () => {
    await openChatDrawer(sharedPage, translations);

    await expect(
      savedPromptSidebarItem(sharedPage, translations, seededSavedPrompt.name),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('applies a saved prompt to the message input from the sidebar', async () => {
    await openChatDrawer(sharedPage, translations);

    const savedPromptRow = savedPromptSidebarItem(
      sharedPage,
      translations,
      seededSavedPrompt.name,
    );
    await expect(savedPromptRow).toBeVisible({ timeout: 15_000 });
    await savedPromptRow.click();

    await expectChatInputValue(
      sharedPage,
      translations,
      seededSavedPrompt.content,
    );
  });

  test('creates a saved prompt from the settings panel', async () => {
    await openSavedPromptsSettingsTab(sharedPage, translations);

    await sharedPage
      .getByRole('button', { name: translations['savedPrompts.newPrompt'] })
      .click();
    await sharedPage
      .getByPlaceholder(translations['savedPrompts.form.titlePlaceholder'])
      .fill('Release notes helper');
    await sharedPage
      .getByPlaceholder(translations['savedPrompts.form.contentPlaceholder'])
      .fill('Draft concise release notes for this change.');
    await sharedPage
      .getByLabel('Chatbot', { exact: true })
      .getByRole('button', {
        name: translations['savedPrompts.form.save'],
        exact: true,
      })
      .click();

    await expect(sharedPage.getByText('Release notes helper')).toBeVisible({
      timeout: 15_000,
    });
  });
});
