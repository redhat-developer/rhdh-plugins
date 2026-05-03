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

/**
 * Token usage reported by the inference server for a single response turn.
 *
 * Mirrors the OpenAI Responses API `ResponseUsage` object.
 * Llama Stack implements the same schema, so this type is
 * the single source of truth for both frontend and backend.
 *
 * @see https://platform.openai.com/docs/api-reference/responses/object
 * @public
 */
export interface ResponseUsage {
  /** Total input tokens (cumulative across all internal agentic calls) */
  input_tokens: number;
  /** Total output tokens (cumulative across all internal agentic calls) */
  output_tokens: number;
  /** Sum of input_tokens + output_tokens (may include internal overhead) */
  total_tokens: number;
  /**
   * Breakdown of input tokens.
   * Present when the server supports prompt caching.
   */
  input_tokens_details?: InputTokensDetails;
  /**
   * Breakdown of output tokens.
   * Llama Stack may return `null` when the model does not emit reasoning tokens.
   */
  output_tokens_details?: OutputTokensDetails | null;
}

/**
 * Detailed breakdown of input tokens.
 * @public
 */
export interface InputTokensDetails {
  /** Tokens retrieved from the KV-cache (no additional compute cost) */
  cached_tokens?: number;
}

/**
 * Detailed breakdown of output tokens.
 * @public
 */
export interface OutputTokensDetails {
  /** Internal chain-of-thought tokens used by reasoning models (e.g. o3, o4-mini) */
  reasoning_tokens?: number;
}

// =============================================================================
// Shared Types (used by both frontend and backend)
// =============================================================================

/**
 * Chat message in a conversation
 * @public
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Tool call information
 * @public
 */
export interface ToolCallInfo {
  id: string;
  name: string;
  serverLabel: string;
  arguments: string;
  output?: string;
  error?: string;
}

/**
 * RAG source information from file_search_call.results
 * This comes directly from Llama Stack Responses API when include: ['file_search_call.results']
 * @public
 */
export interface RAGSource {
  /** Filename or document identifier */
  filename: string;
  /** Relevant text snippet from the document */
  text?: string;
  /** Relevance score (0-1) if provided by the API */
  score?: number;
  /** File ID for reference */
  fileId?: string;
  /** Document title from attributes (for display in citations) */
  title?: string;
  /** Source URL from attributes (for clickable citations) */
  sourceUrl?: string;
  /** Content type from attributes */
  contentType?: string;
  /** Raw attributes object from Llama Stack */
  attributes?: Record<string, unknown>;
}

/**
 * Aggregated evaluation result for a response
 * @public
 */
export interface EvaluationResult {
  /** Overall quality score (0-1) */
  overallScore: number;
  /** Individual scores by function */
  scores: Record<string, number>;
  /** Whether the response passed quality threshold */
  passedThreshold: boolean;
  /** Human-readable quality assessment */
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  /** Timestamp of evaluation */
  evaluatedAt: string;
  /** Error message if evaluation failed */
  error?: string;
  /** True when evaluation was skipped (e.g. not available) rather than run */
  skipped?: boolean;
}

/**
 * File format enum
 * @public
 */
export enum FileFormat {
  YAML = 'yaml',
  PDF = 'pdf',
  TEXT = 'text',
  MARKDOWN = 'markdown',
  JSON = 'json',
}

/**
 * Information about an uploaded document
 * @public
 */
export interface DocumentInfo {
  id: string;
  fileName: string;
  format: FileFormat;
  fileSize: number;
  uploadedAt: string;
  status: 'completed' | 'in_progress' | 'failed' | 'cancelled';
}

/**
 * Provider status information
 * @public
 */
export interface ProviderStatus {
  id: string;
  model: string;
  baseUrl: string;
  connected: boolean;
  error?: string;
}

/**
 * Vector store status information
 * @public
 */
export interface VectorStoreStatus {
  id: string;
  connected: boolean;
  totalDocuments?: number;
  error?: string;
}

/**
 * MCP server status information
 * @public
 */
export interface MCPToolInfo {
  name: string;
  description?: string;
}

/**
 * @public
 */
export interface MCPServerStatus {
  id: string;
  name: string;
  url: string;
  connected: boolean;
  error?: string;
  /** Tools available on this MCP server (populated when connected) */
  tools?: MCPToolInfo[];
  /** Total number of tools (convenience field) */
  toolCount?: number;
  /** Whether this server was defined in YAML (true) or added via admin UI (false) */
  source?: 'yaml' | 'admin';
}

/**
 * Security mode for Augment
 * @public
 */
export type SecurityMode = 'none' | 'plugin-only' | 'full';

/**
 * Combined status for Augment
 * @public
 */
export interface AugmentStatus {
  /** Active provider identifier (e.g., 'llamastack', 'googleadk') */
  providerId: string;
  provider: ProviderStatus;
  vectorStore: VectorStoreStatus;
  mcpServers: MCPServerStatus[];
  /** Current security mode: 'none' | 'plugin-only' | 'full' */
  securityMode: SecurityMode;
  timestamp: string;
  /** Whether the plugin is ready to handle requests (AI provider connected) */
  ready: boolean;
  /** Blocking configuration errors that prevent the plugin from working */
  configurationErrors: string[];
  /** Whether the current user has admin privileges */
  isAdmin?: boolean;
  /** Optional capability status — these are not required for basic chat */
  capabilities?: {
    chat: boolean;
    rag: { available: boolean; reason?: string };
    mcpTools: { available: boolean; reason?: string };
    /** Whether this provider supports listing agents for the catalog */
    agentCatalog?: boolean;
    /** Whether the user must select an agent before chatting */
    agentSelection?: boolean;
    /** Whether agents have rich metadata (cards, skills) */
    agentCards?: boolean;
  };
  /** Summary of configured agents (multi-agent only) */
  agents?: Array<{ key: string; name: string; isDefault: boolean }>;
  /** Tool execution mode: 'direct' or 'backend' */
  toolExecutionMode?: 'direct' | 'backend';
  /** Error from last agent graph resolution attempt, if any */
  agentGraphError?: string;
}

/**
 * Information about an available vector store
 * @public
 */
export interface VectorStoreInfo {
  id: string;
  name: string;
  status: string;
  fileCount: number;
  createdAt: number;
}

/**
 * Quick prompt configuration
 * @public
 */
export interface QuickPrompt {
  title: string;
  description: string;
  prompt: string;
  category: string;
}

// =============================================================================
// Workflow Types (Configurable multi-step templates)
// =============================================================================

/**
 * A single step within a workflow
 * @public
 */
export interface WorkflowStep {
  /** Step title shown in UI */
  title: string;
  /** Prompt to send to chat when this step is executed */
  prompt: string;
  /** Optional description for the step */
  description?: string;
}

/**
 * A workflow template - multi-step guided experience
 * @public
 */
export interface Workflow {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Icon name (material icons) */
  icon?: string;
  /** Category for grouping */
  category?: string;
  /** Ordered list of steps */
  steps: WorkflowStep[];
  /** Whether this workflow is coming soon (disabled, non-clickable) */
  comingSoon?: boolean;
  /** Custom coming soon label (defaults to "Coming Soon") */
  comingSoonLabel?: string;
}

/**
 * Quick action - single click prompt
 * @public
 */
export interface QuickAction {
  /** Display title */
  title: string;
  /** Short description */
  description?: string;
  /** Prompt to send to chat */
  prompt: string;
  /** Icon name */
  icon?: string;
  /** Category for grouping */
  category?: string;
  /** Whether this action is coming soon (disabled, non-clickable) */
  comingSoon?: boolean;
  /** Custom coming soon label (defaults to "Coming Soon") */
  comingSoonLabel?: string;
}

/**
 * A clickable prompt card within a prompt group on the welcome screen
 * @public
 */
export interface PromptCard {
  /** Display title */
  title: string;
  /** Short description */
  description?: string;
  /** Prompt to send to chat */
  prompt: string;
  /** Icon name */
  icon?: string;
  /** Agent to auto-select when this card is clicked (e.g. "namespace/agentName") */
  agentId?: string;
  /** Whether this feature is coming soon (disabled, non-clickable) */
  comingSoon?: boolean;
  /** Custom coming soon label (defaults to "Coming Soon") */
  comingSoonLabel?: string;
}

/**
 * Per-agent chat experience configuration set by admins.
 * Controls which agents are visible to end users and how they appear.
 * @public
 */
export interface ChatAgentConfig {
  /** Agent identifier: "namespace/name" */
  agentId: string;
  /** Whether this agent is published to the end-user catalog (derived from lifecycleStage === 'deployed') */
  published: boolean;
  /** Whether this agent appears in end-user chat (only applies when published) */
  visible: boolean;
  /** Whether this agent is featured prominently on the welcome screen */
  featured: boolean;
  /** Lifecycle stage: draft → registered → deployed */
  lifecycleStage?: AgentLifecycleStage;
  /** Promotion version — incremented each time the agent is promoted forward */
  version?: number;
  /** ISO timestamp of last promotion */
  promotedAt?: string;
  /** User ref of who last promoted this agent */
  promotedBy?: string;
  /** Display order (lower first) */
  order?: number;
  /** Override display name */
  displayName?: string;
  /** Override description */
  description?: string;
  /** Custom avatar image URL */
  avatarUrl?: string;
  /** Per-agent accent color (hex) */
  accentColor?: string;
  /** Greeting message shown as first bot message on new conversation */
  greeting?: string;
  /** Suggested prompts shown on the agent card and below the input */
  conversationStarters?: string[];
}

/**
 * Per-tool lifecycle configuration set by admins.
 * Controls which tools are published to end users, mirroring the agent lifecycle.
 * @public
 */
export interface ChatToolConfig {
  /** Tool identifier: "namespace/name" */
  toolId: string;
  /** Whether this tool is published to the end-user catalog (derived from lifecycleStage === 'deployed') */
  published: boolean;
  /** Whether this tool appears in end-user listings (only applies when published) */
  visible: boolean;
  /** Lifecycle stage: draft → registered → deployed */
  lifecycleStage?: AgentLifecycleStage;
  /** Promotion version — incremented each time the tool is promoted forward */
  version?: number;
  /** ISO timestamp of last promotion */
  promotedAt?: string;
  /** User ref of who last promoted this tool */
  promotedBy?: string;
  /** User ref of who created this tool */
  createdBy?: string;
  /** ISO timestamp of creation */
  createdAt?: string;
}

/**
 * A group of related prompts displayed on the welcome screen
 * @public
 */
export interface PromptGroup {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Description of this prompt group */
  description?: string;
  /** Icon name */
  icon?: string;
  /** Theme color (hex) */
  color?: string;
  /** Display order (lower numbers appear first, defaults to array order if not specified) */
  order?: number;
  /** Cards within this prompt group */
  cards: PromptCard[];
}

// =============================================================================
// Unified Agent Catalog Types
// =============================================================================

/**
 * Lifecycle stage of an agent in the promotion pipeline.
 *
 * Inspired by the AgentOps Lifecycle:
 *   draft → registered → deployed
 *
 * - **draft**: Agent exists but has not been reviewed by an admin.
 * - **registered**: Admin has vetted and registered the agent as an enterprise asset.
 * - **deployed**: Agent is promoted to the end-user catalog and available for use.
 * @public
 */
export type AgentLifecycleStage = 'draft' | 'registered' | 'deployed';

/**
 * Provider-agnostic representation of a chat agent.
 * Used by the agent catalog/gallery to display agents from any provider
 * (Kagenti, Llama Stack config-driven, or custom).
 * @public
 */
export interface ChatAgent {
  /** Unique agent identifier (e.g. "namespace/name" for Kagenti, agent key for Llama Stack) */
  id: string;
  /** Display name */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Runtime status (e.g. "Ready", "Pending", "config") */
  status: string;
  /** Whether this is the default/entry agent */
  isDefault?: boolean;
  /** Provider that owns this agent */
  providerType: string;
  /** Conversation starters / example prompts */
  starters?: string[];
  /** Avatar image URL */
  avatarUrl?: string;
  /** Agent creation timestamp */
  createdAt?: string;
  /** Agent framework label (e.g. "a2a", "llamastack") */
  framework?: string;
  /** Protocol labels (e.g. "A2A", "MCP") */
  protocols?: string[];
  /** Whether this agent is published to the end-user catalog (derived: lifecycleStage === 'deployed') */
  published?: boolean;
  /** Origin of this agent: 'kagenti' | 'orchestration' | 'external' */
  source?: string;
  /** Namespace the agent belongs to (for Kagenti agents) */
  namespace?: string;
  /** Current lifecycle stage in the promotion pipeline */
  lifecycleStage?: AgentLifecycleStage;
  /** Promotion version (increments each time the agent is promoted) */
  version?: number;
  /** When this agent was last promoted */
  promotedAt?: string;
  /** Who promoted this agent */
  promotedBy?: string;
  /** Role of this agent in the orchestration topology */
  agentRole?: AgentRole;
}

/**
 * Possible roles an agent can have in the orchestration topology.
 * Always auto-derived from connections, never manually set.
 * @public
 */
export type AgentRole = 'router' | 'specialist' | 'standalone';

/**
 * Minimal agent shape required for topology-based role derivation.
 * Both frontend form data and backend config objects satisfy this.
 * @public
 */
export interface AgentTopologyNode {
  handoffs?: string[];
  asTools?: string[];
}

/**
 * Derives an agent's role from the multi-agent topology.
 * This is the single source of truth for role derivation across
 * both frontend and backend.
 *
 * Rules:
 * - Has outgoing handoffs or asTools -> 'router'
 * - Is a target of another agent's handoffs or asTools -> 'specialist'
 * - Neither -> 'standalone'
 *
 * @public
 */
export function deriveRoleFromTopology(
  agentKey: string,
  allAgents: Record<string, AgentTopologyNode | null | undefined>,
): AgentRole {
  const agent = allAgents[agentKey];
  if (!agent) return 'standalone';

  const hasOutgoing =
    (agent.handoffs && agent.handoffs.length > 0) ||
    (agent.asTools && agent.asTools.length > 0);

  if (hasOutgoing) return 'router';

  const isTarget = Object.entries(allAgents).some(
    ([k, a]) =>
      k !== agentKey &&
      a !== null && a !== undefined &&
      ((a.handoffs ?? []).includes(agentKey) ||
        (a.asTools ?? []).includes(agentKey)),
  );

  if (isTarget) return 'specialist';
  return 'standalone';
}

// =============================================================================
// Conversation History Types
// =============================================================================

/**
 * Conversation summary for UI display.
 * Derived from stored responses.
 * @public
 */
export interface ConversationSummary {
  /** Response ID — use to continue this conversation */
  responseId: string;
  /** Preview of the conversation (first user message or assistant response) */
  preview: string;
  /** When the conversation was created */
  createdAt: Date;
  /** Model used */
  model: string;
  /** Status */
  status: 'completed' | 'failed' | 'in_progress';
  /** Llama Stack conversation ID (present for new-style conversations) */
  conversationId?: string;
  /** Previous response ID for chain deduplication */
  previousResponseId?: string;
}

/**
 * Base response from the chat endpoint, shared between frontend and backend.
 * Frontend extends this with additional fields (filtered, evaluation, etc.).
 * @public
 */
export interface ChatResponse {
  role: 'assistant';
  content: string;
  ragContext?: string[];
  /** @deprecated Use ragSources instead */
  filesSearched?: string[];
  ragSources?: RAGSource[];
  toolCalls?: ToolCallInfo[];
  responseId?: string;
  usage?: ResponseUsage;
  /** Name of the agent that produced the final response (multi-agent only) */
  agentName?: string;
  /** Ordered list of agent keys visited during handoffs, e.g. ["triage", "billing"] */
  handoffPath?: string[];
  /** Present when a backend-executed tool requires HITL approval before execution */
  pendingApproval?: PendingApprovalInfo;
  /** All pending approvals when multiple backend tools need HITL approval */
  pendingApprovals?: PendingApprovalInfo[];
  /** Structured output validation error (G5). Present when the agent's outputSchema validation failed. */
  outputValidationError?: string;
  /** Reasoning/thinking summaries from the model's chain-of-thought. */
  reasoning?: ReasoningSummary[];
}

/**
 * Summary of model reasoning from chain-of-thought output.
 * @public
 */
export interface ReasoningSummary {
  id: string;
  text: string;
}

/**
 * Information about a single pending HITL approval.
 * @public
 */
export interface PendingApprovalInfo {
  approvalRequestId: string;
  toolName: string;
  serverLabel?: string;
  arguments?: string;
}

/**
 * Result of a document sync operation.
 * @public
 */
export interface SyncResult {
  added: number;
  removed: number;
  updated: number;
  failed: number;
  unchanged: number;
  errors: string[];
}

/**
 * Detailed tool information for the capabilities-aware prompt generator.
 * Used by the frontend capabilities selector to send tool descriptions
 * to the backend so the meta-prompt can reference what each tool does.
 * @public
 */
export interface ToolCapabilityInfo {
  name: string;
  description?: string;
  serverLabel?: string;
}

/**
 * User-selected capabilities to emphasize when generating agent instructions.
 * Sent to the backend so the meta-prompt includes specific tool descriptions
 * and contextual detail about the agent's environment.
 * @public
 */
export interface PromptCapabilities {
  tools?: ToolCapabilityInfo[];
  enableWebSearch?: boolean;
  enableCodeInterpreter?: boolean;
  ragEnabled?: boolean;
  vectorStoreNames?: string[];
  safetyEnabled?: boolean;
  safetyShields?: string[];
}
