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

import { Page, expect, type Locator } from '@playwright/test';
import {
  getExpectedMcpStatusDetailForMock,
  mockedMcpServersResponse,
  type McpServersListMock,
} from '../fixtures/responses';
import { LightspeedMessages, evaluateMessage } from '../utils/translations';

export type DisplayMode = 'Overlay' | 'Dock to window' | 'Fullscreen';

/** Menu label in LightspeedChatBoxHeader (not yet in i18n). */
export const MCP_SETTINGS_MENU_ITEM = 'MCP settings';

// Actions
export async function openChatbot(page: Page) {
  await page.getByRole('button', { name: 'lightspeed-open' }).click();
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
      - menuitem "${MCP_SETTINGS_MENU_ITEM}"
    `);
}

// MCP settings (McpServersSettings — English strings until full i18n)

export async function openMcpSettingsPanel(page: Page, t: LightspeedMessages) {
  await page.getByRole('button', { name: t['aria.settings.label'] }).click();
  await expect(
    page.getByRole('menuitem', { name: MCP_SETTINGS_MENU_ITEM }),
  ).toBeVisible();
  await page.getByRole('menuitem', { name: MCP_SETTINGS_MENU_ITEM }).click();
}

export async function closeMcpSettingsPanel(page: Page) {
  await page.getByRole('button', { name: 'Close MCP settings' }).click();
}

export function mcpServersTable(page: Page): Locator {
  return page.getByLabel('MCP servers table');
}

export function mcpServersTableBodyRows(page: Page): Locator {
  return mcpServersTable(page).locator('tbody tr');
}

export function mcpServerRow(page: Page, serverName: string): Locator {
  return mcpServersTableBodyRows(page).filter({ hasText: serverName });
}

export function mcpServerToggle(page: Page, serverName: string): Locator {
  return mcpServersTable(page)
    .getByRole('gridcell', { name: `Toggle ${serverName}` })
    .locator('span');
}

export async function clickMcpServersStatusColumn(page: Page) {
  await mcpServersTable(page)
    .getByRole('columnheader', { name: 'Status' })
    .click();
}

export async function clickMcpServersNameColumn(page: Page) {
  await mcpServersTable(page).getByRole('button', { name: 'Name' }).click();
}

function mcpServersSettingsHeading(page: Page): Locator {
  return page.getByRole('heading', { name: 'MCP servers', exact: true });
}

/** Assert the MCP servers settings heading is shown or dismissed with the panel. */
export async function expectMcpServersSettingsHeading(
  page: Page,
  visible: boolean,
) {
  const heading = mcpServersSettingsHeading(page);
  const assertion = visible ? expect(heading) : expect(heading).not;
  await assertion.toBeVisible();
}

/**
 * @param mcpList Expected GET `/mcp-servers` body — must match what `mockMcpServers` returns for this test.
 */
export async function verifyMcpSettingsPanel(
  page: Page,
  t: LightspeedMessages,
  mcpList: McpServersListMock = mockedMcpServersResponse,
) {
  await openMcpSettingsPanel(page, t);

  const table = mcpServersTable(page);
  await expect(table).toBeVisible();
  await expectMcpServersSettingsHeading(page, true);
  await expect(page.getByText(/^\d+ of \d+ selected/)).toBeVisible();

  // Scope to MCP grid: Dock/overlay leaves the catalog visible, which also has "Name" sort buttons.
  await expect(table.getByRole('button', { name: 'Name' })).toBeVisible();
  await expect(
    table.getByRole('columnheader', { name: 'Status' }),
  ).toBeVisible();

  await clickMcpServersStatusColumn(page);

  // Close + selected count live in the MCP header, not always inside <form> (fullscreen omits Settings/form wrapper).
  await expect(
    page.getByRole('button', { name: 'Close MCP settings' }),
  ).toBeVisible();

  if (mcpList.servers.length === 0) {
    await expect(
      table.getByText('No MCP servers available.', { exact: true }),
    ).toBeVisible();
  } else {
    for (const server of mcpList.servers) {
      const row = mcpServerRow(page, server.name);
      await expect(row.getByText(server.name, { exact: true })).toBeVisible();
      await expect(
        row.getByText(getExpectedMcpStatusDetailForMock(server), {
          exact: true,
        }),
      ).toBeVisible();
    }
  }

  await expect(page.getByLabel('Chatbot', { exact: true }))
    .toMatchAriaSnapshot(`
    - button "${t['aria.chatHistoryMenu']}"
    - button "${t['aria.chatbotSelector']}"
    - button "${t['aria.settings.label']}"
    `);

  await closeMcpSettingsPanel(page);
  await expectMcpServersSettingsHeading(page, false);
}

/** Chat composer message field (matches sendMessage in testHelper). */
export function chatMessageTextbox(page: Page, t: LightspeedMessages): Locator {
  return page.getByRole('textbox', { name: t['chatbox.message.placeholder'] });
}

export function chatSendButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Send' });
}

export function chatStopButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Stop' });
}

export function chatMessageLoading(page: Page): Locator {
  return page.locator('.pf-chatbot__message-loading');
}

export async function expectChatStopButtonVisible(
  page: Page,
  options?: { timeout?: number },
) {
  await expect(chatStopButton(page)).toBeVisible({
    timeout: options?.timeout ?? 10_000,
  });
}

export async function expectChatInputValue(
  page: Page,
  t: LightspeedMessages,
  value: string,
) {
  await expect(chatMessageTextbox(page, t)).toHaveValue(value);
}

export async function waitForChatMessageLoadingHidden(
  page: Page,
  timeout = 7_000,
) {
  await chatMessageLoading(page).waitFor({ state: 'hidden', timeout });
}

export async function expectChatInputAreaVisible(
  page: Page,
  t: LightspeedMessages,
) {
  await expect(chatMessageTextbox(page, t)).toBeVisible();
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
