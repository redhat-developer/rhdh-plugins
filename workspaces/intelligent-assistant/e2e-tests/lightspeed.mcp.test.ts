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

import { test, expect, Page } from '@playwright/test';
import {
  conversations,
  E2E_MCP_VALID_TOKEN,
  mcpServer,
  mcpServerScenarios,
  tokenCredentialNoUrlScenario,
  tokenCredentialValidationScenario,
  type McpServersListMock,
  generateQueryResponseWithMcpToolCall,
  modelBaseUrl,
} from './fixtures/responses';
import { openLightspeed, sendMessage } from './utils/testHelper';
import {
  openChatbot,
  selectDisplayMode,
  type DisplayMode,
  expectBackstagePageVisible,
  verifyMcpSettingsPanel,
  openMcpSettingsPanel,
  closeMcpSettingsPanel,
  mcpConfigureModalSaveButton,
  mcpCredentialConfigureModal,
  mcpEditServerButton,
  mcpPersonalAccessTokenInput,
  mcpServerToggle,
  mcpServerRow,
  clickMcpServersStatusColumn,
  clickMcpServersNameColumn,
  mcpServersTableBodyRows,
} from './pages/LightspeedPage';
import { McpConfigureTokenPage } from './pages/McpConfigureTokenPage';
import {
  mockChatHistory,
  mockConversations,
  mockMcpServers,
  mockQuery,
  type MockMcpServersOptions,
} from './utils/devMode';
import {
  LightspeedMessages,
  evaluateMessage,
  formatMcpToolCountStatus,
} from './utils/translations';
import {
  bootstrapLightspeedE2ePage,
  LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
} from './utils/lightspeedE2eSetup';

test.describe('Intelligent assistant MCP', () => {
  let translations: LightspeedMessages;
  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    translations = boot.translations;
  });

  test.describe('Chatbot MCP settings', () => {
    async function openChatbotWithMcpMock(
      mcpList: McpServersListMock = mcpServerScenarios.default,
    ) {
      await mockMcpServers(sharedPage, mcpList);
      await openChatbot(sharedPage, translations);
    }

    async function verifyMcpPanelScenario(mcpList: McpServersListMock) {
      await openChatbotWithMcpMock(mcpList);
      await verifyMcpSettingsPanel(sharedPage, translations, mcpList);
    }

    async function openMcpPanelWithMock(
      mcpList: McpServersListMock = mcpServerScenarios.default,
    ) {
      await openChatbotWithMcpMock(mcpList);
      await openMcpSettingsPanel(sharedPage, translations);
    }

    test.beforeEach(async () => {
      await sharedPage.goto('/');
    });

    test.afterEach(async () => {
      await mockMcpServers(sharedPage);
    });

    test.describe('Panel rendering', () => {
      test('renders in overlay mode', async () => {
        await expectBackstagePageVisible(sharedPage);
        await openChatbot(sharedPage, translations);
        await verifyMcpSettingsPanel(sharedPage, translations);
      });

      test('renders in docked mode', async () => {
        await openChatbot(sharedPage, translations);
        await selectDisplayMode(sharedPage, translations, 'Dock to window');
        await verifyMcpSettingsPanel(sharedPage, translations);
      });

      test('renders in fullscreen mode', async () => {
        await openChatbot(sharedPage, translations);
        await selectDisplayMode(sharedPage, translations, 'Fullscreen');
        await verifyMcpSettingsPanel(sharedPage, translations);
      });

      test('renders empty state when no MCP servers are configured', async () => {
        await verifyMcpPanelScenario(mcpServerScenarios.empty);
      });

      test.describe('scenario coverage', () => {
        test('renders all healthy servers', async () => {
          await verifyMcpPanelScenario(mcpServerScenarios.allHealthy);
        });

        test('renders failed and healthy servers together', async () => {
          await verifyMcpPanelScenario(mcpServerScenarios.errorAndOk);
        });

        test('renders disabled and active servers together', async () => {
          await verifyMcpPanelScenario(mcpServerScenarios.disabledAndOk);
        });

        test('renders token-required servers', async () => {
          await verifyMcpPanelScenario(mcpServerScenarios.twoTokenRequired);
        });
      });
    });

    test.describe('Table interactions', () => {
      test('sorts rows by server name', async () => {
        await openMcpPanelWithMock(mcpServerScenarios.allHealthy);

        const rows = mcpServersTableBodyRows(sharedPage, translations);
        await expect(rows.nth(0)).toContainText('alpha-mcp');
        await expect(rows.nth(1)).toContainText('beta-mcp');

        await clickMcpServersNameColumn(sharedPage, translations);
        await expect(rows.nth(0)).toContainText('beta-mcp');
        await expect(rows.nth(1)).toContainText('alpha-mcp');

        await closeMcpSettingsPanel(sharedPage, translations);
      });

      test('sorts rows by status rank and tool-count tie-breaker', async () => {
        const statusSortScenario: McpServersListMock = {
          servers: [
            mcpServer('ok-many-tools', { toolCount: 5 }),
            mcpServer('failed-server', { status: 'error', toolCount: 0 }),
            mcpServer('token-required-server', {
              hasToken: false,
              hasOrgToken: false,
              toolCount: 0,
              status: 'unknown',
            }),
            mcpServer('disabled-server', { enabled: false, toolCount: 8 }),
            mcpServer('ok-one-tool', { toolCount: 1 }),
            mcpServer('unknown-server', { status: 'unknown', toolCount: 4 }),
          ],
        };

        await openMcpPanelWithMock(statusSortScenario);

        const rows = mcpServersTableBodyRows(sharedPage, translations);
        await clickMcpServersStatusColumn(sharedPage, translations);

        await expect(rows.nth(0)).toContainText('ok-one-tool');
        await expect(rows.nth(1)).toContainText('ok-many-tools');
        await expect(rows.nth(2)).toContainText('disabled-server');
        await expect(rows.nth(3)).toContainText('unknown-server');
        await expect(rows.nth(4)).toContainText('token-required-server');
        await expect(rows.nth(5)).toContainText('failed-server');

        await clickMcpServersStatusColumn(sharedPage, translations);

        await expect(rows.nth(0)).toContainText('failed-server');
        await expect(rows.nth(1)).toContainText('token-required-server');
        await expect(rows.nth(2)).toContainText('unknown-server');
        await expect(rows.nth(3)).toContainText('disabled-server');
        await expect(rows.nth(4)).toContainText('ok-many-tools');
        await expect(rows.nth(5)).toContainText('ok-one-tool');

        await closeMcpSettingsPanel(sharedPage, translations);
      });

      test('toggles server enabled state from the table', async () => {
        const serverName = 'mcp-integration-tools';
        await openMcpPanelWithMock();

        const row = mcpServerRow(sharedPage, serverName, translations);
        await clickMcpServersStatusColumn(sharedPage, translations);
        await mcpServerToggle(sharedPage, serverName, translations).click();
        await expect(
          row.getByText(translations['mcp.settings.status.disabled'], {
            exact: true,
          }),
        ).toBeVisible();

        await mcpServerToggle(sharedPage, serverName, translations).click();
        await expect(
          row.getByText(formatMcpToolCountStatus(translations, 14), {
            exact: true,
          }),
        ).toBeVisible();

        await closeMcpSettingsPanel(sharedPage, translations);
      });
    });

    test.describe('Configure MCP server modal', () => {
      let mcpToken: McpConfigureTokenPage;
      const credentialServerName = 'credential-test-mcp';
      const noUrlServerName = 'no-url-mcp';

      async function openCredentialServerModal(
        mode: DisplayMode,
        mockOptions?: MockMcpServersOptions,
      ) {
        await mcpToken.gotoMcpSettings(
          tokenCredentialValidationScenario,
          mode,
          mockOptions,
        );
        await mcpToken.seeRowStatus(
          credentialServerName,
          translations['mcp.settings.status.tokenRequired'],
        );
        await mcpToken.openEditServer(credentialServerName);
      }

      async function openNoUrlServerModal(mode: DisplayMode) {
        await mcpToken.gotoMcpSettings(tokenCredentialNoUrlScenario, mode);
        await mcpToken.openEditServer(noUrlServerName);
      }

      test.beforeEach(() => {
        mcpToken = new McpConfigureTokenPage(sharedPage, translations);
      });

      test.describe('Token validation and persistence', () => {
        test('saves a valid personal token from token-required state — Overlay', async () => {
          await openCredentialServerModal('Overlay');

          const modal = mcpCredentialConfigureModal(sharedPage);
          const tokenRequiredSwitch = modal.getByRole('switch', {
            name: evaluateMessage(
              translations['mcp.settings.toggleServerAriaLabel'],
              credentialServerName,
            ),
          });
          await expect(tokenRequiredSwitch).toBeDisabled();

          await mcpToken.typeToken(E2E_MCP_VALID_TOKEN);
          await mcpToken.save();

          await mcpToken.seeTokenHidden();
          await mcpToken.seeRowStatus(
            credentialServerName,
            formatMcpToolCountStatus(translations, 5),
          );
          await mcpToken.closeMcpPanel();
        });

        test('shows invalid credentials, then succeeds with a valid token — Dock to window', async () => {
          await openCredentialServerModal('Dock to window');

          await mcpToken.typeToken('bad-token');
          await mcpToken.save();
          await mcpToken.seeMessage(
            translations['mcp.settings.token.invalidCredentials'],
          );

          await mcpToken.typeToken(E2E_MCP_VALID_TOKEN);
          await mcpToken.save();
          await mcpToken.seeTokenHidden();
          await mcpToken.seeRowStatus(
            credentialServerName,
            formatMcpToolCountStatus(translations, 5),
          );
          await mcpToken.closeMcpPanel();
        });

        test('cancel closes modal without persisting token draft — Fullscreen', async () => {
          await openCredentialServerModal('Fullscreen');

          await mcpToken.typeToken('draft-token');
          await mcpToken.cancel();

          await mcpToken.seeModalClosed();
          await mcpToken.seeRowStatus(
            credentialServerName,
            translations['mcp.settings.status.tokenRequired'],
          );
          await mcpToken.closeMcpPanel();
        });

        test('clear token input empties PAT and restores helper text — Fullscreen', async () => {
          await openNoUrlServerModal('Fullscreen');

          await mcpToken.typeThenClearToken('e2e-draft-personal-access-token');
          await mcpToken.cancel();
          await mcpToken.closeMcpPanel();
        });
      });

      test.describe('Validation errors', () => {
        test('shows server validation failure after save — Overlay', async () => {
          await openCredentialServerModal('Overlay', {
            failServerValidateFor: credentialServerName,
            failServerValidateError:
              translations['mcp.settings.token.validationFailed'],
          });

          await mcpToken.typeToken(E2E_MCP_VALID_TOKEN);
          await mcpToken.save();
          await mcpToken.seeMessage(
            translations['mcp.settings.token.validationFailed'],
          );
          await mcpToken.cancel();
          await mcpToken.closeMcpPanel();
        });

        test('shows URL-unavailable error when server URL is missing — Dock to window', async () => {
          await openNoUrlServerModal('Dock to window');

          await mcpToken.typeToken(E2E_MCP_VALID_TOKEN);
          await mcpToken.save();
          await mcpToken.seeMessage(
            translations['mcp.settings.token.urlUnavailableForValidation'],
          );
          await mcpToken.cancel();
          await mcpToken.closeMcpPanel();
        });
      });

      test.describe('Credential source modes', () => {
        test('shows DCR-only modal content for DCR-authenticated servers — Overlay', async () => {
          const serverName = 'mcp-integration-tools';
          const dcrServerTools = [
            'mcp_list_tools',
            'mcp_create_incident',
            'mcp_get_service_status',
          ];
          const dcrScenario: McpServersListMock = {
            servers: [
              mcpServer(serverName, {
                url: 'http://localhost:7008/api/mcp-actions/v1',
                auth: 'dcr',
                hasToken: true,
                hasUserToken: false,
                hasOrgToken: false,
                enabled: true,
                status: 'connected',
                toolCount: dcrServerTools.length,
              }),
            ],
          };

          await mcpToken.gotoMcpSettings(dcrScenario, 'Overlay', {
            validationToolsByServer: {
              [serverName]: dcrServerTools,
            },
          });
          await mcpEditServerButton(
            sharedPage,
            serverName,
            translations,
          ).click();

          const modal = mcpCredentialConfigureModal(sharedPage);
          await expect(modal).toContainText(
            translations['mcp.settings.modalDescriptionDcr'],
          );
          await expect(
            modal.getByRole('button', { name: translations['common.cancel'] }),
          ).toBeVisible();
          await expect(
            modal.getByRole('button', { name: translations['modal.save'] }),
          ).toBeDisabled();
          await expect(mcpPersonalAccessTokenInput(sharedPage)).toBeHidden();
          for (const toolName of dcrServerTools) {
            await expect(
              modal.getByText(toolName, { exact: true }),
            ).toBeVisible();
          }

          await modal
            .getByRole('button', {
              name: translations['mcp.settings.closeConfigureModalAriaLabel'],
            })
            .click();
          await mcpToken.closeMcpPanel();
        });

        test('switching to organization token hides personal token input — Overlay', async () => {
          const serverName = 'org-backed-mcp';
          const orgServerTools = ['github.list-repos', 'github.get-repo'];
          const organizationTokenScenario: McpServersListMock = {
            servers: [
              mcpServer(serverName, {
                url: 'http://localhost:8555/mcp',
                hasUserToken: true,
                hasOrgToken: true,
                hasToken: true,
                toolCount: 2,
                status: 'connected',
              }),
            ],
          };

          await mcpToken.gotoMcpSettings(organizationTokenScenario, 'Overlay', {
            validationToolsByServer: {
              [serverName]: orgServerTools,
            },
          });
          await mcpToken.openEditServer(serverName);

          const modal = mcpCredentialConfigureModal(sharedPage);
          const organizationTokenRadio = modal.getByRole('radio', {
            name: translations[
              'mcp.settings.modal.credentialMode.organization'
            ],
          });
          const personalTokenRadio = modal.getByRole('radio', {
            name: translations['mcp.settings.modal.credentialMode.personal'],
          });

          await expect(personalTokenRadio).toBeChecked();
          for (const toolName of orgServerTools) {
            await expect(
              modal.getByText(toolName, { exact: true }),
            ).toBeVisible();
          }
          await organizationTokenRadio.click();
          await expect(organizationTokenRadio).toBeChecked();
          await expect(mcpPersonalAccessTokenInput(sharedPage)).toBeHidden();
          await expect(
            mcpConfigureModalSaveButton(sharedPage, translations),
          ).toBeEnabled();

          await mcpToken.save();
          await mcpToken.seeModalClosed();
          await mcpToken.seeRowStatus(
            serverName,
            formatMcpToolCountStatus(translations, 2),
          );
          await mcpToken.closeMcpPanel();
        });

        test('removing a personal token changes status to token required — Overlay', async () => {
          const serverName = 'personal-only-mcp';
          const personalServerTools = ['jira.search-issues', 'jira.get-issue'];
          const personalTokenScenario: McpServersListMock = {
            servers: [
              mcpServer(serverName, {
                url: 'http://localhost:8666/mcp',
                hasUserToken: true,
                hasOrgToken: false,
                hasToken: true,
                toolCount: 2,
                status: 'connected',
              }),
            ],
          };

          await mcpToken.gotoMcpSettings(personalTokenScenario, 'Overlay', {
            validationToolsByServer: {
              [serverName]: personalServerTools,
            },
          });
          await mcpToken.seeRowStatus(
            serverName,
            formatMcpToolCountStatus(translations, 2),
          );
          await mcpToken.openEditServer(serverName);

          const modal = mcpCredentialConfigureModal(sharedPage);
          const removePersonalTokenButton = modal.getByRole('button', {
            name: translations['mcp.settings.removePersonalToken'],
          });

          await expect(
            modal.getByText(
              formatMcpToolCountStatus(
                translations,
                personalServerTools.length,
              ),
              {
                exact: true,
              },
            ),
          ).toBeVisible();
          for (const toolName of personalServerTools) {
            await expect(
              modal.getByText(toolName, { exact: true }),
            ).toBeVisible();
          }
          await expect(removePersonalTokenButton).toBeVisible();
          await removePersonalTokenButton.click();
          await expect(
            modal.getByText(
              translations['mcp.settings.modal.tokenRemovedWarning'],
            ),
          ).toBeVisible();
          await expect(
            modal.getByText(translations['mcp.settings.status.tokenRequired'], {
              exact: true,
            }),
          ).toBeVisible();
          for (const toolName of personalServerTools) {
            await expect(
              modal.getByText(toolName, { exact: true }),
            ).toBeHidden();
          }
          await expect(removePersonalTokenButton).toBeDisabled();
          await expect(
            mcpConfigureModalSaveButton(sharedPage, translations),
          ).toBeEnabled();

          await mcpToken.save();
          await mcpToken.seeModalClosed();
          await mcpToken.seeRowStatus(
            serverName,
            translations['mcp.settings.status.tokenRequired'],
          );
          await mcpToken.closeMcpPanel();
        });
      });
    });
  });

  test('MCP tool calling renders in UI', async () => {
    const mcpToolCallPrompt = 'test mcp tool call';

    await mockConversations(sharedPage, conversations, true);
    await mockChatHistory(sharedPage, []);
    await openLightspeed(sharedPage);

    await sharedPage.unroute(`${modelBaseUrl}/v1/query`);
    await sharedPage.route(`${modelBaseUrl}/v1/query`, async route => {
      const payload = route.request().postDataJSON();
      if (payload.conversation_id) {
        conversations[1].conversation_id = payload.conversation_id;
      }
      const conversationId =
        conversations[1].conversation_id ?? conversations[0].conversation_id;
      await route.fulfill({
        body: generateQueryResponseWithMcpToolCall(conversationId),
      });
    });

    await sendMessage(mcpToolCallPrompt, sharedPage, translations);

    await expect(
      sharedPage.getByRole('button', {
        name: evaluateMessage(
          translations['toolCall.header'],
          'mcp_list_tools',
        ),
      }),
    ).toBeVisible();

    await sharedPage.unroute(`${modelBaseUrl}/v1/query`);
    await mockQuery(
      sharedPage,
      LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
      conversations,
    );
  });
});
