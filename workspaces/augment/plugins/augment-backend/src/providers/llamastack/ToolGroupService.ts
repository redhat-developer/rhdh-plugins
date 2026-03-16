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
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ResponsesApiClient } from './ResponsesApiClient';

/**
 * Describes a tool group registered on the Llama Stack server.
 * Matches the `GET /v1/toolgroups` response shape.
 */
export interface ToolGroupInfo {
  identifier: string;
  provider_id?: string;
  provider_resource_id?: string;
  type: string;
  description?: string;
  mcp_endpoint?: { uri: string };
  args?: Record<string, unknown>;
}

/**
 * Service for discovering and loading tool groups from Llama Stack's
 * `/v1/toolgroups` API. Enables deferred tool loading at runtime.
 *
 * Matches the OpenAI Agents SDK `ToolSearchTool` pattern: instead of
 * statically listing all tools, agents can discover available tool
 * groups and request the ones relevant to each query.
 */
export class ToolGroupService {
  private cache: ToolGroupInfo[] | null = null;
  private cacheExpiry = 0;
  private readonly cacheTtlMs: number;

  constructor(
    private readonly logger: LoggerService,
    cacheTtlSeconds: number = 300,
  ) {
    this.cacheTtlMs = cacheTtlSeconds * 1000;
  }

  async listToolGroups(client: ResponsesApiClient): Promise<ToolGroupInfo[]> {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const response = await client.requestWithRetry<
        { data: ToolGroupInfo[] } | ToolGroupInfo[]
      >('/v1/toolgroups', { method: 'GET' });
      const groups = Array.isArray(response) ? response : (response.data ?? []);
      this.cache = groups;
      this.cacheExpiry = now + this.cacheTtlMs;
      this.logger.info(
        `[ToolGroupService] Discovered ${groups.length} tool group(s)`,
      );
      return groups;
    } catch (error) {
      this.logger.warn(
        `[ToolGroupService] Failed to list tool groups: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.cache ?? [];
    }
  }

  async getToolGroup(
    client: ResponsesApiClient,
    identifier: string,
  ): Promise<ToolGroupInfo | undefined> {
    try {
      return await client.requestWithRetry<ToolGroupInfo>(
        `/v1/toolgroups/${encodeURIComponent(identifier)}`,
        { method: 'GET' },
      );
    } catch (error) {
      this.logger.warn(
        `[ToolGroupService] Failed to get tool group "${identifier}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  invalidateCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }
}
