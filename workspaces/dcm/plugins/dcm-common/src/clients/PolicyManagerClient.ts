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

import type { Policy, PolicyList } from '../types/policy-manager';
import type { PolicyManagerApi } from './PolicyManagerApi';
import { DcmBaseClient } from './DcmBaseClient';

/**
 * Calls the DCM Policy Manager API through the dcm-backend secure proxy.
 *
 * All requests are sent to `/api/dcm/proxy/<path>` where the backend
 * strips the `/proxy` prefix and forwards to:
 *   `{dcm.apiGatewayUrl}/api/v1alpha1/<path>`
 *
 * @public
 */
export class PolicyManagerClient
  extends DcmBaseClient
  implements PolicyManagerApi
{
  protected readonly serviceName = 'Policy Manager';

  async listPolicies(): Promise<PolicyList> {
    return this.fetch<PolicyList>('policies');
  }

  async getPolicy(policyId: string): Promise<Policy> {
    return this.fetch<Policy>(`policies/${policyId}`);
  }

  async createPolicy(policy: Policy): Promise<Policy> {
    return this.fetch<Policy>('policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    });
  }

  async updatePolicy(
    policyId: string,
    patch: Partial<Policy>,
  ): Promise<Policy> {
    return this.fetch<Policy>(`policies/${policyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(patch),
    });
  }

  async deletePolicy(policyId: string): Promise<void> {
    return this.fetch<void>(`policies/${policyId}`, { method: 'DELETE' });
  }
}
