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

import type { JsonValue } from '@backstage/types';
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ScorecardCollectorsService } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import {
  DORA_PREDECESSOR_COLLECT_FROM,
  DORA_PRE_WINDOW_DEPLOYMENT_FETCH_CAP,
  DORA_TIME_WINDOW_DAYS,
} from '../../constants';
import {
  deploymentsCollectorInputSchema,
  deploymentsCollectorOutputSchema,
  type Deployment,
} from '../schemas/deploymentSchemas';
import { isSuccessfulProductionDeployment } from './deploymentFilterUtils';

export type PredecessorCollectorRange = {
  from: string;
  to: string;
  /**
   * Hint for collectors that honor a fetch cap (e.g. GitHub). Custom
   * collectors that strip unknown keys still receive from/to only.
   */
  fetchItemsLimit: number;
};

export type DeploymentsWithPreWindowBoundary = {
  inWindow: Deployment[];
  predecessor: Deployment | undefined;
  deployments: Deployment[];
};

/**
 * Inclusive `to` for the predecessor collect so a deploy at exactly
 * `windowFrom` is not returned twice (deployments contract is inclusive).
 */
export function getPredecessorCollectorRange(
  windowFrom: Date,
): PredecessorCollectorRange {
  return {
    from: DORA_PREDECESSOR_COLLECT_FROM,
    to: new Date(windowFrom.getTime() - 1).toISOString(),
    fetchItemsLimit: DORA_PRE_WINDOW_DEPLOYMENT_FETCH_CAP,
  };
}

/**
 * Incidents for CFR must cover `[predecessor, firstInWindow)` when a
 * pre-window deploy exists; otherwise the usual metric window start.
 */
export function getChangeFailureRateIncidentFrom(
  windowFrom: Date,
  predecessor: Deployment | undefined,
): string {
  return predecessor?.createdAt ?? windowFrom.toISOString();
}

export function mergeSuccessfulProductionDeploymentsWithPredecessor(options: {
  inWindowDeployments: Deployment[];
  preWindowDeployments: Deployment[];
  windowFrom: Date;
  productionEnvironments: string[];
}): DeploymentsWithPreWindowBoundary {
  const { windowFrom, productionEnvironments } = options;
  const windowFromTimestamp = windowFrom.getTime();

  const inWindow = options.inWindowDeployments.filter(deployment =>
    isSuccessfulProductionDeployment(deployment, productionEnvironments),
  );

  const predecessor = findLatestSuccessfulProductionPredecessor(
    options.preWindowDeployments,
    windowFromTimestamp,
    productionEnvironments,
    new Set(inWindow.map(deployment => deployment.id)),
  );

  return {
    inWindow,
    predecessor,
    deployments: predecessor ? [predecessor, ...inWindow] : inWindow,
  };
}

function findLatestSuccessfulProductionPredecessor(
  preWindowDeployments: Deployment[],
  windowFromTimestamp: number,
  productionEnvironments: string[],
  inWindowIds: Set<string>,
): Deployment | undefined {
  let predecessor: Deployment | undefined;

  for (const deployment of preWindowDeployments) {
    if (inWindowIds.has(deployment.id)) {
      continue;
    }

    const createdAtTimestamp = new Date(deployment.createdAt).getTime();
    if (
      Number.isNaN(createdAtTimestamp) ||
      createdAtTimestamp >= windowFromTimestamp
    ) {
      continue;
    }

    if (!isSuccessfulProductionDeployment(deployment, productionEnvironments)) {
      continue;
    }

    if (
      !predecessor ||
      createdAtTimestamp > new Date(predecessor.createdAt).getTime()
    ) {
      predecessor = deployment;
    }
  }

  return predecessor;
}

export function insufficientSuccessfulProductionDeploymentsMessage(
  metricLabel: string,
  inWindowCount: number,
): string {
  return `Unable to calculate ${metricLabel}: need at least 2 successful production deployments in the last ${DORA_TIME_WINDOW_DAYS} days, or 1 in that window plus a prior successful production deployment, found ${inWindowCount}`;
}

export async function collectSuccessfulProductionDeploymentsWithPreWindowBoundary(options: {
  collectorsService: ScorecardCollectorsService;
  collectorId: string;
  collectorInput?: Record<string, JsonValue>;
  entity: Entity;
  windowFrom: Date;
  windowTo: Date;
  productionEnvironments: string[];
  logger: LoggerService;
  metricProviderId: string;
}): Promise<DeploymentsWithPreWindowBoundary> {
  const inWindowCollected = await options.collectorsService.collect<
    typeof deploymentsCollectorInputSchema,
    typeof deploymentsCollectorOutputSchema
  >({
    collectorId: options.collectorId,
    contract: {
      inputSchema: deploymentsCollectorInputSchema,
      outputSchema: deploymentsCollectorOutputSchema,
    },
    entity: options.entity,
    input: {
      ...options.collectorInput,
      from: options.windowFrom.toISOString(),
      to: options.windowTo.toISOString(),
    },
  });

  const inWindowOnly = mergeSuccessfulProductionDeploymentsWithPredecessor({
    inWindowDeployments: inWindowCollected.deployments,
    preWindowDeployments: [],
    windowFrom: options.windowFrom,
    productionEnvironments: options.productionEnvironments,
  });

  if (inWindowOnly.inWindow.length === 0) {
    return inWindowOnly;
  }

  const predecessorRange = getPredecessorCollectorRange(options.windowFrom);
  let preWindowDeployments: Deployment[] = [];
  try {
    const preWindowCollected = await options.collectorsService.collect<
      typeof deploymentsCollectorInputSchema,
      typeof deploymentsCollectorOutputSchema
    >({
      collectorId: options.collectorId,
      contract: {
        inputSchema: deploymentsCollectorInputSchema,
        outputSchema: deploymentsCollectorOutputSchema,
      },
      entity: options.entity,
      input: {
        ...options.collectorInput,
        from: predecessorRange.from,
        to: predecessorRange.to,
        fetchItemsLimit: predecessorRange.fetchItemsLimit,
      },
    });
    preWindowDeployments = preWindowCollected.deployments;
  } catch (error) {
    options.logger.warn(
      `Skipping pre-window deployment lookup for ${stringifyEntityRef(
        options.entity,
      )} while calculating ${options.metricProviderId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return inWindowOnly;
  }

  return mergeSuccessfulProductionDeploymentsWithPredecessor({
    inWindowDeployments: inWindowCollected.deployments,
    preWindowDeployments,
    windowFrom: options.windowFrom,
    productionEnvironments: options.productionEnvironments,
  });
}
