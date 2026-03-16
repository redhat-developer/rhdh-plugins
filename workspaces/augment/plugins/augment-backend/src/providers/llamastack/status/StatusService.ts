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
import { toErrorMessage, listMcpServerTools } from '../../../services/utils';
import type {
  LlamaStackConfig,
  AugmentStatus,
  LlamaStackVectorStoreResponse,
  MCPServerConfig,
  MCPServerStatus,
  SecurityConfig,
} from '../../../types';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ClientManager } from '../ClientManager';
import type { McpAuthService } from '../McpAuthService';

/**
 * Dependencies passed per getStatus() call so the service
 * always operates on the latest orchestrator state.
 */
export interface StatusDeps {
  config: LlamaStackConfig | null;
  clientManager: ClientManager;
  mcpAuth: McpAuthService | null;
  mcpServers: MCPServerConfig[];
  /** IDs of servers that originate from YAML (vs admin-added) */
  yamlServerIds: Set<string>;
  securityConfig: SecurityConfig;
  vectorStoreReady: boolean;
  logger: LoggerService;
}

/**
 * Encapsulates all status and health-check logic that was previously
 * in ResponsesApiCoordinator. Each getStatus() call receives a fresh
 * StatusDeps snapshot so there are no stale references.
 */
export class StatusService {
  async getStatus(deps: StatusDeps): Promise<AugmentStatus> {
    const { config, clientManager, securityConfig, mcpServers } = deps;

    if (!config || !clientManager.hasClient()) {
      return {
        providerId: 'llamastack',
        provider: {
          id: 'llamastack',
          model: 'not configured',
          baseUrl: 'not configured',
          connected: false,
          error: 'Llama Stack not configured',
        },
        vectorStore: {
          id: 'not configured',
          connected: false,
          error: 'Llama Stack not configured',
        },
        mcpServers: [],
        securityMode: securityConfig.mode,
        timestamp: new Date().toISOString(),
        ready: false,
        configurationErrors: [
          'Llama Stack not configured. Add augment.llamaStack.baseUrl to your app-config.yaml',
        ],
      };
    }

    const [providerResult, vectorStoreResult, mcpServerStatuses] =
      await Promise.all([
        this.checkProviderHealth(deps),
        this.checkVectorStoreHealth(deps),
        this.checkMcpServerHealth(deps),
      ]);

    const configurationErrors: string[] = [];
    if (!providerResult.connected) {
      configurationErrors.push(
        `AI Provider (Llama Stack) not connected: ${
          providerResult.error || 'Unknown error'
        }. Check augment.llamaStack.baseUrl in app-config.yaml`,
      );
    } else if (!providerResult.modelAvailable) {
      configurationErrors.push(
        `Model "${config.model}" not found on the Llama Stack server. Chat may fail. Update the model in the Admin Panel.`,
      );
    }

    const mcpAvailable =
      mcpServerStatuses.length > 0 && mcpServerStatuses.some(s => s.connected);
    const mcpConfigured = mcpServers.length > 0;

    const providerError =
      providerResult.error ??
      (!providerResult.modelAvailable && providerResult.connected
        ? `Model "${config.model}" not found on server`
        : undefined);

    return {
      providerId: 'llamastack',
      provider: {
        id: 'llamastack',
        model: config.model,
        baseUrl: config.baseUrl,
        connected: providerResult.connected,
        error: providerError,
      },
      vectorStore: {
        id: config.vectorStoreIds.join(', ') || 'not configured',
        connected: vectorStoreResult.connected,
        totalDocuments: vectorStoreResult.totalDocuments,
        error: vectorStoreResult.error,
      },
      mcpServers: mcpServerStatuses,
      securityMode: securityConfig.mode,
      timestamp: new Date().toISOString(),
      ready: providerResult.connected,
      configurationErrors,
      capabilities: {
        chat: providerResult.connected,
        rag: {
          available: vectorStoreResult.connected,
          reason: !vectorStoreResult.connected
            ? vectorStoreResult.error ||
              'Vector store not initialized — trigger a sync to set up'
            : undefined,
        },
        mcpTools: {
          available: mcpAvailable,
          reason: getMcpToolsReason(
            mcpAvailable,
            mcpConfigured,
            mcpServerStatuses,
          ),
        },
      },
    };
  }

  private async checkProviderHealth(
    deps: StatusDeps,
  ): Promise<{ connected: boolean; modelAvailable: boolean; error?: string }> {
    try {
      const response = await deps.clientManager
        .getExistingClient()
        .request<{ data: Array<{ id: string }> }>('/v1/models', {
          method: 'GET',
        });

      const models = response.data || [];
      const modelAvailable = deps.config
        ? models.some(m => m.id === deps.config!.model)
        : false;

      return { connected: true, modelAvailable };
    } catch (error) {
      return {
        connected: false,
        modelAvailable: false,
        error: toErrorMessage(error, 'Failed to connect'),
      };
    }
  }

  private async checkVectorStoreHealth(
    deps: StatusDeps,
  ): Promise<{ connected: boolean; totalDocuments?: number; error?: string }> {
    if (!deps.vectorStoreReady) {
      return {
        connected: false,
        error: 'Not initialized yet — will be created on first sync',
      };
    }

    try {
      const storeIds = deps.config!.vectorStoreIds;
      if (!storeIds || storeIds.length === 0) {
        return { connected: false, error: 'No vector store IDs configured' };
      }
      const vectorStoreInfo = await deps.clientManager
        .getExistingClient()
        .request<LlamaStackVectorStoreResponse>(
          `/v1/vector_stores/${storeIds[0]}`,
          { method: 'GET' },
        );
      return {
        connected: true,
        totalDocuments: vectorStoreInfo.file_counts?.total,
      };
    } catch (error) {
      return {
        connected: false,
        error: toErrorMessage(error, 'Failed to connect'),
      };
    }
  }

  private async checkMcpServerHealth(
    deps: StatusDeps,
  ): Promise<MCPServerStatus[]> {
    return Promise.all(
      deps.mcpServers.map(async server => {
        const source: 'yaml' | 'admin' = deps.yamlServerIds.has(server.id)
          ? 'yaml'
          : 'admin';
        try {
          const headers: Record<string, string> = {
            ...(server.headers || {}),
          };

          if (deps.mcpAuth) {
            const authHeaders = await deps.mcpAuth.getServerHeaders(server);
            Object.assign(headers, authHeaders);
          }

          const skipTls = deps.config?.skipTlsVerify ?? false;
          const tools = await listMcpServerTools(server.url, {
            headers,
            skipTlsVerify: skipTls,
            clientName: 'augment-status',
          });

          return {
            id: server.id,
            name: server.name,
            url: server.url,
            connected: true,
            tools: tools.map(t => ({
              name: t.name,
              description: t.description,
            })),
            toolCount: tools.length,
            source,
          };
        } catch (error) {
          return {
            id: server.id,
            name: server.name,
            url: server.url,
            connected: false,
            error: toErrorMessage(error, 'Failed to connect'),
            source,
          };
        }
      }),
    );
  }
}

function getMcpToolsReason(
  mcpAvailable: boolean,
  mcpConfigured: boolean,
  mcpServerStatuses: { id: string; connected: boolean }[],
): string | undefined {
  if (mcpAvailable) return undefined;
  if (mcpConfigured) {
    const unreachable = mcpServerStatuses
      .filter(s => !s.connected)
      .map(s => s.id)
      .join(', ');
    return `MCP servers configured but not reachable: ${unreachable}`;
  }
  return 'No MCP servers configured';
}
