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

import { expect, type Locator, type Page } from '@playwright/test';

import type { SavedPromptMock } from '../fixtures/responses';
import { seedSavedPrompts } from '../utils/devMode';
import { loginAsGuest } from '../utils/lightspeedE2eSetup';
import type { LightspeedMessages } from '../utils/translations';
import {
  expectChatInputValue,
  openChatbot,
  openChatHistoryDrawer,
  waitForBackstageCatalogReady,
} from './LightspeedPage';

/**
 * Saved prompts sidebar and settings flows in overlay/docked chatbot modes.
 * Same role as {@link ./LightspeedPage.ts}: shared locators/assertions keep specs short.
 */
export class SavedPromptsPage {
  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
  ) {}

  /** Landmark labeled “Chatbot” in the accessibility tree. */
  chatbotRegion(): Locator {
    return this.page.getByLabel('Chatbot', { exact: true });
  }

  savedPromptsMenu(): Locator {
    return this.chatbotRegion().getByRole('menu', {
      name: new RegExp(this.t['conversation.category.savedPrompts']),
    });
  }

  savedPromptSidebarItem(promptName: string): Locator {
    return this.savedPromptsMenu().getByRole('menuitem', {
      name: promptName,
      exact: true,
    });
  }

  newPromptButton(): Locator {
    return this.page.getByRole('button', {
      name: this.t['savedPrompts.newPrompt'],
    });
  }

  titleField(): Locator {
    return this.page.getByPlaceholder(
      this.t['savedPrompts.form.titlePlaceholder'],
    );
  }

  contentField(): Locator {
    return this.page.getByPlaceholder(
      this.t['savedPrompts.form.contentPlaceholder'],
    );
  }

  saveFormButton(): Locator {
    return this.chatbotRegion().getByRole('button', {
      name: this.t['savedPrompts.form.save'],
      exact: true,
    });
  }

  async openOverlayWithPrompts(prompts: SavedPromptMock[]): Promise<void> {
    await this.page.goto('/catalog');
    await loginAsGuest(this.page);
    await waitForBackstageCatalogReady(this.page);
    seedSavedPrompts(this.page, prompts);
    await openChatbot(this.page, this.t);
  }

  async openChatHistoryDrawer(): Promise<void> {
    await openChatHistoryDrawer(this.page, this.t);
  }

  async expectSavedPromptVisibleInSidebar(promptName: string): Promise<void> {
    await expect(this.savedPromptSidebarItem(promptName)).toBeVisible({
      timeout: 15_000,
    });
  }

  async applySavedPromptFromSidebar(promptName: string): Promise<void> {
    await this.expectSavedPromptVisibleInSidebar(promptName);
    await this.savedPromptSidebarItem(promptName).click();
  }

  async expectMessageInputValue(value: string): Promise<void> {
    await expectChatInputValue(this.page, this.t, value);
  }

  async openSavedPromptsSettingsTab(): Promise<void> {
    await this.page
      .getByRole('button', { name: this.t['aria.options.label'] })
      .click();
    await this.page
      .getByRole('menuitem', { name: this.t['settings.mcp.label'] })
      .click();
    await this.page
      .getByRole('button', { name: this.t['savedPrompts.tab.title'] })
      .click();
    await expect(this.newPromptButton()).toBeVisible();
  }

  async createSavedPrompt(name: string, content: string): Promise<void> {
    await this.newPromptButton().click();
    await this.titleField().fill(name);
    await this.contentField().fill(content);
    await this.saveFormButton().click();
  }

  async expectSavedPromptVisibleInSettings(name: string): Promise<void> {
    await expect(this.chatbotRegion().getByText(name)).toBeVisible({
      timeout: 15_000,
    });
  }
}
