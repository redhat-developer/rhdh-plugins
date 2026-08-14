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

import type { DoraDeploymentsStore } from '../../database/DatabaseDoraDeployments';
import type { DoraIncidentsStore } from '../../database/DatabaseDoraIncidents';
import type { DoraPullRequestsStore } from '../../database/DatabaseDoraPullRequests';
import { asDate } from '../../database/mappers';
import type {
  DbDoraDeployment,
  DbDoraIncident,
  DbDoraPullRequest,
} from '../../database/types';

const DEFAULT_ENTITY_REF = 'component:default/mock';

export function dbDeployment(partial: {
  id: string;
  commitSha: string;
  environment?: string | null;
  createdAt: string | Date;
  catalogEntityRef?: string;
  collectorId?: string;
  originalDeploymentId?: string;
}): DbDoraDeployment {
  return {
    id: partial.id,
    catalogEntityRef: partial.catalogEntityRef ?? DEFAULT_ENTITY_REF,
    collectorId: partial.collectorId ?? 'github:deployments',
    originalDeploymentId: partial.originalDeploymentId ?? partial.id,
    commitSha: partial.commitSha,
    environment: partial.environment ?? null,
    createdAt: asDate(partial.createdAt),
  };
}

export function dbIncident(partial: {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  resolutionAt?: string | Date | null;
  catalogEntityRef?: string;
  collectorId?: string;
  originalIncidentId?: string;
}): DbDoraIncident {
  return {
    id: partial.id,
    catalogEntityRef: partial.catalogEntityRef ?? DEFAULT_ENTITY_REF,
    collectorId: partial.collectorId ?? 'jira:incidents',
    originalIncidentId: partial.originalIncidentId ?? partial.id,
    createdAt: asDate(partial.createdAt),
    updatedAt: asDate(partial.updatedAt),
    resolutionAt:
      partial.resolutionAt === undefined || partial.resolutionAt === null
        ? null
        : asDate(partial.resolutionAt),
  };
}

export function dbPullRequest(partial: {
  id: string;
  firstCommitAt: string | Date;
  deploymentId?: string | null;
  catalogEntityRef?: string;
  collectorId?: string;
  originalPrId?: string;
}): DbDoraPullRequest {
  return {
    id: partial.id,
    catalogEntityRef: partial.catalogEntityRef ?? DEFAULT_ENTITY_REF,
    collectorId: partial.collectorId ?? 'github:deploymentPullRequests',
    originalPrId: partial.originalPrId ?? partial.id,
    firstCommitAt: asDate(partial.firstCommitAt),
    deploymentId: partial.deploymentId ?? null,
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
  deleteOlderThan: jest.fn(),
};
