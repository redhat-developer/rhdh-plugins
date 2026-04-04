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
  KagentiToolSummary,
  KagentiToolDetail,
  KagentiCreateToolRequest,
  KagentiEnvVar,
  KagentiServicePort,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

// =============================================================================
// Kagenti API Request / Response Types
// =============================================================================
//
// TypeScript representations of all Kagenti REST API request/response payloads.
// Organized by API domain. Where identical to augment-common, we re-export
// common types under backend-friendly names to avoid duplication.

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

/**
 * Agent card response from the Kagenti API.
 * Uses the official A2A AgentCard type from @kagenti/adk which includes
 * capabilities, extensions, security schemes, skills, and more.
 */
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

export interface CreateAgentResponse {
  success: boolean;
  name: string;
  namespace: string;
  message: string;
}

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

export interface ClusterBuildStrategiesResponse {
  strategies: Array<{ name: string; description?: string }>;
}

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

export interface FinalizeShipwrightBuildRequest {
  protocol?: string;
  framework?: string;
  envVars?: KagentiEnvVar[];
  servicePorts?: KagentiServicePort[];
  createHttpRoute?: boolean;
  authBridgeEnabled?: boolean;
  imagePullSecret?: string;
}

// -- Shipwright Builds --------------------------------------------------------

export interface ShipwrightBuildListItem {
  name: string;
  namespace: string;
  resourceType?: string;
  registered: boolean;
  strategy?: string;
  gitUrl?: string;
  gitRevision?: string;
  contextDir?: string;
  outputImage?: string;
  creationTimestamp?: string;
}

export interface ShipwrightBuildListResponse {
  items: ShipwrightBuildListItem[];
}

export interface ShipwrightBuildStatusResponse {
  name: string;
  namespace: string;
  registered: boolean;
  reason?: string;
  message?: string;
}

export interface BuildStatusCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface ShipwrightBuildRunStatusResponse {
  name: string;
  namespace: string;
  buildName: string;
  phase: string;
  startTime?: string;
  completionTime?: string;
  outputImage?: string;
  outputDigest?: string;
  failureMessage?: string;
  conditions: BuildStatusCondition[];
}

export interface ResourceConfigFromBuild {
  protocol?: string;
  framework?: string;
  createHttpRoute?: boolean;
  registrySecret?: string;
  envVars?: KagentiEnvVar[];
  servicePorts?: KagentiServicePort[];
}

export interface ShipwrightBuildInfoResponse {
  name: string;
  namespace: string;
  buildRegistered: boolean;
  buildReason?: string;
  buildMessage?: string;
  outputImage: string;
  strategy: string;
  gitUrl: string;
  gitRevision: string;
  contextDir: string;
  hasBuildRun: boolean;
  buildRunName?: string;
  buildRunPhase?: string;
  buildRunStartTime?: string;
  buildRunCompletionTime?: string;
  buildRunOutputImage?: string;
  buildRunOutputDigest?: string;
  buildRunFailureMessage?: string;
  agentConfig?: ResourceConfigFromBuild;
  toolConfig?: ResourceConfigFromBuild;
}

export interface TriggerBuildRunResponse {
  success: boolean;
  buildRunName: string;
  namespace: string;
  buildName: string;
  message?: string;
}

// -- Tools --------------------------------------------------------------------

export type ToolSummary = KagentiToolSummary;

export interface ToolListResponse {
  items: ToolSummary[];
}

export type ToolDetailResponse = KagentiToolDetail;

export type CreateToolRequest = KagentiCreateToolRequest;

export interface CreateToolResponse {
  success: boolean;
  name: string;
  namespace: string;
  message: string;
}

export interface FinalizeToolBuildRequest {
  protocol?: string;
  framework?: string;
  workloadType?: string;
  persistentStorage?: Record<string, unknown>;
  envVars?: KagentiEnvVar[];
  servicePorts?: KagentiServicePort[];
  createHttpRoute?: boolean;
  authBridgeEnabled?: boolean;
  imagePullSecret?: string;
}

export interface MCPToolsResponse {
  tools: Array<{
    name: string;
    description?: string;
    input_schema?: Record<string, unknown>;
  }>;
}

export interface MCPInvokeRequest {
  tool_name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPInvokeResponse {
  result: unknown;
}

// -- Sandbox ------------------------------------------------------------------

export interface SandboxSessionListResponse {
  items: Array<{
    contextId: string;
    agentName?: string;
    status: string;
    title?: string;
    visibility?: 'private' | 'namespace';
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  }>;
  total?: number;
  limit?: number;
  offset?: number;
}

export interface SandboxSessionDetailResponse {
  [key: string]: unknown;
}

export interface SandboxChatRequest {
  message: string;
  session_id?: string;
  agent_name?: string;
  skill?: string;
}

export interface SandboxChatResponse {
  content: string;
  context_id: string;
  task_id?: string;
  status: string;
}

export interface SandboxCreateRequest {
  [key: string]: unknown;
}

export interface SandboxCreateResponse {
  [key: string]: unknown;
}

export interface SandboxAgentInfoResponse {
  name: string;
  namespace: string;
  sessionCount?: number;
  [key: string]: unknown;
}

export interface RenameRequest {
  title: string;
}

export interface VisibilityRequest {
  visibility: 'private' | 'namespace';
}

export interface CleanupResponse {
  cleaned: number;
}

export interface SessionChainResponse {
  [key: string]: unknown;
}

export interface DirectoryListing {
  [key: string]: unknown;
}

export interface FileContent {
  [key: string]: unknown;
}

export interface PodStorageStats {
  [key: string]: unknown;
}

// -- Sidecars -----------------------------------------------------------------

export interface SidecarResponse {
  sidecarType: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EnableSidecarRequest {
  auto_approve?: boolean;
  config?: Record<string, unknown>;
  agent_name?: string;
}

export interface SidecarConfigUpdateRequest {
  interval?: number;
  counters?: Record<string, unknown>;
  thresholds?: Record<string, unknown>;
  auto_approve?: boolean;
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

// -- Keycloak Token -----------------------------------------------------------

export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}
