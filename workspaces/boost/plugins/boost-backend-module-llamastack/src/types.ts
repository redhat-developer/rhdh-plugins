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
