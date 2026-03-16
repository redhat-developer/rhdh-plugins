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
import { toAdkEffectiveConfig, toAdkMcpServerConfig } from './configAdapter';
import type { EffectiveConfig, MCPServerConfig } from '../../../types';

function fullPluginConfig(
  overrides: Partial<EffectiveConfig> = {},
): EffectiveConfig {
  return {
    model: 'llama3',
    baseUrl: 'http://localhost:8321',
    systemPrompt: 'Be helpful.',
    enableWebSearch: false,
    enableCodeInterpreter: false,
    vectorStoreIds: ['vs-1'],
    vectorStoreName: 'docs',
    embeddingModel: 'embed-v1',
    embeddingDimension: 384,
    chunkingStrategy: 'auto',
    maxChunkSizeTokens: 512,
    chunkOverlapTokens: 64,
    skipTlsVerify: false,
    zdrMode: false,
    verboseStreamLogging: false,
    ...overrides,
  };
}

describe('toAdkEffectiveConfig', () => {
  it('forwards core model fields', () => {
    const result = toAdkEffectiveConfig(fullPluginConfig());
    expect(result.model).toBe('llama3');
    expect(result.baseUrl).toBe('http://localhost:8321');
    expect(result.systemPrompt).toBe('Be helpful.');
  });

  it('forwards all RAG-related fields', () => {
    const result = toAdkEffectiveConfig(
      fullPluginConfig({
        vectorStoreIds: ['vs-1', 'vs-2'],
        fileSearchMaxResults: 10,
        fileSearchScoreThreshold: 0.5,
        searchMode: 'hybrid',
        bm25Weight: 0.3,
        semanticWeight: 0.7,
      }),
    );
    expect(result.vectorStoreIds).toEqual(['vs-1', 'vs-2']);
    expect(result.fileSearchMaxResults).toBe(10);
    expect(result.fileSearchScoreThreshold).toBe(0.5);
    expect(result.searchMode).toBe('hybrid');
  });

  it('strips plugin-only branding field', () => {
    const result = toAdkEffectiveConfig(
      fullPluginConfig({ branding: { title: 'Augment' } as any }),
    );
    expect((result as any).branding).toBeUndefined();
  });

  it('strips plugin-only safety fields', () => {
    const result = toAdkEffectiveConfig(
      fullPluginConfig({
        safetyEnabled: true,
        inputShields: ['shield-1'],
        outputShields: ['shield-2'],
        safetyOnError: 'block',
      }),
    );
    expect((result as any).safetyEnabled).toBeUndefined();
    expect((result as any).inputShields).toBeUndefined();
    expect((result as any).outputShields).toBeUndefined();
    expect((result as any).safetyOnError).toBeUndefined();
  });

  it('strips plugin-only evaluation fields', () => {
    const result = toAdkEffectiveConfig(
      fullPluginConfig({
        evaluationEnabled: true,
        scoringFunctions: ['fn-1'],
        minScoreThreshold: 0.8,
        evaluationOnError: 'fail',
      }),
    );
    expect((result as any).evaluationEnabled).toBeUndefined();
    expect((result as any).scoringFunctions).toBeUndefined();
    expect((result as any).minScoreThreshold).toBeUndefined();
    expect((result as any).evaluationOnError).toBeUndefined();
  });

  it('maps mcpServers through toAdkMcpServerConfig', () => {
    const result = toAdkEffectiveConfig(
      fullPluginConfig({
        mcpServers: [
          {
            id: 'srv-1',
            name: 'K8s',
            type: 'sse',
            url: 'http://k8s:3001/sse',
            requireApproval: 'never',
          } as MCPServerConfig,
        ],
      }),
    );
    expect(result.mcpServers).toHaveLength(1);
    expect(result.mcpServers![0].id).toBe('srv-1');
    expect(result.mcpServers![0].name).toBe('K8s');
  });

  it('forwards agent config when present', () => {
    const result = toAdkEffectiveConfig(
      fullPluginConfig({
        agents: {
          router: {
            name: 'Router',
            instructions: 'Route requests.',
          },
        },
        defaultAgent: 'router',
        maxAgentTurns: 5,
      }),
    );
    expect(result.agents?.router?.name).toBe('Router');
    expect(result.defaultAgent).toBe('router');
    expect(result.maxAgentTurns).toBe(5);
  });

  it('returns undefined mcpServers when plugin has none', () => {
    const result = toAdkEffectiveConfig(fullPluginConfig());
    expect(result.mcpServers).toBeUndefined();
  });
});

describe('toAdkMcpServerConfig', () => {
  it('maps core fields', () => {
    const result = toAdkMcpServerConfig({
      id: 'srv-1',
      name: 'K8s MCP',
      type: 'sse',
      url: 'http://k8s:3001/sse',
      requireApproval: 'never',
    } as MCPServerConfig);
    expect(result).toEqual({
      id: 'srv-1',
      name: 'K8s MCP',
      type: 'sse',
      url: 'http://k8s:3001/sse',
      headers: undefined,
      requireApproval: 'never',
      allowedTools: undefined,
    });
  });

  it('forwards headers and allowedTools', () => {
    const result = toAdkMcpServerConfig({
      id: 'srv-2',
      name: 'Auth MCP',
      type: 'sse',
      url: 'http://auth:3002/sse',
      headers: { Authorization: 'Bearer token' },
      requireApproval: 'always',
      allowedTools: ['verify_user'],
    } as MCPServerConfig);
    expect(result.headers).toEqual({ Authorization: 'Bearer token' });
    expect(result.allowedTools).toEqual(['verify_user']);
  });

  it('strips auth-specific plugin fields', () => {
    const pluginServer = {
      id: 'srv-3',
      name: 'Secured',
      type: 'sse',
      url: 'http://x:3000/sse',
      requireApproval: 'never',
      authRef: 'k8s-service-account',
      oauth: { tokenEndpoint: 'https://auth/token' },
    } as unknown as MCPServerConfig;
    const result = toAdkMcpServerConfig(pluginServer);
    expect((result as any).authRef).toBeUndefined();
    expect((result as any).oauth).toBeUndefined();
  });
});
