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
