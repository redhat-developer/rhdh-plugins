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
  ProcessInstanceDTO,
  WorkflowLogsResponse,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';
import { WorkflowLogProvider } from '@red-hat-developer-hub/backstage-plugin-orchestrator-node';

export class MockWorkflowLogProviders implements WorkflowLogProvider {
  constructor(
    protected providerId: string,
    protected baseURL: string,
  ) {}
  getProviderId(): string {
    return this.providerId;
  }
  getBaseURL(): string {
    return this.baseURL;
  }
  fetchWorkflowLogsByIntance(
    workflowInstance: ProcessInstanceDTO,
  ): Promise<WorkflowLogsResponse> {
    throw new Error('Method not implemented.');
  }
}

export const lokiLogProvider = new MockWorkflowLogProviders(
  'loki',
  'https://loki',
);

export const randomLogProviderThatDoesntExist = new MockWorkflowLogProviders(
  'random',
  'https://random',
);
