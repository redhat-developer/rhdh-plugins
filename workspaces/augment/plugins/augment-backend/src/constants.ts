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

// ---------------------------------------------------------------------------
// Timeout constants (milliseconds unless suffixed with _S for seconds)
// ---------------------------------------------------------------------------

/** API request timeout for synchronous LLM inference calls. */
export const API_REQUEST_TIMEOUT_MS = 120_000;

/** Streaming request timeout for long-running LLM responses. */
export const STREAM_REQUEST_TIMEOUT_MS = 300_000;

/** Timeout for walking a response chain in ConversationService. */
export const RESPONSE_CHAIN_TIMEOUT_MS = 15_000;

/** Default HTTP timeout for fetchWithTlsControl. */
export const DEFAULT_HTTP_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Token / auth constants
// ---------------------------------------------------------------------------

/** Buffer (seconds) before token expiry to trigger a refresh. */
export const TOKEN_EXPIRY_BUFFER_S = 60;

/** Timeout for token exchange operations (ms). */
export const TOKEN_EXCHANGE_TIMEOUT_MS = 30_000;

/** Minimum token lifetime (seconds) to consider caching. */
export const MIN_TOKEN_LIFETIME_S = 300;

// ---------------------------------------------------------------------------
// Input validation limits
// ---------------------------------------------------------------------------

/** Maximum length for description/query fields in admin routes. */
export const MAX_DESCRIPTION_LENGTH = 2_000;

/** Maximum length for system prompt configuration. */
export const MAX_SYSTEM_PROMPT_LENGTH = 50_000;

/** Maximum length for a single chat message content string (64 KB). */
export const MAX_MESSAGE_CONTENT_LENGTH = 64_000;

/** Maximum number of messages in a single chat request. */
export const MAX_MESSAGES_PER_REQUEST = 200;

/** Maximum length for approval request string fields. */
export const MAX_APPROVAL_FIELD_LENGTH = 1_000;

// ---------------------------------------------------------------------------
// Cache / registry size limits
// ---------------------------------------------------------------------------

/** Maximum entries in the conversation registry (LRU-style cap). */
export const MAX_CONVERSATION_REGISTRY_SIZE = 10_000;

/** Maximum entries in the MCP auth token cache. */
export const MAX_TOKEN_CACHE_SIZE = 1_000;

/** Maximum entries in the DocumentSyncService content hash cache. */
export const MAX_CONTENT_HASH_CACHE_SIZE = 10_000;

/** Default expiration for OAuth tokens (seconds) when no expiry is provided. */
export const DEFAULT_TOKEN_EXPIRATION_S = 3_600;

// ---------------------------------------------------------------------------
// Pagination / list limits
// ---------------------------------------------------------------------------

/** Default page size for vector store file listing. */
export const VECTOR_STORE_PAGE_SIZE = 100;

/** Maximum conversations to return from a listing query. */
export const MAX_CONVERSATIONS_LIMIT = 100;

/** Maximum session list limit. */
export const MAX_SESSION_LIST_LIMIT = 500;

/** Default session list limit for admin queries. */
export const DEFAULT_SESSION_LIST_LIMIT = 100;

/** Maximum characters in a session title. */
export const MAX_SESSION_TITLE_LENGTH = 200;

// ---------------------------------------------------------------------------
// Content length limits
// ---------------------------------------------------------------------------

/** Maximum length for a message preview (truncated for session title). */
export const MESSAGE_PREVIEW_MAX_LENGTH = 200;

/** Maximum length of a tool output item logged during approval. */
export const APPROVAL_OUTPUT_LOG_MAX_LENGTH = 500;

/** Maximum file size for document uploads (bytes). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Config validation limits
// ---------------------------------------------------------------------------

/** Maximum length for config values in validation. */
export const MAX_CONFIG_VALUE_SIZE = 100_000;

/** Maximum length for a model identifier. */
export const MAX_MODEL_LENGTH = 200;

/** Maximum length for branding text fields. */
export const MAX_BRANDING_FIELD_LENGTH = 500;

// ---------------------------------------------------------------------------
// Config defaults
// ---------------------------------------------------------------------------

/** Default embedding dimension when not specified. */
export const DEFAULT_EMBEDDING_DIMENSION = 384;

/** Default vector store name when not specified in config. */
export const DEFAULT_VECTOR_STORE_NAME = 'augment-knowledge-base';

/** Default chunk size for document ingestion. */
export const DEFAULT_CHUNK_SIZE = 512;

/** Default chunk overlap for document ingestion. */
export const DEFAULT_CHUNK_OVERLAP = 50;

/** Maximum allowed chunk size (tokens) in vector store config validation. */
export const MAX_CHUNK_SIZE_TOKENS = 100_000;

/** Maximum allowed chunk overlap (tokens) in vector store config validation. */
export const MAX_CHUNK_OVERLAP_TOKENS = 50_000;

/** Maximum file search results in vector store config validation. */
export const MAX_FILE_SEARCH_RESULTS = 100;

/** Default limit for conversation listing. */
export const DEFAULT_CONVERSATIONS_LIMIT = 50;

/** Maximum RAG search results for RAG test endpoint. */
export const MAX_RAG_SEARCH_RESULTS = 20;

/** Cache TTL for RuntimeConfigResolver (ms). */
export const CONFIG_CACHE_TTL_MS = 5_000;

// ---------------------------------------------------------------------------
// Stream / loop limits
// ---------------------------------------------------------------------------

/** Max auto-reapprovals for chained HITL duplicate requests. */
export const MAX_AUTO_REAPPROVALS = 3;

/**
 * Max iterations for the HITL continuation loop in BackendApprovalHandler.
 * After approving a tool, the LLM may request additional tool calls; this
 * bounds the auto-execution loop to prevent infinite cycling.
 */
export const MAX_CONTINUATION_ITERATIONS = 10;

/** Max visits to a single agent before cycle detection triggers. */
export const MAX_AGENT_VISITS = 3;

/** Max retries for transient API failures (502, 503, 504, ECONNRESET). */
export const MAX_API_RETRIES = 2;

/** Base delay in ms for exponential backoff between API retries. */
export const RETRY_BASE_DELAY_MS = 1000;

/** Maximum depth when walking a response chain. */
export const MAX_RESPONSE_CHAIN_DEPTH = 50;

/** Instruction length (chars) above which a warning is logged. */
export const INSTRUCTION_LENGTH_WARNING_THRESHOLD = 8_000;

/** Maximum MCP proxy response body size (bytes). */
export const MAX_MCP_PROXY_RESPONSE_BYTES = 10 * 1024 * 1024;

/**
 * Maximum tool output size in characters that will be sent to the LLM
 * as function_call_output. Outputs exceeding this are intelligently
 * truncated to prevent context window overflow (the -4993 max_tokens bug).
 * ~4K chars is roughly 1K tokens — leaves room for tool schemas,
 * system prompt, and conversation history when models have limited
 * context windows (e.g. 8K). Larger windows can override via config.
 */
export const MAX_TOOL_OUTPUT_CHARS = 4_000;

/** TTL for BackendToolExecutor's cached tool schemas (ms). */
export const BACKEND_TOOL_DISCOVERY_TTL_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Default model / prompt fallbacks
// ---------------------------------------------------------------------------

/** Default system prompt used when none is configured. */
export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';

/** Default LLM model identifier used as fallback in provider code. */
export const DEFAULT_MODEL = 'meta-llama/Llama-3.3-8B-Instruct';

/** Default embedding model for vector stores. */
export const DEFAULT_EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

/**
 * Default `include` fields for Responses API requests.
 * Ensures file_search results are returned in the response output.
 */
export const DEFAULT_INCLUDE_FIELDS: readonly string[] = [
  'file_search_call.results',
];

/**
 * Extended `include` fields for ZDR mode.
 * Adds encrypted reasoning content alongside file_search results.
 */
export const ZDR_INCLUDE_FIELDS: readonly string[] = [
  'file_search_call.results',
  'reasoning.encrypted_content',
];
