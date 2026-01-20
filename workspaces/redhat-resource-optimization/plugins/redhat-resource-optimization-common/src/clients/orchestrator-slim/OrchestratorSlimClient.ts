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

import {
  DiscoveryApi,
  FetchApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import type {
  OrchestratorSlimApi,
  WorkflowAvailabilityResult,
} from './OrchestratorSlimApi';
import type { JsonObject } from '@backstage/types';

/** @public */
export class OrchestratorSlimClient implements OrchestratorSlimApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;
  private readonly identityApi: IdentityApi;
  private baseUrl?: string;

  constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
    this.identityApi = options.identityApi;
  }

  async isWorkflowAvailable(workflowId: string): Promise<boolean> {
    const result = await this.checkWorkflowAvailability(workflowId);
    return result.available;
  }

  async checkWorkflowAvailability(
    workflowId: string,
  ): Promise<WorkflowAvailabilityResult> {
    if (!workflowId) {
      return {
        available: false,
        reason: 'not_configured',
        errorMessage: 'No workflow configured to apply recommendations',
      };
    }

    if (!this.baseUrl) {
      this.baseUrl = await this.discoveryApi.getBaseUrl('orchestrator');
    }

    const url = `${this.baseUrl}/v2/workflows/${encodeURIComponent(
      workflowId,
    )}/overview`;

    try {
      const response = await this.fetchApi.fetch(url, { method: 'GET' });

      if (response.ok) {
        return { available: true };
      }

      // Try to extract error message from the response
      let errorMessage: string | undefined;
      try {
        const errorResponse = (await response.json()) as {
          error?: { message?: string };
          message?: string;
        };
        errorMessage =
          errorResponse?.error?.message || errorResponse?.message || undefined;
      } catch {
        // Ignore JSON parsing errors
      }

      if (response.status === 404) {
        return {
          available: false,
          reason: 'not_found',
          errorMessage: errorMessage || 'Workflow not found',
        };
      }

      if (response.status === 403 || response.status === 401) {
        return {
          available: false,
          reason: 'access_denied',
          errorMessage:
            errorMessage ||
            'You do not have permission to access this workflow',
        };
      }

      return {
        available: false,
        reason: 'service_unavailable',
        errorMessage:
          errorMessage || 'Workflow service is currently unavailable',
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unable to connect to workflow service';
      return {
        available: false,
        reason: 'service_unavailable',
        errorMessage,
      };
    }
  }

  /** @public */
  async executeWorkflow<D = JsonObject>(
    workflowId: string,
    workflowInputData: D,
  ): Promise<{ id: string }> {
    if (!this.baseUrl) {
      this.baseUrl = await this.discoveryApi.getBaseUrl('orchestrator');
    }

    const { token } = await this.identityApi.getCredentials();
    const url = `${this.baseUrl}/v2/workflows/${encodeURIComponent(
      workflowId,
    )}/execute`;
    const response = await this.fetchApi.fetch(url, {
      method: 'POST',
      body: JSON.stringify(workflowInputData),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = (await response.json()) as { id: string };

    return payload;
  }
}
