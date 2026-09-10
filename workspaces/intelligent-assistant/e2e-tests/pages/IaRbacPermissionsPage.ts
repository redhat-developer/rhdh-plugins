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
  private chatRequests: string[] = [];
  private notebookRequests: string[] = [];

  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
  ) {
    page.on('request', request => {
      if (request.method() !== 'GET') {
        return;
      }
      const url = request.url();
      if (
        url.includes('/api/intelligent-assistant/v2/conversations') ||
        url.includes('/api/intelligent-assistant/v1/models')
      ) {
        this.chatRequests.push(url);
      }
      if (url.includes('/api/intelligent-assistant/notebooks/v1/sessions')) {
        this.notebookRequests.push(url);
      }
    });
  }

  resetApiTracking(): void {
    this.chatRequests = [];
    this.notebookRequests = [];
  }

  fabButton(): Locator {
    return this.page.getByRole('button', { name: this.t['tooltip.fab.open'] });
  }

  newChatButton(): Locator {
    return this.page.getByRole('button', { name: this.t['button.newChat'] });
  }

  chatTab(): Locator {
    return this.page.getByRole('tab', { name: this.t['tabs.chat'] });
  }

  notebooksTab(): Locator {
    return this.page.getByRole('tab', { name: this.t['tabs.notebooks'] });
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
    await expect(this.page.locator('.pf-chatbot__header')).toBeVisible();
  }

  async expectChatAndNotebooksTabsVisible(): Promise<void> {
    await expect(this.chatTab()).toBeVisible();
    await expect(this.notebooksTab()).toBeVisible();
  }

  async expectNoTabs(): Promise<void> {
    await expect(this.page.getByRole('tab')).toHaveCount(0);
  }

  async expectChatApiRequestsMade(): Promise<void> {
    await expect.poll(() => this.chatRequests.length).toBeGreaterThan(0);
  }

  async expectNoChatApiRequests(): Promise<void> {
    await expect.poll(() => this.chatRequests.length).toBe(0);
  }

  async expectNotebookApiRequestsMade(): Promise<void> {
    await expect.poll(() => this.notebookRequests.length).toBeGreaterThan(0);
  }

  async expectNoNotebookApiRequests(): Promise<void> {
    await expect.poll(() => this.notebookRequests.length).toBe(0);
  }

  async expectChatOnlyLayout(): Promise<void> {
    await this.expectNoTabs();
    await expect(this.newChatButton()).toBeVisible();
    await expect(this.notebooksEmptyTitle()).not.toBeVisible();
    await this.expectNoNotebookApiRequests();
    await this.expectChatApiRequestsMade();
  }

  async expectNotebooksOnlyLayout(): Promise<void> {
    await this.expectNoTabs();
    await expect(this.newChatButton()).not.toBeVisible();
    await expect(this.notebooksEmptyTitle()).toBeVisible();
    await this.expectNoChatApiRequests();
    await this.expectNotebookApiRequestsMade();
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
