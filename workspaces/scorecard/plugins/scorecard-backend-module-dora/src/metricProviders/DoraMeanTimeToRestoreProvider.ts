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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  type ScorecardCollectorsService,
  MetricProvider,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { DORA_TIME_WINDOW_DAYS } from '../constants';
import {
  incidentsCollectorInputSchema,
  incidentsCollectorOutputSchema,
} from './schemas/incidentSchemas';
import { calculateMean } from './utils/calculationUtils';
import {
  DEFAULT_DORA_MEAN_TIME_TO_RESTORE_THRESHOLDS,
  type DoraMeanTimeToRestoreConfig,
  parseDoraMeanTimeToRestoreConfig,
} from './DoraConfig';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

type DoraMeanTimeToRestoreProviderOptions = {
  collectorsService: ScorecardCollectorsService;
  config: DoraMeanTimeToRestoreConfig;
  logger: LoggerService;
};

export class DoraMeanTimeToRestoreProvider implements MetricProvider<'number'> {
  private readonly collectorsService: ScorecardCollectorsService;
  private readonly config: DoraMeanTimeToRestoreConfig;
  private readonly logger: LoggerService;

  private constructor(options: DoraMeanTimeToRestoreProviderOptions) {
    this.collectorsService = options.collectorsService;
    this.config = options.config;
    this.logger = options.logger;
  }

  static fromConfig(
    config: Config,
    options: {
      collectorsService: ScorecardCollectorsService;
      logger: LoggerService;
    },
  ): DoraMeanTimeToRestoreProvider {
    return new DoraMeanTimeToRestoreProvider({
      collectorsService: options.collectorsService,
      config: parseDoraMeanTimeToRestoreConfig(config),
      logger: options.logger,
    });
  }

  getProviderDatasourceId(): string {
    return 'dora';
  }

  getProviderId() {
    return 'dora.meanTimeToRestore';
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: this.getProviderId(),
        title: 'DORA - Mean Time to Restore',
        description:
          'Tracks the average time to restore service after an incident over the past 30 days. Elite performers restore service in under one hour.',
        type: 'number',
        thresholds: DEFAULT_DORA_MEAN_TIME_TO_RESTORE_THRESHOLDS,
        unit: 'h',
        history: true,
        defaultVisualization: 'sparkline',
      },
    ];
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.scorecard.io/dora': CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - DORA_TIME_WINDOW_DAYS);

    const incidentsCollected = await this.collectorsService.collect<
      typeof incidentsCollectorInputSchema,
      typeof incidentsCollectorOutputSchema
    >({
      collectorId: this.config.incidentsCollector.id,
      contract: {
        inputSchema: incidentsCollectorInputSchema,
        outputSchema: incidentsCollectorOutputSchema,
      },
      entity,
      input: {
        ...this.config.incidentsCollector.input,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    });

    const recoveryHours: number[] = [];
    let invalidResolvedIncidents = 0;
    for (const incident of incidentsCollected.incidents) {
      if (!incident.resolutionAt) {
        continue;
      }
      const createdAtTimestamp = new Date(incident.createdAt).getTime();
      const resolutionAtTimestamp = new Date(incident.resolutionAt).getTime();
      if (resolutionAtTimestamp < createdAtTimestamp) {
        invalidResolvedIncidents += 1;
        this.logger.warn(
          `Skipping incident ${incident.id} for ${stringifyEntityRef(
            entity,
          )} while calculating ${this.getProviderId()}: resolutionAt (${
            incident.resolutionAt
          }) is before createdAt (${incident.createdAt})`,
        );
        continue;
      }
      recoveryHours.push(
        (resolutionAtTimestamp - createdAtTimestamp) / 3_600_000,
      );
    }

    if (recoveryHours.length === 0) {
      if (invalidResolvedIncidents > 0) {
        throw new Error(
          `Unable to calculate mean time to restore: found ${invalidResolvedIncidents} resolved incident(s) with resolutionAt before createdAt and no measurable recovery times`,
        );
      }
      throw new Error(
        'Unable to calculate mean time to restore: no resolved incidents with measurable recovery time were found',
      );
    }

    results.set(
      this.getProviderId(),
      Number(calculateMean(recoveryHours).toFixed(4)),
    );
    return results;
  }
}
