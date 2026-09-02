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
import type {
  DbDoraDeployment,
  DbDoraDeploymentCreate,
  DbDoraIncident,
  DbDoraIncidentCreate,
  DbDoraPullRequest,
  DbDoraPullRequestCreate,
} from './types';

export type DbDoraDeploymentRow = {
  id: string;
  catalog_entity_ref: string;
  collector_id: string;
  collector_input_hash: string;
  original_deployment_id: string;
  commit_sha: string;
  environment: string | null;
  created_at: Date | string;
};

export type DbDoraIncidentRow = {
  id: string;
  catalog_entity_ref: string;
  collector_id: string;
  collector_input_hash: string;
  original_incident_id: string;
  created_at: Date | string;
  updated_at: Date | string;
  resolution_at: Date | string | null;
};

export type DbDoraPullRequestRow = {
  id: string;
  catalog_entity_ref: string;
  collector_id: string;
  collector_input_hash: string;
  original_pr_id: string;
  first_commit_at: Date | string;
  deployment_id: string;
};

export function toDoraDeploymentRow(
  deployment: DbDoraDeploymentCreate,
): Omit<DbDoraDeploymentRow, 'id'> {
  return {
    catalog_entity_ref: deployment.catalogEntityRef,
    collector_id: deployment.collectorId,
    collector_input_hash: deployment.collectorInputHash,
    original_deployment_id: deployment.originalDeploymentId,
    commit_sha: deployment.commitSha,
    environment: deployment.environment ?? null,
    created_at: deployment.createdAt,
  };
}

export function fromDoraDeploymentRow(
  row: DbDoraDeploymentRow,
): DbDoraDeployment {
  return {
    id: row.id,
    catalogEntityRef: row.catalog_entity_ref,
    collectorId: row.collector_id,
    collectorInputHash: row.collector_input_hash,
    originalDeploymentId: row.original_deployment_id,
    commitSha: row.commit_sha,
    environment: row.environment,
    createdAt: parseDate(row.created_at),
  };
}

export function toDoraIncidentRow(
  incident: DbDoraIncidentCreate,
): Omit<DbDoraIncidentRow, 'id'> {
  return {
    catalog_entity_ref: incident.catalogEntityRef,
    collector_id: incident.collectorId,
    collector_input_hash: incident.collectorInputHash,
    original_incident_id: incident.originalIncidentId,
    created_at: incident.createdAt,
    updated_at: incident.updatedAt,
    resolution_at: incident.resolutionAt ?? null,
  };
}

export function fromDoraIncidentRow(row: DbDoraIncidentRow): DbDoraIncident {
  return {
    id: row.id,
    catalogEntityRef: row.catalog_entity_ref,
    collectorId: row.collector_id,
    collectorInputHash: row.collector_input_hash,
    originalIncidentId: row.original_incident_id,
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
    resolutionAt: row.resolution_at ? parseDate(row.resolution_at) : null,
  };
}

export function toDoraPullRequestRow(
  pullRequest: DbDoraPullRequestCreate,
): Omit<DbDoraPullRequestRow, 'id'> {
  return {
    catalog_entity_ref: pullRequest.catalogEntityRef,
    collector_id: pullRequest.collectorId,
    collector_input_hash: pullRequest.collectorInputHash,
    original_pr_id: pullRequest.originalPrId,
    first_commit_at: pullRequest.firstCommitAt,
    deployment_id: pullRequest.deploymentId,
  };
}

export function fromDoraPullRequestRow(
  row: DbDoraPullRequestRow,
): DbDoraPullRequest {
  return {
    id: row.id,
    catalogEntityRef: row.catalog_entity_ref,
    collectorId: row.collector_id,
    collectorInputHash: row.collector_input_hash,
    originalPrId: row.original_pr_id,
    firstCommitAt: parseDate(row.first_commit_at),
    deploymentId: row.deployment_id,
  };
}
