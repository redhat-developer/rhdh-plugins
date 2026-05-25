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
import {
  requestWithRetry as doRetry,
  streamRequest as doStream,
} from './requestCore';
import type { RequestCoreContext } from './requestCore';

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

function stripTrailingSlashes(s: string): string {
  let end = s.length;
  while (end > 0 && s[end - 1] === '/') end--;
  return end === s.length ? s : s.slice(0, end);
}

export class KagentiApiClient {
  private readonly ctx: RequestCoreContext;
  private _requestContext: KagentiRequestContext = {};

  constructor(options: KagentiApiClientOptions) {
    const baseUrl = stripTrailingSlashes(options.baseUrl);
    const isHttps = baseUrl.startsWith('https');
    const httpAgent = isHttps
      ? new https.Agent({
          keepAlive: true,
          rejectUnauthorized: !(options.skipTlsVerify ?? false),
        })
      : new http.Agent({ keepAlive: true });
    this.ctx = {
      baseUrl,
      isHttps,
      httpAgent,
      tokenManager: options.tokenManager,
      logger: options.logger,
      requestTimeoutMs: options.requestTimeoutMs ?? 30_000,
      streamTimeoutMs: options.streamTimeoutMs ?? 300_000,
      maxRetries: options.maxRetries ?? 3,
      retryBaseDelayMs: options.retryBaseDelayMs ?? 1000,
      getUserRef: () => this._requestContext.userRef,
    };
  }

  setRequestContext(ctx: KagentiRequestContext): void {
    this._requestContext = ctx;
  }
  destroy(): void {
    this.ctx.httpAgent.destroy();
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    skipAuth = false,
  ): Promise<T> {
    return doRetry<T>(this.ctx, method, path, body, skipAuth);
  }
  async requestWithRetry<T>(
    method: string,
    path: string,
    body?: unknown,
    skipAuth = false,
    retries?: number,
  ): Promise<T> {
    return doRetry<T>(this.ctx, method, path, body, skipAuth, retries);
  }
  async streamRequest(
    path: string,
    body: unknown,
    onLine: (line: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return doStream(this.ctx, path, body, onLine, signal);
  }

  // -- Health/Auth/Config --
  async health(): Promise<HealthResponse> {
    return this.request('GET', '/health', undefined, true);
  }
  async ready(): Promise<HealthResponse> {
    return this.request('GET', '/ready', undefined, true);
  }
  async getAuthConfig(): Promise<AuthConfigResponse> {
    return this.request('GET', `${API_PREFIX}/auth/config`, undefined, true);
  }
  async getAuthStatus(): Promise<AuthStatusResponse> {
    return this.request('GET', `${API_PREFIX}/auth/status`);
  }
  async getUserInfo(): Promise<UserInfoResponse> {
    return this.request('GET', `${API_PREFIX}/auth/userinfo`);
  }
  async getMe(): Promise<UserInfoResponse> {
    return this.request('GET', `${API_PREFIX}/auth/me`);
  }
  async getFeatureFlags(): Promise<FeatureFlagsResponse> {
    return this.request('GET', `${API_PREFIX}/config/features`);
  }
  async getDashboards(): Promise<DashboardConfigResponse> {
    return this.request('GET', `${API_PREFIX}/config/dashboards`);
  }
  async listNamespaces(enabledOnly = true): Promise<NamespaceListResponse> {
    return this.request(
      'GET',
      `${API_PREFIX}/namespaces?enabled_only=${enabledOnly}`,
    );
  }

  // -- Chat --
  async getAgentCard(
    ns: string,
    name: string,
    opts?: { retries?: number },
  ): Promise<AgentCardResponse> {
    return this.requestWithRetry(
      'GET',
      `${API_PREFIX}/chat/${e(ns)}/${e(name)}/agent-card`,
      undefined,
      false,
      opts?.retries,
    );
  }
  async chatSend(
    ns: string,
    name: string,
    message: string,
    sessionId?: string,
    a2a?: {
      metadata?: Record<string, unknown>;
      parts?: Array<Record<string, unknown>>;
      contextId?: string;
    },
  ): Promise<ChatResponse> {
    const body: ChatRequest = {
      message,
      session_id: sessionId,
      ...(a2a?.metadata && { metadata: a2a.metadata }),
      ...(a2a?.parts && { parts: a2a.parts }),
      ...(a2a?.contextId && { context_id: a2a.contextId }),
    };
    return this.request(
      'POST',
      `${API_PREFIX}/chat/${e(ns)}/${e(name)}/send`,
      body,
    );
  }
  async chatStream(
    ns: string,
    name: string,
    message: string,
    sessionId: string | undefined,
    onLine: (line: string) => void,
    signal?: AbortSignal,
    a2a?: {
      metadata?: Record<string, unknown>;
      parts?: Array<Record<string, unknown>>;
      contextId?: string;
    },
  ): Promise<void> {
    const body: ChatRequest = {
      message,
      session_id: sessionId,
      ...(a2a?.metadata && { metadata: a2a.metadata }),
      ...(a2a?.parts && { parts: a2a.parts }),
      ...(a2a?.contextId && { context_id: a2a.contextId }),
    };
    return this.streamRequest(
      `${API_PREFIX}/chat/${e(ns)}/${e(name)}/stream`,
      body,
      onLine,
      signal,
    );
  }
  async listContextHistory(
    contextId: string,
    opts?: { limit?: number; pageToken?: string },
  ): Promise<ContextHistoryListResponse> {
    const p = new URLSearchParams();
    if (opts?.limit !== undefined) p.set('limit', String(opts.limit));
    if (opts?.pageToken) p.set('page_token', opts.pageToken);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return this.request(
      'GET',
      `${API_PREFIX}/contexts/${e(contextId)}/history${qs}`,
    );
  }

  // -- Agents --
  async listAgents(ns?: string): Promise<AgentListResponse> {
    return this.request(
      'GET',
      `${API_PREFIX}/agents${ns ? `?namespace=${e(ns)}` : ''}`,
    );
  }
  async getAgent(ns: string, name: string): Promise<AgentDetailResponse> {
    return this.request('GET', `${API_PREFIX}/agents/${e(ns)}/${e(name)}`);
  }
  async getAgentRouteStatus(
    ns: string,
    name: string,
  ): Promise<RouteStatusResponse> {
    return this.request(
      'GET',
      `${API_PREFIX}/agents/${e(ns)}/${e(name)}/route-status`,
    );
  }
  async createAgent(body: CreateAgentRequest): Promise<CreateAgentResponse> {
    return this.request('POST', `${API_PREFIX}/agents`, body);
  }
  async deleteAgent(ns: string, name: string): Promise<DeleteResponse> {
    return this.request('DELETE', `${API_PREFIX}/agents/${e(ns)}/${e(name)}`);
  }
  async listMigratableAgents(): Promise<ListMigratableAgentsResponse> {
    return this.request('GET', `${API_PREFIX}/agents/migration/migratable`);
  }
  async migrateAgent(
    ns: string,
    name: string,
    deleteOld = false,
  ): Promise<MigrateAgentResponse> {
    return this.request(
      'POST',
      `${API_PREFIX}/agents/${e(ns)}/${e(name)}/migrate`,
      { delete_old: deleteOld } as MigrateAgentRequest,
    );
  }
  async migrateAllAgents(opts?: {
    namespace?: string;
    dryRun?: boolean;
    deleteOld?: boolean;
  }): Promise<MigrateAllResponse> {
    const p = new URLSearchParams();
    if (opts?.namespace) p.set('namespace', opts.namespace);
    if (opts?.dryRun !== undefined) p.set('dry_run', String(opts.dryRun));
    if (opts?.deleteOld !== undefined)
      p.set('delete_old', String(opts.deleteOld));
    return this.request(
      'POST',
      `${API_PREFIX}/agents/migration/migrate-all${p.toString() ? `?${p.toString()}` : ''}`,
    );
  }
  async listBuildStrategies(): Promise<ClusterBuildStrategiesResponse> {
    return this.request('GET', `${API_PREFIX}/agents/build-strategies`);
  }
  async listAgentBuilds(ns?: string): Promise<ShipwrightBuildListResponse> {
    const agents = await this.listAgents(ns);
    const results = await Promise.allSettled(
      agents.items.map(a => this.getAgentBuildInfo(a.namespace, a.name)),
    );
    const items: ShipwrightBuildListItem[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        const a = agents.items[i];
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
    ns: string,
    name: string,
  ): Promise<ShipwrightBuildStatusResponse> {
    return this.request(
      'GET',
      `${API_PREFIX}/agents/${e(ns)}/${e(name)}/shipwright-build`,
    );
  }
  async getAgentBuildRun(
    ns: string,
    name: string,
  ): Promise<ShipwrightBuildRunStatusResponse> {
    return this.request(
      'GET',
      `${API_PREFIX}/agents/${e(ns)}/${e(name)}/shipwright-buildrun`,
    );
  }
  async triggerAgentBuildRun(
    ns: string,
    name: string,
  ): Promise<TriggerBuildRunResponse> {
    return this.request(
      'POST',
      `${API_PREFIX}/agents/${e(ns)}/${e(name)}/shipwright-buildrun`,
    );
  }
  async getAgentBuildInfo(
    ns: string,
    name: string,
  ): Promise<ShipwrightBuildInfoResponse> {
    return this.request(
      'GET',
      `${API_PREFIX}/agents/${e(ns)}/${e(name)}/shipwright-build-info`,
    );
  }
  async finalizeAgentBuild(
    ns: string,
    name: string,
    body?: FinalizeShipwrightBuildRequest,
  ): Promise<CreateAgentResponse> {
    return this.request(
      'POST',
      `${API_PREFIX}/agents/${e(ns)}/${e(name)}/finalize-shipwright-build`,
      body ?? {},
    );
  }
  async parseEnv(content: string): Promise<ParseEnvResponse> {
    return this.request('POST', `${API_PREFIX}/agents/parse-env`, {
      content,
    } as ParseEnvRequest);
  }
  async fetchEnvUrl(url: string): Promise<FetchEnvUrlResponse> {
    return this.request('POST', `${API_PREFIX}/agents/fetch-env-url`, {
      url,
    } as FetchEnvUrlRequest);
  }

  // -- Tools --
  async listTools(ns?: string): Promise<ToolListResponse> {
    return this.request(
      'GET',
      `${API_PREFIX}/tools${ns ? `?namespace=${e(ns)}` : ''}`,
    );
  }
  async getTool(ns: string, name: string): Promise<ToolDetailResponse> {
    return this.request('GET', `${API_PREFIX}/tools/${e(ns)}/${e(name)}`);
  }
  async getToolRouteStatus(
    ns: string,
    name: string,
  ): Promise<RouteStatusResponse> {
    return this.request(
      'GET',
      `${API_PREFIX}/tools/${e(ns)}/${e(name)}/route-status`,
    );
  }
  async createTool(body: CreateToolRequest): Promise<CreateToolResponse> {
    return this.request('POST', `${API_PREFIX}/tools`, body);
  }
  async deleteTool(ns: string, name: string): Promise<DeleteResponse> {
    return this.request('DELETE', `${API_PREFIX}/tools/${e(ns)}/${e(name)}`);
  }
  async listToolBuilds(ns?: string): Promise<ShipwrightBuildListResponse> {
    const tools = await this.listTools(ns);
    const results = await Promise.allSettled(
      tools.items.map(t => this.getToolBuildInfo(t.namespace, t.name)),
    );
    const items: ShipwrightBuildListItem[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        const t = tools.items[i];
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
    ns: string,
    name: string,
  ): Promise<ShipwrightBuildInfoResponse> {
    return this.request(
      'GET',
      `${API_PREFIX}/tools/${e(ns)}/${e(name)}/shipwright-build-info`,
    );
  }
  async triggerToolBuildRun(
    ns: string,
    name: string,
  ): Promise<TriggerBuildRunResponse> {
    return this.request(
      'POST',
      `${API_PREFIX}/tools/${e(ns)}/${e(name)}/shipwright-buildrun`,
    );
  }
  async finalizeToolBuild(
    ns: string,
    name: string,
    body?: FinalizeToolBuildRequest,
  ): Promise<CreateToolResponse> {
    return this.request(
      'POST',
      `${API_PREFIX}/tools/${e(ns)}/${e(name)}/finalize-shipwright-build`,
      body ?? {},
    );
  }
  async connectTool(ns: string, name: string): Promise<MCPToolsResponse> {
    return this.request(
      'POST',
      `${API_PREFIX}/tools/${e(ns)}/${e(name)}/connect`,
    );
  }
  async invokeTool(
    ns: string,
    name: string,
    toolName: string,
    args: Record<string, unknown> = {},
  ): Promise<MCPInvokeResponse> {
    return this.request(
      'POST',
      `${API_PREFIX}/tools/${e(ns)}/${e(name)}/invoke`,
      { tool_name: toolName, arguments: args } as MCPInvokeRequest,
    );
  }
  async listAllBuilds(ns?: string): Promise<ShipwrightBuildListResponse> {
    const [a, t] = await Promise.all([
      this.listAgentBuilds(ns).catch(() => ({
        items: [] as ShipwrightBuildListItem[],
      })),
      this.listToolBuilds(ns).catch(() => ({
        items: [] as ShipwrightBuildListItem[],
      })),
    ]);
    return { items: [...a.items, ...t.items] };
  }
}
