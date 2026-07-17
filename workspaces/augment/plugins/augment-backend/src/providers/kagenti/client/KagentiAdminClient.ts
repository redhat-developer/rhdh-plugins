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
  LlmModelResponse,
  TeamCreateRequest,
  TeamResponse,
  KeyCreateRequest,
  KeyInfo,
  CreateIntegrationRequest,
  IntegrationListResponse,
  TriggerRequest,
  TriggerResponse,
} from './types';
import { API_PREFIX as API, encodePathSegment as e } from './utils';

/**
 * Client for Kagenti admin/feature-flagged endpoints:
 * models, LLM keys/teams, integrations, and triggers.
 */
export class KagentiAdminClient {
  constructor(private readonly api: KagentiApiClient) {}

  // -- Models (sandbox flag) --------------------------------------------------

  async listLlmModels(): Promise<LlmModelResponse[]> {
    return this.api.request('GET', `${API}/models`);
  }

  // -- LLM Teams (sandbox flag) -----------------------------------------------

  async createTeam(body: TeamCreateRequest): Promise<TeamResponse> {
    return this.api.request('POST', `${API}/llm/teams`, body);
  }

  async listTeams(): Promise<TeamResponse[]> {
    return this.api.request('GET', `${API}/llm/teams`);
  }

  async getTeam(namespace: string): Promise<TeamResponse> {
    return this.api.request('GET', `${API}/llm/teams/${e(namespace)}`);
  }

  // -- LLM Keys (sandbox flag) ------------------------------------------------

  async createKey(body: KeyCreateRequest): Promise<Record<string, unknown>> {
    return this.api.request('POST', `${API}/llm/keys`, body);
  }

  async listKeys(): Promise<KeyInfo[]> {
    return this.api.request('GET', `${API}/llm/keys`);
  }

  async deleteKey(
    namespace: string,
    agentName: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'DELETE',
      `${API}/llm/keys/${e(namespace)}/${e(agentName)}`,
    );
  }

  async getAgentModels(
    namespace: string,
    agentName: string,
  ): Promise<Record<string, unknown>[]> {
    return this.api.request(
      'GET',
      `${API}/llm/agent-models/${e(namespace)}/${e(agentName)}`,
    );
  }

  // -- Integrations (integrations flag) ---------------------------------------

  async listIntegrations(namespace?: string): Promise<IntegrationListResponse> {
    const qs = namespace ? `?namespace=${e(namespace)}` : '';
    return this.api.request('GET', `${API}/integrations${qs}`);
  }

  async getIntegration(
    namespace: string,
    name: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'GET',
      `${API}/integrations/${e(namespace)}/${e(name)}`,
    );
  }

  async createIntegration(
    body: CreateIntegrationRequest,
  ): Promise<Record<string, unknown>> {
    return this.api.request('POST', `${API}/integrations`, body);
  }

  async updateIntegration(
    namespace: string,
    name: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'PUT',
      `${API}/integrations/${e(namespace)}/${e(name)}`,
      patch,
    );
  }

  async deleteIntegration(
    namespace: string,
    name: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'DELETE',
      `${API}/integrations/${e(namespace)}/${e(name)}`,
    );
  }

  async testIntegration(
    namespace: string,
    name: string,
  ): Promise<Record<string, unknown>> {
    return this.api.request(
      'POST',
      `${API}/integrations/${e(namespace)}/${e(name)}/test`,
    );
  }

  // -- Triggers (triggers flag) -----------------------------------------------

  async createTrigger(body: TriggerRequest): Promise<TriggerResponse> {
    return this.api.request('POST', `${API}/sandbox/trigger`, body);
  }
}
