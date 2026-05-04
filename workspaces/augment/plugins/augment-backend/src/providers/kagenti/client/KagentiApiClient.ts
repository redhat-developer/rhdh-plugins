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

import * as http from 'http';
import * as https from 'https';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { KeycloakTokenManager } from './KeycloakTokenManager';
import type {
  HealthResponse,
  AuthConfigResponse,
  AuthStatusResponse,
  UserInfoResponse,
  FeatureFlagsResponse,
  DashboardConfigResponse,
  NamespaceListResponse,
  AgentCardResponse,
  ChatRequest,
  ChatResponse,
  AgentListResponse,
  AgentDetailResponse,
  RouteStatusResponse,
  CreateAgentRequest,
  CreateAgentResponse,
  DeleteResponse,
  ListMigratableAgentsResponse,
  MigrateAgentRequest,
  MigrateAgentResponse,
  MigrateAllResponse,
  ClusterBuildStrategiesResponse,
  ShipwrightBuildListItem,
  ShipwrightBuildListResponse,
  ShipwrightBuildStatusResponse,
  ShipwrightBuildRunStatusResponse,
  ShipwrightBuildInfoResponse,
  TriggerBuildRunResponse,
  FinalizeShipwrightBuildRequest,
  ParseEnvRequest,
  ParseEnvResponse,
  FetchEnvUrlRequest,
  FetchEnvUrlResponse,
  ToolListResponse,
  ToolDetailResponse,
  CreateToolRequest,
  CreateToolResponse,
  FinalizeToolBuildRequest,
  MCPToolsResponse,
  MCPInvokeRequest,
  MCPInvokeResponse,
  ContextHistoryListResponse,
} from './types';
import { API_PREFIX, encodePathSegment as e } from './utils';

const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

export interface KagentiApiClientOptions {
  baseUrl: string;
  tokenManager: KeycloakTokenManager;
  skipTlsVerify?: boolean;
  logger: LoggerService;
  requestTimeoutMs?: number;
  streamTimeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
}

export interface KagentiRequestContext {
  userRef?: string;
}

export class KagentiApiClient {
  private readonly baseUrl: string;
  private readonly tokenManager: KeycloakTokenManager;
  private readonly logger: LoggerService;
  private readonly httpAgent: http.Agent | https.Agent;
  private readonly isHttps: boolean;
  private readonly requestTimeoutMs: number;
  private readonly streamTimeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private _requestContext: KagentiRequestContext = {};

  constructor(options: KagentiApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.tokenManager = options.tokenManager;
    this.logger = options.logger;
    this.isHttps = this.baseUrl.startsWith('https');
    this.requestTimeoutMs = options.requestTimeoutMs ?? 30_000;
    this.streamTimeoutMs = options.streamTimeoutMs ?? 300_000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 1000;

    if (this.isHttps) {
      this.httpAgent = new https.Agent({
        keepAlive: true,
        rejectUnauthorized: !(options.skipTlsVerify ?? false),
      });
    } else {
      this.httpAgent = new http.Agent({ keepAlive: true });
    }
  }

  /**
   * Set per-request context (e.g. Backstage user identity) that will be
   * forwarded to the Kagenti API as an X-Backstage-User header.
   */
  setRequestContext(ctx: KagentiRequestContext): void {
    this._requestContext = ctx;
  }

  // ---------------------------------------------------------------------------
  // Generic request helpers
  // ---------------------------------------------------------------------------

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    skipAuth = false,
  ): Promise<T> {
    return this.requestWithRetry<T>(method, path, body, skipAuth);
  }

  async requestWithRetry<T>(
    method: string,
    path: string,
    body?: unknown,
    skipAuth = false,
    retries?: number,
  ): Promise<T> {
    const maxAttempts = retries ?? this.maxRetries;
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        return await this.doRequest<T>(method, path, body, skipAuth);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const statusMatch = lastError.message.match(/status (\d+)/);
        const status = statusMatch ? Number(statusMatch[1]) : 0;
        if (status === 401 && attempt === 0) {
          this.tokenManager.clearCache();
          this.logger.warn(
            `Got 401, cleared token cache and retrying ${method} ${path}`,
          );
          continue;
        }
        const isNetworkError =
          status === 0 &&
          /ECONNRESET|ECONNREFUSED|EPIPE|ETIMEDOUT|EAI_AGAIN/i.test(
            lastError.message,
          );
        if (
          (!RETRYABLE_STATUS_CODES.has(status) && !isNetworkError) ||
          attempt === maxAttempts
        ) {
          throw lastError;
        }
        const delay = this.retryBaseDelayMs * Math.pow(2, attempt);
        this.logger.warn(
          `Retrying ${method} ${path} after ${status} (attempt ${attempt + 1} of ${maxAttempts + 1}, delay ${delay}ms)`,
        );
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw (
      lastError ?? new Error(`Request failed after ${maxAttempts} attempts`)
    );
  }

  async streamRequest(
    path: string,
    body: unknown,
    onLine: (line: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const token = await this.tokenManager.getTokenForStreaming(
      this.streamTimeoutMs || 300_000,
    );
    const url = new URL(`${this.baseUrl}${path}`);
    const transport = this.isHttps ? https : http;
    const payload = JSON.stringify(body);

    return new Promise<void>((resolve, reject) => {
      let cleanupAbort = () => {};

      const req = transport.request(
        {
          method: 'POST',
          hostname: url.hostname,
          port: url.port || (this.isHttps ? 443 : 80),
          path: url.pathname + url.search,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
            ...(this._requestContext.userRef && {
              'X-Backstage-User': this._requestContext.userRef,
            }),
          },
          agent: this.httpAgent,
          timeout: this.streamTimeoutMs || 0,
        },
        res => {
          if (!res.statusCode || res.statusCode >= 300) {
            const errChunks: Buffer[] = [];
            res.on('data', (c: Buffer) => errChunks.push(c));
            res.on('end', () => {
              const raw = Buffer.concat(errChunks).toString('utf-8');
              let detail = '';
              try {
                const parsed = JSON.parse(raw);
                detail = parsed.detail || parsed.message || '';
              } catch {
                /* not JSON */
              }
              reject(
                new Error(
                  `Kagenti stream request failed: status ${res.statusCode}${detail ? ` - ${detail}` : ''}`,
                ),
              );
            });
            return;
          }

          let buffer = '';
          res.setEncoding('utf-8');
          res.on('data', (chunk: string) => {
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.substring(6);
                if (data !== '[DONE]') {
                  onLine(data);
                }
              }
            }
          });
          res.on('end', () => {
            if (buffer.trim().startsWith('data: ')) {
              const data = buffer.trim().substring(6);
              if (data !== '[DONE]') {
                onLine(data);
              }
            }
            cleanupAbort();
            resolve();
          });
          res.on('error', err => {
            cleanupAbort();
            reject(err);
          });
        },
      );

      req.on('error', err => {
        cleanupAbort();
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        cleanupAbort();
        reject(new Error(`Kagenti stream request timed out`));
      });

      if (signal) {
        const onAbort = () => {
          req.destroy();
          reject(new Error('Stream aborted by client'));
        };
        if (signal.aborted) {
          req.destroy();
          reject(new Error('Stream aborted by client'));
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
        cleanupAbort = () => signal.removeEventListener('abort', onAbort);
      }

      req.write(payload);
      req.end();
    });
  }

  private async doRequest<T>(
    method: string,
    path: string,
    body?: unknown,
    skipAuth = false,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (!skipAuth) {
      const token = await this.tokenManager.getToken();
      headers.Authorization = `Bearer ${token}`;
    }

    if (this._requestContext.userRef) {
      headers['X-Backstage-User'] = this._requestContext.userRef;
    }

    let payload: string | undefined;
    if (body !== undefined) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(Buffer.byteLength(payload));
    }

    const url = new URL(`${this.baseUrl}${path}`);
    const transport = this.isHttps ? https : http;

    return new Promise<T>((resolve, reject) => {
      const req = transport.request(
        {
          method,
          hostname: url.hostname,
          port: url.port || (this.isHttps ? 443 : 80),
          path: url.pathname + url.search,
          headers,
          agent: this.httpAgent,
          timeout: this.requestTimeoutMs,
        },
        res => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('error', err => reject(err));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf-8');
            if (!res.statusCode || res.statusCode >= 400) {
              let detail = '';
              try {
                const parsed = JSON.parse(raw);
                detail = parsed.detail || parsed.message || '';
              } catch {
                /* not JSON */
              }
              reject(
                new Error(
                  `Kagenti API error: ${method} ${path} status ${res.statusCode}${detail ? ` - ${detail}` : ''}`,
                ),
              );
              return;
            }
            if (
              res.statusCode &&
              res.statusCode >= 300 &&
              res.statusCode < 400
            ) {
              reject(
                new Error(
                  `Kagenti API error: ${method} ${path} unexpected redirect status ${res.statusCode}`,
                ),
              );
              return;
            }
            if (res.statusCode === 204 || !raw.trim()) {
              resolve({} as T);
              return;
            }
            try {
              resolve(JSON.parse(raw) as T);
            } catch {
              reject(
                new Error(`Failed to parse Kagenti response from ${path}`),
              );
            }
          });
        },
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Kagenti API timeout: ${method} ${path}`));
      });
      req.on('error', reject);

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  destroy(): void {
    this.httpAgent.destroy();
  }

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/health', undefined, true);
  }

  async ready(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/ready', undefined, true);
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  /**
   * Fetches the Kagenti server's user-facing SSO/Keycloak configuration.
   * Note: This is NOT the same as the Backstage service credentials
   * configured in augment.kagenti.auth. This endpoint returns the
   * Kagenti server's own authentication settings for end users.
   * Currently unused — reserved for future SSO integration.
   */
  async getAuthConfig(): Promise<AuthConfigResponse> {
    return this.request<AuthConfigResponse>(
      'GET',
      `${API_PREFIX}/auth/config`,
      undefined,
      true,
    );
  }

  async getAuthStatus(): Promise<AuthStatusResponse> {
    return this.request<AuthStatusResponse>('GET', `${API_PREFIX}/auth/status`);
  }

  async getUserInfo(): Promise<UserInfoResponse> {
    return this.request<UserInfoResponse>('GET', `${API_PREFIX}/auth/userinfo`);
  }

  async getMe(): Promise<UserInfoResponse> {
    return this.request<UserInfoResponse>('GET', `${API_PREFIX}/auth/me`);
  }

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------

  async getFeatureFlags(): Promise<FeatureFlagsResponse> {
    return this.request<FeatureFlagsResponse>(
      'GET',
      `${API_PREFIX}/config/features`,
    );
  }

  async getDashboards(): Promise<DashboardConfigResponse> {
    return this.request<DashboardConfigResponse>(
      'GET',
      `${API_PREFIX}/config/dashboards`,
    );
  }

  // ---------------------------------------------------------------------------
  // Namespaces
  // ---------------------------------------------------------------------------

  async listNamespaces(enabledOnly = true): Promise<NamespaceListResponse> {
    const qs = `?enabled_only=${enabledOnly}`;
    return this.request<NamespaceListResponse>(
      'GET',
      `${API_PREFIX}/namespaces${qs}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Chat
  // ---------------------------------------------------------------------------

  async getAgentCard(
    namespace: string,
    name: string,
    options?: { retries?: number },
  ): Promise<AgentCardResponse> {
    return this.requestWithRetry<AgentCardResponse>(
      'GET',
      `${API_PREFIX}/chat/${e(namespace)}/${e(name)}/agent-card`,
      undefined,
      false,
      options?.retries,
    );
  }

  async chatSend(
    namespace: string,
    name: string,
    message: string,
    sessionId?: string,
    a2aMetadata?: {
      metadata?: Record<string, unknown>;
      parts?: Array<Record<string, unknown>>;
      contextId?: string;
    },
  ): Promise<ChatResponse> {
    const body: ChatRequest = {
      message,
      session_id: sessionId,
      ...(a2aMetadata?.metadata && { metadata: a2aMetadata.metadata }),
      ...(a2aMetadata?.parts && { parts: a2aMetadata.parts }),
      ...(a2aMetadata?.contextId && { context_id: a2aMetadata.contextId }),
    };
    return this.request<ChatResponse>(
      'POST',
      `${API_PREFIX}/chat/${e(namespace)}/${e(name)}/send`,
      body,
    );
  }

  async chatStream(
    namespace: string,
    name: string,
    message: string,
    sessionId: string | undefined,
    onLine: (line: string) => void,
    signal?: AbortSignal,
    a2aMetadata?: {
      metadata?: Record<string, unknown>;
      parts?: Array<Record<string, unknown>>;
      contextId?: string;
    },
  ): Promise<void> {
    const body: ChatRequest = {
      message,
      session_id: sessionId,
      ...(a2aMetadata?.metadata && { metadata: a2aMetadata.metadata }),
      ...(a2aMetadata?.parts && { parts: a2aMetadata.parts }),
      ...(a2aMetadata?.contextId && { context_id: a2aMetadata.contextId }),
    };
    return this.streamRequest(
      `${API_PREFIX}/chat/${e(namespace)}/${e(name)}/stream`,
      body,
      onLine,
      signal,
    );
  }

  // ---------------------------------------------------------------------------
  // Agents
  // ---------------------------------------------------------------------------

  async listAgents(namespace?: string): Promise<AgentListResponse> {
    const qs = namespace ? `?namespace=${e(namespace)}` : '';
    return this.request<AgentListResponse>('GET', `${API_PREFIX}/agents${qs}`);
  }

  async getAgent(
    namespace: string,
    name: string,
  ): Promise<AgentDetailResponse> {
    return this.request<AgentDetailResponse>(
      'GET',
      `${API_PREFIX}/agents/${e(namespace)}/${e(name)}`,
    );
  }

  async getAgentRouteStatus(
    namespace: string,
    name: string,
  ): Promise<RouteStatusResponse> {
    return this.request<RouteStatusResponse>(
      'GET',
      `${API_PREFIX}/agents/${e(namespace)}/${e(name)}/route-status`,
    );
  }

  async createAgent(body: CreateAgentRequest): Promise<CreateAgentResponse> {
    return this.request<CreateAgentResponse>(
      'POST',
      `${API_PREFIX}/agents`,
      body,
    );
  }

  async deleteAgent(namespace: string, name: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(
      'DELETE',
      `${API_PREFIX}/agents/${e(namespace)}/${e(name)}`,
    );
  }

  // -- Migration --------------------------------------------------------------

  async listMigratableAgents(): Promise<ListMigratableAgentsResponse> {
    return this.request<ListMigratableAgentsResponse>(
      'GET',
      `${API_PREFIX}/agents/migration/migratable`,
    );
  }

  async migrateAgent(
    namespace: string,
    name: string,
    deleteOld = false,
  ): Promise<MigrateAgentResponse> {
    const body: MigrateAgentRequest = { delete_old: deleteOld };
    return this.request<MigrateAgentResponse>(
      'POST',
      `${API_PREFIX}/agents/${e(namespace)}/${e(name)}/migrate`,
      body,
    );
  }

  async migrateAllAgents(options?: {
    namespace?: string;
    dryRun?: boolean;
    deleteOld?: boolean;
  }): Promise<MigrateAllResponse> {
    const params = new URLSearchParams();
    if (options?.namespace) params.set('namespace', options.namespace);
    if (options?.dryRun !== undefined)
      params.set('dry_run', String(options.dryRun));
    if (options?.deleteOld !== undefined)
      params.set('delete_old', String(options.deleteOld));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<MigrateAllResponse>(
      'POST',
      `${API_PREFIX}/agents/migration/migrate-all${qs}`,
    );
  }

  // -- Shipwright (agents) ----------------------------------------------------

  async listBuildStrategies(): Promise<ClusterBuildStrategiesResponse> {
    return this.request<ClusterBuildStrategiesResponse>(
      'GET',
      `${API_PREFIX}/agents/build-strategies`,
    );
  }

  async listAgentBuilds(
    namespace?: string,
    _allNamespaces = false,
  ): Promise<ShipwrightBuildListResponse> {
    const agents = await this.listAgents(namespace);
    const results = await Promise.allSettled(
      agents.items.map(a => this.getAgentBuildInfo(a.namespace, a.name)),
    );
    const items: ShipwrightBuildListItem[] = [];
    results.forEach((r, i) => {
      const a = agents.items[i];
      if (r.status === 'fulfilled') {
        const info = r.value;
        items.push({
          name: a.name,
          namespace: a.namespace,
          resourceType: 'agent',
          registered: info.buildRegistered,
          strategy: info.strategy,
          gitUrl: info.gitUrl,
          gitRevision: info.gitRevision,
          contextDir: info.contextDir,
          outputImage: info.outputImage,
          creationTimestamp: a.createdAt,
        });
      }
    });
    return { items };
  }

  async getAgentBuild(
    namespace: string,
    name: string,
  ): Promise<ShipwrightBuildStatusResponse> {
    return this.request<ShipwrightBuildStatusResponse>(
      'GET',
      `${API_PREFIX}/agents/${e(namespace)}/${e(name)}/shipwright-build`,
    );
  }

  async getAgentBuildRun(
    namespace: string,
    name: string,
  ): Promise<ShipwrightBuildRunStatusResponse> {
    return this.request<ShipwrightBuildRunStatusResponse>(
      'GET',
      `${API_PREFIX}/agents/${e(namespace)}/${e(name)}/shipwright-buildrun`,
    );
  }

  async triggerAgentBuildRun(
    namespace: string,
    name: string,
  ): Promise<TriggerBuildRunResponse> {
    return this.request<TriggerBuildRunResponse>(
      'POST',
      `${API_PREFIX}/agents/${e(namespace)}/${e(name)}/shipwright-buildrun`,
    );
  }

  async getAgentBuildInfo(
    namespace: string,
    name: string,
  ): Promise<ShipwrightBuildInfoResponse> {
    return this.request<ShipwrightBuildInfoResponse>(
      'GET',
      `${API_PREFIX}/agents/${e(namespace)}/${e(name)}/shipwright-build-info`,
    );
  }

  async finalizeAgentBuild(
    namespace: string,
    name: string,
    body?: FinalizeShipwrightBuildRequest,
  ): Promise<CreateAgentResponse> {
    return this.request<CreateAgentResponse>(
      'POST',
      `${API_PREFIX}/agents/${e(namespace)}/${e(name)}/finalize-shipwright-build`,
      body ?? {},
    );
  }

  // -- Utilities (agents) -----------------------------------------------------

  async parseEnv(content: string): Promise<ParseEnvResponse> {
    const body: ParseEnvRequest = { content };
    return this.request<ParseEnvResponse>(
      'POST',
      `${API_PREFIX}/agents/parse-env`,
      body,
    );
  }

  async fetchEnvUrl(url: string): Promise<FetchEnvUrlResponse> {
    const body: FetchEnvUrlRequest = { url };
    return this.request<FetchEnvUrlResponse>(
      'POST',
      `${API_PREFIX}/agents/fetch-env-url`,
      body,
    );
  }

  // ---------------------------------------------------------------------------
  // Tools
  // ---------------------------------------------------------------------------

  async listTools(namespace?: string): Promise<ToolListResponse> {
    const qs = namespace ? `?namespace=${e(namespace)}` : '';
    return this.request<ToolListResponse>('GET', `${API_PREFIX}/tools${qs}`);
  }

  async getTool(namespace: string, name: string): Promise<ToolDetailResponse> {
    return this.request<ToolDetailResponse>(
      'GET',
      `${API_PREFIX}/tools/${e(namespace)}/${e(name)}`,
    );
  }

  async getToolRouteStatus(
    namespace: string,
    name: string,
  ): Promise<RouteStatusResponse> {
    return this.request<RouteStatusResponse>(
      'GET',
      `${API_PREFIX}/tools/${e(namespace)}/${e(name)}/route-status`,
    );
  }

  async createTool(body: CreateToolRequest): Promise<CreateToolResponse> {
    return this.request<CreateToolResponse>(
      'POST',
      `${API_PREFIX}/tools`,
      body,
    );
  }

  async deleteTool(namespace: string, name: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(
      'DELETE',
      `${API_PREFIX}/tools/${e(namespace)}/${e(name)}`,
    );
  }

  // -- Shipwright (tools) -----------------------------------------------------

  async listToolBuilds(
    namespace?: string,
    _allNamespaces = false,
  ): Promise<ShipwrightBuildListResponse> {
    const tools = await this.listTools(namespace);
    const results = await Promise.allSettled(
      tools.items.map(t => this.getToolBuildInfo(t.namespace, t.name)),
    );
    const items: ShipwrightBuildListItem[] = [];
    results.forEach((r, i) => {
      const t = tools.items[i];
      if (r.status === 'fulfilled') {
        const info = r.value;
        items.push({
          name: t.name,
          namespace: t.namespace,
          resourceType: 'tool',
          registered: info.buildRegistered,
          strategy: info.strategy,
          gitUrl: info.gitUrl,
          gitRevision: info.gitRevision,
          contextDir: info.contextDir,
          outputImage: info.outputImage,
          creationTimestamp: t.createdAt,
        });
      }
    });
    return { items };
  }

  async getToolBuildInfo(
    namespace: string,
    name: string,
  ): Promise<ShipwrightBuildInfoResponse> {
    return this.request<ShipwrightBuildInfoResponse>(
      'GET',
      `${API_PREFIX}/tools/${e(namespace)}/${e(name)}/shipwright-build-info`,
    );
  }

  async triggerToolBuildRun(
    namespace: string,
    name: string,
  ): Promise<TriggerBuildRunResponse> {
    return this.request<TriggerBuildRunResponse>(
      'POST',
      `${API_PREFIX}/tools/${e(namespace)}/${e(name)}/shipwright-buildrun`,
    );
  }

  async finalizeToolBuild(
    namespace: string,
    name: string,
    body?: FinalizeToolBuildRequest,
  ): Promise<CreateToolResponse> {
    return this.request<CreateToolResponse>(
      'POST',
      `${API_PREFIX}/tools/${e(namespace)}/${e(name)}/finalize-shipwright-build`,
      body ?? {},
    );
  }

  // -- MCP (tools) ------------------------------------------------------------

  async connectTool(
    namespace: string,
    name: string,
  ): Promise<MCPToolsResponse> {
    return this.request<MCPToolsResponse>(
      'POST',
      `${API_PREFIX}/tools/${e(namespace)}/${e(name)}/connect`,
    );
  }

  async invokeTool(
    namespace: string,
    name: string,
    toolName: string,
    args: Record<string, unknown> = {},
  ): Promise<MCPInvokeResponse> {
    const body: MCPInvokeRequest = { tool_name: toolName, arguments: args };
    return this.request<MCPInvokeResponse>(
      'POST',
      `${API_PREFIX}/tools/${e(namespace)}/${e(name)}/invoke`,
      body,
    );
  }

  // ---------------------------------------------------------------------------
  // Shipwright (global)
  // ---------------------------------------------------------------------------

  async listAllBuilds(
    namespace?: string,
    _allNamespaces = false,
  ): Promise<ShipwrightBuildListResponse> {
    const [agentBuilds, toolBuilds] = await Promise.all([
      this.listAgentBuilds(namespace).catch(() => ({ items: [] as ShipwrightBuildListItem[] })),
      this.listToolBuilds(namespace).catch(() => ({ items: [] as ShipwrightBuildListItem[] })),
    ]);
    return { items: [...agentBuilds.items, ...toolBuilds.items] };
  }

  // ---------------------------------------------------------------------------
  // Contexts (conversation history)
  // ---------------------------------------------------------------------------

  async listContextHistory(
    contextId: string,
    opts?: { limit?: number; pageToken?: string },
  ): Promise<ContextHistoryListResponse> {
    const params = new URLSearchParams();
    if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
    if (opts?.pageToken) params.set('page_token', opts.pageToken);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<ContextHistoryListResponse>(
      'GET',
      `${API_PREFIX}/contexts/${e(contextId)}/history${qs}`,
    );
  }
}
