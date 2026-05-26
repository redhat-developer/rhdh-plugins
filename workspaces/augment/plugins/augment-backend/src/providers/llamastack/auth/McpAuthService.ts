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

import { LoggerService } from '@backstage/backend-plugin-api';
import {
  MAX_TOKEN_CACHE_SIZE,
  TOKEN_EXPIRY_BUFFER_S,
} from '../../../constants';
import { fetchWithTlsControl } from '../../../services/utils/http';
import { toErrorMessage } from '../../../services/utils';
import { MCPAuthConfig, MCPServerConfig, SecurityConfig } from '../../../types';
import { getApiApprovalConfig } from '../config/McpConfigLoader';
import {
  fetchOAuthToken,
  fetchOAuthClientCredentials,
  fetchServiceAccountToken,
} from './mcpTokenFetchers';
import type { TokenCacheEntry } from './mcpTokenFetchers';

export class McpAuthService {
  private readonly securityConfig: SecurityConfig;
  private readonly mcpAuthConfigs: Map<string, MCPAuthConfig>;
  private readonly logger: LoggerService;
  private readonly skipTlsVerify: boolean;

  private readonly oauthTokenCache: Map<string, TokenCacheEntry> = new Map();
  private readonly serviceAccountTokenCache: Map<string, TokenCacheEntry> =
    new Map();

  private readonly inflightTokenRequests: Map<string, Promise<string | null>> =
    new Map();

  private mcpOAuthToken: string | null = null;
  private mcpOAuthTokenExpiry: number | null = null;

  constructor(
    securityConfig: SecurityConfig,
    mcpAuthConfigs: Map<string, MCPAuthConfig>,
    logger: LoggerService,
    skipTlsVerify: boolean = false,
  ) {
    this.securityConfig = securityConfig;
    this.mcpAuthConfigs = mcpAuthConfigs;
    this.logger = logger;
    this.skipTlsVerify = skipTlsVerify;
  }

  private evictExpiredEntries(cache: Map<string, TokenCacheEntry>): void {
    if (cache.size <= MAX_TOKEN_CACHE_SIZE) return;
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) {
        cache.delete(key);
      }
    }
    if (cache.size > MAX_TOKEN_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }
  }

  private makeFetchFn() {
    const skipTls = this.skipTlsVerify;
    return (
      url: string,
      options: {
        method: string;
        headers: Record<string, string>;
        body: string;
      },
    ) =>
      fetchWithTlsControl(url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        skipTlsVerify: skipTls,
      });
  }

  async getServerHeaders(
    server: MCPServerConfig,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = { ...server.headers };

    if (server.authRef) {
      const authConfig = this.mcpAuthConfigs.get(server.authRef);
      if (!authConfig) {
        this.logger.warn(
          `MCP server ${server.id} references unknown auth config: ${server.authRef}`,
        );
      } else if (authConfig.type === 'oauth') {
        const token = await this.getOAuthToken(server.id, authConfig);
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        } else {
          this.logger.warn(
            `MCP server ${server.id}: OAuth token via authRef "${server.authRef}" returned null — requests will be unauthenticated`,
          );
        }
      } else if (authConfig.type === 'serviceAccount') {
        const token = await this.getServiceAccountToken(server.id, authConfig);
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        } else {
          this.logger.warn(
            `MCP server ${server.id}: ServiceAccount token via authRef "${server.authRef}" returned null — requests will be unauthenticated`,
          );
        }
      }
      return headers;
    }

    if (server.oauth) {
      const token = await this.getOAuthToken(server.id, server.oauth);
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        this.logger.warn(
          `MCP server ${server.id}: inline OAuth token returned null — requests will be unauthenticated`,
        );
      }
      return headers;
    }

    if (server.serviceAccount) {
      const token = await this.getServiceAccountToken(
        server.id,
        server.serviceAccount,
      );
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        this.logger.warn(
          `MCP server ${server.id}: ServiceAccount token returned null — requests will be unauthenticated`,
        );
      }
      return headers;
    }

    if (this.securityConfig.mode === 'full' && this.securityConfig.mcpOAuth) {
      const token = await this.getSecurityMcpOAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        this.logger.debug(
          `MCP server ${server.id} using global security.mcpOAuth token`,
        );
      } else {
        this.logger.warn(
          `MCP server ${server.id}: global security.mcpOAuth token returned null — requests will be unauthenticated`,
        );
      }
      return headers;
    }

    return headers;
  }

  getApiApprovalConfig(
    configApproval: Parameters<typeof getApiApprovalConfig>[0],
  ): ReturnType<typeof getApiApprovalConfig> {
    return getApiApprovalConfig(configApproval, this.logger);
  }

  private async getOAuthToken(
    serverId: string,
    oauth: import('../../../types').OAuthClientConfig,
  ): Promise<string | null> {
    if (!oauth) {
      return null;
    }

    const cached = this.oauthTokenCache.get(serverId);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Using cached OAuth token for MCP server ${serverId}`);
      return cached.token;
    }

    const inflightKey = `oauth:${serverId}`;
    const inflight = this.inflightTokenRequests.get(inflightKey);
    if (inflight !== undefined) {
      this.logger.debug(
        `Awaiting in-flight OAuth token request for ${serverId}`,
      );
      return inflight;
    }

    const request = fetchOAuthToken(
      serverId,
      oauth,
      this.oauthTokenCache,
      this.makeFetchFn(),
      cache => this.evictExpiredEntries(cache),
      this.logger,
    );
    this.inflightTokenRequests.set(inflightKey, request);

    try {
      return await request;
    } finally {
      this.inflightTokenRequests.delete(inflightKey);
    }
  }

  private async getServiceAccountToken(
    serverId: string,
    saConfig: import('../../../types').MCPServerServiceAccountConfig,
  ): Promise<string | null> {
    return fetchServiceAccountToken(
      serverId,
      saConfig,
      this.serviceAccountTokenCache,
      cache => this.evictExpiredEntries(cache),
      this.logger,
    );
  }

  private async getSecurityMcpOAuthToken(): Promise<string | null> {
    if (this.securityConfig.mode !== 'full' || !this.securityConfig.mcpOAuth) {
      return null;
    }

    if (
      this.mcpOAuthToken &&
      this.mcpOAuthTokenExpiry &&
      Date.now() < this.mcpOAuthTokenExpiry - TOKEN_EXPIRY_BUFFER_S * 1000
    ) {
      return this.mcpOAuthToken;
    }

    const inflightKey = 'security:mcpOAuth';
    const inflight = this.inflightTokenRequests.get(inflightKey);
    if (inflight !== undefined) {
      this.logger.debug('Awaiting in-flight security mcpOAuth token request');
      return inflight;
    }

    const request = this.fetchSecurityMcpOAuthToken();
    this.inflightTokenRequests.set(inflightKey, request);

    try {
      return await request;
    } finally {
      this.inflightTokenRequests.delete(inflightKey);
    }
  }

  private async fetchSecurityMcpOAuthToken(): Promise<string | null> {
    const { tokenUrl, clientId, clientSecret, scopes } =
      this.securityConfig.mcpOAuth!;

    this.logger.info(`Fetching security OAuth token for MCP servers`);

    try {
      const result = await fetchOAuthClientCredentials(
        tokenUrl,
        clientId,
        clientSecret,
        scopes || ['openid'],
        this.makeFetchFn(),
      );

      this.mcpOAuthToken = result.token;
      this.mcpOAuthTokenExpiry = Date.now() + result.expiresIn * 1000;

      this.logger.info(
        `Security OAuth token obtained, expires in ${result.expiresIn}s`,
      );

      return this.mcpOAuthToken;
    } catch (error) {
      this.logger.error(
        `Failed to get security OAuth token: ${toErrorMessage(error)}`,
      );
      return null;
    }
  }
}
