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
  getExpectedMcpSelectedCountForMock,
  getExpectedMcpStatusDetailForMock,
  mockedMcpServersResponse,
  type McpServersListMock,
} from '../fixtures/responses';
import {
  LightspeedMessages,
  evaluateMessage,
  formatMcpSelectedCount,
} from '../utils/translations';

export type DisplayMode = 'Overlay' | 'Dock to window' | 'Fullscreen';

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
  if (process.env.APP_MODE === 'nfs') {
    return;
  }
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
  const settingsMenu = page
    .getByRole('menu')
    .filter({
      has: page.getByRole('menuitem', {
        name: t['settings.displayMode.label'],
      }),
    })
    .first();

  await expect(settingsMenu).toBeVisible();
  await expect(
    settingsMenu.getByRole('menuitem', {
      name: t['settings.displayMode.label'],
    }),
  ).toBeDisabled();
  await expect(
    settingsMenu.getByRole('menuitem', {
      name: t['settings.displayMode.overlay'],
    }),
  ).toBeVisible();
  await expect(
    settingsMenu.getByRole('menuitem', {
      name: t['settings.displayMode.docked'],
    }),
  ).toBeVisible();
  await expect(
    settingsMenu.getByRole('menuitem', {
      name: t['settings.displayMode.fullscreen'],
    }),
  ).toBeVisible();

  await expect(
    page.getByRole('menuitem', {
      name: `${t['settings.pinned.disable']} ${t['settings.pinned.enabled.description']}`,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: t['settings.mcp.label'] }),
  ).toBeVisible();
}

// MCP settings (McpServersSettings — strings from `mcp.settings.*` translations)

export async function openMcpSettingsPanel(page: Page, t: LightspeedMessages) {
  await page.getByRole('button', { name: t['aria.settings.label'] }).click();
  await expect(
    page.getByRole('menuitem', { name: t['settings.mcp.label'] }),
  ).toBeVisible();
  await page.getByRole('menuitem', { name: t['settings.mcp.label'] }).click();
}

export async function closeMcpSettingsPanel(page: Page, t: LightspeedMessages) {
  await page
    .getByRole('button', { name: t['mcp.settings.closeAriaLabel'] })
    .click();
}

export function mcpServersTable(page: Page, t: LightspeedMessages): Locator {
  return page.getByLabel(t['mcp.settings.tableAriaLabel']);
}

export function mcpServersTableBodyRows(
  page: Page,
  t: LightspeedMessages,
): Locator {
  return mcpServersTable(page, t).locator('tbody tr');
}

export function mcpServerRow(
  page: Page,
  serverName: string,
  t: LightspeedMessages,
): Locator {
  return mcpServersTableBodyRows(page, t).filter({ hasText: serverName });
}

export function mcpServerToggle(
  page: Page,
  serverName: string,
  t: LightspeedMessages,
): Locator {
  return mcpServersTable(page, t)
    .getByRole('gridcell', {
      name: evaluateMessage(
        t['mcp.settings.toggleServerAriaLabel'],
        serverName,
      ),
    })
    .locator('span');
}

export function mcpEditServerButton(
  page: Page,
  serverName: string,
  t: LightspeedMessages,
): Locator {
  return page.getByRole('button', {
    name: evaluateMessage(t['mcp.settings.editServerAriaLabel'], serverName),
  });
}

export function mcpPersonalAccessTokenInput(page: Page): Locator {
  return page.locator('#mcp-pat-input');
}

/** Configure-server modal that contains the PAT field (avoids matching other dialogs). */
export function mcpCredentialConfigureModal(page: Page): Locator {
  return page
    .getByRole('dialog')
    .filter({ has: page.locator('#mcp-pat-input') });
}

/** Clear (×) control on the PAT field (`mcp.settings.token.clearAriaLabel`). */
export function mcpClearTokenInputButton(
  page: Page,
  t: LightspeedMessages,
): Locator {
  return mcpCredentialConfigureModal(page).getByRole('button', {
    name: t['mcp.settings.token.clearAriaLabel'],
  });
}

export function mcpConfigureModalSaveButton(
  page: Page,
  t: LightspeedMessages,
): Locator {
  return mcpCredentialConfigureModal(page).getByRole('button', {
    name: t['modal.save'],
  });
}

export function mcpConfigureModalCancelButton(
  page: Page,
  t: LightspeedMessages,
): Locator {
  return mcpCredentialConfigureModal(page).getByRole('button', {
    name: t['modal.cancel'],
    exact: true,
  });
}

/** Validation/helper line under the PAT field after Save (matches i18n `mcp.settings.token.*` copy). */
export function mcpConfigureModalMessage(
  page: Page,
  exactText: string,
): Locator {
  return mcpCredentialConfigureModal(page).getByText(exactText, {
    exact: true,
  });
}

/**
 * Asserts configure-server modal is ready: Close, Clear, Save, Cancel, and PAT field.
 */
export async function expectMcpConfigureModalReady(
  page: Page,
  t: LightspeedMessages,
) {
  await expect(
    mcpCredentialConfigureModal(page).getByRole('button', {
      name: t['mcp.settings.closeConfigureModalAriaLabel'],
    }),
  ).toBeVisible();
  await expect(mcpClearTokenInputButton(page, t)).toBeVisible();
  await expect(mcpConfigureModalSaveButton(page, t)).toBeVisible();
  await expect(mcpConfigureModalCancelButton(page, t)).toBeVisible();
  await expect(mcpPersonalAccessTokenInput(page)).toBeVisible();
}

export async function clickMcpServersStatusColumn(
  page: Page,
  t: LightspeedMessages,
) {
  await mcpServersTable(page, t)
    .getByRole('columnheader', { name: t['mcp.settings.status'] })
    .click();
}

export async function clickMcpServersNameColumn(
  page: Page,
  t: LightspeedMessages,
) {
  await mcpServersTable(page, t)
    .getByRole('button', { name: t['mcp.settings.name'] })
    .click();
}

function mcpServersSettingsHeading(page: Page, t: LightspeedMessages): Locator {
  return page.getByRole('heading', {
    name: t['mcp.settings.title'],
    exact: true,
  });
}

/** Assert the MCP servers settings heading is shown or dismissed with the panel. */
export async function expectMcpServersSettingsHeading(
  page: Page,
  visible: boolean,
  t: LightspeedMessages,
) {
  const heading = mcpServersSettingsHeading(page, t);
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

  const table = mcpServersTable(page, t);
  await expect(table).toBeVisible();
  await expectMcpServersSettingsHeading(page, true, t);
  const { selectedCount, totalCount } =
    getExpectedMcpSelectedCountForMock(mcpList);
  await expect(
    page.getByText(formatMcpSelectedCount(t, selectedCount, totalCount), {
      exact: true,
    }),
  ).toBeVisible();

  // Scope to MCP grid: Dock/overlay leaves the catalog visible, which also has "Name" sort buttons.
  await expect(
    table.getByRole('button', { name: t['mcp.settings.name'] }),
  ).toBeVisible();
  await expect(
    table.getByRole('columnheader', { name: t['mcp.settings.status'] }),
  ).toBeVisible();

  await clickMcpServersStatusColumn(page, t);

  // Close + selected count live in the MCP header, not always inside <form> (fullscreen omits Settings/form wrapper).
  await expect(
    page.getByRole('button', { name: t['mcp.settings.closeAriaLabel'] }),
  ).toBeVisible();

  if (mcpList.servers.length === 0) {
    await expect(
      table.getByText(t['mcp.settings.noneAvailable'], { exact: true }),
    ).toBeVisible();
  } else {
    for (const server of mcpList.servers) {
      const row = mcpServerRow(page, server.name, t);
      await expect(row.getByText(server.name, { exact: true })).toBeVisible();
      await expect(
        row.getByText(getExpectedMcpStatusDetailForMock(server, t), {
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

  await closeMcpSettingsPanel(page, t);
  await expectMcpServersSettingsHeading(page, false, t);
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
