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

import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import type { ScorecardCollectorsService } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import type { DoraDeploymentsStore } from '../database/DatabaseDoraDeployments';
import type { DoraIncidentsStore } from '../database/DatabaseDoraIncidents';
import type { DoraPullRequestsStore } from '../database/DatabaseDoraPullRequests';
import {
  deploymentsCollectorInputSchema,
  deploymentsCollectorOutputSchema,
} from '../metricProviders/schemas/deploymentSchemas';
import {
  incidentsCollectorInputSchema,
  incidentsCollectorOutputSchema,
} from '../metricProviders/schemas/incidentSchemas';
import {
  deploymentPullRequestsCollectorInputSchema,
  deploymentPullRequestsCollectorOutputSchema,
} from '../metricProviders/schemas/pullRequestSchemas';
import type { WindowOptions, CollectorCallOptions } from './types';
import { laterOf } from './syncUtils';

/**
 * Collects new DORA source data via collectors and persists it.
 */
export interface DoraSyncService {
  syncDeployments(
    entity: Entity,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<void>;
  syncIncidents(
    entity: Entity,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<void>;
  syncPullRequestsForDeployment(
    entity: Entity,
    options: CollectorCallOptions & {
      deploymentId: string;
      baseCommitSha: string;
      headCommitSha: string;
    },
  ): Promise<void>;
}

export class DefaultDoraSyncService implements DoraSyncService {
  constructor(
    private readonly collectorsService: ScorecardCollectorsService,
    private readonly deploymentsDb: DoraDeploymentsStore,
    private readonly incidentsDb: DoraIncidentsStore,
    private readonly pullRequestsDb: DoraPullRequestsStore,
  ) {}

  /**
   * Retrieves and persists deployments
   * that were created after the last successfully synced deployment's createdAt
   * for a given entity and collector.
   */
  async syncDeployments(
    entity: Entity,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<void> {
    const catalogEntityRef = stringifyEntityRef(entity);
    const collectorId = options.collector.id;
    const syncWatermark = await this.deploymentsDb.getLatestCreatedAt(
      catalogEntityRef,
      collectorId,
    );
    const syncFrom = laterOf(options.windowFrom, syncWatermark);

    const collected = await this.collectorsService.collect<
      typeof deploymentsCollectorInputSchema,
      typeof deploymentsCollectorOutputSchema
    >({
      collectorId,
      contract: {
        inputSchema: deploymentsCollectorInputSchema,
        outputSchema: deploymentsCollectorOutputSchema,
      },
      entity,
      input: {
        ...options.collector.input,
        from: syncFrom.toISOString(),
        to: options.windowTo.toISOString(),
      },
    });

    await this.deploymentsDb.upsert(
      collected.deployments.map(deployment => ({
        catalogEntityRef,
        collectorId,
        originalDeploymentId: deployment.id,
        commitSha: deployment.commitSha,
        environment: deployment.environment ?? null,
        createdAt: new Date(deployment.createdAt),
        result: deployment.result,
      })),
    );
  }

  /**
   * Retrieves and persists incidents
   * that were updated after the last successfully synced incident's updatedAt
   * for a given entity and collector.
   */
  async syncIncidents(
    entity: Entity,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<void> {
    const catalogEntityRef = stringifyEntityRef(entity);
    const collectorId = options.collector.id;
    const watermark = await this.incidentsDb.getLatestUpdatedAt(
      catalogEntityRef,
      collectorId,
    );
    const updatedSince = laterOf(options.windowFrom, watermark);

    const collected = await this.collectorsService.collect<
      typeof incidentsCollectorInputSchema,
      typeof incidentsCollectorOutputSchema
    >({
      collectorId,
      contract: {
        inputSchema: incidentsCollectorInputSchema,
        outputSchema: incidentsCollectorOutputSchema,
      },
      entity,
      input: {
        ...options.collector.input,
        from: options.windowFrom.toISOString(),
        to: options.windowTo.toISOString(),
        updatedSince: updatedSince.toISOString(),
      },
    });

    await this.incidentsDb.upsert(
      collected.incidents.map(incident => ({
        catalogEntityRef,
        collectorId,
        originalIncidentId: incident.id,
        createdAt: new Date(incident.createdAt),
        updatedAt: new Date(incident.updatedAt),
        resolutionAt: incident.resolutionAt
          ? new Date(incident.resolutionAt)
          : null,
      })),
    );
  }

  /**
   * Retrieves and persists PRs for a deployment when none are stored yet.
   * `deploymentId` is the persisted deployments row id (FK).
   */
  async syncPullRequestsForDeployment(
    entity: Entity,
    options: CollectorCallOptions & {
      deploymentId: string;
      baseCommitSha: string;
      headCommitSha: string;
    },
  ): Promise<void> {
    const catalogEntityRef = stringifyEntityRef(entity);
    const collectorId = options.collector.id;

    const existing =
      await this.pullRequestsDb.readByEntityCollectorAndDeployment(
        catalogEntityRef,
        collectorId,
        options.deploymentId,
      );
    if (existing.length > 0) {
      return;
    }

    const collected = await this.collectorsService.collect<
      typeof deploymentPullRequestsCollectorInputSchema,
      typeof deploymentPullRequestsCollectorOutputSchema
    >({
      collectorId,
      contract: {
        inputSchema: deploymentPullRequestsCollectorInputSchema,
        outputSchema: deploymentPullRequestsCollectorOutputSchema,
      },
      entity,
      input: {
        ...options.collector.input,
        baseCommitSha: options.baseCommitSha,
        headCommitSha: options.headCommitSha,
      },
    });

    await this.pullRequestsDb.upsert(
      collected.pullRequests.map(pullRequest => ({
        catalogEntityRef,
        collectorId,
        originalPrId: pullRequest.id,
        firstCommitAt: new Date(pullRequest.firstCommitAt),
        deploymentId: options.deploymentId,
      })),
    );
  }
}
