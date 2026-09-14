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

import { DORA_PRE_WINDOW_DEPLOYMENT_CANDIDATE_LIMIT } from '../constants';
import type { DoraDeploymentsStore } from '../database/DatabaseDoraDeployments';
import type { DoraIncidentsStore } from '../database/DatabaseDoraIncidents';
import type { DoraPullRequestsStore } from '../database/DatabaseDoraPullRequests';
import type {
  DbDoraDeployment,
  DbDoraIncident,
  DbDoraPullRequest,
} from '../database/types';
import { isProductionEnvironment } from '../metricProviders/utils/deploymentFilterUtils';
import type { CollectorCallOptions, WindowOptions } from './types';

/**
 * Reads persisted DORA data for metric calculation.
 */
export interface DoraDataService {
  readDeployments(
    catalogEntityRef: string,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<DbDoraDeployment[]>;
  /**
   * Latest successful production deployment with `createdAt` strictly before
   * `before`, if one exists for this entity and collector identity.
   */
  readLatestProductionDeploymentBefore(
    catalogEntityRef: string,
    options: CollectorCallOptions & {
      before: Date;
      productionEnvironments: string[];
    },
  ): Promise<DbDoraDeployment | undefined>;
  readIncidents(
    catalogEntityRef: string,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<DbDoraIncident[]>;
  readPullRequestsForDeployment(
    catalogEntityRef: string,
    options: { deploymentId: string },
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

  async readLatestProductionDeploymentBefore(
    catalogEntityRef: string,
    options: CollectorCallOptions & {
      before: Date;
      productionEnvironments: string[];
    },
  ): Promise<DbDoraDeployment | undefined> {
    const candidates = await this.deploymentsDb.readCandidatesBefore(
      catalogEntityRef,
      options.collector.id,
      options.collector.inputHash,
      options.before,
      DORA_PRE_WINDOW_DEPLOYMENT_CANDIDATE_LIMIT,
    );

    return candidates.find(deployment =>
      isProductionEnvironment(
        deployment.environment,
        options.productionEnvironments,
      ),
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
    options: { deploymentId: string },
  ): Promise<DbDoraPullRequest[]> {
    return this.pullRequestsDb.readByEntityAndDeployment(
      catalogEntityRef,
      options.deploymentId,
    );
  }
}
