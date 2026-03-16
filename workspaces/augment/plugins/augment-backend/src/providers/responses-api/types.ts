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

import type { MCPServerConfig, ApprovalFilter } from '../../types';

/**
 * Minimal configuration required by the generic Responses API HTTP client.
 * Providers map their platform-specific config to this shape.
 */
export interface ResponsesApiClientConfig {
  baseUrl: string;
  token?: string;
  skipTlsVerify?: boolean;
}

/**
 * Provides MCP authentication headers and approval configuration.
 * Implemented by platform providers (e.g. McpAuthService in LlamaStack).
 */
export interface McpAuthProvider {
  getServerHeaders(server: MCPServerConfig): Promise<Record<string, string>>;
  getApiApprovalConfig(
    configApproval: 'always' | 'never' | ApprovalFilter | undefined,
  ): 'always' | 'never' | { always?: string[]; never?: string[] };
}

/**
 * Provides access to a configured ResponsesApiClient instance.
 * Implemented by platform providers (e.g. ClientManager in LlamaStack).
 *
 * Uses a generic constraint to avoid circular imports with the client module.
 * In practice, consumers parameterize with `ResponsesApiClient`.
 */
export interface ClientProvider<TClient = unknown> {
  getExistingClient(): TClient;
}

/**
 * Provides effective configuration for the current request context.
 * Implemented by platform providers (e.g. ConfigResolutionService in LlamaStack).
 */
export interface ConfigProvider {
  resolve(): Promise<EffectiveConfigSnapshot>;
  getCachedConfig(): EffectiveConfigSnapshot | null;
  invalidateCache(): void;
}

/**
 * Snapshot of effective configuration as seen by the toolkit.
 * Platform providers map their full config to this minimal shape.
 */
export interface EffectiveConfigSnapshot {
  model: string;
  mcpServers?: MCPServerConfig[];
  guardrails?: string[];
  safetyIdentifier?: string;
  reasoning?: Record<string, unknown>;
}

/**
 * Describes what the connected Responses API server supports.
 * Used by ToolsBuilder and ResponsesApiService to gate features.
 */
export interface CapabilityInfo {
  functionTools: boolean;
  strictField: boolean;
  maxOutputTokens: boolean;
  mcpTools: boolean;
  parallelToolCalls: boolean;
  truncation: boolean;
}
