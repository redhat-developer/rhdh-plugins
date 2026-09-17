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
import { mockSavedPrompts } from '../utils/devMode';
import { loginAsGuest } from '../utils/lightspeedE2eSetup';
import type { LightspeedMessages } from '../utils/translations';
import { evaluateMessage } from '../utils/translations';
import {
  closeChatHistoryDrawer,
  expectChatInputValue,
  openChatbot,
  openChatHistoryDrawer,
  waitForBackstageCatalogReady,
  waitForChatMessageLoadingHidden,
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

  /** History drawer nested inside the chatbot overlay (not `.pf-v6-c-drawer__panel-main`). */
  savedPromptsHistoryDrawer(): Locator {
    return this.chatbotRegion()
      .getByRole('dialog')
      .filter({
        has: this.page.getByRole('button', {
          name: this.t['aria.closeDrawerPanel'],
        }),
      });
  }

  savedPromptsMenu(): Locator {
    return this.savedPromptsHistoryDrawer().getByRole('menu', {
      name: new RegExp(this.t['conversation.category.savedPrompts']),
    });
  }

  savedPromptSidebarItem(promptName: string): Locator {
    return this.savedPromptsMenu().getByRole('menuitem', {
      name: promptName,
      exact: true,
    });
  }

  savedPromptKebabToggle(
    promptName: string,
    variant: 'sidebar' | 'settings',
  ): Locator {
    const label = evaluateMessage(
      this.t['savedPrompts.actions.menuAriaLabel'],
      promptName,
    );
    if (variant === 'sidebar') {
      return this.savedPromptsMenu().getByRole('menuitem', { name: label });
    }
    return this.chatbotRegion().getByRole('button', { name: label });
  }

  kebabActionMenuItem(action: 'apply' | 'send' | 'delete'): Locator {
    const actionLabels = {
      apply: this.t['savedPrompts.actions.apply'],
      send: this.t['savedPrompts.actions.send'],
      delete: this.t['savedPrompts.actions.delete'],
    };
    return this.page.getByRole('menuitem', {
      name: actionLabels[action],
      exact: true,
    });
  }

  deleteSavedPromptDialog(promptName: string): Locator {
    return this.page.getByRole('dialog', {
      name: evaluateMessage(
        this.t['savedPrompts.delete.confirm.title'],
        promptName,
      ),
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

  private async resetChatbotOverlay(): Promise<void> {
    const closeSettings = this.page.getByRole('button', {
      name: this.t['mcp.settings.closeAriaLabel'],
    });
    if (await closeSettings.isVisible().catch(() => false)) {
      await closeSettings.click();
    }

    const closeFab = this.page.getByRole('button', {
      name: this.t['tooltip.fab.close'],
    });
    if (await closeFab.isVisible().catch(() => false)) {
      await closeFab.click();
    }
  }

  private waitForSavedPromptsFetch() {
    return this.page.waitForResponse(
      response =>
        response.url().includes('/v1/saved-prompts') &&
        response.request().method() === 'GET' &&
        response.ok(),
    );
  }

  async openOverlayWithPrompts(prompts: SavedPromptMock[]): Promise<void> {
    await this.page.goto('/catalog');
    await loginAsGuest(this.page);
    await waitForBackstageCatalogReady(this.page);
    await this.resetChatbotOverlay();

    // Re-register the route and seed in-memory data for this page.
    await mockSavedPrompts(this.page, prompts);

    // React Query caches saved prompts for 5 minutes — reload clears stale [].
    await this.page.reload();
    await waitForBackstageCatalogReady(this.page);

    const savedPromptsResponse =
      prompts.length > 0 ? this.waitForSavedPromptsFetch() : null;

    await openChatbot(this.page, this.t);

    if (savedPromptsResponse) {
      await savedPromptsResponse;
    }
  }

  async openChatHistoryDrawer(): Promise<void> {
    await openChatHistoryDrawer(this.page, this.t);
    await expect(this.savedPromptsHistoryDrawer()).toBeVisible({
      timeout: 15_000,
    });
  }

  async closeChatHistoryDrawer(): Promise<void> {
    await closeChatHistoryDrawer(this.page, this.t);
    await expect(this.savedPromptsHistoryDrawer()).toBeHidden({
      timeout: 15_000,
    });
  }

  /** Seeded prompts are listed in the drawer group, not the empty placeholder row. */
  async expectSavedPromptsSidebarLoaded(promptName: string): Promise<void> {
    await expect(this.savedPromptsHistoryDrawer()).toBeVisible({
      timeout: 15_000,
    });
    await expect
      .poll(
        async () => {
          const emptyVisible = await this.savedPromptsMenu()
            .getByRole('menuitem', {
              name: this.t['savedPrompts.sidebar.empty'],
            })
            .isVisible()
            .catch(() => false);
          const promptVisible = await this.savedPromptSidebarItem(promptName)
            .isVisible()
            .catch(() => false);
          return !emptyVisible && promptVisible;
        },
        { timeout: 15_000 },
      )
      .toBe(true);
  }

  openSavedPromptsSettingsGearButton(): Locator {
    return this.chatbotRegion().getByRole('button', {
      name: this.t['savedPrompts.sidebar.openSettings'],
      exact: true,
    });
  }

  async openSavedPromptsSettingsFromSidebarGear(): Promise<void> {
    await this.openChatHistoryDrawer();
    await this.savedPromptsHistoryDrawer()
      .getByRole('button', {
        name: new RegExp(
          `${this.t['conversation.category.savedPrompts']}.*${this.t['savedPrompts.sidebar.openSettings']}`,
        ),
      })
      .hover();
    await expect(this.openSavedPromptsSettingsGearButton()).toBeVisible();
    await this.openSavedPromptsSettingsGearButton().click();
  }

  async expectSavedPromptsSettingsPanelVisible(): Promise<void> {
    await expect(
      this.chatbotRegion().getByRole('heading', {
        name: this.t['settings.panel.title'],
      }),
    ).toBeVisible();
    await expect(this.newPromptButton()).toBeVisible();
  }

  async applySavedPromptFromSidebar(promptName: string): Promise<void> {
    await this.expectSavedPromptsSidebarLoaded(promptName);
    await this.savedPromptSidebarItem(promptName).click();
  }

  async openSavedPromptKebabMenu(
    promptName: string,
    variant: 'sidebar' | 'settings',
  ): Promise<void> {
    await this.savedPromptKebabToggle(promptName, variant).click();
  }

  async selectKebabAction(action: 'apply' | 'send' | 'delete'): Promise<void> {
    await this.kebabActionMenuItem(action).click();
  }

  async closeSettingsPanel(): Promise<void> {
    await this.page
      .getByRole('button', { name: this.t['mcp.settings.closeAriaLabel'] })
      .click();
  }

  async applySavedPromptFromKebab(
    promptName: string,
    variant: 'sidebar' | 'settings',
  ): Promise<void> {
    await this.openSavedPromptKebabMenu(promptName, variant);
    await this.selectKebabAction('apply');
    if (variant === 'settings') {
      await this.closeSettingsPanel();
    }
  }

  async sendSavedPromptFromKebab(
    promptName: string,
    variant: 'sidebar' | 'settings',
  ): Promise<void> {
    await this.openSavedPromptKebabMenu(promptName, variant);
    await this.selectKebabAction('send');
    if (variant === 'settings') {
      await this.closeSettingsPanel();
    }
  }

  async deleteSavedPromptFromKebab(
    promptName: string,
    variant: 'sidebar' | 'settings',
  ): Promise<void> {
    await this.openSavedPromptKebabMenu(promptName, variant);
    await this.selectKebabAction('delete');
    await this.deleteSavedPromptDialog(promptName)
      .getByRole('button', {
        name: this.t['savedPrompts.delete.confirm.action'],
        exact: true,
      })
      .click();
  }

  async expectUserMessageWithText(content: string): Promise<void> {
    await waitForChatMessageLoadingHidden(this.page);
    const messageLog = this.chatbotRegion().getByLabel(
      'Scrollable message log',
    );
    await expect(messageLog).toContainText('Message from Bot:', {
      timeout: 15_000,
    });
    await expect(messageLog).toContainText(content, { timeout: 15_000 });
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

  async expectEmptySavedPromptsSettingsVisible(): Promise<void> {
    const emptyState = this.chatbotRegion().getByTestId(
      'saved-prompts-empty-state',
    );
    await expect(emptyState).toBeVisible({ timeout: 15_000 });
    await expect(
      emptyState.getByText(this.t['savedPrompts.count.zero'], { exact: true }),
    ).toBeVisible();
    await expect(
      emptyState.getByText(this.t['savedPrompts.empty.description']),
    ).toBeVisible();
    await expect(
      emptyState.getByRole('button', {
        name: this.t['savedPrompts.newPrompt'],
      }),
    ).toBeVisible();
  }

  async createSavedPrompt(name: string, content: string): Promise<void> {
    await this.newPromptButton().click();
    await this.titleField().fill(name);
    await this.contentField().fill(content);
    await this.saveFormButton().click();
  }

  async expectSavedPromptVisibleInSettings(name: string): Promise<void> {
    await expect(this.savedPromptCardInSettings(name)).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectSavedPromptHiddenInSettings(name: string): Promise<void> {
    await expect(this.savedPromptCardInSettings(name)).toBeHidden({
      timeout: 15_000,
    });
  }

  private savedPromptCardInSettings(name: string): Locator {
    return this.chatbotRegion()
      .getByTestId('saved-prompts-list')
      .getByText(name, { exact: true });
  }
}
