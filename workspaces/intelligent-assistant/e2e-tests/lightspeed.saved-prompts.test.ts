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
import { savedPromptsMenuItems } from './utils/chatManagement';
import { mockSavedPrompts } from './utils/devMode';
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

async function openSavedPromptsSettingsPanel(
  page: Page,
  translations: LightspeedMessages,
) {
  await page
    .getByRole('button', { name: translations['aria.options.label'] })
    .click();
  await page
    .getByRole('menuitem', { name: translations['settings.mcp.label'] })
    .click();
  await page
    .getByRole('button', { name: translations['savedPrompts.tab.title'] })
    .click();
  await expect(
    page.getByRole('button', { name: translations['savedPrompts.newPrompt'] }),
  ).toBeVisible();
}

test.describe('Intelligent assistant saved prompts', () => {
  let sharedPage: Page;
  let translations: LightspeedMessages;

  test.beforeAll(async ({ browser }) => {
    const boot: LightspeedE2eBootstrap =
      await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    translations = boot.translations;
  });

  test.beforeEach(async () => {
    await sharedPage.goto('/catalog');
    await waitForBackstageCatalogReady(sharedPage);
    await mockSavedPrompts(sharedPage, [seededSavedPrompt]);
    await openChatbot(sharedPage, translations);
  });

  test('shows seeded saved prompts in the chat history sidebar', async () => {
    await openChatDrawer(sharedPage, translations);

    await expect(
      savedPromptsMenuItems(sharedPage, translations).filter({
        hasText: seededSavedPrompt.name,
      }),
    ).toBeVisible();
  });

  test('applies a saved prompt to the message input from the sidebar', async () => {
    await openChatDrawer(sharedPage, translations);

    await savedPromptsMenuItems(sharedPage, translations)
      .filter({ hasText: seededSavedPrompt.name })
      .click();

    await expectChatInputValue(
      sharedPage,
      translations,
      seededSavedPrompt.content,
    );
  });

  test('creates a saved prompt from the settings panel', async () => {
    await openSavedPromptsSettingsPanel(sharedPage, translations);

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
      .getByRole('button', { name: translations['savedPrompts.form.save'] })
      .click();

    await expect(sharedPage.getByText('Release notes helper')).toBeVisible();
  });
});
