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
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ScorecardCollectorsService } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import type { DoraDeploymentsStore } from '../database/DatabaseDoraDeployments';
import type { DoraIncidentsStore } from '../database/DatabaseDoraIncidents';
import type { DoraLastSyncStore } from '../database/DatabaseDoraLastSync';
import type { DoraPullRequestsStore } from '../database/DatabaseDoraPullRequests';
import type { DoraSyncConfig } from '../metricProviders/DoraConfig';
import {
  DORA_DEFAULT_DEPLOYMENT_LOOKBACK_MS,
  DORA_DEFAULT_STALE_AFTER_MS,
} from '../constants';
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
import {
  coalesceInFlight,
  deploymentSyncFrom,
  isWithinStaleWindow,
  laterOf,
} from './syncUtils';

const DEFAULT_DORA_SYNC_CONFIG: DoraSyncConfig = {
  staleAfterMs: DORA_DEFAULT_STALE_AFTER_MS,
  deploymentLookbackMs: DORA_DEFAULT_DEPLOYMENT_LOOKBACK_MS,
};

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
  private readonly inflightDeployments = new Map<string, Promise<void>>();
  private readonly inflightIncidents = new Map<string, Promise<void>>();
  private readonly inflightPullRequests = new Map<string, Promise<void>>();

  constructor(
    private readonly collectorsService: ScorecardCollectorsService,
    private readonly deploymentsDb: DoraDeploymentsStore,
    private readonly incidentsDb: DoraIncidentsStore,
    private readonly pullRequestsDb: DoraPullRequestsStore,
    private readonly lastSyncDb: DoraLastSyncStore,
    private readonly logger: LoggerService,
    private readonly config: DoraSyncConfig = DEFAULT_DORA_SYNC_CONFIG,
  ) {}

  /**
   * Retrieves and persists deployments created after the last successful sync
   * (minus lookback) for a given entity and collector.
   *
   * Concurrent syncs for the same entity and collector share one in-flight fetch.
   */
  syncDeployments(
    entity: Entity,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<void> {
    const catalogEntityRef = stringifyEntityRef(entity);
    const key = `${catalogEntityRef}\0${options.collector.id}\0${options.collector.inputHash}`;
    return coalesceInFlight(this.inflightDeployments, key, () =>
      this.doSyncDeployments(entity, options, catalogEntityRef),
    );
  }

  private async doSyncDeployments(
    entity: Entity,
    options: WindowOptions & CollectorCallOptions,
    catalogEntityRef: string,
  ): Promise<void> {
    const collectorId = options.collector.id;
    const collectorInputHash = options.collector.inputHash;
    const lastSyncedAt = await this.lastSyncDb.getLastSyncedAt(
      catalogEntityRef,
      collectorId,
      collectorInputHash,
    );
    if (isWithinStaleWindow(lastSyncedAt, this.config.staleAfterMs)) {
      this.logger.debug(
        `Skipping DORA deployments refresh for collector "${collectorId}" on "${catalogEntityRef}" because data is fresh within staleAfterMs (${this.config.staleAfterMs} ms).`,
      );
      return;
    }
    const syncFrom = deploymentSyncFrom(
      options.windowFrom,
      lastSyncedAt,
      this.config.deploymentLookbackMs,
    );

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
      collected.deployments
        .filter(deployment => deployment.result === 'success')
        .map(deployment => ({
          catalogEntityRef,
          collectorId,
          collectorInputHash,
          originalDeploymentId: deployment.id,
          commitSha: deployment.commitSha,
          environment: deployment.environment ?? null,
          createdAt: new Date(deployment.createdAt),
        })),
    );

    await this.lastSyncDb.setLastSyncedAt(
      catalogEntityRef,
      collectorId,
      collectorInputHash,
      options.windowTo,
    );
  }

  /**
   * Retrieves and persists incidents updated after the last successful sync
   * for a given entity and collector.
   *
   * Concurrent syncs for the same entity and collector share one in-flight fetch.
   */
  syncIncidents(
    entity: Entity,
    options: WindowOptions & CollectorCallOptions,
  ): Promise<void> {
    const catalogEntityRef = stringifyEntityRef(entity);
    const key = `${catalogEntityRef}\0${options.collector.id}\0${options.collector.inputHash}`;
    return coalesceInFlight(this.inflightIncidents, key, () =>
      this.doSyncIncidents(entity, options, catalogEntityRef),
    );
  }

  private async doSyncIncidents(
    entity: Entity,
    options: WindowOptions & CollectorCallOptions,
    catalogEntityRef: string,
  ): Promise<void> {
    const collectorId = options.collector.id;
    const collectorInputHash = options.collector.inputHash;
    const lastSyncedAt = await this.lastSyncDb.getLastSyncedAt(
      catalogEntityRef,
      collectorId,
      collectorInputHash,
    );
    if (isWithinStaleWindow(lastSyncedAt, this.config.staleAfterMs)) {
      this.logger.debug(
        `Skipping DORA incidents refresh for collector "${collectorId}" on "${catalogEntityRef}" because data is fresh within staleAfterMs (${this.config.staleAfterMs} ms).`,
      );
      return;
    }
    const updatedSince = laterOf(options.windowFrom, lastSyncedAt);

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
        collectorInputHash,
        originalIncidentId: incident.id,
        createdAt: new Date(incident.createdAt),
        updatedAt: new Date(incident.updatedAt),
        resolutionAt: incident.resolutionAt
          ? new Date(incident.resolutionAt)
          : null,
      })),
    );

    await this.lastSyncDb.setLastSyncedAt(
      catalogEntityRef,
      collectorId,
      collectorInputHash,
      options.windowTo,
    );
  }

  /**
   * Retrieves and persists PRs for a deployment when none are stored yet.
   * `deploymentId` is the persisted deployments row id (FK).
   *
   * Concurrent syncs for the same entity, collector, and deployment share one
   * in-flight fetch.
   */
  syncPullRequestsForDeployment(
    entity: Entity,
    options: CollectorCallOptions & {
      deploymentId: string;
      baseCommitSha: string;
      headCommitSha: string;
    },
  ): Promise<void> {
    const catalogEntityRef = stringifyEntityRef(entity);
    const key = `${catalogEntityRef}\0${options.collector.id}\0${options.collector.inputHash}\0${options.deploymentId}`;
    return coalesceInFlight(this.inflightPullRequests, key, () =>
      this.doSyncPullRequestsForDeployment(entity, options, catalogEntityRef),
    );
  }

  private async doSyncPullRequestsForDeployment(
    entity: Entity,
    options: CollectorCallOptions & {
      deploymentId: string;
      baseCommitSha: string;
      headCommitSha: string;
    },
    catalogEntityRef: string,
  ): Promise<void> {
    const collectorId = options.collector.id;
    const collectorInputHash = options.collector.inputHash;

    const existing =
      await this.pullRequestsDb.readByEntityCollectorAndDeployment(
        catalogEntityRef,
        collectorId,
        collectorInputHash,
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
        collectorInputHash,
        originalPrId: pullRequest.id,
        firstCommitAt: new Date(pullRequest.firstCommitAt),
        deploymentId: options.deploymentId,
      })),
    );
  }
}
