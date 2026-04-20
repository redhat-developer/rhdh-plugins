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

/**
 * Interface for the DCM Policy Manager API client.
 *
 * @public
 */
export interface PolicyManagerApi {
  listPolicies(): Promise<PolicyList>;
  getPolicy(policyId: string): Promise<Policy>;
  createPolicy(policy: Policy): Promise<Policy>;
  updatePolicy(policyId: string, patch: Partial<Policy>): Promise<Policy>;
  deletePolicy(policyId: string): Promise<void>;
}
