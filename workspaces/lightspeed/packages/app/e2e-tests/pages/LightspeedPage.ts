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
import { LightspeedMessages, evaluateMessage } from '../utils/translations';

export type DisplayMode = 'Overlay' | 'Dock to window' | 'Fullscreen';

// Actions
export async function openChatbot(page: Page) {
  await page.getByRole('button', { name: 'lightspeed-close' }).click();
}

export async function selectDisplayMode(
  page: Page,
  t: LightspeedMessages,
  mode: DisplayMode,
) {
  await page.getByRole('button', { name: t['aria.settings.label'] }).click();
  const modeMap: Record<DisplayMode, string> = {
    Overlay: t['settings.displayMode.overlay'],
    'Dock to window': t['settings.displayMode.docked'],
    Fullscreen: t['settings.displayMode.fullscreen'],
  };
  await page.getByRole('menuitem', { name: modeMap[mode] }).click();
}

export async function openChatHistoryDrawer(page: Page, t: LightspeedMessages) {
  await page.getByRole('button', { name: t['aria.chatHistoryMenu'] }).click();
}

export async function closeChatHistoryDrawer(
  page: Page,
  t: LightspeedMessages,
) {
  await page.getByRole('button', { name: t['aria.closeDrawerPanel'] }).click();
}

// Assertions
export async function expectBackstagePageVisible(page: Page, visible = true) {
  const locator = page.getByText('Red Hat Catalog');
  const assertion = visible ? expect(locator) : expect(locator).not;
  await assertion.toBeVisible();
}

export async function expectChatbotControlsVisible(
  page: Page,
  t: LightspeedMessages,
) {
  await expect(page.locator('.pf-chatbot__header')).toBeVisible();
  await expect(
    page.getByRole('button', { name: t['aria.chatHistoryMenu'] }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: t['aria.settings.label'] }),
  ).toBeVisible();
}

export async function verifyDisplayModeMenuOptions(
  page: Page,
  t: LightspeedMessages,
) {
  await page.getByRole('button', { name: t['aria.settings.label'] }).click();
  await expect(page.getByLabel('Chatbot', { exact: true }))
    .toMatchAriaSnapshot(`
    - menu:
      - menuitem "${t['settings.displayMode.label']}" [disabled]
      - menuitem "${t['settings.displayMode.overlay']}"
      - menuitem "${t['settings.displayMode.docked']}"
      - menuitem "${t['settings.displayMode.fullscreen']}"
    - separator
    - menu:
      - menuitem "${t['settings.pinned.disable']} ${t['settings.pinned.enabled.description']}"
    `);
}

export async function expectChatInputAreaVisible(
  page: Page,
  t: LightspeedMessages,
) {
  await expect(
    page.getByRole('textbox', { name: t['chatbox.message.placeholder'] }),
  ).toBeVisible();
}

export async function expectEmptyChatHistory(
  page: Page,
  t: LightspeedMessages,
) {
  await expect(
    page.getByRole('heading', { name: t['conversation.category.pinnedChats'] }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: t['chatbox.emptyState.noPinnedChats'] }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: t['conversation.category.recent'] }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: t['chatbox.emptyState.noRecentChats'] }),
  ).toBeVisible();
}

function getWelcomeHeader(t: LightspeedMessages): string {
  const greeting = evaluateMessage(
    t['chatbox.welcome.greeting'],
    t['user.guest'],
  );
  return `
    - region "Scrollable message log":
      - 'heading "Info alert: ${t['aria.important']}" [level=4]'
      - text: ${t['disclaimer.withValidation']}
      - heading "${greeting} ${t['chatbox.welcome.description']}" [level=1]`;
}

const buttonGroup = `
      - button
      - text: ''`;

const buttonCounts: Record<DisplayMode, number> = {
  Overlay: 1,
  'Dock to window': 2,
  Fullscreen: 3,
};

export async function expectConversationArea(
  page: Page,
  t: LightspeedMessages,
  mode: DisplayMode,
) {
  const buttons = buttonGroup.repeat(buttonCounts[mode]);
  const snapshot = `${getWelcomeHeader(t)}${buttons}
    `;
  await expect(page.getByLabel('Scrollable message log')).toMatchAriaSnapshot(
    snapshot,
  );
}
