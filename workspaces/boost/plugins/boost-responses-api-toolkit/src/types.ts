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
 * Responses API request body.
 *
 * @public
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
 * @public
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
 * @public
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
 * @public
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
 * @public
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
 * @public
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
 * @public
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
