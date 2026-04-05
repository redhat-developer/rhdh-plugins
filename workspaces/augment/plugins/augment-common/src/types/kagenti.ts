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

// =============================================================================
// Kagenti Shared Types
// =============================================================================
//
// Types shared between augment-backend and augment (frontend) for the
// Kagenti provider. These represent the shapes exposed through the
// /kagenti/* routes and used in UI rendering.

/** @public */
export interface KagentiSecretKeyRef {
  name: string;
  key: string;
}

/** @public */
export interface KagentiConfigMapKeyRef {
  name: string;
  key: string;
}

/** @public */
export interface KagentiEnvVarSource {
  secretKeyRef?: KagentiSecretKeyRef;
  configMapKeyRef?: KagentiConfigMapKeyRef;
}

/** @public */
export interface KagentiEnvVar {
  name: string;
  value?: string;
  valueFrom?: KagentiEnvVarSource;
}

/** @public */
export interface KagentiServicePort {
  name?: string;
  port: number;
  targetPort?: number;
  protocol?: string;
}

// -- Resource Labels ----------------------------------------------------------

/** @public */
export interface KagentiResourceLabels {
  protocol?: string | string[];
  framework?: string;
  type?: string;
}

// -- Agents -------------------------------------------------------------------

/** @public */
export interface KagentiAgentSummary {
  name: string;
  namespace: string;
  description: string;
  status: string;
  labels: KagentiResourceLabels;
  workloadType?: string;
  createdAt?: string;
}

/** @public */
export interface KagentiAgentDetail {
  metadata: Record<string, unknown>;
  spec: Record<string, unknown>;
  status: Record<string, unknown>;
  workloadType?: string;
  readyStatus?: string;
  service?: Record<string, unknown>;
}

/** @public */
export interface KagentiAgentCardSkill {
  id?: string;
  name?: string;
  description?: string;
  examples?: string[];
}

/** @public */
export interface KagentiAgentCard {
  name: string;
  description?: string;
  version: string;
  url: string;
  streaming: boolean;
  defaultInputModes?: string[];
  skills: KagentiAgentCardSkill[];
}

/** @public */
export interface KagentiShipwrightConfig {
  buildStrategy?: string;
  dockerfile?: string;
  buildArgs?: string[];
  buildTimeout?: string;
}

/** @public */
export interface KagentiCreateAgentRequest {
  name: string;
  namespace: string;
  protocol?: string;
  framework?: string;
  envVars?: KagentiEnvVar[];
  workloadType?: 'deployment' | 'statefulset' | 'job';
  deploymentMethod?: 'source' | 'image';
  gitUrl?: string;
  gitPath?: string;
  gitBranch?: string;
  imageTag?: string;
  registryUrl?: string;
  registrySecret?: string;
  startCommand?: string;
  containerImage?: string;
  imagePullSecret?: string;
  servicePorts?: KagentiServicePort[];
  createHttpRoute?: boolean;
  authBridgeEnabled?: boolean;
  spireEnabled?: boolean;
  shipwrightConfig?: KagentiShipwrightConfig;
}

/** @public */
export interface KagentiCreateAgentResponse {
  success: boolean;
  name: string;
  namespace: string;
  message: string;
}

// -- Tools --------------------------------------------------------------------

/** @public */
export interface KagentiToolSummary {
  name: string;
  namespace: string;
  description: string;
  status: string;
  labels: KagentiResourceLabels;
  createdAt?: string;
  workloadType?: string;
}

/** @public */
export interface KagentiToolDetail {
  metadata: Record<string, unknown>;
  spec: Record<string, unknown>;
  status: Record<string, unknown>;
  workloadType?: string;
  service?: Record<string, unknown>;
}

/** @public */
export interface KagentiCreateToolRequest {
  name: string;
  namespace: string;
  protocol?: string;
  framework?: string;
  description?: string;
  envVars?: KagentiEnvVar[];
  servicePorts?: KagentiServicePort[];
  workloadType?: 'deployment' | 'statefulset';
  persistentStorage?: KagentiPersistentStorageConfig;
  deploymentMethod?: 'image' | 'source';
  containerImage?: string;
  imagePullSecret?: string;
  gitUrl?: string;
  gitRevision?: string;
  contextDir?: string;
  registryUrl?: string;
  registrySecret?: string;
  imageTag?: string;
  shipwrightConfig?: KagentiShipwrightConfig;
  createHttpRoute?: boolean;
  authBridgeEnabled?: boolean;
  spireEnabled?: boolean;
}

/** @public */
export interface KagentiCreateToolResponse {
  success: boolean;
  name: string;
  namespace: string;
  message: string;
}

/** @public */
export interface KagentiPersistentStorageConfig {
  enabled: boolean;
  size: string;
}

/** @public */
export interface KagentiFinalizeToolBuildRequest {
  protocol?: string;
  framework?: string;
  workloadType?: string;
  persistentStorage?: KagentiPersistentStorageConfig;
  envVars?: KagentiEnvVar[];
  servicePorts?: KagentiServicePort[];
  createHttpRoute?: boolean;
  authBridgeEnabled?: boolean;
  spireEnabled?: boolean;
  imagePullSecret?: string;
}

/** @public */
export interface KagentiMcpInvokeResponse {
  result: unknown;
}

/** @public */
export interface KagentiMcpToolSchema {
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
}

// -- Config / Platform --------------------------------------------------------

/** @public */
export interface KagentiFeatureFlags {
  sandbox: boolean;
  integrations: boolean;
  triggers: boolean;
}

/** @public */
export interface KagentiDashboardConfig {
  traces?: string;
  network?: string;
  mcpInspector?: string;
  mcpProxy?: string;
  keycloakConsole?: string;
  domainName?: string;
}

/**
 * Kagenti server's user-facing SSO / Keycloak configuration.
 *
 * **This is NOT the Backstage service credentials** configured in
 * `augment.kagenti.auth` (which uses OAuth2 client-credentials grant
 * for backend-to-Kagenti API authentication). This type represents
 * the Kagenti server's own authentication settings for end users,
 * as returned by the `GET /api/v1/auth/config` endpoint.
 *
 * @public
 */
export interface KagentiAuthConfig {
  enabled: boolean;
  keycloak_url?: string;
  realm?: string;
  client_id?: string;
  redirect_uri?: string;
}

// -- Shipwright / Builds ------------------------------------------------------

/** @public */
export interface KagentiBuildListItem {
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

/** @public */
export interface KagentiResourceConfigFromBuild {
  protocol?: string;
  framework?: string;
  createHttpRoute?: boolean;
  registrySecret?: string;
  envVars?: KagentiEnvVar[];
  servicePorts?: KagentiServicePort[];
}

/** @public */
export interface KagentiBuildInfo {
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
  agentConfig?: KagentiResourceConfigFromBuild;
  toolConfig?: KagentiResourceConfigFromBuild;
}

/** @public */
export interface KagentiBuildStrategy {
  name: string;
  description?: string;
}

/** @public */
export interface KagentiRouteStatus {
  hasRoute: boolean;
  /** Present when the API exposes a public URL for the route. */
  url?: string;
  /** Additional fields returned by the Kagenti API (e.g. ready, status). */
  [key: string]: unknown;
}

/** @public */
export interface KagentiTriggerBuildRunResponse {
  success: boolean;
  buildRunName: string;
  namespace: string;
  buildName: string;
  message?: string;
}

// -- Migration ----------------------------------------------------------------

/** @public */
export interface KagentiMigratableAgent {
  name: string;
  namespace: string;
  status: string;
  has_deployment: boolean;
  labels: KagentiResourceLabels;
  description?: string;
}

/** @public */
export interface KagentiMigrateAgentResponse {
  success: boolean;
  migrated: boolean;
  name: string;
  namespace: string;
  message: string;
  deployment_created: boolean;
  service_created: boolean;
  agent_crd_deleted: boolean;
}

/** @public */
export interface KagentiMigrateAllResponse {
  namespace: string;
  dry_run: boolean;
  delete_old: boolean;
  total: number;
  migrated: unknown[];
  skipped: unknown[];
  failed: unknown[];
}

// -- Sandbox ------------------------------------------------------------------

/** @public */
export interface KagentiSandboxSession {
  contextId: string;
  agentName?: string;
  status: string;
  title?: string;
  visibility?: 'private' | 'namespace';
  createdAt?: string;
  updatedAt?: string;
}

/** @public */
export interface KagentiSandboxAgentInfo {
  name: string;
  namespace: string;
  sessionCount?: number;
  [key: string]: unknown;
}

/** @public */
export interface KagentiSandboxCreateRequest {
  [key: string]: unknown;
}

// -- Sidecars -----------------------------------------------------------------

/** @public */
export interface KagentiSidecar {
  sidecarType: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

// -- Token Usage --------------------------------------------------------------

/** @public */
export interface KagentiSessionTokenUsage {
  contextId: string;
  totalTokens?: number;
  totalCost?: number;
  models?: Array<{ model: string; tokens: number; cost?: number }>;
}

// -- Integrations -------------------------------------------------------------

/** @public */
export interface KagentiIntegration {
  name: string;
  namespace: string;
  conditions?: Array<{ type: string; status: string; message?: string }>;
  [key: string]: unknown;
}

/** @public */
export interface KagentiCreateIntegrationRequest {
  name: string;
  namespace: string;
  [key: string]: unknown;
}

// -- LLM Keys / Teams ---------------------------------------------------------

/** @public */
export interface KagentiLlmTeam {
  teamId: string;
  namespace: string;
  [key: string]: unknown;
}

/** @public */
export interface KagentiLlmKey {
  alias?: string;
  agent?: string;
  namespace?: string;
  [key: string]: unknown;
}

/** @public */
export interface KagentiCreateTeamRequest {
  namespace: string;
  [key: string]: unknown;
}

/** @public */
export interface KagentiCreateKeyRequest {
  namespace: string;
  agentName: string;
  [key: string]: unknown;
}

// -- Triggers -----------------------------------------------------------------

/** @public */
export interface KagentiTriggerRequest {
  type: 'cron' | 'webhook' | 'alert';
  namespace: string;
  skill?: string;
  schedule?: string;
  ttl_hours?: number;
  [key: string]: unknown;
}
