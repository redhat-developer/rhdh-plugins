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

import { Knex } from 'knex';
import crypto from 'node:crypto';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  Job,
  JobStatusEnum,
  MigrationPhase,
  Artifact,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { mapRowToJob, mapRowToArtifact } from './mappers';

export class JobOperations {
  readonly #logger: LoggerService;
  readonly #dbClient: Knex;

  constructor(logger: LoggerService, dbClient: Knex) {
    this.#logger = logger;
    this.#dbClient = dbClient;
  }

  async attachArtifactsToJobs(rows: Record<string, unknown>[]): Promise<Job[]> {
    if (rows.length === 0) {
      return [];
    }

    const jobIds = rows.map(row => row.id as string);

    const artifactRows = await this.#dbClient('artifacts')
      .whereIn('job_id', jobIds)
      .select('*')
      .orderBy('id', 'asc');

    const artifactsByJobId = new Map<string, Artifact[]>();
    for (const artifact of artifactRows) {
      const jobId = artifact.job_id as string;
      if (jobId) {
        artifactsByJobId.set(jobId, [
          ...(artifactsByJobId.get(jobId) || []),
          mapRowToArtifact(artifact),
        ]);
      }
    }

    return rows.map(row => {
      const job = mapRowToJob(row);
      return {
        ...job,
        artifacts: artifactsByJobId.get(job.id) || [],
      };
    });
  }

  async createJob(job: {
    projectId: string;
    moduleId?: string | null;
    log?: string | null;
    startedAt?: Date;
    finishedAt?: Date | null;
    status?: JobStatusEnum;
    phase: MigrationPhase;
    errorDetails?: string | null;
    k8sJobName?: string | null;
    callbackToken?: string | null;
    artifacts?: Pick<Artifact, 'type' | 'value'>[];
  }): Promise<Job> {
    const id = crypto.randomUUID();
    this.#logger.info(`createJob called for job: ${JSON.stringify(job)}`);
    const startedAt = job.startedAt || new Date();
    const finishedAt = job.finishedAt || null;
    const status = job.status || 'pending';
    const artifacts = job.artifacts || [];

    await this.#dbClient('jobs').insert({
      id,
      project_id: job.projectId,
      module_id: job.moduleId || null,
      log: job.log || null,
      started_at: startedAt,
      finished_at: finishedAt,
      status,
      phase: job.phase,
      error_details: job.errorDetails || null,
      k8s_job_name: job.k8sJobName || null,
      callback_token: job.callbackToken || null,
    });

    if (artifacts.length > 0) {
      const artifactRows = artifacts.map(artifact => ({
        id: crypto.randomUUID(),
        value: artifact.value,
        type: artifact.type,
        job_id: id,
      }));
      await this.#dbClient('artifacts').insert(artifactRows);
    }

    const newJob = await this.getJob({ id });
    if (!newJob) {
      throw new Error(`Failed to read the job after creation: ${id}`);
    }
    this.#logger.info(`Created new job: ${JSON.stringify(newJob)}`);
    return newJob as Job;
  }

  async getJob({ id }: { id: string }): Promise<Job | undefined> {
    this.#logger.info(`getJob called for id: ${id}`);

    const row = await this.#dbClient('jobs')
      .where('id', id)
      .select(
        'id',
        'project_id',
        'module_id',
        'started_at',
        'finished_at',
        'status',
        'phase',
        'error_details',
        'k8s_job_name',
        'callback_token',
      )
      .first();
    if (!row) {
      return undefined;
    }

    const job = mapRowToJob(row);

    const artifactRows = await this.#dbClient('artifacts')
      .where('job_id', id)
      .select('*')
      .orderBy('id', 'asc');

    const artifacts: Artifact[] = artifactRows.map(
      (r: Record<string, unknown>) => mapRowToArtifact(r),
    );

    return {
      ...job,
      artifacts,
    };
  }

  async getJobWithLog({
    id,
  }: {
    id: string;
  }): Promise<(Job & { log?: string | null }) | undefined> {
    const job = await this.getJob({ id });
    if (!job) {
      return undefined;
    }
    const log = await this.getJobLogs({ jobId: id });
    return {
      ...job,
      log,
    };
  }

  async getJobLogs({ jobId }: { jobId: string }): Promise<string | undefined> {
    this.#logger.info(`getJobLogs called for id: ${jobId}`);
    const row = await this.#dbClient('jobs').where('id', jobId).first();
    return row ? (row.log as string) : undefined;
  }

  async listJobsForProject({
    projectId,
  }: {
    projectId: string;
  }): Promise<Job[]> {
    this.#logger.info(`listJobsForProject called for projectId: ${projectId}`);

    const rows = await this.#dbClient('jobs')
      .where('project_id', projectId)
      .select('*')
      .orderBy('started_at', 'desc');

    const jobs = await this.attachArtifactsToJobs(rows);

    this.#logger.debug(
      `Fetched ${jobs.length} jobs from database for project ${projectId}`,
    );

    return jobs;
  }

  async listJobsForModule({
    projectId,
    moduleId,
  }: {
    projectId: string;
    moduleId: string;
  }): Promise<Job[]> {
    this.#logger.info(
      `listJobsForModule called for projectId: ${projectId}, moduleId: ${moduleId}`,
    );

    const rows = await this.#dbClient('jobs')
      .where({ project_id: projectId, module_id: moduleId })
      .select('*')
      .orderBy('started_at', 'desc');

    const jobs = await this.attachArtifactsToJobs(rows);

    this.#logger.debug(
      `Fetched ${jobs.length} jobs from database for module ${moduleId} in project ${projectId}`,
    );

    return jobs;
  }

  async listJobs({
    projectId,
    moduleId,
    phase,
    lastJobOnly = false,
  }: {
    projectId: string;
    moduleId?: string;
    phase?: MigrationPhase;
    lastJobOnly?: boolean;
  }): Promise<Job[]> {
    this.#logger.info(
      `listJobs called for projectId: ${projectId}, moduleId: ${moduleId}, phase: ${phase}, lastJobOnly: ${lastJobOnly}`,
    );

    const rows = await this.#dbClient('jobs')
      .where('project_id', projectId)
      .modify(queryBuilder => {
        if (moduleId) {
          queryBuilder.where('module_id', moduleId);
        }
      })
      .modify(queryBuilder => {
        if (phase) {
          queryBuilder.where('phase', phase);
        }
      })
      .select(
        'id',
        'project_id',
        'module_id',
        'started_at',
        'finished_at',
        'status',
        'phase',
        'error_details',
        'k8s_job_name',
        'callback_token',
      )
      .orderBy('started_at', 'desc')
      .modify(queryBuilder => {
        if (lastJobOnly) {
          queryBuilder.limit(1);
        }
      });

    const jobs = await this.attachArtifactsToJobs(rows);

    this.#logger.debug(
      `Fetched ${jobs.length} jobs from database for module ${moduleId}`,
    );

    return jobs;
  }

  async updateJob({
    id,
    log,
    finishedAt,
    status,
    errorDetails,
    k8sJobName,
    artifacts,
  }: {
    id: string;
    log?: string | null;
    finishedAt?: Date | null;
    status?: JobStatusEnum;
    errorDetails?: string | null;
    k8sJobName?: string | null;
    artifacts?: Artifact[];
  }): Promise<Job | undefined> {
    this.#logger.info(`updateJob called for id: ${id}`);

    const existingJob = await this.getJob({ id });
    if (!existingJob) {
      this.#logger.warn(`No job found with id: ${id}`);
      return undefined;
    }

    const updateData: Record<string, unknown> = {};
    if (log !== undefined) {
      updateData.log = log;
    }
    if (finishedAt !== undefined) {
      updateData.finished_at = finishedAt;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (errorDetails !== undefined) {
      updateData.error_details = errorDetails;
    }
    if (k8sJobName !== undefined) {
      updateData.k8s_job_name = k8sJobName;
    }

    if (Object.keys(updateData).length > 0) {
      await this.#dbClient('jobs').where('id', id).update(updateData);
    }

    if (artifacts !== undefined) {
      await this.#dbClient('artifacts').where('job_id', id).delete();

      if (artifacts.length > 0) {
        const artifactRows = artifacts.map(artifact => ({
          id: artifact.id ?? crypto.randomUUID(),
          type: artifact.type,
          value: artifact.value,
          job_id: id,
        }));
        await this.#dbClient('artifacts').insert(artifactRows);
      }
    }

    return this.getJob({ id });
  }

  async deleteJob({ id }: { id: string }): Promise<number> {
    this.#logger.info(`deleteJob called for id: ${id}`);

    const deletedCount = await this.#dbClient('jobs').where('id', id).delete();

    if (deletedCount === 0) {
      this.#logger.warn(`No job found with id: ${id}`);
    } else {
      this.#logger.info(`Deleted job with id: ${id}`);
    }

    return deletedCount;
  }
}
