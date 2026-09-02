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

import { parseDate } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { collectorInputHash } from '../../service/collectorHash';
import {
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
} from '../../constants';
import type { DoraDeploymentsStore } from '../../database/DatabaseDoraDeployments';
import type { DoraIncidentsStore } from '../../database/DatabaseDoraIncidents';
import type { DoraLastSyncStore } from '../../database/DatabaseDoraLastSync';
import type { DoraPullRequestsStore } from '../../database/DatabaseDoraPullRequests';
import type {
  DbDoraDeployment,
  DbDoraIncident,
  DbDoraPullRequest,
} from '../../database/types';

const DEFAULT_ENTITY_REF = 'component:default/mock';
const EMPTY_INPUT_HASH = collectorInputHash({});

export function dbDeployment(partial: {
  id: string;
  commitSha: string;
  environment?: string | null;
  createdAt: string | Date;
  catalogEntityRef?: string;
  collectorId?: string;
  collectorInputHash?: string;
  originalDeploymentId?: string;
}): DbDoraDeployment {
  return {
    id: partial.id,
    catalogEntityRef: partial.catalogEntityRef ?? DEFAULT_ENTITY_REF,
    collectorId: partial.collectorId ?? DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
    collectorInputHash: partial.collectorInputHash ?? EMPTY_INPUT_HASH,
    originalDeploymentId: partial.originalDeploymentId ?? partial.id,
    commitSha: partial.commitSha,
    environment: partial.environment ?? null,
    createdAt: parseDate(partial.createdAt),
  };
}

export function dbIncident(partial: {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  resolutionAt?: string | Date | null;
  catalogEntityRef?: string;
  collectorId?: string;
  collectorInputHash?: string;
  originalIncidentId?: string;
}): DbDoraIncident {
  return {
    id: partial.id,
    catalogEntityRef: partial.catalogEntityRef ?? DEFAULT_ENTITY_REF,
    collectorId: partial.collectorId ?? DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
    collectorInputHash: partial.collectorInputHash ?? EMPTY_INPUT_HASH,
    originalIncidentId: partial.originalIncidentId ?? partial.id,
    createdAt: parseDate(partial.createdAt),
    updatedAt: parseDate(partial.updatedAt),
    resolutionAt:
      partial.resolutionAt === undefined || partial.resolutionAt === null
        ? null
        : parseDate(partial.resolutionAt),
  };
}

export function dbPullRequest(partial: {
  id: string;
  firstCommitAt: string | Date;
  deploymentId: string;
  catalogEntityRef?: string;
  collectorId?: string;
  collectorInputHash?: string;
  originalPrId?: string;
}): DbDoraPullRequest {
  return {
    id: partial.id,
    catalogEntityRef: partial.catalogEntityRef ?? DEFAULT_ENTITY_REF,
    collectorId:
      partial.collectorId ?? DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
    collectorInputHash: partial.collectorInputHash ?? EMPTY_INPUT_HASH,
    originalPrId: partial.originalPrId ?? partial.id,
    firstCommitAt: parseDate(partial.firstCommitAt),
    deploymentId: partial.deploymentId,
  };
}

export const mockDoraDeploymentsStore: jest.Mocked<DoraDeploymentsStore> = {
  upsert: jest.fn(),
  readByEntityCollectorAndWindow: jest.fn(),
  deleteOlderThan: jest.fn(),
};

export const mockDoraIncidentsStore: jest.Mocked<DoraIncidentsStore> = {
  upsert: jest.fn(),
  readByEntityCollectorAndWindow: jest.fn(),
  deleteOlderThan: jest.fn(),
};

export const mockDoraPullRequestsStore: jest.Mocked<DoraPullRequestsStore> = {
  upsert: jest.fn(),
  readByEntityCollectorAndDeployment: jest.fn(),
  deleteForDeploymentsOlderThan: jest.fn(),
};

export const mockDoraLastSyncStore: jest.Mocked<DoraLastSyncStore> = {
  getLastSyncedAt: jest.fn(),
  setLastSyncedAt: jest.fn(),
  deleteOlderThan: jest.fn(),
};
