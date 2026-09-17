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

import { test, type Page } from '@playwright/test';
import {
  E2E_SAVED_PROMPT_DEPLOY_CHECKLIST,
  E2E_SAVED_PROMPT_RELEASE_NOTES,
} from './fixtures/responses';
import { SavedPromptsPage } from './pages/SavedPromptsPage';
import { bootstrapLightspeedE2ePage } from './utils/lightspeedE2eSetup';
import type { LightspeedMessages } from './utils/translations';

test.describe('Intelligent assistant saved prompts', () => {
  let sharedPage: Page;
  let translations: LightspeedMessages;
  let savedPrompts: SavedPromptsPage;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser, {
      openFullscreenChat: false,
    });
    sharedPage = boot.page;
    translations = boot.translations;
    savedPrompts = new SavedPromptsPage(sharedPage, translations);
  });

  test.beforeEach(async () => {
    await savedPrompts.openOverlayWithPrompts([
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST,
    ]);
  });

  test('shows seeded saved prompts in the chat history sidebar', async () => {
    await savedPrompts.openChatHistoryDrawer();
    await savedPrompts.expectSavedPromptsSidebarLoaded(
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST.name,
    );
  });

  test('applies a saved prompt to the message input from the sidebar', async () => {
    await savedPrompts.openChatHistoryDrawer();
    await savedPrompts.applySavedPromptFromSidebar(
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST.name,
    );
    await savedPrompts.closeChatHistoryDrawer();
    await savedPrompts.expectMessageInputValue(
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST.content,
    );
  });

  test('opens saved prompts settings from the sidebar gear control', async () => {
    await savedPrompts.openSavedPromptsSettingsFromSidebarGear();
    await savedPrompts.expectSavedPromptsSettingsPanelVisible();
  });

  test('applies a saved prompt via the settings kebab menu', async () => {
    await savedPrompts.openSavedPromptsSettingsTab();
    await savedPrompts.applySavedPromptFromKebab(
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST.name,
      'settings',
    );
    await savedPrompts.expectMessageInputValue(
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST.content,
    );
  });

  test('sends a saved prompt directly from the settings kebab menu', async () => {
    await savedPrompts.openSavedPromptsSettingsTab();
    await savedPrompts.sendSavedPromptFromKebab(
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST.name,
      'settings',
    );
    await savedPrompts.expectUserMessageWithText(
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST.content,
    );
  });

  test('deletes a saved prompt from the settings kebab menu', async () => {
    await savedPrompts.openSavedPromptsSettingsTab();
    await savedPrompts.deleteSavedPromptFromKebab(
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST.name,
      'settings',
    );
    await savedPrompts.expectSavedPromptHiddenInSettings(
      E2E_SAVED_PROMPT_DEPLOY_CHECKLIST.name,
    );
    await savedPrompts.expectEmptySavedPromptsSettingsVisible();
    await savedPrompts.closeSettingsPanel();
    await savedPrompts.openChatHistoryDrawer();
    await savedPrompts.expectSavedPromptsSidebarEmpty();
  });

  test('creates a saved prompt from the settings panel', async () => {
    await savedPrompts.openSavedPromptsSettingsTab();
    await savedPrompts.createSavedPrompt(
      E2E_SAVED_PROMPT_RELEASE_NOTES.name,
      E2E_SAVED_PROMPT_RELEASE_NOTES.content,
    );
    await savedPrompts.expectSavedPromptVisibleInSettings(
      E2E_SAVED_PROMPT_RELEASE_NOTES.name,
    );
  });
});
