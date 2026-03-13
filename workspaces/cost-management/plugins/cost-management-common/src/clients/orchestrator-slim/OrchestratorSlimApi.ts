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

import type { JsonObject } from '@backstage/types';

/** @public */
export type WorkflowUnavailableReason =
  | 'not_configured'
  | 'not_found'
  | 'access_denied'
  | 'service_unavailable';

/** @public */
export interface WorkflowAvailabilityResult {
  available: boolean;
  reason?: WorkflowUnavailableReason;
  errorMessage?: string;
}

/** @public */
export interface OrchestratorSlimApi {
  isWorkflowAvailable(workflowId: string): Promise<boolean>;
  checkWorkflowAvailability(
    workflowId: string,
  ): Promise<WorkflowAvailabilityResult>;
  executeWorkflow<D = JsonObject>(
    workflowId: string,
    workflowInputData: D,
  ): Promise<{ id: string }>;
}
