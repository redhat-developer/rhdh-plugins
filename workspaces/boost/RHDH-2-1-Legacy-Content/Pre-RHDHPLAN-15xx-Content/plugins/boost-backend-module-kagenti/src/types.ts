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
 * Configuration for connecting to a Kagenti (A2A) endpoint.
 *
 * @internal
 */
export interface KagentiConnectionConfig {
  /** Base URL of the Kagenti A2A gateway (e.g., 'http://localhost:8080'). */
  baseUrl: string;
  /** Default agent identifier to use when none is specified. */
  defaultAgent?: string;
}

/**
 * Configuration for Keycloak authentication used by Kagenti.
 *
 * @internal
 */
export interface KagentiKeycloakConfig {
  /** Keycloak server URL (e.g., 'https://keycloak.example.com'). */
  serverUrl: string;
  /** Keycloak realm name. */
  realm: string;
  /** OAuth2 client ID for the Kagenti integration. */
  clientId: string;
  /** OAuth2 client secret for the Kagenti integration. */
  clientSecret: string;
}

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
 * Kagenti namespace model for scoping agents and tools.
 *
 * @internal
 */
export interface KagentiNamespace {
  /** Unique namespace identifier. */
  id: string;
  /** Human-readable namespace name. */
  name: string;
  /** Optional description. */
  description?: string;
}

/**
 * A2A protocol task request sent to a Kagenti agent.
 *
 * @internal
 */
export interface A2ATaskRequest {
  /** The task identifier. */
  id: string;
  /** The agent to send the task to. */
  agentId: string;
  /** The input message content. */
  message: A2AMessage;
  /** Optional session ID for multi-turn conversations. */
  sessionId?: string;
}

/**
 * A message in the A2A protocol.
 *
 * @internal
 */
export interface A2AMessage {
  /** Role of the message author. */
  role: 'user' | 'agent';
  /** Message parts. */
  parts: A2AMessagePart[];
}

/**
 * A part of an A2A message.
 *
 * @internal
 */
export interface A2AMessagePart {
  /** Part type discriminator. */
  type: 'text';
  /** Text content. */
  text: string;
}

/**
 * A2A protocol task response from a Kagenti agent.
 *
 * @internal
 */
export interface A2ATaskResponse {
  /** The task identifier. */
  id: string;
  /** The task status. */
  status: A2ATaskStatus;
  /** The agent's response message. */
  message?: A2AMessage;
  /** Session ID for multi-turn tracking. */
  sessionId?: string;
}

/**
 * Status of an A2A task.
 *
 * @internal
 */
export interface A2ATaskStatus {
  /** Current state of the task. */
  state: 'submitted' | 'working' | 'completed' | 'failed' | 'canceled';
  /** Optional status message. */
  message?: string;
}

/**
 * A2A streaming event from a Kagenti agent.
 *
 * @internal
 */
export interface A2AStreamEvent {
  /** Event type discriminator. */
  type: string;
  /** The task identifier. */
  taskId: string;
  /** Text delta for incremental text events. */
  delta?: string;
  /** Full message for completion events. */
  message?: A2AMessage;
  /** Task status update. */
  status?: A2ATaskStatus;
}
