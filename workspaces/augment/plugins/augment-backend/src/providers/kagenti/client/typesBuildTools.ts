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

import type {
  KagentiToolSummary,
  KagentiToolDetail,
  KagentiCreateToolRequest,
  KagentiCreateToolResponse,
  KagentiFinalizeToolBuildRequest,
  KagentiMcpInvokeResponse,
  KagentiEnvVar,
  KagentiServicePort,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

// -- Shipwright Builds --------------------------------------------------------

export interface ClusterBuildStrategiesResponse {
  strategies: Array<{ name: string; description?: string }>;
}

export interface FinalizeShipwrightBuildRequest {
  protocol?: string;
  framework?: string;
  envVars?: KagentiEnvVar[];
  servicePorts?: KagentiServicePort[];
  createHttpRoute?: boolean;
  authBridgeEnabled?: boolean;
  spireEnabled?: boolean;
  imagePullSecret?: string;
}

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

export type CreateToolResponse = KagentiCreateToolResponse;

export type FinalizeToolBuildRequest = KagentiFinalizeToolBuildRequest;

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

export type MCPInvokeResponse = KagentiMcpInvokeResponse;
