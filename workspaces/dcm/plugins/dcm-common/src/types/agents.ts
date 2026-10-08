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
 * DCM Agents API types — derived from Agent API OpenAPI spec (v1alpha1).
 *
 * @public
 */

/** Relative cost weight for placement decisions. */
export type AgentCost =
  | 'low'
  | 'medium-low'
  | 'medium'
  | 'medium-high'
  | 'high';

/** Current health status of a registered agent (readOnly). */
export type AgentHealthStatus = 'ready' | 'congested' | 'unavailable';

/** A registered environment agent. */
export interface Agent {
  /** Server-generated unique identifier (readOnly). */
  agent_id?: string;
  /** Unique name of the agent. */
  name: string;
  /** Environment label for the agent. */
  environment: string;
  /** List of service types this agent can provide. */
  service_types: string[];
  /** Relative cost weight for placement decisions. */
  cost: AgentCost;
  /** NATS topic name for this agent (must start with dcm.agent.). */
  topic_name: string;
  /** Current health status (readOnly). */
  health_status?: AgentHealthStatus;
  /** Timestamp of last heartbeat received (readOnly). */
  last_heartbeat?: string;
  /** Timestamp when the agent was first registered (readOnly). */
  create_time?: string;
  /** Timestamp when the agent was last updated (readOnly). */
  update_time?: string;
}

/** Request body for registering or re-registering an agent. */
export interface AgentRegistrationRequest {
  name: string;
  environment: string;
  service_types: string[];
  cost: AgentCost;
  /** NATS topic name — must start with dcm.agent. */
  topic_name: string;
}

/** Paginated list of {@link Agent} resources. */
export interface AgentList {
  agents?: Agent[];
  next_page_token?: string;
}

/** Request body for an agent heartbeat. */
export interface HeartbeatRequest {
  /** Number of unprocessed messages in the agent's NATS consumer. */
  consumer_lag: number;
  /** Timestamp of this heartbeat (used for monotonicity check). */
  timestamp: string;
}
