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
  KagentiIntegration,
  KagentiCreateIntegrationRequest,
  KagentiLlmTeam,
  KagentiLlmKey,
  KagentiCreateTeamRequest,
  KagentiCreateKeyRequest,
  KagentiTriggerRequest,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { KagentiApiDeps } from './types';
import { e, jsonBody } from './types';

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
  return deps.fetchJson(`/kagenti/llm/keys/${e(namespace)}/${e(agentName)}`, {
    method: 'DELETE',
  });
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
  return deps.fetchJson(`/kagenti/integrations/${e(namespace)}/${e(name)}`);
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
  return deps.fetchJson(`/kagenti/integrations/${e(namespace)}/${e(name)}`, {
    method: 'DELETE',
  });
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
