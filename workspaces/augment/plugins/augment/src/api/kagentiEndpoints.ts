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
  KagentiAgentSummary,
  KagentiAgentDetail,
  KagentiAgentCard,
  KagentiCreateAgentRequest,
  KagentiToolSummary,
  KagentiToolDetail,
  KagentiCreateToolRequest,
  KagentiFeatureFlags,
  KagentiDashboardConfig,
  KagentiBuildInfo,
  KagentiBuildStrategy,
  KagentiBuildListItem,
  KagentiMigratableAgent,
  KagentiSandboxSession,
  KagentiSandboxAgentInfo,
  KagentiSandboxCreateRequest,
  KagentiSidecar,
  KagentiSessionTokenUsage,
  KagentiIntegration,
  KagentiCreateIntegrationRequest,
  KagentiLlmTeam,
  KagentiLlmKey,
  KagentiCreateTeamRequest,
  KagentiCreateKeyRequest,
  KagentiTriggerRequest,
  KagentiMcpToolSchema,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { jsonBody } from './fetchHelpers';

export interface KagentiApiDeps {
  fetchJson: <T>(path: string, init?: RequestInit) => Promise<T>;
}

const e = encodeURIComponent;

// =============================================================================
// Health & Config
// =============================================================================

export async function getHealth(
  deps: KagentiApiDeps,
): Promise<{ health: string; ready: boolean }> {
  return deps.fetchJson('/kagenti/health');
}

export async function getFeatureFlags(
  deps: KagentiApiDeps,
): Promise<KagentiFeatureFlags> {
  return deps.fetchJson('/kagenti/config/features');
}

export async function getDashboards(
  deps: KagentiApiDeps,
): Promise<KagentiDashboardConfig> {
  return deps.fetchJson('/kagenti/config/dashboards');
}

// =============================================================================
// Namespaces
// =============================================================================

export async function listNamespaces(
  deps: KagentiApiDeps,
  enabledOnly = true,
): Promise<{ namespaces: string[]; defaultNamespace?: string }> {
  const qs = enabledOnly ? '?enabled_only=true' : '';
  return deps.fetchJson(`/kagenti/namespaces${qs}`);
}

// =============================================================================
// Agents
// =============================================================================

export async function listAgents(
  deps: KagentiApiDeps,
  namespace?: string,
): Promise<{ agents: KagentiAgentSummary[] }> {
  const qs = namespace ? `?namespace=${e(namespace)}` : '';
  return deps.fetchJson(`/kagenti/agents${qs}`);
}

export async function getAgent(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<KagentiAgentDetail & { agentCard?: KagentiAgentCard }> {
  return deps.fetchJson(`/kagenti/agents/${e(namespace)}/${e(name)}`);
}

export async function createAgent(
  deps: KagentiApiDeps,
  body: KagentiCreateAgentRequest,
): Promise<Record<string, unknown>> {
  return deps.fetchJson('/kagenti/agents', jsonBody(body));
}

export async function deleteAgent(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<void> {
  return deps.fetchJson(
    `/kagenti/agents/${e(namespace)}/${e(name)}`,
    { method: 'DELETE' },
  );
}

export async function getAgentRouteStatus(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/agents/${e(namespace)}/${e(name)}/route-status`,
  );
}

// =============================================================================
// Agent Migration
// =============================================================================

export async function listMigratableAgents(
  deps: KagentiApiDeps,
): Promise<{ agents: KagentiMigratableAgent[] }> {
  return deps.fetchJson('/kagenti/agents/migration/migratable');
}

export async function migrateAgent(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
  deleteOld?: boolean,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/agents/${e(namespace)}/${e(name)}/migrate`,
    jsonBody({ delete_old: deleteOld }),
  );
}

export async function migrateAllAgents(
  deps: KagentiApiDeps,
  options?: { namespace?: string; dryRun?: boolean; deleteOld?: boolean },
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams();
  if (options?.namespace) params.set('namespace', options.namespace);
  if (options?.dryRun) params.set('dry_run', 'true');
  if (options?.deleteOld !== undefined)
    params.set('delete_old', String(options.deleteOld));
  const qs = params.toString() ? `?${params}` : '';
  return deps.fetchJson(
    `/kagenti/agents/migration/migrate-all${qs}`,
    jsonBody({}),
  );
}

// =============================================================================
// Agent Builds
// =============================================================================

export async function getAgentBuildInfo(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<KagentiBuildInfo> {
  return deps.fetchJson(
    `/kagenti/agents/${e(namespace)}/${e(name)}/build-info`,
  );
}

export async function triggerAgentBuild(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/agents/${e(namespace)}/${e(name)}/buildrun`,
    jsonBody({}),
  );
}

export async function finalizeAgentBuild(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/agents/${e(namespace)}/${e(name)}/finalize-build`,
    jsonBody(body || {}),
  );
}

export async function listBuildStrategies(
  deps: KagentiApiDeps,
): Promise<{ strategies: KagentiBuildStrategy[] }> {
  return deps.fetchJson('/kagenti/agents/build-strategies');
}

export async function parseEnv(
  deps: KagentiApiDeps,
  content: string,
): Promise<Record<string, string>> {
  return deps.fetchJson('/kagenti/agents/parse-env', jsonBody({ content }));
}

export async function fetchEnvUrl(
  deps: KagentiApiDeps,
  url: string,
): Promise<Record<string, string>> {
  return deps.fetchJson('/kagenti/agents/fetch-env-url', jsonBody({ url }));
}

// =============================================================================
// Tools
// =============================================================================

export async function listTools(
  deps: KagentiApiDeps,
  namespace?: string,
): Promise<{ tools: KagentiToolSummary[] }> {
  const qs = namespace ? `?namespace=${e(namespace)}` : '';
  const raw = await deps.fetchJson<{ tools?: KagentiToolSummary[]; items?: KagentiToolSummary[] }>(`/kagenti/tools${qs}`);
  return { tools: raw.tools ?? raw.items ?? [] };
}

export async function getTool(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<KagentiToolDetail> {
  return deps.fetchJson(`/kagenti/tools/${e(namespace)}/${e(name)}`);
}

export async function createTool(
  deps: KagentiApiDeps,
  body: KagentiCreateToolRequest,
): Promise<Record<string, unknown>> {
  return deps.fetchJson('/kagenti/tools', jsonBody(body));
}

export async function deleteTool(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<void> {
  return deps.fetchJson(
    `/kagenti/tools/${e(namespace)}/${e(name)}`,
    { method: 'DELETE' },
  );
}

export async function getToolRouteStatus(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/tools/${e(namespace)}/${e(name)}/route-status`,
  );
}

export async function getToolBuildInfo(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<KagentiBuildInfo> {
  return deps.fetchJson(
    `/kagenti/tools/${e(namespace)}/${e(name)}/build-info`,
  );
}

export async function triggerToolBuild(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/tools/${e(namespace)}/${e(name)}/buildrun`,
    jsonBody({}),
  );
}

export async function finalizeToolBuild(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/tools/${e(namespace)}/${e(name)}/finalize-build`,
    jsonBody(body || {}),
  );
}

export async function connectTool(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<{ tools: KagentiMcpToolSchema[] }> {
  return deps.fetchJson(
    `/kagenti/tools/${e(namespace)}/${e(name)}/connect`,
    jsonBody({}),
  );
}

export async function invokeTool(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
  toolName: string,
  args?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/tools/${e(namespace)}/${e(name)}/invoke`,
    jsonBody({ tool_name: toolName, arguments: args }),
  );
}

// =============================================================================
// Shipwright Builds
// =============================================================================

export async function listShipwrightBuilds(
  deps: KagentiApiDeps,
  options?: { namespace?: string; allNamespaces?: boolean },
): Promise<{ builds: KagentiBuildListItem[] }> {
  const params = new URLSearchParams();
  if (options?.namespace) params.set('namespace', options.namespace);
  if (options?.allNamespaces) params.set('allNamespaces', 'true');
  const qs = params.toString() ? `?${params}` : '';
  return deps.fetchJson(`/kagenti/shipwright/builds${qs}`);
}

// =============================================================================
// Sandbox Sessions
// =============================================================================

export async function listSandboxSessions(
  deps: KagentiApiDeps,
  namespace: string,
  options?: {
    limit?: number;
    offset?: number;
    search?: string;
    agentName?: string;
  },
): Promise<{ sessions: KagentiSandboxSession[]; total?: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  if (options?.search) params.set('search', options.search);
  if (options?.agentName) params.set('agent_name', options.agentName);
  const qs = params.toString() ? `?${params}` : '';
  return deps.fetchJson(`/kagenti/sandbox/${e(namespace)}/sessions${qs}`);
}

export async function getSandboxSession(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<KagentiSandboxSession> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}`,
  );
}

export async function getSandboxSessionChain(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/chain`,
  );
}

export async function getSandboxSessionHistory(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/history`,
  );
}

export async function deleteSandboxSession(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<void> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}`,
    { method: 'DELETE' },
  );
}

export async function renameSandboxSession(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  title: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/rename`,
    jsonBody({ title }, 'PUT'),
  );
}

export async function killSandboxSession(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/kill`,
    jsonBody({}),
  );
}

export async function approveSandboxSession(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/approve`,
    jsonBody({}),
  );
}

export async function denySandboxSession(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/deny`,
    jsonBody({}),
  );
}

export async function setSandboxSessionVisibility(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  visibility: 'private' | 'namespace',
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/visibility`,
    jsonBody({ visibility }, 'PUT'),
  );
}

export async function cleanupSandboxSessions(
  deps: KagentiApiDeps,
  namespace: string,
  ttlMinutes?: number,
): Promise<Record<string, unknown>> {
  const qs = ttlMinutes ? `?ttl_minutes=${ttlMinutes}` : '';
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/cleanup${qs}`,
    jsonBody({}),
  );
}

// =============================================================================
// Sandbox Agents / Pods
// =============================================================================

export async function listSandboxAgents(
  deps: KagentiApiDeps,
  namespace: string,
): Promise<{ agents: KagentiSandboxAgentInfo[] }> {
  return deps.fetchJson(`/kagenti/sandbox/${e(namespace)}/agents`);
}

export async function getSandboxAgentPodStatus(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/agents/${e(name)}/pod-status`,
  );
}

export async function getSandboxAgentMetrics(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/agents/${e(name)}/metrics`,
  );
}

export async function getSandboxAgentEvents(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/agents/${e(name)}/events`,
  );
}

// =============================================================================
// Sandbox Chat
// =============================================================================

export async function sandboxChat(
  deps: KagentiApiDeps,
  namespace: string,
  body: {
    message: string;
    session_id?: string;
    agent_name?: string;
    skill?: string;
  },
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/chat`,
    jsonBody(body),
  );
}

// =============================================================================
// Sandbox CRUD
// =============================================================================

export async function getSandboxDefaults(
  deps: KagentiApiDeps,
): Promise<Record<string, unknown>> {
  return deps.fetchJson('/kagenti/sandbox/defaults');
}

export async function createSandbox(
  deps: KagentiApiDeps,
  namespace: string,
  body: KagentiSandboxCreateRequest,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/create`,
    jsonBody(body),
  );
}

export async function deleteSandbox(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<void> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/${e(name)}`,
    { method: 'DELETE' },
  );
}

export async function getSandboxConfig(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/${e(name)}/config`,
  );
}

export async function updateSandbox(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/${e(name)}`,
    jsonBody(body, 'PUT'),
  );
}

// =============================================================================
// Sandbox Files
// =============================================================================

export async function browseSandboxFiles(
  deps: KagentiApiDeps,
  namespace: string,
  agent: string,
  path = '/',
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/files/${e(agent)}?path=${e(path)}`,
  );
}

export async function listSandboxDirectory(
  deps: KagentiApiDeps,
  namespace: string,
  agent: string,
  path = '/',
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/files/${e(agent)}/list?path=${e(path)}`,
  );
}

export async function getSandboxFileContent(
  deps: KagentiApiDeps,
  namespace: string,
  agent: string,
  path: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/files/${e(agent)}/content?path=${e(path)}`,
  );
}

export async function browseSandboxContextFiles(
  deps: KagentiApiDeps,
  namespace: string,
  agent: string,
  contextId: string,
  path = '/',
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/files/${e(agent)}/${e(contextId)}?path=${e(path)}`,
  );
}

export async function getSandboxStorageStats(
  deps: KagentiApiDeps,
  namespace: string,
  agent: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/stats/${e(agent)}`,
  );
}

// =============================================================================
// Sandbox Sidecars
// =============================================================================

export async function listSidecars(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<{ sidecars: KagentiSidecar[] }> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/sidecars`,
  );
}

export async function enableSidecar(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  sidecarType: string,
  autoApprove?: boolean,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/enable`,
    jsonBody({ auto_approve: autoApprove }),
  );
}

export async function disableSidecar(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  sidecarType: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/disable`,
    jsonBody({}),
  );
}

export async function updateSidecarConfig(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  sidecarType: string,
  config: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/config`,
    jsonBody(config, 'PUT'),
  );
}

export async function resetSidecar(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  sidecarType: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/reset`,
    jsonBody({}),
  );
}

export async function approveSidecar(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  sidecarType: string,
  msgId: string,
): Promise<{ status: string; id: string }> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/approve/${e(msgId)}`,
    jsonBody({}),
  );
}

export async function denySidecar(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  sidecarType: string,
  msgId: string,
): Promise<{ status: string; id: string }> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/deny/${e(msgId)}`,
    jsonBody({}),
  );
}

// =============================================================================
// Token Usage
// =============================================================================

export async function getSessionTokenUsage(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<KagentiSessionTokenUsage> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/token-usage/sessions/${e(contextId)}`,
  );
}

export async function getSessionTreeUsage(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/token-usage/sessions/${e(contextId)}/tree`,
  );
}

// =============================================================================
// Sandbox Events & Tasks
// =============================================================================

export async function getSandboxEvents(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  options?: { taskId?: string; fromIndex?: number; limit?: number },
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams();
  params.set('context_id', contextId);
  if (options?.taskId) params.set('task_id', options.taskId);
  if (options?.fromIndex !== undefined)
    params.set('from_index', String(options.fromIndex));
  if (options?.limit) params.set('limit', String(options.limit));
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/events?${params}`,
  );
}

export async function getSandboxTasksPaginated(
  deps: KagentiApiDeps,
  namespace: string,
  contextId: string,
  options?: { limit?: number; beforeId?: string },
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams();
  params.set('context_id', contextId);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.beforeId) params.set('before_id', options.beforeId);
  return deps.fetchJson(
    `/kagenti/sandbox/${e(namespace)}/tasks/paginated?${params}`,
  );
}

// =============================================================================
// Admin: LLM Models / Teams / Keys
// =============================================================================

export async function listLlmModels(
  deps: KagentiApiDeps,
): Promise<Record<string, unknown>> {
  return deps.fetchJson('/kagenti/models');
}

export async function createLlmTeam(
  deps: KagentiApiDeps,
  body: KagentiCreateTeamRequest,
): Promise<KagentiLlmTeam> {
  return deps.fetchJson('/kagenti/llm/teams', jsonBody(body));
}

export async function listLlmTeams(
  deps: KagentiApiDeps,
): Promise<{ teams: KagentiLlmTeam[] }> {
  return deps.fetchJson('/kagenti/llm/teams');
}

export async function getLlmTeam(
  deps: KagentiApiDeps,
  namespace: string,
): Promise<KagentiLlmTeam> {
  return deps.fetchJson(`/kagenti/llm/teams/${e(namespace)}`);
}

export async function createLlmKey(
  deps: KagentiApiDeps,
  body: KagentiCreateKeyRequest,
): Promise<KagentiLlmKey> {
  return deps.fetchJson('/kagenti/llm/keys', jsonBody(body));
}

export async function listLlmKeys(
  deps: KagentiApiDeps,
): Promise<{ keys: KagentiLlmKey[] }> {
  return deps.fetchJson('/kagenti/llm/keys');
}

export async function deleteLlmKey(
  deps: KagentiApiDeps,
  namespace: string,
  agentName: string,
): Promise<void> {
  return deps.fetchJson(
    `/kagenti/llm/keys/${e(namespace)}/${e(agentName)}`,
    { method: 'DELETE' },
  );
}

export async function getAgentModels(
  deps: KagentiApiDeps,
  namespace: string,
  agentName: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/llm/agent-models/${e(namespace)}/${e(agentName)}`,
  );
}

// =============================================================================
// Admin: Integrations
// =============================================================================

export async function listIntegrations(
  deps: KagentiApiDeps,
  namespace?: string,
): Promise<{ integrations: KagentiIntegration[] }> {
  const qs = namespace ? `?namespace=${e(namespace)}` : '';
  return deps.fetchJson(`/kagenti/integrations${qs}`);
}

export async function getIntegration(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<KagentiIntegration> {
  return deps.fetchJson(
    `/kagenti/integrations/${e(namespace)}/${e(name)}`,
  );
}

export async function createIntegration(
  deps: KagentiApiDeps,
  body: KagentiCreateIntegrationRequest,
): Promise<KagentiIntegration> {
  return deps.fetchJson('/kagenti/integrations', jsonBody(body));
}

export async function updateIntegration(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
  body: Record<string, unknown>,
): Promise<KagentiIntegration> {
  return deps.fetchJson(
    `/kagenti/integrations/${e(namespace)}/${e(name)}`,
    jsonBody(body, 'PUT'),
  );
}

export async function deleteIntegration(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<void> {
  return deps.fetchJson(
    `/kagenti/integrations/${e(namespace)}/${e(name)}`,
    { method: 'DELETE' },
  );
}

export async function testIntegration(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<Record<string, unknown>> {
  return deps.fetchJson(
    `/kagenti/integrations/${e(namespace)}/${e(name)}/test`,
    jsonBody({}),
  );
}

// =============================================================================
// Admin: Triggers
// =============================================================================

export async function createTrigger(
  deps: KagentiApiDeps,
  body: KagentiTriggerRequest,
): Promise<Record<string, unknown>> {
  return deps.fetchJson('/kagenti/sandbox/trigger', jsonBody(body));
}
