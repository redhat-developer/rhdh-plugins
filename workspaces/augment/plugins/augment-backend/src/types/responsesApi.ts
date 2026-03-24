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
 * @internal
 */
export interface LlamaStackFileResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  expires_at?: number;
  filename: string;
  purpose: string;
}

/**
 * @internal
 */
export interface LlamaStackVectorStoreFileResponse {
  id: string;
  object: string;
  status: 'completed' | 'in_progress' | 'failed' | 'cancelled';
  created_at: number;
  last_error?: { code: string; message: string } | null;
  usage_bytes: number;
  vector_store_id: string;
}

/**
 * @internal
 */
export interface LlamaStackVectorStoreResponse {
  id: string;
  object: string;
  name: string;
  status: string;
  created_at?: number;
  file_counts: {
    total: number;
    completed: number;
    in_progress: number;
    failed: number;
    cancelled: number;
  };
}

/**
 * Responses API output event types
 * @internal
 */
export interface ResponsesApiFileSearchResult {
  type: 'file_search_call';
  id: string;
  status: string;
  queries: string[];
  results: Array<{
    file_id: string;
    filename: string;
    score: number;
    text: string;
    attributes: Record<string, unknown>;
  }>;
}

/**
 * MCP tool call result from Responses API
 * @internal
 */
export interface ResponsesApiMcpCall {
  type: 'mcp_call';
  id: string;
  name: string;
  arguments: string;
  server_label: string;
  error?: string;
  output?: string;
}

/**
 * @internal
 */
export interface ResponsesApiMessage {
  type: 'message';
  id: string;
  role: 'assistant';
  status: 'completed' | 'failed' | 'in_progress';
  content: Array<{
    type: 'output_text';
    text: string;
    /** Annotations such as file citations or URL citations */
    annotations?: ResponsesApiAnnotation[];
  }>;
}

/**
 * Annotation on output text content, e.g. file citation or URL citation.
 * @internal
 */
export interface ResponsesApiAnnotation {
  type: 'file_citation' | 'url_citation' | 'file_path';
  /** Start index in the output text */
  start_index?: number;
  /** End index in the output text */
  end_index?: number;
  file_citation?: {
    file_id: string;
    filename?: string;
    quote?: string;
  };
  url_citation?: {
    url: string;
    title?: string;
  };
  file_path?: {
    file_id: string;
  };
  [key: string]: unknown;
}

/**
 * Function call output from Responses API.
 * Returned when the model invokes a custom function tool (e.g. handoff, agent-as-tool).
 * @internal
 */
export interface ResponsesApiFunctionCall {
  type: 'function_call';
  id: string;
  call_id: string;
  name: string;
  arguments: string;
  status?: 'completed' | 'failed' | 'in_progress';
}

/**
 * Function call output item returned in the response output array.
 * Carries the result of a previously invoked function_call.
 * @internal
 */
export interface ResponsesApiFunctionCallOutput {
  type: 'function_call_output';
  id?: string;
  call_id: string;
  output: string;
  status?: string;
}

/**
 * Reasoning/thinking output item from the Responses API.
 * Produced when the model uses chain-of-thought reasoning.
 * @internal
 */
export interface ResponsesApiReasoningItem {
  type: 'reasoning';
  id: string;
  summary?: Array<{ type: 'summary_text'; text: string }>;
  /** Encrypted reasoning content (ZDR mode) */
  encrypted_content?: string;
  status?: 'completed' | 'in_progress';
}

/**
 * @internal
 */
export type ResponsesApiOutputEvent =
  | ResponsesApiFileSearchResult
  | ResponsesApiMcpCall
  | ResponsesApiMessage
  | ResponsesApiFunctionCall
  | ResponsesApiFunctionCallOutput
  | ResponsesApiReasoningItem;

/**
 * Content block for multi-modal function call output.
 * Matches OpenAI's ResponseInputContent — currently only text is used
 * by the multi-agent runner, but the type supports future expansion.
 * @internal
 */
export interface ResponseInputContent {
  type: 'input_text' | 'input_image' | 'input_file';
  text?: string;
  [key: string]: unknown;
}

/**
 * Input item for sending function call results back to the Responses API.
 * Used by the multi-agent runner to acknowledge handoffs and return
 * agent-as-tool results.
 *
 * `output` supports both a plain string and an array of content blocks
 * per the OpenAI Responses API spec. Current usage is string-only;
 * the wider type enables future multi-modal agent-as-tool patterns.
 * @internal
 */
export interface FunctionCallOutputItem {
  type: 'function_call_output';
  call_id: string;
  output: string | ResponseInputContent[];
}

/**
 * Message input item for sending user/system/assistant messages via input array.
 * @internal
 */
export interface MessageInputItem {
  type: 'message';
  role: 'user' | 'system' | 'developer' | 'assistant';
  content: string | ResponseInputContent[];
}

/**
 * Item reference for including a previous response item by ID.
 * @internal
 */
export interface ItemReferenceInputItem {
  type: 'item_reference';
  id: string;
}

/**
 * Union of input item types that can be sent as array elements in the
 * Responses API `input` field.
 *
 * Includes the actively-used FunctionCallOutputItem as well as
 * message, item_reference, and function_call types for completeness.
 * @internal
 */
export type ResponsesApiInputItem =
  | FunctionCallOutputItem
  | MessageInputItem
  | ItemReferenceInputItem;

/**
 * File search tool format for Responses API
 * @internal
 */
export interface ResponsesApiFileSearchTool {
  type: 'file_search';
  vector_store_ids: string[];
  /** Maximum number of chunks returned by file_search (1-50, Llama Stack default: 10) */
  max_num_results?: number;
  /** Ranking/filtering options for search results */
  ranking_options?: {
    /** Ranker strategy: 'weighted', 'rrf', or 'neural' */
    ranker?: string;
    /** Minimum relevance score (0.0-1.0); chunks below this are dropped */
    score_threshold?: number;
  };
}

/**
 * MCP tool format for Responses API
 * @internal
 */
export interface ResponsesApiMcpTool {
  type: 'mcp';
  server_url: string;
  server_label: string;
  /** HITL approval requirement - maps directly to Llama Stack API */
  require_approval:
    | 'never'
    | 'always'
    | { always?: string[]; never?: string[] };
  headers?: Record<string, string>;
  /** Restrict which tools from this server are exposed to the model.
   *  Llama Stack accepts plain string[] or AllowedToolsFilter { tool_names }. */
  allowed_tools?: string[];
}

/**
 * Function tool format for Responses API
 * Defines a custom function the model can call
 * @internal
 */
export interface ResponsesApiFunctionTool {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict?: boolean;
}

/**
 * Web search tool format for Responses API
 * Built-in tool for searching the web
 * @internal
 */
export interface ResponsesApiWebSearchTool {
  type: 'web_search';
  /** Location context for search results */
  user_location?: {
    type: 'approximate';
    city?: string;
    region?: string;
    country?: string;
    timezone?: string;
  };
  /** Limit on number of search results */
  search_context_size?: 'low' | 'medium' | 'high';
}

/**
 * Code interpreter tool format for Responses API
 * Built-in tool for executing Python code
 * @internal
 */
export interface ResponsesApiCodeInterpreterTool {
  type: 'code_interpreter';
  /** Container to run the code in */
  container?: {
    type: 'auto';
    file_ids?: string[];
  };
}

/**
 * Image generation tool format for Responses API
 * Built-in tool for generating images
 * @internal
 */
export interface ResponsesApiImageGenerationTool {
  type: 'image_generation';
  /** Model to use for image generation */
  model?: string;
  /** Quality setting */
  quality?: 'low' | 'medium' | 'high' | 'auto';
  /** Image size */
  size?: '1024x1024' | '1024x1536' | '1536x1024' | 'auto';
  /** Whether to produce a partial image at each step (streaming) */
  partial_images?: number;
}

/**
 * Union type for all Responses API tools
 * @internal
 */
export type ResponsesApiTool =
  | ResponsesApiFileSearchTool
  | ResponsesApiMcpTool
  | ResponsesApiFunctionTool
  | ResponsesApiWebSearchTool
  | ResponsesApiCodeInterpreterTool
  | ResponsesApiImageGenerationTool;
