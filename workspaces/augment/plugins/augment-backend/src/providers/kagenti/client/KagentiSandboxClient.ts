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

import type { KagentiApiClient } from './KagentiApiClient';
import type {
  SandboxSessionListResponse,
  SandboxSessionDetailResponse,
  SessionChainResponse,
  SandboxChatRequest,
  SandboxChatResponse,
  SandboxCreateRequest,
  SandboxCreateResponse,
  RenameRequest,
  VisibilityRequest,
  CleanupResponse,
  SandboxAgentInfoResponse,
  DirectoryListing,
  FileContent,
  PodStorageStats,
  SidecarResponse,
  EnableSidecarRequest,
  SidecarConfigUpdateRequest,
  SessionTokenUsageResponse,
  SessionTreeUsageResponse,
  PaginatedEventsResponse,
  PaginatedTasksResponse,
} from './types';
import { SANDBOX_PREFIX as P, encodePathSegment as e } from './utils';

/**
 * Client for Kagenti sandbox feature-flagged endpoints.
 * Only instantiated when the Kagenti server reports sandbox=true.
 */
export class KagentiSandboxClient {
  constructor(private readonly api: KagentiApiClient) {}

  // -- Sessions ---------------------------------------------------------------

  async listSessions(
    namespace: string,
    opts?: {
      limit?: number;
      offset?: number;
      search?: string;
      agentName?: string;
    },
  ): Promise<SandboxSessionListResponse> {
    const params = new URLSearchParams();
    if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
    if (opts?.offset !== undefined) params.set('offset', String(opts.offset));
    if (opts?.search) params.set('search', opts.search);
    if (opts?.agentName) params.set('agent_name', opts.agentName);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.api.request('GET', `${P}/${e(namespace)}/sessions${qs}`);
  }

  async getSession(
    namespace: string,
    contextId: string,
  ): Promise<SandboxSessionDetailResponse> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/sessions/${e(contextId)}`,
    );
  }

  async getSessionChain(
    namespace: string,
    contextId: string,
  ): Promise<SessionChainResponse> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/chain`,
    );
  }

  async getSessionHistory(
    namespace: string,
    contextId: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/history`,
    );
  }

  async deleteSession(namespace: string, contextId: string): Promise<void> {
    await this.api.request(
      'DELETE',
      `${P}/${e(namespace)}/sessions/${e(contextId)}`,
    );
  }

  async renameSession(
    namespace: string,
    contextId: string,
    title: string,
  ): Promise<{ title: string }> {
    const body: RenameRequest = { title };
    return this.api.request(
      'PUT',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/rename`,
      body,
    );
  }

  async killSession(
    namespace: string,
    contextId: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'POST',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/kill`,
    );
  }

  async approveSession(
    namespace: string,
    contextId: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'POST',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/approve`,
    );
  }

  async denySession(
    namespace: string,
    contextId: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'POST',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/deny`,
    );
  }

  async setVisibility(
    namespace: string,
    contextId: string,
    visibility: 'private' | 'namespace',
  ): Promise<{ visibility: string }> {
    const body: VisibilityRequest = { visibility };
    return this.api.request(
      'PUT',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/visibility`,
      body,
    );
  }

  async cleanupSessions(
    namespace: string,
    ttlMinutes?: number,
  ): Promise<CleanupResponse> {
    const qs = ttlMinutes !== undefined ? `?ttl_minutes=${ttlMinutes}` : '';
    return this.api.request('POST', `${P}/${e(namespace)}/cleanup${qs}`);
  }

  // -- Sandbox Agents ---------------------------------------------------------

  async listSandboxAgents(
    namespace: string,
  ): Promise<SandboxAgentInfoResponse[]> {
    return this.api.request('GET', `${P}/${e(namespace)}/agents`);
  }

  async getSandboxAgentCard(
    namespace: string,
    agentName: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/agent-card/${e(agentName)}`,
    );
  }

  async getAgentPodStatus(
    namespace: string,
    agentName: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/agents/${e(agentName)}/pod-status`,
    );
  }

  async getPodMetrics(
    namespace: string,
    agentName: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/pods/${e(agentName)}/metrics`,
    );
  }

  async getPodEvents(
    namespace: string,
    agentName: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/pods/${e(agentName)}/events`,
    );
  }

  // -- Sandbox Chat -----------------------------------------------------------

  async sandboxChat(
    namespace: string,
    message: string,
    opts?: { sessionId?: string; agentName?: string; skill?: string },
  ): Promise<SandboxChatResponse> {
    const body: SandboxChatRequest = {
      message,
      session_id: opts?.sessionId,
      agent_name: opts?.agentName,
      skill: opts?.skill,
    };
    return this.api.request('POST', `${P}/${e(namespace)}/chat`, body);
  }

  async sandboxChatStream(
    namespace: string,
    message: string,
    opts:
      | { sessionId?: string; agentName?: string; skill?: string }
      | undefined,
    onLine: (line: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const body: SandboxChatRequest = {
      message,
      session_id: opts?.sessionId,
      agent_name: opts?.agentName,
      skill: opts?.skill,
    };
    return this.api.streamRequest(
      `${P}/${e(namespace)}/chat/stream`,
      body,
      onLine,
      signal,
    );
  }

  async subscribeSession(
    namespace: string,
    sessionId: string,
    onLine: (line: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return this.api.streamRequest(
      `${P}/${e(namespace)}/sessions/${e(sessionId)}/subscribe`,
      {},
      onLine,
      signal,
    );
  }

  // -- Sandbox Deploy ---------------------------------------------------------

  async getSandboxDefaults(): Promise<Record<string, unknown>> {
    return this.api.request('GET', `${P}/defaults`);
  }

  async createSandbox(
    namespace: string,
    body: SandboxCreateRequest,
  ): Promise<SandboxCreateResponse> {
    return this.api.request('POST', `${P}/${e(namespace)}/create`, body);
  }

  async deleteSandbox(
    namespace: string,
    name: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request('DELETE', `${P}/${e(namespace)}/${e(name)}`);
  }

  async getSandboxConfig(
    namespace: string,
    name: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request('GET', `${P}/${e(namespace)}/${e(name)}/config`);
  }

  async updateSandbox(
    namespace: string,
    name: string,
    body: SandboxCreateRequest,
  ): Promise<SandboxCreateResponse> {
    return this.api.request('PUT', `${P}/${e(namespace)}/${e(name)}`, body);
  }

  // -- Files ------------------------------------------------------------------

  async browseFiles(
    namespace: string,
    agentName: string,
    path = '/',
  ): Promise<DirectoryListing | FileContent> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/files/${e(agentName)}?path=${e(path)}`,
    );
  }

  async listDirectory(
    namespace: string,
    agentName: string,
    path = '/',
  ): Promise<DirectoryListing> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/files/${e(agentName)}/list?path=${e(path)}`,
    );
  }

  async getFileContent(
    namespace: string,
    agentName: string,
    path: string,
  ): Promise<FileContent> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/files/${e(agentName)}/content?path=${e(path)}`,
    );
  }

  async browseContextFiles(
    namespace: string,
    agentName: string,
    contextId: string,
    path = '/',
  ): Promise<DirectoryListing | FileContent> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/files/${e(agentName)}/${e(contextId)}?path=${e(path)}`,
    );
  }

  async getStorageStats(
    namespace: string,
    agentName: string,
  ): Promise<PodStorageStats> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/stats/${e(agentName)}`,
    );
  }

  // -- Sidecars ---------------------------------------------------------------

  async listSidecars(
    namespace: string,
    contextId: string,
  ): Promise<SidecarResponse[]> {
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars`,
    );
  }

  async enableSidecar(
    namespace: string,
    contextId: string,
    sidecarType: string,
    opts?: EnableSidecarRequest,
  ): Promise<SidecarResponse> {
    return this.api.request(
      'POST',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/enable`,
      opts,
    );
  }

  async disableSidecar(
    namespace: string,
    contextId: string,
    sidecarType: string,
  ): Promise<{ status: string; sidecar_type: string }> {
    return this.api.request(
      'POST',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/disable`,
    );
  }

  async updateSidecarConfig(
    namespace: string,
    contextId: string,
    sidecarType: string,
    config: SidecarConfigUpdateRequest,
  ): Promise<SidecarResponse> {
    return this.api.request(
      'PUT',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/config`,
      config,
    );
  }

  async resetSidecar(
    namespace: string,
    contextId: string,
    sidecarType: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'POST',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/reset`,
    );
  }

  async streamObservations(
    namespace: string,
    contextId: string,
    sidecarType: string,
    onLine: (line: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return this.api.streamRequest(
      `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/observations`,
      {},
      onLine,
      signal,
    );
  }

  async approveSidecar(
    namespace: string,
    contextId: string,
    sidecarType: string,
    msgId: string,
  ): Promise<{ status: string; id: string }> {
    return this.api.request(
      'POST',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/approve/${e(msgId)}`,
    );
  }

  async denySidecar(
    namespace: string,
    contextId: string,
    sidecarType: string,
    msgId: string,
  ): Promise<{ status: string; id: string }> {
    return this.api.request(
      'POST',
      `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/deny/${e(msgId)}`,
    );
  }

  // -- Token Usage ------------------------------------------------------------

  async getSessionTokenUsage(
    contextId: string,
  ): Promise<SessionTokenUsageResponse> {
    return this.api.request(
      'GET',
      `/api/v1/token-usage/sessions/${e(contextId)}`,
    );
  }

  async getSessionTreeUsage(
    contextId: string,
  ): Promise<SessionTreeUsageResponse> {
    return this.api.request(
      'GET',
      `/api/v1/token-usage/sessions/${e(contextId)}/tree`,
    );
  }

  // -- Events -----------------------------------------------------------------

  async getEvents(
    namespace: string,
    contextId: string,
    opts?: { taskId?: string; fromIndex?: number; limit?: number },
  ): Promise<PaginatedEventsResponse> {
    const params = new URLSearchParams();
    params.set('context_id', contextId);
    if (opts?.taskId) params.set('task_id', opts.taskId);
    if (opts?.fromIndex !== undefined)
      params.set('from_index', String(opts.fromIndex));
    if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/events?${params.toString()}`,
    );
  }

  async getPaginatedTasks(
    namespace: string,
    contextId: string,
    opts?: { limit?: number; beforeId?: string },
  ): Promise<PaginatedTasksResponse> {
    const params = new URLSearchParams();
    params.set('context_id', contextId);
    if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
    if (opts?.beforeId) params.set('before_id', opts.beforeId);
    return this.api.request(
      'GET',
      `${P}/${e(namespace)}/tasks/paginated?${params.toString()}`,
    );
  }
}
