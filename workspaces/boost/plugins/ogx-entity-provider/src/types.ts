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
 * A model descriptor returned by the OGX /v1/models API.
 *
 * @internal
 */
export interface OgxModel {
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
 * OpenAI-compatible model list response from /v1/models.
 *
 * @internal
 */
export interface OgxModelListResponse {
  /** Response object type. */
  object?: string;
  /** Array of model entries. */
  data: OgxModelEntry[];
}

/**
 * A single model entry in the /v1/models response.
 *
 * @internal
 */
export interface OgxModelEntry {
  /** Model identifier. */
  id: string;
  /** Object type (always 'model'). */
  object?: string;
  /** Timestamp of creation. */
  created?: number;
  /** Owner of the model. */
  owned_by?: string;
}

/**
 * An agent configuration from OGX YAML/admin config.
 *
 * @internal
 */
export interface OgxAgentConfig {
  /** Unique agent identifier. */
  id: string;
  /** Human-readable agent name. */
  name: string;
  /** Optional version string (semver, date, or commit hash). */
  version?: string;
  /** Optional description. */
  description?: string;
  /** System prompt / instructions for the agent. */
  instructions?: string;
  /** The model this agent uses. */
  model?: string;
  /** Tool identifiers the agent has access to. */
  tools?: string[];
  /** Handoff target agent IDs. */
  handoffs?: string[];
  /** Description of when to hand off to this agent (used by router agents). */
  handoffDescription?: string;
  /** Whether this agent uses RAG retrieval. */
  enableRAG?: boolean;
  /** Identity of the user who created/registered the agent. */
  createdBy?: string;
  /** Lifecycle stage of the agent. */
  lifecycleStage?: 'draft' | 'pending' | 'published' | 'archived';
}

/**
 * Configuration for connecting to an OGX endpoint for entity discovery.
 *
 * @internal
 */
export interface OgxEntityProviderConfig {
  /** Base URL of the OGX API endpoint. */
  baseUrl: string;
  /** Optional API key for authenticated endpoints. */
  apiKey?: string;
  /** Optional version string for the model server (semver, date, or commit hash). */
  serverVersion?: string;
  /** Upstream refresh interval in seconds for model entities (default: 60 = 1m). */
  modelRefreshIntervalSeconds?: number;
  /** Upstream refresh interval in seconds for agent entities (default: 300 = 5m). */
  agentRefreshIntervalSeconds?: number;
  /** ID of the default/entry-point agent. */
  defaultAgent?: string;
  /** Maximum number of agent turns in a conversation. */
  maxAgentTurns?: number;
  /** Static agent configurations from YAML/admin config. */
  agents?: OgxAgentConfig[];
}
