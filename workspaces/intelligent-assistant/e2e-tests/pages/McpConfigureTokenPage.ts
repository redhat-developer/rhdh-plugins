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
import type { McpServersListMock } from '../fixtures/responses';
import type { MockMcpServersOptions } from '../utils/devMode';
import { mockMcpServers } from '../utils/devMode';
import type { LightspeedMessages } from '../utils/translations';
import {
  closeMcpSettingsPanel,
  expectMcpConfigureModalReady,
  mcpClearTokenInputButton,
  mcpConfigureModalCancelButton,
  mcpConfigureModalMessage,
  mcpConfigureModalSaveButton,
  mcpCredentialConfigureModal,
  mcpEditServerButton,
  mcpPersonalAccessTokenInput,
  mcpServerRow,
  openChatbot,
  openMcpSettingsPanel,
  selectDisplayMode,
  type DisplayMode,
} from './LightspeedPage';

export class McpConfigureTokenPage {
  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
  ) {}

  async gotoMcpSettings(
    mcpList: McpServersListMock,
    mode: DisplayMode,
    mockOptions?: MockMcpServersOptions,
  ): Promise<void> {
    await mockMcpServers(this.page, mcpList, mockOptions ?? {});
    await openChatbot(this.page, this.t);
    await selectDisplayMode(this.page, this.t, mode);
    await openMcpSettingsPanel(this.page, this.t);
  }

  async openEditServer(serverName: string): Promise<void> {
    await mcpEditServerButton(this.page, serverName, this.t).click();
    await expectMcpConfigureModalReady(this.page, this.t);
  }

  async seeRowStatus(serverName: string, text: string): Promise<void> {
    await expect(
      mcpServerRow(this.page, serverName, this.t).getByText(text, {
        exact: true,
      }),
    ).toBeVisible();
  }

  async typeToken(value: string): Promise<void> {
    await mcpPersonalAccessTokenInput(this.page).fill(value);
    await expect(mcpPersonalAccessTokenInput(this.page)).toHaveValue(value);
    await expect(
      mcpConfigureModalMessage(this.page, this.t['mcp.settings.enterToken']),
    ).toBeVisible();
  }

  async save(): Promise<void> {
    await mcpConfigureModalSaveButton(this.page, this.t).click();
  }

  async cancel(): Promise<void> {
    await mcpConfigureModalCancelButton(this.page, this.t).click();
  }

  async seeMessage(text: string): Promise<void> {
    await expect(mcpConfigureModalMessage(this.page, text)).toBeVisible();
  }

  async seeModalClosed(): Promise<void> {
    await expect(mcpCredentialConfigureModal(this.page)).not.toBeVisible();
  }

  async seeTokenHidden(): Promise<void> {
    await expect(mcpPersonalAccessTokenInput(this.page)).not.toBeVisible();
  }

  async closeMcpPanel(): Promise<void> {
    await closeMcpSettingsPanel(this.page, this.t);
  }

  tokenField(): Locator {
    return mcpPersonalAccessTokenInput(this.page);
  }

  async clearToken(): Promise<void> {
    await mcpClearTokenInputButton(this.page, this.t).click();
  }

  async typeThenClearToken(draft: string): Promise<void> {
    const field = this.tokenField();
    await field.click();
    await field.fill(draft);
    await expect(field).toHaveValue(draft);
    await this.clearToken();
    await expect(field).toHaveValue('');
    await this.seeMessage(this.t['mcp.settings.enterToken']);
  }
}
