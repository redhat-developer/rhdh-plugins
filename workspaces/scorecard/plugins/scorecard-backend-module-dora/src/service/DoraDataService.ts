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

import type { DoraDeploymentsStore } from '../database/DatabaseDoraDeployments';
import type { DoraIncidentsStore } from '../database/DatabaseDoraIncidents';
import type { DoraPullRequestsStore } from '../database/DatabaseDoraPullRequests';
import type {
  DbDoraDeployment,
  DbDoraIncident,
  DbDoraPullRequest,
} from '../database/types';
import type { CollectorCallOptions, WindowOptions } from './types';

/**
 * Reads persisted DORA data for metric calculation.
 */
export interface DoraDataService {
  readDeployments(
    catalogEntityRef: string,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<DbDoraDeployment[]>;
  readIncidents(
    catalogEntityRef: string,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<DbDoraIncident[]>;
  readPullRequestsForDeployment(
    catalogEntityRef: string,
    options: CollectorCallOptions & {
      deploymentId: string;
    },
  ): Promise<DbDoraPullRequest[]>;
}

export class DefaultDoraDataService implements DoraDataService {
  constructor(
    private readonly deploymentsDb: DoraDeploymentsStore,
    private readonly incidentsDb: DoraIncidentsStore,
    private readonly pullRequestsDb: DoraPullRequestsStore,
  ) {}

  async readDeployments(
    catalogEntityRef: string,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<DbDoraDeployment[]> {
    return this.deploymentsDb.readByEntityCollectorAndWindow(
      catalogEntityRef,
      options.collector.id,
      options.collector.inputHash,
      options.windowFrom,
      options.windowTo,
    );
  }

  async readIncidents(
    catalogEntityRef: string,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<DbDoraIncident[]> {
    return this.incidentsDb.readByEntityCollectorAndWindow(
      catalogEntityRef,
      options.collector.id,
      options.collector.inputHash,
      options.windowFrom,
      options.windowTo,
    );
  }

  async readPullRequestsForDeployment(
    catalogEntityRef: string,
    options: CollectorCallOptions & {
      deploymentId: string;
    },
  ): Promise<DbDoraPullRequest[]> {
    return this.pullRequestsDb.readByEntityCollectorAndDeployment(
      catalogEntityRef,
      options.collector.id,
      options.collector.inputHash,
      options.deploymentId,
    );
  }
}
