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

import { Page, expect } from '@playwright/test';

export type DisplayMode = 'Overlay' | 'Dock to window' | 'Fullscreen';

export class LightspeedPage {
  constructor(readonly page: Page) {}

  // Locators
  readonly chatbotToggleButton = () =>
    this.page.getByRole('button', { name: 'lightspeed-close' });
  readonly chatbotOptionsMenuButton = () =>
    this.page.getByRole('button', { name: 'Chatbot options' });
  readonly chatHistoryMenuButton = () =>
    this.page.getByRole('button', { name: 'Chat history menu' });
  readonly drawerCloseButton = () =>
    this.page.getByRole('button', { name: 'Close drawer panel' });
  readonly chatbotHeader = () => this.page.locator('.pf-chatbot__header');
  readonly conversationArea = () =>
    this.page.getByLabel('Scrollable message log');
  readonly chatbotPanel = () =>
    this.page.getByLabel('Chatbot', { exact: true });
  readonly backstagePageContent = () => this.page.getByText('Red Hat Catalog');

  // Actions
  async goto(path = '/') {
    await this.page.goto(path);
  }

  async openChatbot() {
    await this.chatbotToggleButton().click();
  }

  async selectDisplayMode(mode: DisplayMode) {
    await this.chatbotOptionsMenuButton().click();
    await this.page.getByRole('menuitem', { name: mode }).click();
  }

  async openChatHistoryDrawer() {
    await this.chatHistoryMenuButton().click();
  }

  async closeChatHistoryDrawer() {
    await this.drawerCloseButton().click();
  }

  // Assertions
  async expectBackstagePageVisible(visible = true) {
    const assertion = visible
      ? expect(this.backstagePageContent())
      : expect(this.backstagePageContent()).not;
    await assertion.toBeVisible();
  }

  async expectChatbotControlsVisible() {
    await expect(this.chatbotHeader()).toBeVisible();
    await expect(this.chatHistoryMenuButton()).toBeVisible();
    await expect(this.chatbotOptionsMenuButton()).toBeVisible();
  }

  async verifyDisplayModeMenuOptions() {
    await this.chatbotOptionsMenuButton().click();
    await expect(this.chatbotPanel()).toMatchAriaSnapshot(`
      - menu:
        - menuitem "Display mode" [disabled]
        - menuitem "Overlay"
        - menuitem "Dock to window"
        - menuitem "Fullscreen"
      - separator
      - menu:
        - menuitem "Disable pinned chats Pinned chats are currently enabled"
      `);
  }

  async expectChatInputAreaVisible() {
    await expect(this.chatbotPanel()).toMatchAriaSnapshot(`
      - textbox "Send a message and optionally upload a JSON, YAML, or TXT file..."
      - button "Attach"
      - button "Use microphone"
      - button "Always review AI generated content prior to use."
      `);
  }

  async expectEmptyChatHistory() {
    await expect(
      this.page.getByRole('heading', { name: 'Pinned' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('menuitem', { name: 'No pinned chats' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', { name: 'Recent' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('menuitem', { name: 'No recent chats' }),
    ).toBeVisible();
  }

  private readonly welcomeHeader = `
      - region "Scrollable message log":
        - 'heading "Info alert: Important" [level=4]'
        - text: This feature uses AI technology. Do not include any personal information or any other sensitive information in your input. Interactions may be used to improve Red Hat's products or services.
        - heading "Hello, Guest How can I help you today?" [level=1]`;

  private readonly buttonGroup = `
        - button
        - text: ''`;

  private readonly buttonCounts: Record<DisplayMode, number> = {
    Overlay: 1,
    'Dock to window': 2,
    Fullscreen: 3,
  };

  async expectConversationArea(mode: DisplayMode) {
    const buttons = this.buttonGroup.repeat(this.buttonCounts[mode]);
    const snapshot = `${this.welcomeHeader}${buttons}
      `;
    await expect(this.conversationArea()).toMatchAriaSnapshot(snapshot);
  }
}
