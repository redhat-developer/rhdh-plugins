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
  KagentiCreateAgentResponse,
  KagentiFinalizeAgentBuildRequest,
  KagentiMigratableAgent,
  KagentiBuildInfo,
  KagentiBuildStrategy,
  KagentiRouteStatus,
  KagentiTriggerBuildRunResponse,
  KagentiMigrateAgentResponse,
  KagentiMigrateAllResponse,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { KagentiApiDeps } from './types';
import { e, jsonBody } from './types';

// =============================================================================
// Agents
// =============================================================================

export async function listAgents(
  deps: KagentiApiDeps,
  namespace?: string,
  options?: { includeCards?: boolean },
): Promise<{
  agents: (KagentiAgentSummary & { agentCard?: KagentiAgentCard })[];
}> {
  const params: string[] = [];
  if (namespace) params.push(`namespace=${e(namespace)}`);
  if (options?.includeCards) params.push('include=cards');
  const qs = params.length ? `?${params.join('&')}` : '';
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
): Promise<KagentiCreateAgentResponse> {
  return deps.fetchJson('/kagenti/agents', jsonBody(body));
}

export async function deleteAgent(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<void> {
  return deps.fetchJson(`/kagenti/agents/${e(namespace)}/${e(name)}`, {
    method: 'DELETE',
  });
}

export async function getAgentRouteStatus(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<KagentiRouteStatus> {
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
): Promise<KagentiMigrateAgentResponse> {
  return deps.fetchJson(
    `/kagenti/agents/${e(namespace)}/${e(name)}/migrate`,
    jsonBody({ delete_old: deleteOld }),
  );
}

export async function migrateAllAgents(
  deps: KagentiApiDeps,
  options?: { namespace?: string; dryRun?: boolean; deleteOld?: boolean },
): Promise<KagentiMigrateAllResponse> {
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
): Promise<KagentiTriggerBuildRunResponse> {
  return deps.fetchJson(
    `/kagenti/agents/${e(namespace)}/${e(name)}/buildrun`,
    jsonBody({}),
  );
}

export async function finalizeAgentBuild(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
  body?: KagentiFinalizeAgentBuildRequest,
): Promise<KagentiCreateAgentResponse> {
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
