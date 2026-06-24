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
 * Configuration for connecting to a Llama Stack endpoint.
 *
 * @internal
 */
export interface LlamaStackConnectionConfig {
  /** Base URL of the Llama Stack API endpoint (e.g., 'http://localhost:8321'). */
  baseUrl: string;
  /** Default model identifier for inference requests. */
  defaultModel?: string;
  /** Optional API key for authenticated endpoints. */
  apiKey?: string;
}

/**
 * A model descriptor returned by the Llama Stack models API.
 *
 * @internal
 */
export interface LlamaStackModel {
  /** Model identifier. */
  identifier: string;
  /** Human-readable display name. */
  displayName?: string;
  /** Provider-specific model ID. */
  providerId?: string;
  /** Model type (e.g., 'llm', 'embedding'). */
  modelType?: string;
}

/**
 * Llama Stack Responses API request body.
 *
 * @internal
 */
export interface ResponsesApiRequest {
  /** The model to use for this request. */
  model: string;
  /** The input messages for the response. */
  input: ResponsesApiInputItem[];
  /** Whether to stream the response. */
  stream?: boolean;
  /** Optional temperature for sampling. */
  temperature?: number;
  /** Optional max output tokens. */
  max_output_tokens?: number;
  /** Optional tool definitions. */
  tools?: ResponsesApiTool[];
  /** Optional previous response ID for multi-turn conversations. */
  previous_response_id?: string;
}

/**
 * Input item for the Responses API.
 *
 * @internal
 */
export interface ResponsesApiInputItem {
  /** Role of the message author. */
  role: 'user' | 'assistant' | 'system';
  /** Message content. */
  content: string;
}

/**
 * Tool definition for the Responses API.
 *
 * @internal
 */
export interface ResponsesApiTool {
  /** Tool type (e.g., 'mcp'). */
  type: string;
  /** Tool-specific server label. */
  server_label?: string;
  /** Tool-specific server URL. */
  server_url?: string;
  /** Optional headers for the tool server. */
  headers?: Record<string, string>;
}

/**
 * Non-streaming response from the Responses API.
 *
 * @internal
 */
export interface ResponsesApiResponse {
  /** Response identifier. */
  id: string;
  /** The output items. */
  output: ResponsesApiOutputItem[];
  /** The model used. */
  model: string;
}

/**
 * An output item in a Responses API response.
 *
 * @internal
 */
export interface ResponsesApiOutputItem {
  /** Output type. */
  type: 'message' | 'mcp_call' | 'mcp_list_tools';
  /** Message content (for message type). */
  content?: ResponsesApiContentPart[];
  /** Tool call ID (for mcp_call type). */
  id?: string;
  /** Server label (for mcp_call type). */
  server_label?: string;
}

/**
 * A content part in a Responses API output message.
 *
 * @internal
 */
export interface ResponsesApiContentPart {
  /** Content type. */
  type: 'output_text';
  /** Text content. */
  text: string;
}

/**
 * A streaming event from the Responses API.
 *
 * @internal
 */
export interface ResponsesApiStreamEvent {
  /** Event type discriminator. */
  type: string;
  /** Text delta for output_text_delta events. */
  delta?: string;
  /** Item snapshot for output_added events. */
  item?: ResponsesApiOutputItem;
  /** Response object for response.completed events. */
  response?: ResponsesApiResponse;
}

/**
 * MCP server configuration for the Llama Stack provider.
 *
 * @internal
 */
export interface LlamaStackMcpServerConfig {
  /** Server label used in tool references. */
  serverLabel: string;
  /** MCP server endpoint URL. */
  serverUrl: string;
  /** Authentication type for this MCP server. */
  authType: 'bearer' | 'static-headers' | 'none';
}

/**
 * Identity-keyed client state tracked by the ClientManager.
 *
 * @internal
 */
export interface ClientState {
  /** The user identity ref. */
  userRef: string;
  /** Timestamp of last activity (ISO 8601). */
  lastActivity: string;
  /** Active session count for this identity. */
  sessionCount: number;
}
