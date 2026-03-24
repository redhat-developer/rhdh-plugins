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

import type { BrandingConfig } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { MCPServerConfig } from './security';

/**
 * Effective configuration resolved at request time by merging
 * YAML baseline with admin DB overrides. All chat-time config
 * consumers should read from this interface, not from cached
 * service fields.
 *
 * @public
 */
export interface EffectiveConfig {
  /** LLM model identifier */
  model: string;
  /** Llama Stack server URL */
  baseUrl: string;
  /** System prompt injected as instructions */
  systemPrompt: string;
  /** Tool choice strategy */
  toolChoice?: ToolChoiceConfig;
  /** Allow the model to invoke multiple tools in one turn */
  parallelToolCalls?: boolean;
  /** Structured output format */
  textFormat?: {
    type: 'json_schema';
    json_schema: {
      name: string;
      schema: Record<string, unknown>;
      strict?: boolean;
    };
  };
  /** Enable built-in web search tool */
  enableWebSearch: boolean;
  /** Enable built-in code interpreter tool */
  enableCodeInterpreter: boolean;
  /** Max chunks returned by file_search */
  fileSearchMaxResults?: number;
  /** Minimum relevance score threshold for file_search */
  fileSearchScoreThreshold?: number;
  /** Active vector store IDs for RAG */
  vectorStoreIds: string[];
  /** Vector store name for auto-creation */
  vectorStoreName: string;
  /** Embedding model */
  embeddingModel: string;
  /** Embedding dimension */
  embeddingDimension: number;
  /** Search mode */
  searchMode?: 'semantic' | 'keyword' | 'hybrid';
  /** BM25 weight for hybrid search */
  bm25Weight?: number;
  /** Semantic weight for hybrid search */
  semanticWeight?: number;
  /** Chunking strategy */
  chunkingStrategy: 'auto' | 'static';
  /** Max chunk size in tokens */
  maxChunkSizeTokens: number;
  /** Chunk overlap in tokens */
  chunkOverlapTokens: number;
  /** Skip TLS verification */
  skipTlsVerify: boolean;
  /** Zero Data Retention mode */
  zdrMode: boolean;
  /** Custom function definitions */
  functions?: FunctionDefinition[];
  /** API authentication token */
  token?: string;
  /** Verbose stream logging */
  verboseStreamLogging: boolean;
  /** Destructive action patterns for safety */
  safetyPatterns?: string[];
  /** Branding overrides */
  branding?: Partial<BrandingConfig>;
  /** Additional MCP servers added via admin UI (merged with YAML) */
  mcpServers?: MCPServerConfig[];
  /** Override safety enabled/disabled from admin panel */
  safetyEnabled?: boolean;
  /** Override input shield IDs from admin panel */
  inputShields?: string[];
  /** Override output shield IDs from admin panel */
  outputShields?: string[];
  /** Override evaluation enabled/disabled from admin panel */
  evaluationEnabled?: boolean;
  /** Override scoring function IDs from admin panel */
  scoringFunctions?: string[];
  /** Override minimum score threshold from admin panel */
  minScoreThreshold?: number;
  /** Override safety onError behavior from admin panel ('allow' = fail-open, 'block' = fail-closed) */
  safetyOnError?: 'allow' | 'block';
  /** Override evaluation onError behavior from admin panel ('skip' = ignore errors, 'fail' = report errors) */
  evaluationOnError?: 'skip' | 'fail';
  /**
   * Reasoning configuration for models that support thinking (Gemini 2.5+, o1/o3, etc.)
   * Maps to the OpenAI Responses API `reasoning` parameter.
   * Llama Stack translates this to provider-specific params (e.g. Gemini thinking_level).
   */
  reasoning?: ReasoningConfig;
  /** Semantic tool scoping configuration */
  toolScoping?: ToolScopingConfig;

  // ===========================================================================
  // Responses API Production Parameters
  // ===========================================================================

  /**
   * Guardrail shield IDs to apply during response generation.
   * Passed directly to the Responses API `guardrails` field for
   * server-side enforcement alongside local SafetyService checks.
   * Shield IDs must be registered on the Llama Stack server.
   */
  guardrails?: string[];

  /**
   * Maximum number of total built-in tool calls per response.
   * Maps to the Responses API `max_tool_calls` parameter.
   * Prevents runaway tool loops (e.g., infinite file_search).
   */
  maxToolCalls?: number;

  /**
   * Upper bound for the number of output tokens per response.
   * Maps to the Responses API `max_output_tokens` parameter.
   * Controls cost and prevents excessively long outputs.
   */
  maxOutputTokens?: number;

  /**
   * Sampling temperature (0.0–2.0). Lower values are more
   * deterministic, higher values more creative.
   * Maps to the Responses API `temperature` parameter.
   */
  temperature?: number;

  /**
   * Stable identifier for safety monitoring and abuse detection.
   * Maps to the Responses API `safety_identifier` parameter.
   * Typically set to the organization or deployment name.
   */
  safetyIdentifier?: string;

  /**
   * Maximum number of inference iterations for the Responses API.
   * Maps to the Responses API `max_infer_iters` parameter.
   * Server-side iteration limit complementing the client-side `maxAgentTurns`.
   */
  maxInferIters?: number;

  /**
   * Instructions appended to approval continuations to guide
   * how the model formats tool output. Configurable via
   * `augment.postToolInstructions` in YAML.
   */
  postToolInstructions?: string;

  /**
   * Context window truncation strategy for the Responses API.
   * - 'auto': Server truncates old conversation context to fit the model's window
   * - 'disabled': No truncation (default); requests that exceed context will fail
   * Maps to the Responses API `truncation` parameter.
   */
  truncation?: 'auto' | 'disabled';

  // ===========================================================================
  // Multi-Agent Configuration
  // ===========================================================================

  /**
   * Multi-agent definitions keyed by agent identifier.
   * When present, the orchestrator uses multi-agent routing instead of single-agent chat.
   * Each key becomes the agent identifier used in handoff function names (e.g. `transfer_to_{key}`).
   */
  agents?: Record<string, AgentConfig>;
  /** Key of the default (entry/triage) agent. Must match a key in `agents`. */
  defaultAgent?: string;
  /** Maximum number of internal turns the multi-agent runner may execute per user request (default: 10) */
  maxAgentTurns?: number;

  /**
   * Llama Stack prompt reference for server-managed prompt templates.
   * When set, the `prompt` field replaces `instructions` in the `/v1/responses` request.
   */
  promptRef?: {
    id: string;
    version?: number;
    variables?: Record<string, string>;
  };
}

/**
 * Reasoning configuration for the OpenAI Responses API.
 * Controls how much thinking a model performs before responding.
 * @public
 */
export interface ReasoningConfig {
  /** How much reasoning effort the model should apply */
  effort?: 'low' | 'medium' | 'high';
  /**
   * Controls reasoning summary output in streaming responses.
   * - 'auto': Server decides (default)
   * - 'concise': Brief summaries
   * - 'detailed': Full reasoning summaries
   * - 'none': No summaries
   */
  summary?: 'auto' | 'concise' | 'detailed' | 'none';
}

/**
 * Allowed tool specification for filtering available tools
 * @public
 */
export type AllowedToolSpec =
  | { type: 'file_search' }
  | { type: 'web_search' }
  | { type: 'code_interpreter' }
  | { type: 'mcp'; server_label: string }
  | { type: 'function'; name: string };

/**
 * Tool choice configuration for Responses API
 * Controls how the model selects which tools to use
 * @public
 */
export type ToolChoiceConfig =
  | 'auto' // Model decides when to call tools (default)
  | 'required' // Model must call at least one tool
  | 'none' // Model cannot call any tools
  | { type: 'function'; name: string } // Force a specific function
  | {
      type: 'allowed_tools';
      mode?: 'auto' | 'required';
      tools: AllowedToolSpec[];
    }; // Restrict to specific tools

/**
 * Configuration for semantic tool scoping (ToolScope).
 * Provider-agnostic: controls whether per-query tool filtering
 * is active and how many tools to select.
 * @public
 */
export interface ToolScopingConfig {
  /** Enable semantic tool scoping (default: false) */
  enabled: boolean;
  /** Max tools selected per chat turn (default: 12) */
  maxToolsPerTurn: number;
  /** Min total tool count before scoping activates (default: 15) */
  activationThreshold: number;
  /** Minimum cosine similarity score for a tool to be included (default: 0.1) */
  minScore: number;
}

/**
 * Configuration for Llama Stack integration
 * Uses Llama Stack's OpenAI-compatible APIs with Responses API for RAG
 * @public
 */
export interface LlamaStackConfig {
  /** Base URL for the Llama Stack server */
  baseUrl: string;
  /** IDs of vector stores to search (supports multiple for automatic multi-store RAG) */
  vectorStoreIds: string[];
  /** Name for auto-created vector store (required if vectorStoreIds not provided) */
  vectorStoreName: string;
  /** Embedding model for vector store (e.g., 'sentence-transformers/all-MiniLM-L6-v2') */
  embeddingModel: string;
  /** Embedding dimension (e.g., 384 for all-MiniLM-L6-v2, 768 for text-embedding-004) */
  embeddingDimension?: number;
  /**
   * Vector store search mode for RAG retrieval
   * - 'semantic': Pure embedding-based search (default)
   * - 'keyword': Pure BM25 keyword search
   * - 'hybrid': Combines semantic and keyword search for better results
   */
  searchMode?: 'semantic' | 'keyword' | 'hybrid';
  /**
   * Weight for BM25 keyword search in hybrid mode (0.0 - 1.0)
   * Only used when searchMode is 'hybrid'
   * Default: 0.5
   */
  bm25Weight?: number;
  /**
   * Weight for semantic/embedding search in hybrid mode (0.0 - 1.0)
   * Only used when searchMode is 'hybrid'
   * Default: 0.5
   */
  semanticWeight?: number;
  /** LLM model to use for Responses API (e.g., 'gemini/gemini-2.5-flash') */
  model: string;
  /** Optional API token for authentication */
  token?: string;
  /** Chunking strategy for file uploads: 'auto' or 'static' */
  chunkingStrategy: 'auto' | 'static';
  /** Max chunk size in tokens (for static chunking) */
  maxChunkSizeTokens: number;
  /** Chunk overlap in tokens (for static chunking) */
  chunkOverlapTokens: number;
  /** Skip TLS certificate verification (for self-signed certs in dev/enterprise) */
  skipTlsVerify?: boolean;
  /** Enable verbose logging for streaming events (default: false) */
  verboseStreamLogging?: boolean;
  /**
   * Tool choice configuration - controls how the model selects tools
   * - 'auto': Model decides when to call tools (default)
   * - 'required': Model must call at least one tool
   * - 'none': Model cannot call any tools
   * - `\{ type: 'function', name: '...' \}`: Force a specific function
   */
  toolChoice?: ToolChoiceConfig;
  /**
   * Whether to allow parallel tool calls
   * - true: Model can call multiple tools in a single turn (default)
   * - false: Model can only call one tool at a time
   */
  parallelToolCalls?: boolean;
  /**
   * Structured output format configuration
   * When set, the model will return output conforming to the JSON schema
   */
  textFormat?: {
    type: 'json_schema';
    json_schema: {
      name: string;
      schema: Record<string, unknown>;
      strict?: boolean;
    };
  };
  /**
   * Custom function definitions for the model to call
   * These are added to the tools array alongside file_search and MCP tools
   */
  functions?: FunctionDefinition[];
  /**
   * Enable Zero Data Retention (ZDR) mode
   * When enabled:
   * - Responses are not stored (store: false)
   * - Encrypted reasoning tokens are returned for stateless operation
   * - Pass encrypted tokens back in subsequent requests
   */
  zdrMode?: boolean;
  /**
   * Maximum number of chunks returned by file_search per query (1-50).
   * Lower values reduce input tokens; higher values provide more context.
   * Llama Stack default is 10 when not specified.
   */
  fileSearchMaxResults?: number;
  /**
   * Minimum relevance score for file_search results (0.0-1.0).
   * Chunks scoring below this threshold are dropped before being sent to the model.
   * 0.0 means no filtering (default), 0.3-0.5 is a reasonable starting point.
   */
  fileSearchScoreThreshold?: number;
  /**
   * Enable the built-in web_search tool
   * When enabled, the model can search the web for real-time information
   */
  enableWebSearch?: boolean;
  /**
   * Enable the built-in code_interpreter tool
   * When enabled, the model can execute Python code for data analysis
   */
  enableCodeInterpreter?: boolean;
  /**
   * Reasoning / thinking configuration.
   * Enables and controls the model's internal chain-of-thought.
   * - effort: 'low' | 'medium' | 'high' — maps to Gemini thinking_level or OpenAI reasoning effort
   * - summary: 'auto' | 'concise' | 'detailed' | 'none' — controls reasoning summary output
   */
  reasoning?: ReasoningConfig;
  /**
   * Semantic tool scoping configuration.
   * When enabled, tools are filtered per-query by semantic relevance.
   */
  toolScoping?: ToolScopingConfig;

  /**
   * Maximum number of total built-in tool calls per response.
   * Maps to the Responses API `max_tool_calls` parameter.
   */
  maxToolCalls?: number;

  /**
   * Upper bound for output tokens per response.
   * Maps to the Responses API `max_output_tokens` parameter.
   */
  maxOutputTokens?: number;

  /**
   * Sampling temperature (0.0–2.0).
   * Maps to the Responses API `temperature` parameter.
   */
  temperature?: number;

  /**
   * Stable identifier for safety monitoring and abuse detection.
   * Maps to the Responses API `safety_identifier` parameter.
   */
  safetyIdentifier?: string;

  /**
   * Context window truncation strategy.
   * - 'auto': Server truncates old context to fit the model's window
   * - 'disabled': No truncation (default)
   */
  truncation?: 'auto' | 'disabled';
}

/**
 * Function definition for Responses API
 * Defines a custom function the model can call
 * @public
 */
export interface FunctionDefinition {
  /** Function name (e.g., 'search_catalog') */
  name: string;
  /** Description of what the function does and when to use it */
  description: string;
  /** JSON Schema defining the function's input parameters */
  parameters: Record<string, unknown>;
  /** Whether to enforce strict mode for schema compliance (default: true) */
  strict?: boolean;
}

/**
 * Handoff input filter strategy.
 * Controls how conversation history is transformed when handing off.
 * Follows the OpenAI Agents SDK `HandoffInputFilter` pattern.
 * @public
 */
export type HandoffInputFilter = 'none' | 'removeToolCalls' | 'summaryOnly';

/**
 * Tool use behavior after tool results are returned.
 * Follows the OpenAI Agents SDK `ToolUseBehavior` pattern.
 * @public
 */
export type ToolUseBehavior =
  | 'run_llm_again'
  | 'stop_on_first_tool'
  | { stopAtToolNames: string[] };

/**
 * JSON Schema definition for structured agent output.
 * @public
 */
export interface OutputSchema {
  /** Schema name for the Responses API */
  name: string;
  /** JSON Schema object defining the expected output structure */
  schema: Record<string, unknown>;
  /** Whether to enforce strict schema compliance (default: true) */
  strict?: boolean;
}

/**
 * Per-tool guardrail rule applied before or after tool execution.
 * Follows the OpenAI Agents SDK `defineToolInputGuardrail` / `defineToolOutputGuardrail` pattern.
 * Since LlamaStack handles MCP tool execution server-side, these guardrails are
 * pattern-based validation rules applied at the orchestration layer.
 * @public
 */
export interface ToolGuardrailRule {
  /** Tool name pattern to match (glob-style, e.g. '*_delete', 'pods_*') */
  toolPattern: string;
  /** Whether this is an input or output guardrail */
  phase: 'input' | 'output';
  /**
   * Action when the guardrail matches:
   * - 'block': reject the tool call with a message
   * - 'warn': log a warning but allow execution
   * - 'require_approval': force HITL approval even if tool doesn't normally require it
   */
  action: 'block' | 'warn' | 'require_approval';
  /** Human-readable message explaining why this guardrail exists */
  message: string;
  /**
   * Optional argument/output pattern to match against (regex).
   * When set, the guardrail only fires if the tool arguments/output match this pattern.
   */
  contentPattern?: string;
}

/**
 * Structured lifecycle event emitted by the ADK orchestration layer.
 * Follows the OpenAI Agents SDK `RunHooks` pattern for observability.
 * @public
 */
export type AgentLifecycleEvent =
  | { type: 'agent.start'; agentKey: string; agentName: string; turn: number }
  | {
      type: 'agent.end';
      agentKey: string;
      agentName: string;
      turn: number;
      result: string;
    }
  | {
      type: 'agent.handoff';
      fromAgent: string;
      toAgent: string;
      fromKey: string;
      toKey: string;
      reason?: string;
    }
  | {
      type: 'agent.tool_start';
      agentKey: string;
      toolName: string;
      turn: number;
    }
  | {
      type: 'agent.tool_end';
      agentKey: string;
      toolName: string;
      turn: number;
      success: boolean;
    };

/**
 * Callback for receiving lifecycle events from the runner.
 * @public
 */
export type LifecycleEventCallback = (event: AgentLifecycleEvent) => void;

/**
 * Deep-clone an agent config and apply partial overrides.
 * Matches the OpenAI Agents SDK `Agent.clone()` pattern.
 * @public
 */
export function cloneAgentConfig(
  base: AgentConfig,
  overrides: Partial<AgentConfig> = {},
): AgentConfig {
  const cloned = JSON.parse(JSON.stringify(base)) as AgentConfig;
  return { ...cloned, ...overrides };
}

/**
 * Configuration for a single agent in a multi-agent system.
 * Follows the OpenAI Agents SDK pattern: each agent has its own instructions,
 * tools, and can hand off to other agents via function calls.
 * @public
 */
export interface AgentConfig {
  /** Display name of the agent */
  name: string;
  /** System prompt / instructions for this agent */
  instructions: string;
  /** Description shown to other agents when this agent is a handoff target */
  handoffDescription?: string;
  /** Override the LLM model for this agent (falls back to global model) */
  model?: string;
  /** Subset of MCP server IDs this agent can use (from the global mcpServers list) */
  mcpServers?: string[];
  /** Agent keys this agent can hand off to (generates `transfer_to_{key}` functions) */
  handoffs?: string[];
  /** Agent keys this agent can call as tools (generates `call_{key}` functions) */
  asTools?: string[];
  /** Whether this agent has access to RAG / file_search */
  enableRAG?: boolean;
  /** Whether this agent has access to web search */
  enableWebSearch?: boolean;
  /** Whether this agent has access to code interpreter */
  enableCodeInterpreter?: boolean;
  /** Custom function definitions specific to this agent */
  functions?: FunctionDefinition[];
  /** Override tool choice strategy for this agent */
  toolChoice?: ToolChoiceConfig;
  /** Override reasoning configuration for this agent */
  reasoning?: ReasoningConfig;
  /**
   * @deprecated No longer used. Each agent's `instructions` is the complete prompt
   * sent to the LLM, matching the OpenAI Agents SDK model. Kept for backward
   * compatibility with existing saved configs (silently ignored at runtime).
   */
  inheritSystemPrompt?: boolean;
  /**
   * JSON Schema for handoff metadata the model can pass when routing to this agent.
   * When set, the transfer_to_ tool accepts structured parameters (reason, priority, etc.).
   * Follows the OpenAI Agents SDK `inputType` pattern.
   */
  handoffInputSchema?: Record<string, unknown>;
  /**
   * How conversation history is transformed when another agent hands off to this one.
   * - 'none' (default): pass all history as-is
   * - 'removeToolCalls': strip function_call / function_call_output items
   * - 'summaryOnly': only pass the handoff output (minimal context)
   * Follows the OpenAI Agents SDK `HandoffInputFilter` pattern.
   */
  handoffInputFilter?: HandoffInputFilter;
  /**
   * What happens after tool calls return results.
   * - 'run_llm_again' (default): re-invoke the model with tool results
   * - 'stop_on_first_tool': return tool output directly as the response
   * Follows the OpenAI Agents SDK `ToolUseBehavior` pattern.
   */
  toolUseBehavior?: ToolUseBehavior;
  /**
   * JSON Schema for this agent's structured output.
   * When set, the agent's final output is validated against this schema.
   * Maps to the Responses API `text.format` parameter.
   */
  outputSchema?: OutputSchema;
  /**
   * Runtime condition controlling whether this agent's handoffs are available.
   * When false, other agents cannot hand off to this agent.
   * Default: true.
   * Follows the OpenAI Agents SDK `isEnabled` pattern.
   */
  enabled?: boolean;
  /**
   * Per-tool guardrail rules for this agent.
   * Applied at the orchestration layer to validate tool inputs/outputs
   * beyond the global SafetyService shields.
   * Follows the OpenAI Agents SDK `defineToolInputGuardrail` / `defineToolOutputGuardrail` pattern.
   */
  toolGuardrails?: ToolGuardrailRule[];

  /**
   * Override server-side guardrail shield IDs for this agent.
   * Passed to the Responses API `guardrails` field.
   */
  guardrails?: string[];

  /**
   * Override max tool calls per response for this agent.
   * Prevents runaway tool loops for agents with many MCP tools.
   */
  maxToolCalls?: number;

  /**
   * Override max output tokens for this agent.
   * Useful to constrain router agents to short outputs or
   * allow analyst agents longer responses.
   */
  maxOutputTokens?: number;

  /**
   * Override sampling temperature for this agent.
   * Lower for routers (deterministic), higher for creative agents.
   */
  temperature?: number;

  /**
   * After the agent uses a tool, reset `toolChoice` to `undefined` (i.e. `auto`)
   * to prevent the model from being forced into infinite tool-calling loops.
   * Default: true. Matches the OpenAI Agents SDK `reset_tool_choice` pattern.
   */
  resetToolChoice?: boolean;

  /**
   * On handoff, wrap the full conversation history into a single structured
   * input item with XML-style tags, reducing context size for the target agent.
   * Complements `handoffInputFilter` with a nesting strategy.
   * Matches the OpenAI Agents SDK `nest_handoff_history` pattern.
   */
  nestHandoffHistory?: boolean;

  /**
   * Llama Stack prompt reference for server-managed prompt templates.
   * When set, the `prompt` field is sent to `/v1/responses` instead of `instructions`.
   * Enables server-side versioning, variable substitution, and A/B testing.
   */
  promptRef?: {
    id: string;
    version?: number;
    variables?: Record<string, string>;
  };

  /**
   * Override context window truncation strategy for this agent.
   * - 'auto': Server truncates old context to fit the model's window
   * - 'disabled': No truncation (default)
   */
  truncation?: 'auto' | 'disabled';
}
