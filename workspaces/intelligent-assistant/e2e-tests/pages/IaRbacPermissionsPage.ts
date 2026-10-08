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

import type { LightspeedMessages } from '../utils/translations';
import { openChatbot } from './LightspeedPage';

/**
 * Intelligent Assistant permission gating: FAB visibility, tab layout, and MCP menu.
 */
export class IaRbacPermissionsPage {
  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
  ) {}

  fabButton(): Locator {
    return this.page.getByRole('button', { name: this.t['tooltip.fab.open'] });
  }

  chatbotRegion(): Locator {
    return this.page.getByLabel('Chatbot', { exact: true });
  }

  newChatButton(): Locator {
    return this.page.getByRole('button', { name: this.t['button.newChat'] });
  }

  chatTab(): Locator {
    return this.chatbotRegion().getByRole('tab', { name: this.t['tabs.chat'] });
  }

  notebooksTab(): Locator {
    return this.chatbotRegion().getByRole('tab', {
      name: this.t['tabs.notebooks'],
    });
  }

  notebooksEmptyTitle(): Locator {
    return this.page.getByText(this.t['notebooks.empty.title']);
  }

  mcpSettingsMenuItem(): Locator {
    return this.page.getByRole('menuitem', {
      name: this.t['settings.mcp.label'],
    });
  }

  async expectFabVisible(): Promise<void> {
    await expect(this.fabButton()).toBeVisible();
  }

  async expectFabHidden(): Promise<void> {
    await expect(this.fabButton()).toHaveCount(0);
  }

  async openFromFab(): Promise<void> {
    await openChatbot(this.page, this.t);
    await expect(this.chatbotRegion()).toBeVisible();
  }

  async expectChatAndNotebooksTabsVisible(): Promise<void> {
    await expect(this.chatTab()).toBeVisible();
    await expect(this.notebooksTab()).toBeVisible();
  }

  async expectChatOnlyLayout(): Promise<void> {
    await expect(this.notebooksTab()).toBeHidden();
    await expect(this.newChatButton()).toBeVisible();
    await expect(this.notebooksEmptyTitle()).not.toBeVisible();
  }

  async expectNotebooksOnlyLayout(): Promise<void> {
    await expect(this.chatTab()).toBeHidden();
    await expect(this.newChatButton()).not.toBeVisible();
    await expect(this.notebooksEmptyTitle()).toBeVisible();
  }

  async openOptionsMenu(): Promise<void> {
    await this.page
      .getByRole('button', { name: this.t['aria.options.label'] })
      .click();
  }

  async expectMcpSettingsVisible(): Promise<void> {
    await expect(this.mcpSettingsMenuItem()).toBeVisible();
  }

  async expectMcpSettingsHidden(): Promise<void> {
    await expect(this.mcpSettingsMenuItem()).toHaveCount(0);
  }

  async expectMcpMenuVisible(): Promise<void> {
    await this.openFromFab();
    await this.openOptionsMenu();
    await this.expectMcpSettingsVisible();
  }

  async expectMcpMenuHidden(): Promise<void> {
    await this.openFromFab();
    await this.openOptionsMenu();
    await this.expectMcpSettingsHidden();
  }
}
