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
 * An A2A agent card describing a remote agent's capabilities.
 *
 * @internal
 */
export interface AgentCard {
  /** Unique agent identifier within the Kagenti namespace. */
  id: string;
  /** Human-readable agent name. */
  name: string;
  /** Optional description of the agent. */
  description?: string;
  /** The A2A endpoint URL for this agent. */
  url: string;
  /** Capabilities declared by the agent. */
  capabilities?: AgentCardCapabilities;
  /** Namespace the agent belongs to. */
  namespace?: string;
  /** Identity of the user who created/registered the agent. */
  createdBy?: string;
  /** Lifecycle stage of the agent. */
  lifecycleStage?: 'draft' | 'pending' | 'published' | 'archived';
}

/**
 * Capability declarations from an A2A agent card.
 *
 * @internal
 */
export interface AgentCardCapabilities {
  /** Whether the agent supports streaming responses. */
  streaming?: boolean;
  /** Whether the agent supports tool use. */
  tools?: boolean;
  /** Whether the agent supports multi-turn conversations. */
  multiTurn?: boolean;
}

/**
 * A Kagenti tool (K8s workload) with lifecycle governance.
 *
 * @internal
 */
export interface KagentiTool {
  /** Unique tool identifier. */
  id: string;
  /** Human-readable tool name. */
  name: string;
  /** Optional description of the tool. */
  description?: string;
  /** Namespace the tool belongs to. */
  namespace?: string;
  /** Identity of the user who created/registered the tool. */
  createdBy?: string;
  /** Lifecycle stage of the tool. */
  lifecycleStage?: 'draft' | 'pending' | 'published' | 'archived';
}

/**
 * Configuration for connecting to a Kagenti endpoint for entity discovery.
 *
 * @internal
 */
export interface KagentiEntityProviderConfig {
  /** Base URL of the Kagenti A2A gateway. */
  baseUrl: string;
  /** Namespaces to scan for agents and tools. */
  namespaces?: string[];
  /** Upstream refresh interval in seconds for agent entities (default: 300 = 5m). */
  agentRefreshIntervalSeconds?: number;
  /** Upstream refresh interval in seconds for tool entities (default: 300 = 5m). */
  toolRefreshIntervalSeconds?: number;
  /** Optional Keycloak service-account auth configuration. */
  auth?: {
    /** Keycloak token endpoint URL. */
    tokenEndpoint: string;
    /** OAuth2 client ID. */
    clientId: string;
    /** OAuth2 client secret. */
    clientSecret: string;
  };
}
