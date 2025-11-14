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

import { ConflictError } from '@backstage/errors';

import { WorkflowLogProvider } from '@red-hat-developer-hub/backstage-plugin-orchestrator-node';

export class WorkflowLogsProvidersRegistry {
  private readonly workfLogsProviders = new Map<string, WorkflowLogProvider>();

  register(workflowLogProvider: WorkflowLogProvider): void {
    const providerId = workflowLogProvider.getProviderId();

    if (this.workfLogsProviders.has(providerId)) {
      throw new ConflictError(
        `Workflow Log Provider with ID ${providerId} has already been registered`,
      );
    }

    this.workfLogsProviders.set(providerId, workflowLogProvider);
  }

  listProviders(): WorkflowLogProvider[] {
    return Array.from(this.workfLogsProviders.values());
  }

  getProvider(providerId: string): WorkflowLogProvider | undefined {
    return this.workfLogsProviders.get(providerId);
  }
}
