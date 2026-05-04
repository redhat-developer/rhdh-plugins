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
import {
  ConfigApi,
  createApiRef,
  DiscoveryApi,
  FetchApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { initializeDebug } from '../utils';
import {
  ChatMessage,
  DocumentInfo,
  AugmentStatus,
  Workflow,
  QuickAction,
  PromptGroup,
  StreamingEventCallback,
  SessionMessagesResponse,
  ChatSessionSummary,
  BrandingConfig,
  AdminConfigKey,
  AdminConfigEntry,
  RagTestResult,
  RagGenerateResult,
  UploadResult,
  VectorStoreConfig,
  VectorStoreCreateResult,
  VectorStoreStatusResult,
  VectorStoreInfo,
  McpTestConnectionResult,
  SafetyStatusResponse,
  EvaluationStatusResponse,
} from '../types';
import type {
  ProviderDescriptor,
  ChatAgent,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import * as chatEndpoints from './chatEndpoints';
import * as conversationEndpoints from './conversationEndpoints';
import * as adminEndpoints from './adminEndpoints';
import * as documentEndpoints from './documentEndpoints';
import * as sessionEndpoints from './sessionEndpoints';
import * as kagentiEndpoints from './kagentiEndpoints';

/**
 * API interface for Augment
 * @public
 */
export interface AugmentApi {
  /**
   * Get the status of the Augment service
   */
  getStatus(): Promise<AugmentStatus>;

  /**
   * List agents available for chat in a provider-agnostic format.
   * @param options.published - When true, only return published agents
   */
  listAgents(options?: { published?: boolean }): Promise<ChatAgent[]>;

  /**
   * Publish an agent to the end-user catalog.
   */
  publishAgent(agentId: string): Promise<void>;

  /**
   * Unpublish an agent from the end-user catalog.
   */
  unpublishAgent(agentId: string): Promise<void>;

  /**
   * Promote an agent to the next lifecycle stage (draft → registered → deployed).
   */
  promoteAgent(agentId: string, targetStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage): Promise<{ lifecycleStage: string; version: number }>;

  /**
   * Demote an agent to a previous lifecycle stage (deployed → registered → draft).
   */
  demoteAgent(agentId: string, targetStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage): Promise<{ lifecycleStage: string }>;

  /**
   * Bulk publish or unpublish agents.
   */
  bulkPublishAgents(agentIds: string[], published: boolean): Promise<void>;

  /**
   * Update agent display configuration (name, description, starters, etc.)
   */
  updateAgentConfig(agentId: string, config: Partial<import('@red-hat-developer-hub/backstage-plugin-augment-common').ChatAgentConfig>): Promise<void>;

  /**
   * List tools with lifecycle overlay in a provider-agnostic format.
   */
  listToolsWithLifecycle(options?: { published?: boolean }): Promise<(import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiToolSummary & { published?: boolean; lifecycleStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage; version?: number })[]>;

  /**
   * Promote a tool to the next lifecycle stage (draft → registered → deployed).
   */
  promoteToolLifecycle(toolId: string, targetStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage): Promise<{ lifecycleStage: string; version: number }>;

  /**
   * Demote a tool to a previous lifecycle stage (deployed → registered → draft).
   */
  demoteToolLifecycle(toolId: string, targetStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage): Promise<{ lifecycleStage: string }>;

  /**
   * Get branding configuration for enterprise customization
   */
  getBranding(): Promise<BrandingConfig>;

  /**
   * Get configured workflows (multi-step templates)
   */
  getWorkflows(): Promise<Workflow[]>;

  /**
   * Get configured quick actions (single-click prompts)
   */
  getQuickActions(): Promise<QuickAction[]>;

  /**
   * Get configured guided experience tours (from YAML or defaults)
   */
  getTours(): Promise<import('../components/AdminPanels/shared/defaultTours').TourDefinition[]>;

  /**
   * Get configured prompt groups (grouped prompt cards for the welcome screen)
   */
  getPromptGroups(): Promise<PromptGroup[]>;

  /**
   * Stream a chat message with real-time events from Responses API
   * Events are forwarded directly from the API - no hardcoding
   * @param messages - Chat messages
   * @param onEvent - Callback for each streaming event (raw from API)
   * @param enableRAG - Whether to enable RAG
   * @param signal - AbortSignal for cancellation
   * @param previousResponseId - Previous response ID for conversation branching
   * @param conversationId - Conversation ID to link to
   */
  chatStream(
    messages: ChatMessage[],
    onEvent: StreamingEventCallback,
    enableRAG?: boolean,
    signal?: AbortSignal,
    previousResponseId?: string,
    conversationId?: string,
    model?: string,
  ): Promise<void>;

  /**
   * Create a new conversation container
   */
  createConversation(): Promise<{ conversationId: string }>;

  // ===========================================================================
  // Human-in-the-Loop (HITL) Tool Approval
  // ===========================================================================

  /**
   * Submit approval or rejection for a pending tool call
   * Used when require_approval is configured for an MCP server
   *
   * LLAMA STACK WORKAROUND (tracked for removal):
   * toolName and toolArguments are required for approvals because Llama Stack's
   * mcp_approval_response does NOT auto-execute pending tools. The backend uses
   * these to send an explicit tool execution request instead.
   * TODO: Remove when Llama Stack natively supports mcp_approval_response auto-execution.
   * Track: https://github.com/meta-llama/llama-stack/issues — search "mcp_approval_response"
   *
   * @param responseId - The response ID containing the pending approval
   * @param callId - The approval_request_id from mcp_approval_request event
   * @param approved - Whether to approve (true) or reject (false)
   * @param toolName - Name of the tool to execute (REQUIRED if approved)
   * @param toolArguments - JSON string of tool arguments (REQUIRED if approved)
   */
  submitToolApproval(
    responseId: string,
    callId: string,
    approved: boolean,
    toolName?: string,
    toolArguments?: string,
    signal?: AbortSignal,
    reason?: string,
  ): Promise<{
    success: boolean;
    content?: string;
    responseId?: string;
    rejected?: boolean;
    toolOutput?: string;
    toolExecuted?: boolean;
    outputTruncated?: boolean;
    pendingApproval?: {
      approvalRequestId: string;
      toolName: string;
      serverLabel?: string;
      arguments?: string;
    };
    handoff?: {
      fromAgent: string;
      toAgent: string;
    };
  }>;

  // ===========================================================================
  // Chat Sessions (local DB — mirrors ai-virtual-agent pattern)
  // ===========================================================================

  /** List chat sessions from local DB, optionally paginated and filtered by provider */
  listSessions(
    limit?: number,
    offset?: number,
    providerId?: string,
  ): Promise<ChatSessionSummary[]>;

  /** Create a new chat session, tagged with the active provider */
  createSession(
    title?: string,
    model?: string,
    providerId?: string,
  ): Promise<ChatSessionSummary>;

  /** Delete a chat session */
  deleteSession(sessionId: string): Promise<boolean>;

  /** Fetch session state for debug inspector */
  getSessionState(sessionId: string): Promise<Record<string, unknown>>;

  /** Submit per-message feedback (thumbs up/down with optional reasons) */
  submitMessageFeedback(payload: {
    messageId: string;
    sessionId?: string;
    direction: 'positive' | 'negative';
    reasons?: string[];
    comment?: string;
  }): Promise<boolean>;

  /** Get processed messages for a session (server-side grouping) */
  getSessionMessages(sessionId: string): Promise<SessionMessagesResponse>;

  /** List all sessions across all users (admin only) */
  listAllSessions(
    limit?: number,
    offset?: number,
  ): Promise<ChatSessionSummary[]>;

  /** Get messages for any session without ownership check (admin only) */
  getAdminSessionMessages(sessionId: string): Promise<SessionMessagesResponse>;

  /**
   * Stream a chat message, identified by session ID.
   * Same as chatStream but uses sessionId for backend conversation management.
   */
  chatStreamWithSession(
    messages: ChatMessage[],
    onEvent: StreamingEventCallback,
    sessionId: string,
    enableRAG?: boolean,
    signal?: AbortSignal,
    model?: string,
  ): Promise<void>;

  // ===========================================================================
  // Admin API
  // ===========================================================================

  /** List available models from the inference server */
  listModels(): Promise<
    Array<{ id: string; owned_by?: string; model_type?: string }>
  >;

  /** Generate a system prompt from a natural language description using the configured LLM */
  generateSystemPrompt(
    description: string,
    model?: string,
    capabilities?: import('../types').PromptCapabilities,
  ): Promise<string>;

  /** Get the full effective config (YAML + DB merged) for admin panel pre-population */
  getEffectiveConfig(): Promise<Record<string, unknown>>;

  /** Get an admin config entry by key */
  getAdminConfig(key: AdminConfigKey): Promise<{
    entry: AdminConfigEntry | null;
    source: 'database' | 'default';
  }>;

  /** Set / update an admin config entry. Returns warnings (if any) from soft validation. */
  setAdminConfig(
    key: AdminConfigKey,
    value: unknown,
  ): Promise<{ warnings?: string[] }>;

  /** Delete an admin config entry (revert to YAML defaults) */
  deleteAdminConfig(key: AdminConfigKey): Promise<{ deleted: boolean }>;

  /** List all admin config entries */
  listAdminConfig(): Promise<
    Array<{ configKey: AdminConfigKey; updatedAt: string; updatedBy: string }>
  >;

  /** List all known providers (implemented + placeholders) */
  listProviders(): Promise<{
    providers: ProviderDescriptor[];
    activeProviderId: string;
  }>;

  /** Get the currently active provider ID */
  getActiveProvider(): Promise<{ providerId: string }>;

  /** Set the active provider (triggers hot-swap on backend) */
  setActiveProvider(
    providerId: string,
  ): Promise<{ success: boolean; providerId: string; error?: string }>;

  /** Trigger a document sync */
  syncDocuments(): Promise<{
    added: number;
    updated: number;
    removed: number;
    failed: number;
    unchanged: number;
    errors: string[];
  }>;

  /** Upload a document to the knowledge base */
  uploadDocument(
    file: File,
    vectorStoreId?: string,
    replace?: boolean,
  ): Promise<UploadResult>;

  /** Delete a document from the knowledge base */
  deleteDocument(
    fileId: string,
    vectorStoreId?: string,
  ): Promise<{ success: boolean }>;

  /** List documents for a specific vector store */
  listDocumentsForStore(vectorStoreId: string): Promise<DocumentInfo[]>;

  /** Test a RAG query against one or more vector stores */
  testRagQuery(
    query: string,
    maxResults?: number,
    vectorStoreId?: string,
    vectorStoreIds?: string[],
  ): Promise<RagTestResult>;

  /** End-to-end RAG test: retrieve chunks then generate an LLM answer */
  generateRagAnswer(
    query: string,
    maxResults?: number,
    vectorStoreId?: string,
    vectorStoreIds?: string[],
  ): Promise<RagGenerateResult>;

  /** Get safety status including available shields from the provider */
  getSafetyStatus(): Promise<SafetyStatusResponse>;

  /** Get evaluation status including available scoring functions from the provider */
  getEvaluationStatus(): Promise<EvaluationStatusResponse>;

  /** Test model connectivity, availability, and generation capability */
  testModelConnection(
    model?: string,
    baseUrl?: string,
  ): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }>;

  /** Test MCP server connection and discover tools */
  testMcpConnection(
    url: string,
    type?: string,
    headers?: Record<string, string>,
  ): Promise<McpTestConnectionResult>;

  /** Get effective vector store config (YAML defaults merged with DB overrides) */
  getVectorStoreConfig(): Promise<{
    config: VectorStoreConfig;
    source: 'yaml' | 'database' | 'merged';
  }>;

  /** Save vector store config overrides to DB */
  saveVectorStoreConfig(overrides: Partial<VectorStoreConfig>): Promise<void>;

  /** Reset vector store config to YAML defaults */
  resetVectorStoreConfig(): Promise<{ deleted: boolean }>;

  /** Create a vector store using the effective config */
  createVectorStore(
    config?: Record<string, unknown>,
  ): Promise<VectorStoreCreateResult>;

  /** Get current vector store status */
  getVectorStoreStatus(): Promise<VectorStoreStatusResult>;

  // ===========================================================================
  // Multi-Vector-Store Management
  // ===========================================================================

  /** List all active vector stores with their status, plus unconnected server stores */
  listActiveVectorStores(): Promise<{
    stores: Array<VectorStoreInfo & { active: boolean }>;
    unconnected?: Array<VectorStoreInfo & { active: false }>;
  }>;

  /** Connect an existing vector store by ID */
  connectVectorStore(vectorStoreId: string): Promise<{
    activeVectorStoreIds: string[];
  }>;

  /** Remove a vector store. If permanent=true, deletes it and all files from the server. */
  removeVectorStore(
    vectorStoreId: string,
    permanent?: boolean,
  ): Promise<{
    removed: string;
    permanent: boolean;
    filesDeleted: number;
    activeVectorStoreIds: string[];
  }>;

  // ===========================================================================
  // Kagenti API
  // ===========================================================================

  listKagentiAgents(
    namespace?: string,
    options?: { includeCards?: boolean },
  ): Promise<{
    agents: (import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiAgentSummary & {
      agentCard?: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiAgentCard;
    })[];
  }>;
  getKagentiAgent(
    namespace: string,
    name: string,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiAgentDetail & {
      agentCard?: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiAgentCard;
    }
  >;
  getKagentiAgentRouteStatus(
    namespace: string,
    name: string,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiRouteStatus
  >;
  createKagentiAgent(
    body: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateAgentRequest,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateAgentResponse
  >;
  deleteKagentiAgent(namespace: string, name: string): Promise<void>;
  listKagentiMigratableAgents(): Promise<{
    agents: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiMigratableAgent[];
  }>;
  migrateKagentiAgent(
    namespace: string,
    name: string,
    deleteOld?: boolean,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiMigrateAgentResponse
  >;
  migrateAllKagentiAgents(options?: {
    namespace?: string;
    dryRun?: boolean;
    deleteOld?: boolean;
  }): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiMigrateAllResponse
  >;
  listKagentiTools(namespace?: string): Promise<{
    tools: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiToolSummary[];
  }>;
  getKagentiTool(
    namespace: string,
    name: string,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiToolDetail
  >;
  createKagentiTool(
    body: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateToolRequest,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateToolResponse
  >;
  deleteKagentiTool(namespace: string, name: string): Promise<void>;
  getKagentiFeatureFlags(): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiFeatureFlags
  >;
  getKagentiDashboards(): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiDashboardConfig
  >;
  listKagentiNamespaces(
    enabledOnly?: boolean,
  ): Promise<{ namespaces: string[]; defaultNamespace?: string }>;
  triggerKagentiBuild(
    namespace: string,
    name: string,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiTriggerBuildRunResponse
  >;
  getKagentiBuildInfo(
    namespace: string,
    name: string,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiBuildInfo
  >;
  finalizeKagentiAgentBuild(
    namespace: string,
    name: string,
    body?: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiFinalizeAgentBuildRequest,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateAgentResponse
  >;
  listKagentiBuildStrategies(): Promise<{
    strategies: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiBuildStrategy[];
  }>;
  listKagentiShipwrightBuilds(options?: {
    namespace?: string;
    allNamespaces?: boolean;
  }): Promise<{
    builds: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiBuildListItem[];
  }>;
  connectKagentiTool(
    namespace: string,
    name: string,
  ): Promise<{
    tools: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiMcpToolSchema[];
  }>;
  invokeKagentiTool(
    namespace: string,
    name: string,
    toolName: string,
    args?: Record<string, unknown>,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiMcpInvokeResponse
  >;
  getToolRouteStatus(
    namespace: string,
    name: string,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiRouteStatus
  >;
  getToolBuildInfo(
    namespace: string,
    name: string,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiBuildInfo
  >;
  triggerToolBuild(
    namespace: string,
    name: string,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiTriggerBuildRunResponse
  >;
  finalizeToolBuild(
    namespace: string,
    name: string,
    body?: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiFinalizeToolBuildRequest,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateToolResponse
  >;
  createDevSpacesWorkspace(
    request: import('@red-hat-developer-hub/backstage-plugin-augment-common').DevSpacesCreateWorkspaceRequest,
  ): Promise<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').DevSpacesCreateWorkspaceResponse
  >;
}

/**
 * API reference for Augment
 * @public
 */
export const augmentApiRef = createApiRef<AugmentApi>({
  id: 'plugin.augment.api',
});

/**
 * Implementation of the Augment API client
 * @public
 */
export class AugmentApiClient implements AugmentApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;
  constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
    configApi: ConfigApi;
    /** @deprecated Auth is now handled by fetchApi; retained for API compat */
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;

    const debugEnabled = options.configApi.getOptionalBoolean('augment.debug');
    initializeDebug(debugEnabled);
  }

  // ---------------------------------------------------------------------------
  // Internal fetch helpers — eliminate per-method boilerplate
  // ---------------------------------------------------------------------------

  /** Fetch JSON from a path relative to the plugin base URL; throws on non-2xx. */
  private async fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = await this.discoveryApi.getBaseUrl('augment');
    const url = `${baseUrl}${path}`;
    const response = init
      ? await this.fetchApi.fetch(url, init)
      : await this.fetchApi.fetch(url);
    if (!response.ok) throw await ResponseError.fromResponse(response);
    try {
      return await response.json();
    } catch {
      throw new Error(
        `Invalid JSON response from ${path} (status ${response.status})`,
      );
    }
  }

  /** Like fetchJson but returns `fallback` instead of throwing on non-2xx. */
  private async fetchJsonSafe<T>(
    path: string,
    fallback: T,
    init?: RequestInit,
  ): Promise<T> {
    const baseUrl = await this.discoveryApi.getBaseUrl('augment');
    const url = `${baseUrl}${path}`;
    const response = init
      ? await this.fetchApi.fetch(url, init)
      : await this.fetchApi.fetch(url);
    if (!response.ok) return fallback;
    return response.json();
  }

  // ---------------------------------------------------------------------------
  // Public API — Chat
  // ---------------------------------------------------------------------------

  private get chatDeps(): chatEndpoints.ChatApiDeps {
    return {
      fetchJson: this.fetchJson.bind(this),
      discoveryApi: this.discoveryApi,
      fetchApi: this.fetchApi,
    };
  }

  private get conversationDeps(): conversationEndpoints.ConversationApiDeps {
    return {
      fetchJson: this.fetchJson.bind(this),
      fetchJsonSafe: this.fetchJsonSafe.bind(this),
      discoveryApi: this.discoveryApi,
      fetchApi: this.fetchApi,
    };
  }

  private get adminDeps(): adminEndpoints.AdminApiDeps {
    return {
      fetchJson: this.fetchJson.bind(this),
      discoveryApi: this.discoveryApi,
      fetchApi: this.fetchApi,
    };
  }

  private get documentDeps(): documentEndpoints.DocumentApiDeps {
    return {
      fetchJson: this.fetchJson.bind(this),
      discoveryApi: this.discoveryApi,
      fetchApi: this.fetchApi,
    };
  }

  private get sessionDeps(): sessionEndpoints.SessionApiDeps {
    return {
      fetchJson: this.fetchJson.bind(this),
      fetchJsonSafe: this.fetchJsonSafe.bind(this),
      discoveryApi: this.discoveryApi,
      fetchApi: this.fetchApi,
    };
  }

  async getStatus(): Promise<AugmentStatus> {
    return this.fetchJson('/status');
  }

  async listAgents(options?: { published?: boolean }): Promise<ChatAgent[]> {
    const qs = options?.published ? '?published=true' : '';
    const data = await this.fetchJson<{ agents: ChatAgent[] }>(`/agents${qs}`);
    return data.agents ?? [];
  }

  async publishAgent(agentId: string): Promise<void> {
    await this.fetchJson(`/agents/${encodeURIComponent(agentId)}/publish`, {
      method: 'PUT',
    });
  }

  async unpublishAgent(agentId: string): Promise<void> {
    await this.fetchJson(`/agents/${encodeURIComponent(agentId)}/unpublish`, {
      method: 'PUT',
    });
  }

  async promoteAgent(agentId: string, targetStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage): Promise<{ lifecycleStage: string; version: number }> {
    return this.fetchJson(`/agents/${encodeURIComponent(agentId)}/promote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStage }),
    });
  }

  async demoteAgent(agentId: string, targetStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage): Promise<{ lifecycleStage: string }> {
    return this.fetchJson(`/agents/${encodeURIComponent(agentId)}/demote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStage }),
    });
  }

  async bulkPublishAgents(agentIds: string[], published: boolean): Promise<void> {
    await this.fetchJson('/agents/bulk-publish', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentIds, published }),
    });
  }

  async updateAgentConfig(agentId: string, config: Partial<import('@red-hat-developer-hub/backstage-plugin-augment-common').ChatAgentConfig>): Promise<void> {
    await this.fetchJson(`/agents/${encodeURIComponent(agentId)}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  }

  async listToolsWithLifecycle(options?: { published?: boolean }): Promise<(import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiToolSummary & { published?: boolean; lifecycleStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage; version?: number })[]> {
    const qs = options?.published ? '?published=true' : '';
    const data = await this.fetchJson<{ tools: (import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiToolSummary & { published?: boolean; lifecycleStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage; version?: number })[] }>(`/tools${qs}`);
    return data.tools ?? [];
  }

  async promoteToolLifecycle(toolId: string, targetStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage): Promise<{ lifecycleStage: string; version: number }> {
    return this.fetchJson(`/tools/${encodeURIComponent(toolId)}/promote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStage }),
    });
  }

  async demoteToolLifecycle(toolId: string, targetStage?: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage): Promise<{ lifecycleStage: string }> {
    return this.fetchJson(`/tools/${encodeURIComponent(toolId)}/demote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStage }),
    });
  }

  async getBranding(): Promise<BrandingConfig> {
    const data = await this.fetchJson<{ branding: BrandingConfig }>(
      '/branding',
    );
    return data.branding;
  }

  async getWorkflows(): Promise<Workflow[]> {
    return adminEndpoints.getWorkflows(this.adminDeps);
  }

  async getQuickActions(): Promise<QuickAction[]> {
    return adminEndpoints.getQuickActions(this.adminDeps);
  }

  async getTours(): Promise<import('../components/AdminPanels/shared/defaultTours').TourDefinition[]> {
    const data = await this.fetchJson<{ tours: import('../components/AdminPanels/shared/defaultTours').TourDefinition[] }>('/tours');
    return data.tours ?? [];
  }

  async getPromptGroups(): Promise<PromptGroup[]> {
    return adminEndpoints.getPromptGroups(this.adminDeps);
  }

  async chatStream(
    messages: ChatMessage[],
    onEvent: StreamingEventCallback,
    enableRAG = true,
    signal?: AbortSignal,
    previousResponseId?: string,
    conversationId?: string,
    model?: string,
  ): Promise<void> {
    return chatEndpoints.chatStream(
      this.chatDeps,
      messages,
      onEvent,
      enableRAG,
      signal,
      previousResponseId,
      conversationId,
      model,
    );
  }

  async createConversation(): Promise<{ conversationId: string }> {
    return conversationEndpoints.createConversation(this.conversationDeps);
  }

  async submitToolApproval(
    responseId: string,
    callId: string,
    approved: boolean,
    toolName?: string,
    toolArguments?: string,
    signal?: AbortSignal,
    reason?: string,
  ): Promise<{
    success: boolean;
    content?: string;
    responseId?: string;
    rejected?: boolean;
    toolOutput?: string;
    toolExecuted?: boolean;
    outputTruncated?: boolean;
    pendingApproval?: {
      approvalRequestId: string;
      toolName: string;
      serverLabel?: string;
      arguments?: string;
    };
    handoff?: {
      fromAgent: string;
      toAgent: string;
    };
  }> {
    return chatEndpoints.submitToolApproval(
      this.chatDeps,
      responseId,
      callId,
      approved,
      toolName,
      toolArguments,
      signal,
      reason,
    );
  }

  // ---------------------------------------------------------------------------
  // Chat Sessions (local DB)
  // ---------------------------------------------------------------------------

  async listSessions(
    limit?: number,
    offset?: number,
    providerId?: string,
  ): Promise<ChatSessionSummary[]> {
    return sessionEndpoints.listSessions(
      this.sessionDeps,
      limit,
      offset,
      providerId,
    );
  }

  async createSession(
    title?: string,
    model?: string,
    providerId?: string,
  ): Promise<ChatSessionSummary> {
    return sessionEndpoints.createSession(
      this.sessionDeps,
      title,
      model,
      providerId,
    );
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return sessionEndpoints.deleteSession(this.sessionDeps, sessionId);
  }

  async getSessionState(sessionId: string): Promise<Record<string, unknown>> {
    return sessionEndpoints.getSessionState(this.sessionDeps, sessionId);
  }

  async submitMessageFeedback(payload: {
    messageId: string;
    sessionId?: string;
    direction: 'positive' | 'negative';
    reasons?: string[];
    comment?: string;
  }): Promise<boolean> {
    return sessionEndpoints.submitMessageFeedback(this.sessionDeps, payload);
  }

  async getSessionMessages(
    sessionId: string,
  ): Promise<SessionMessagesResponse> {
    return sessionEndpoints.getSessionMessages(this.sessionDeps, sessionId);
  }

  async listAllSessions(
    limit?: number,
    offset?: number,
  ): Promise<ChatSessionSummary[]> {
    return sessionEndpoints.listAllSessions(this.sessionDeps, limit, offset);
  }

  async getAdminSessionMessages(
    sessionId: string,
  ): Promise<SessionMessagesResponse> {
    return sessionEndpoints.getAdminSessionMessages(
      this.sessionDeps,
      sessionId,
    );
  }

  async chatStreamWithSession(
    messages: ChatMessage[],
    onEvent: StreamingEventCallback,
    sessionId: string,
    enableRAG = true,
    signal?: AbortSignal,
    model?: string,
  ): Promise<void> {
    return chatEndpoints.chatStreamWithSession(
      this.chatDeps,
      messages,
      onEvent,
      sessionId,
      enableRAG,
      signal,
      model,
    );
  }

  async getEffectiveConfig(): Promise<Record<string, unknown>> {
    return adminEndpoints.getEffectiveConfig(this.adminDeps);
  }

  async listModels(): Promise<
    Array<{ id: string; owned_by?: string; model_type?: string }>
  > {
    return adminEndpoints.listModels(this.adminDeps);
  }

  async generateSystemPrompt(
    description: string,
    model?: string,
    capabilities?: import('../types').PromptCapabilities,
  ): Promise<string> {
    return adminEndpoints.generateSystemPrompt(
      this.adminDeps,
      description,
      model,
      capabilities,
    );
  }

  async getAdminConfig(key: AdminConfigKey): Promise<{
    entry: AdminConfigEntry | null;
    source: 'database' | 'default';
  }> {
    return adminEndpoints.getAdminConfig(this.adminDeps, key);
  }

  async setAdminConfig(
    key: AdminConfigKey,
    value: unknown,
  ): Promise<{ warnings?: string[] }> {
    return adminEndpoints.setAdminConfig(this.adminDeps, key, value);
  }

  async deleteAdminConfig(key: AdminConfigKey): Promise<{ deleted: boolean }> {
    return adminEndpoints.deleteAdminConfig(this.adminDeps, key);
  }

  async listAdminConfig(): Promise<
    Array<{ configKey: AdminConfigKey; updatedAt: string; updatedBy: string }>
  > {
    return adminEndpoints.listAdminConfig(this.adminDeps);
  }

  async listProviders(): Promise<{
    providers: ProviderDescriptor[];
    activeProviderId: string;
  }> {
    return adminEndpoints.listProviders(this.adminDeps);
  }

  async getActiveProvider(): Promise<{ providerId: string }> {
    return adminEndpoints.getActiveProvider(this.adminDeps);
  }

  async setActiveProvider(
    providerId: string,
  ): Promise<{ success: boolean; providerId: string; error?: string }> {
    return adminEndpoints.setActiveProvider(this.adminDeps, providerId);
  }

  async syncDocuments(): Promise<{
    added: number;
    updated: number;
    removed: number;
    failed: number;
    unchanged: number;
    errors: string[];
  }> {
    return documentEndpoints.syncDocuments(this.documentDeps);
  }

  async uploadDocument(
    file: File,
    vectorStoreId?: string,
    replace?: boolean,
  ): Promise<UploadResult> {
    return documentEndpoints.uploadDocument(
      this.documentDeps,
      file,
      vectorStoreId,
      replace,
    );
  }

  async deleteDocument(
    fileId: string,
    vectorStoreId?: string,
  ): Promise<{ success: boolean }> {
    return documentEndpoints.deleteDocument(
      this.documentDeps,
      fileId,
      vectorStoreId,
    );
  }

  async listDocumentsForStore(vectorStoreId: string): Promise<DocumentInfo[]> {
    return documentEndpoints.listDocumentsForStore(
      this.documentDeps,
      vectorStoreId,
    );
  }

  async testRagQuery(
    query: string,
    maxResults?: number,
    vectorStoreId?: string,
    vectorStoreIds?: string[],
  ): Promise<RagTestResult> {
    return documentEndpoints.testRagQuery(
      this.documentDeps,
      query,
      maxResults,
      vectorStoreId,
      vectorStoreIds,
    );
  }

  async generateRagAnswer(
    query: string,
    maxResults?: number,
    vectorStoreId?: string,
    vectorStoreIds?: string[],
  ): Promise<RagGenerateResult> {
    return documentEndpoints.generateRagAnswer(
      this.documentDeps,
      query,
      maxResults,
      vectorStoreId,
      vectorStoreIds,
    );
  }

  async getSafetyStatus(): Promise<SafetyStatusResponse> {
    return adminEndpoints.getSafetyStatus(this.adminDeps);
  }

  async getEvaluationStatus(): Promise<EvaluationStatusResponse> {
    return adminEndpoints.getEvaluationStatus(this.adminDeps);
  }

  async testModelConnection(
    model?: string,
    baseUrl?: string,
  ): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }> {
    return adminEndpoints.testModelConnection(this.adminDeps, model, baseUrl);
  }

  async testMcpConnection(
    url: string,
    type?: string,
    headers?: Record<string, string>,
  ): Promise<McpTestConnectionResult> {
    return adminEndpoints.testMcpConnection(this.adminDeps, url, type, headers);
  }

  async getVectorStoreConfig(): Promise<{
    config: VectorStoreConfig;
    source: 'yaml' | 'database' | 'merged';
  }> {
    return documentEndpoints.getVectorStoreConfig(this.documentDeps);
  }

  async saveVectorStoreConfig(
    overrides: Partial<VectorStoreConfig>,
  ): Promise<void> {
    return documentEndpoints.saveVectorStoreConfig(
      this.documentDeps,
      overrides,
    );
  }

  async resetVectorStoreConfig(): Promise<{ deleted: boolean }> {
    return documentEndpoints.resetVectorStoreConfig(this.documentDeps);
  }

  async createVectorStore(
    config?: Record<string, unknown>,
  ): Promise<VectorStoreCreateResult> {
    return documentEndpoints.createVectorStore(this.documentDeps, config);
  }

  async getVectorStoreStatus(): Promise<VectorStoreStatusResult> {
    return documentEndpoints.getVectorStoreStatus(this.documentDeps);
  }

  async listActiveVectorStores(): Promise<{
    stores: Array<VectorStoreInfo & { active: boolean }>;
    unconnected?: Array<VectorStoreInfo & { active: false }>;
  }> {
    return documentEndpoints.listActiveVectorStores(this.documentDeps);
  }

  async connectVectorStore(vectorStoreId: string): Promise<{
    activeVectorStoreIds: string[];
  }> {
    return documentEndpoints.connectVectorStore(
      this.documentDeps,
      vectorStoreId,
    );
  }

  async removeVectorStore(
    vectorStoreId: string,
    permanent?: boolean,
  ): Promise<{
    removed: string;
    permanent: boolean;
    filesDeleted: number;
    activeVectorStoreIds: string[];
  }> {
    return documentEndpoints.removeVectorStore(
      this.documentDeps,
      vectorStoreId,
      permanent,
    );
  }

  // ---------------------------------------------------------------------------
  // Kagenti API
  // ---------------------------------------------------------------------------

  private get kagentiDeps(): kagentiEndpoints.KagentiApiDeps {
    return { fetchJson: this.fetchJson.bind(this) };
  }

  async listKagentiAgents(
    namespace?: string,
    options?: { includeCards?: boolean },
  ) {
    return kagentiEndpoints.listAgents(this.kagentiDeps, namespace, options);
  }
  async getKagentiAgent(namespace: string, name: string) {
    return kagentiEndpoints.getAgent(this.kagentiDeps, namespace, name);
  }
  async getKagentiAgentRouteStatus(namespace: string, name: string) {
    return kagentiEndpoints.getAgentRouteStatus(
      this.kagentiDeps,
      namespace,
      name,
    );
  }
  async createKagentiAgent(
    body: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateAgentRequest,
  ) {
    return kagentiEndpoints.createAgent(this.kagentiDeps, body);
  }
  async deleteKagentiAgent(namespace: string, name: string) {
    return kagentiEndpoints.deleteAgent(this.kagentiDeps, namespace, name);
  }
  async listKagentiMigratableAgents() {
    return kagentiEndpoints.listMigratableAgents(this.kagentiDeps);
  }
  async migrateKagentiAgent(
    namespace: string,
    name: string,
    deleteOld?: boolean,
  ) {
    return kagentiEndpoints.migrateAgent(
      this.kagentiDeps,
      namespace,
      name,
      deleteOld,
    );
  }
  async migrateAllKagentiAgents(options?: {
    namespace?: string;
    dryRun?: boolean;
    deleteOld?: boolean;
  }) {
    return kagentiEndpoints.migrateAllAgents(this.kagentiDeps, options);
  }
  async listKagentiTools(namespace?: string) {
    return kagentiEndpoints.listTools(this.kagentiDeps, namespace);
  }
  async getKagentiTool(namespace: string, name: string) {
    return kagentiEndpoints.getTool(this.kagentiDeps, namespace, name);
  }
  async createKagentiTool(
    body: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateToolRequest,
  ) {
    return kagentiEndpoints.createTool(this.kagentiDeps, body);
  }
  async deleteKagentiTool(namespace: string, name: string) {
    return kagentiEndpoints.deleteTool(this.kagentiDeps, namespace, name);
  }
  async getKagentiFeatureFlags() {
    return kagentiEndpoints.getFeatureFlags(this.kagentiDeps);
  }
  async getKagentiDashboards() {
    return kagentiEndpoints.getDashboards(this.kagentiDeps);
  }
  async listKagentiNamespaces(enabledOnly?: boolean) {
    return kagentiEndpoints.listNamespaces(this.kagentiDeps, enabledOnly);
  }
  async triggerKagentiBuild(namespace: string, name: string) {
    return kagentiEndpoints.triggerAgentBuild(
      this.kagentiDeps,
      namespace,
      name,
    );
  }
  async getKagentiBuildInfo(namespace: string, name: string) {
    return kagentiEndpoints.getAgentBuildInfo(
      this.kagentiDeps,
      namespace,
      name,
    );
  }
  async finalizeKagentiAgentBuild(
    namespace: string,
    name: string,
    body?: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiFinalizeAgentBuildRequest,
  ) {
    return kagentiEndpoints.finalizeAgentBuild(
      this.kagentiDeps,
      namespace,
      name,
      body,
    );
  }
  async listKagentiBuildStrategies() {
    return kagentiEndpoints.listBuildStrategies(this.kagentiDeps);
  }
  async listKagentiShipwrightBuilds(options?: {
    namespace?: string;
    allNamespaces?: boolean;
  }) {
    return kagentiEndpoints.listShipwrightBuilds(this.kagentiDeps, options);
  }
  async connectKagentiTool(namespace: string, name: string) {
    return kagentiEndpoints.connectTool(this.kagentiDeps, namespace, name);
  }
  async invokeKagentiTool(
    namespace: string,
    name: string,
    toolName: string,
    args?: Record<string, unknown>,
  ) {
    return kagentiEndpoints.invokeTool(
      this.kagentiDeps,
      namespace,
      name,
      toolName,
      args,
    );
  }
  async getToolRouteStatus(namespace: string, name: string) {
    return kagentiEndpoints.getToolRouteStatus(
      this.kagentiDeps,
      namespace,
      name,
    );
  }
  async getToolBuildInfo(namespace: string, name: string) {
    return kagentiEndpoints.getToolBuildInfo(this.kagentiDeps, namespace, name);
  }
  async triggerToolBuild(namespace: string, name: string) {
    return kagentiEndpoints.triggerToolBuild(this.kagentiDeps, namespace, name);
  }
  async finalizeToolBuild(
    namespace: string,
    name: string,
    body?: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiFinalizeToolBuildRequest,
  ) {
    return kagentiEndpoints.finalizeToolBuild(
      this.kagentiDeps,
      namespace,
      name,
      body,
    );
  }
  async createDevSpacesWorkspace(
    request: import('@red-hat-developer-hub/backstage-plugin-augment-common').DevSpacesCreateWorkspaceRequest,
  ) {
    return kagentiEndpoints.createDevSpacesWorkspace(this.kagentiDeps, request);
  }
}
