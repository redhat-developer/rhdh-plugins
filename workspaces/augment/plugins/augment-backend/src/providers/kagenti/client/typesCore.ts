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

import type { AgentCard as AdkAgentCard } from '@kagenti/adk';
import type {
  KagentiResourceLabels,
  KagentiAgentSummary,
  KagentiAgentDetail,
  KagentiFeatureFlags,
  KagentiDashboardConfig,
  KagentiAuthConfig,
  KagentiCreateAgentRequest,
  KagentiCreateAgentResponse,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

// -- Health -------------------------------------------------------------------

export interface HealthResponse {
  status: string;
}

// -- Auth ---------------------------------------------------------------------

export type AuthConfigResponse = KagentiAuthConfig;

export interface AuthStatusResponse {
  enabled: boolean;
  authenticated: boolean;
  keycloak_url?: string;
  realm?: string;
  client_id?: string;
}

export interface UserInfoResponse {
  username: string;
  email?: string;
  roles: string[];
  authenticated: boolean;
}

// -- Config -------------------------------------------------------------------

export type FeatureFlagsResponse = KagentiFeatureFlags;

export type DashboardConfigResponse = KagentiDashboardConfig;

// -- Namespaces ---------------------------------------------------------------

export interface NamespaceListResponse {
  namespaces: string[];
}

// -- Chat ---------------------------------------------------------------------

export interface ChatRequest {
  message: string;
  session_id?: string;
  metadata?: Record<string, unknown>;
  parts?: Array<Record<string, unknown>>;
  contextId?: string;
}

export interface ChatResponse {
  content: string;
  session_id: string;
  is_complete: boolean;
}

export type AgentCardResponse = AdkAgentCard;

// -- Agents -------------------------------------------------------------------

export type ResourceLabels = KagentiResourceLabels;

export type AgentSummary = KagentiAgentSummary;

export interface AgentListResponse {
  items: AgentSummary[];
}

export type AgentDetailResponse = KagentiAgentDetail;

export interface RouteStatusResponse {
  hasRoute: boolean;
}

export type CreateAgentRequest = KagentiCreateAgentRequest;

export type CreateAgentResponse = KagentiCreateAgentResponse;

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface MigratableAgentInfo {
  name: string;
  namespace: string;
  status: string;
  has_deployment: boolean;
  labels: ResourceLabels;
  description?: string;
}

export interface ListMigratableAgentsResponse {
  agents: MigratableAgentInfo[];
  total: number;
  already_migrated: number;
}

export interface MigrateAgentRequest {
  delete_old?: boolean;
}

export interface MigrateAgentResponse {
  success: boolean;
  migrated: boolean;
  name: string;
  namespace: string;
  message: string;
  deployment_created: boolean;
  service_created: boolean;
  agent_crd_deleted: boolean;
}

export interface MigrateAllResponse {
  namespace: string;
  dry_run: boolean;
  delete_old: boolean;
  total: number;
  migrated: Array<Record<string, unknown>>;
  skipped: Array<Record<string, unknown>>;
  failed: Array<Record<string, unknown>>;
}

// -- Namespaces ---------------------------------------------------------------

export interface ParseEnvRequest {
  content: string;
}

export interface ParseEnvResponse {
  envVars: Array<Record<string, unknown>>;
  warnings?: string[];
}

export interface FetchEnvUrlRequest {
  url: string;
}

export interface FetchEnvUrlResponse {
  content: string;
  url: string;
}

// -- Models -------------------------------------------------------------------

export interface LlmModelResponse {
  id: string;
  name?: string;
  [key: string]: unknown;
}

// -- LLM Keys ----------------------------------------------------------------

export interface TeamCreateRequest {
  namespace: string;
  [key: string]: unknown;
}

export interface TeamResponse {
  teamId: string;
  namespace: string;
  [key: string]: unknown;
}

export interface KeyCreateRequest {
  namespace: string;
  agentName: string;
  [key: string]: unknown;
}

export interface KeyInfo {
  alias?: string;
  agent?: string;
  namespace?: string;
  [key: string]: unknown;
}

// -- Integrations -------------------------------------------------------------

export interface IntegrationListResponse {
  [key: string]: unknown;
}

export interface CreateIntegrationRequest {
  name: string;
  namespace: string;
  [key: string]: unknown;
}

// -- Triggers -----------------------------------------------------------------

export interface TriggerRequest {
  type: 'cron' | 'webhook' | 'alert';
  namespace: string;
  skill?: string;
  schedule?: string;
  ttl_hours?: number;
  [key: string]: unknown;
}

export interface TriggerResponse {
  sandbox_claim?: string;
  namespace: string;
  [key: string]: unknown;
}

// -- Contexts API -------------------------------------------------------------

export interface ContextHistoryItem {
  id: string;
  context_id: string;
  created_at: string;
  kind: 'artifact' | 'message';
  data: ContextHistoryMessage | ContextHistoryArtifact;
}

export interface ContextHistoryMessage {
  role: string;
  parts: Array<{
    type?: string;
    text?: string;
    [key: string]: unknown;
  }>;
  metadata?: Record<string, unknown>;
  referenceTaskIds?: string[];
}

export interface ContextHistoryArtifact {
  artifactId: string;
  name?: string;
  description?: string;
  parts: Array<{
    type?: string;
    text?: string;
    [key: string]: unknown;
  }>;
  metadata?: Record<string, unknown>;
}

export interface ContextHistoryListResponse {
  total_count: number;
  has_more: boolean;
  next_page_token: string | null;
  items: ContextHistoryItem[];
}

// -- Keycloak Token -----------------------------------------------------------

export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

// -- Token Usage --------------------------------------------------------------

export interface SessionTokenUsageResponse {
  [key: string]: unknown;
}

export interface SessionTreeUsageResponse {
  [key: string]: unknown;
}

// -- Events -------------------------------------------------------------------

export interface PaginatedEventsResponse {
  [key: string]: unknown;
}

export interface PaginatedTasksResponse {
  [key: string]: unknown;
}
