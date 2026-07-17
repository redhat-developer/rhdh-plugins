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
 * A model descriptor returned by the Llama Stack /v1/models API.
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
 * OpenAI-compatible model list response from /v1/models.
 *
 * @internal
 */
export interface LlamaStackModelListResponse {
  /** Response object type. */
  object?: string;
  /** Array of model entries. */
  data: LlamaStackModelEntry[];
}

/**
 * A single model entry in the /v1/models response.
 *
 * @internal
 */
export interface LlamaStackModelEntry {
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
 * An agent configuration from Llama Stack YAML/admin config.
 *
 * @internal
 */
export interface LlamaStackAgentConfig {
  /** Unique agent identifier. */
  id: string;
  /** Human-readable agent name. */
  name: string;
  /** Optional description. */
  description?: string;
  /** The model this agent uses. */
  model?: string;
  /** Tool identifiers the agent has access to. */
  tools?: string[];
  /** Handoff target agent IDs. */
  handoffTargets?: string[];
  /** Identity of the user who created/registered the agent. */
  createdBy?: string;
  /** Lifecycle stage of the agent. */
  lifecycleStage?: 'draft' | 'pending' | 'published' | 'archived';
}

/**
 * Configuration for connecting to a Llama Stack endpoint for entity discovery.
 *
 * @internal
 */
export interface LlamaStackEntityProviderConfig {
  /** Base URL of the Llama Stack API endpoint. */
  baseUrl: string;
  /** Optional API key for authenticated endpoints. */
  apiKey?: string;
  /** Upstream refresh interval in seconds for model entities (default: 60 = 1m). */
  modelRefreshIntervalSeconds?: number;
  /** Upstream refresh interval in seconds for agent entities (default: 300 = 5m). */
  agentRefreshIntervalSeconds?: number;
  /** Static agent configurations from YAML/admin config. */
  agents?: LlamaStackAgentConfig[];
}
