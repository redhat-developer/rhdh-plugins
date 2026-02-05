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

import {
  Project,
  Module,
  Job,
  JobStatusEnum,
  Artifact,
  ArtifactType,
  MigrationPhase,
  Telemetry,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export function mapRowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    abbreviation: row.abbreviation as string,
    description: row.description as string,
    sourceRepoUrl: row.source_repo_url as string,
    targetRepoUrl: row.target_repo_url as string,
    sourceRepoBranch: row.source_repo_branch as string,
    targetRepoBranch: row.target_repo_branch as string,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string | Date),
  };
}

export function mapRowToModule(row: Record<string, unknown>): Module {
  return {
    id: row.id as string,
    name: row.name as string,
    sourcePath: row.source_path as string,
    projectId: row.project_id as string,
  };
}

export function mapRowToJob(
  row: Record<string, unknown>,
): Job & { callbackToken?: string } {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    moduleId: (row.module_id as string) ?? undefined,
    startedAt: row.started_at
      ? new Date(row.started_at as string | Date)
      : new Date(),
    finishedAt: row.finished_at
      ? new Date(row.finished_at as string | Date)
      : undefined,
    status: (row.status || 'pending') as JobStatusEnum,
    phase: row.phase as MigrationPhase,
    errorDetails: row.error_details as string | undefined,
    k8sJobName: (row.k8s_job_name as string) ?? undefined,
    callbackToken: row.callback_token as string | undefined,
    telemetry: parseTelemetry(row.telemetry as string | undefined),
  };
}

function parseTelemetry(raw: string | undefined): Telemetry | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as Telemetry;
  } catch {
    return undefined;
  }
}

export function mapRowToArtifact(row: Record<string, unknown>): Artifact {
  return {
    id: row.id as string,
    // Following retype is fragile if DB writes do not respect the enum
    type: row.type as ArtifactType,
    value: row.value as string,
  };
}
