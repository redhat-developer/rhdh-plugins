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
  KagentiBuildInfo,
  KagentiBuildListItem,
  KagentiMcpToolSchema,
  KagentiCreateToolResponse,
  KagentiFinalizeToolBuildRequest,
  KagentiMcpInvokeResponse,
  KagentiRouteStatus,
  KagentiTriggerBuildRunResponse,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { KagentiApiDeps } from './types';
import { e, jsonBody } from './types';

// =============================================================================
// Tools
// =============================================================================

export async function listTools(
  deps: KagentiApiDeps,
  namespace?: string,
): Promise<{ tools: KagentiToolSummary[] }> {
  const qs = namespace ? `?namespace=${e(namespace)}` : '';
  const raw = await deps.fetchJson<{
    tools?: KagentiToolSummary[];
    items?: KagentiToolSummary[];
  }>(`/kagenti/tools${qs}`);
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
): Promise<KagentiCreateToolResponse> {
  return deps.fetchJson('/kagenti/tools', jsonBody(body));
}

export async function deleteTool(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<void> {
  return deps.fetchJson(`/kagenti/tools/${e(namespace)}/${e(name)}`, {
    method: 'DELETE',
  });
}

export async function getToolRouteStatus(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<KagentiRouteStatus> {
  return deps.fetchJson(
    `/kagenti/tools/${e(namespace)}/${e(name)}/route-status`,
  );
}

export async function getToolBuildInfo(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<KagentiBuildInfo> {
  return deps.fetchJson(`/kagenti/tools/${e(namespace)}/${e(name)}/build-info`);
}

export async function triggerToolBuild(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<KagentiTriggerBuildRunResponse> {
  return deps.fetchJson(
    `/kagenti/tools/${e(namespace)}/${e(name)}/buildrun`,
    jsonBody({}),
  );
}

export async function finalizeToolBuild(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
  body?: KagentiFinalizeToolBuildRequest,
): Promise<KagentiCreateToolResponse> {
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
): Promise<KagentiMcpInvokeResponse> {
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

export async function listToolBuilds(
  deps: KagentiApiDeps,
  namespace?: string,
  allNamespaces = false,
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams();
  if (namespace) params.set('namespace', namespace);
  if (allNamespaces) params.set('all_namespaces', 'true');
  const qs = params.toString() ? `?${params}` : '';
  return deps.fetchJson(`/kagenti/tools/shipwright-builds${qs}`);
}
