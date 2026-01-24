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

import crypto from 'node:crypto';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  LoggerService,
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import { Expand } from '@backstage/types';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { Knex } from 'knex';

// TODO: model via openapi schema
export interface Module {
  id: string;
  name: string;
  sourcePath: string;
  projectId: string;
}

// TODO: model via openapi schema
export type JobStatus = 'pending' | 'running' | 'success' | 'error';

// TODO: model via openapi schema
export interface Job {
  id: string;
  log: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  status: JobStatus;
  moduleId: string;
  artifacts: string[];
}

export class X2ADatabaseService {
  readonly #logger: LoggerService;
  readonly #dbClient: Knex;

  static create(options: { logger: LoggerService; dbClient: Knex }) {
    return new X2ADatabaseService(options.logger, options.dbClient);
  }

  private constructor(logger: LoggerService, dbClient: Knex) {
    this.#logger = logger;
    this.#dbClient = dbClient;
  }

  // Map a database row to a Project object
  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      abbreviation: row.abbreviation,
      description: row.description,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    };
  }

  // Map a database row to a Module object
  private mapRowToModule(row: any): Module {
    return {
      id: row.id,
      name: row.name,
      sourcePath: row.source_path,
      projectId: row.project_id,
    };
  }

  // Map a database row to a Job object (without artifacts)
  private mapRowToJob(row: any): Omit<Job, 'artifacts'> {
    return {
      id: row.id,
      log: row.log,
      startedAt: row.started_at ? new Date(row.started_at) : new Date(),
      finishedAt: row.finished_at ? new Date(row.finished_at) : null,
      status: (row.status || 'pending') as JobStatus,
      moduleId: row.module_id,
    };
  }

  async createProject(
    input: {
      name: string;
      abbreviation: string;
      description: string;
    },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
    },
  ): Promise<Project> {
    const id = crypto.randomUUID();
    const createdBy = options.credentials.principal.userEntityRef;
    const createdAt = new Date();

    const newProject: Project = {
      id,
      name: input.name,
      abbreviation: input.abbreviation,
      description: input.description,
      // sourceRepository: 'https://github.com/org/repo',
      createdBy,
      createdAt,
    };

    // Persist in the database
    await this.#dbClient('projects').insert({
      id,
      name: input.name,
      abbreviation: input.abbreviation,
      description: input.description,
      created_by: createdBy,
      created_at: createdAt,
    });

    this.#logger.info(`Created new project: ${JSON.stringify(newProject)}`);

    return newProject;
  }

  async listProjects(): Promise<{ projects: Project[]; totalCount: number }> {
    this.#logger.info('listProjects called');

    // Fetch all records from the database
    const rows = await this.#dbClient('projects')
      .select('*')
      .orderBy('created_at', 'desc');

    const projects: Project[] = rows.map(this.mapRowToProject);

    const totalCount = projects.length;
    this.#logger.debug(`Fetched ${totalCount} projects from database`);

    return { projects, totalCount };
  }

  async getProject({
    projectId,
  }: {
    projectId: string;
  }): Promise<Project | undefined> {
    this.#logger.info(`getProject called for projectId: ${projectId}`);
    const row = await this.#dbClient('projects').where('id', projectId).first();
    return row ? this.mapRowToProject(row) : undefined;
  }

  async deleteProject({ projectId }: { projectId: string }): Promise<number> {
    this.#logger.info(`deleteProject called for projectId: ${projectId}`);

    // Delete from the database
    const deletedCount = await this.#dbClient('projects')
      .where('id', projectId)
      .delete();

    if (deletedCount === 0) {
      this.#logger.warn(`No project found with id: ${projectId}`);
    } else {
      this.#logger.info(`Deleted project with id: ${projectId}`);
    }

    return deletedCount;
  }

  async createModule(module: {
    name: string;
    sourcePath: string;
    projectId: string;
  }): Promise<Module> {
    const id = crypto.randomUUID();

    const newModule: Module = {
      id,
      name: module.name,
      sourcePath: module.sourcePath,
      projectId: module.projectId,
    };

    // Persist in the database
    await this.#dbClient('modules').insert({
      id,
      name: module.name,
      source_path: module.sourcePath,
      project_id: module.projectId,
    });

    this.#logger.info(`Created new module: ${JSON.stringify(newModule)}`);

    return newModule;
  }

  async getModule({ id }: { id: string }): Promise<Module | undefined> {
    this.#logger.info(`getModule called for id: ${id}`);
    const row = await this.#dbClient('modules').where('id', id).first();
    return row ? this.mapRowToModule(row) : undefined;
  }

  async listModules({ projectId }: { projectId: string }): Promise<Module[]> {
    this.#logger.info(`listModules called for projectId: ${projectId}`);

    // Fetch all modules for the given project
    const rows = await this.#dbClient('modules')
      .where('project_id', projectId)
      .select('*')
      .orderBy('name', 'asc');

    const modules: Module[] = rows.map(this.mapRowToModule);

    this.#logger.debug(
      `Fetched ${modules.length} modules from database for project ${projectId}`,
    );

    return modules;
  }

  async deleteModule({ id }: { id: string }): Promise<number> {
    this.#logger.info(`deleteModule called for id: ${id}`);

    // Delete from the database
    const deletedCount = await this.#dbClient('modules')
      .where('id', id)
      .delete();

    if (deletedCount === 0) {
      this.#logger.warn(`No module found with id: ${id}`);
    } else {
      this.#logger.info(`Deleted module with id: ${id}`);
    }

    return deletedCount;
  }

  async createJob(job: {
    log?: string | null;
    startedAt?: Date;
    finishedAt?: Date | null;
    status?: JobStatus;
    moduleId: string;
    artifacts?: string[];
  }): Promise<Job> {
    const id = crypto.randomUUID();
    const startedAt = job.startedAt || new Date();
    const finishedAt = job.finishedAt || null;
    const status = job.status || 'pending';
    const artifacts = job.artifacts || [];

    // Persist the job in the database
    await this.#dbClient('jobs').insert({
      id,
      log: job.log || null,
      started_at: startedAt,
      finished_at: finishedAt,
      status,
      module_id: job.moduleId,
    });

    // Insert artifacts if provided
    if (artifacts.length > 0) {
      const artifactRows = artifacts.map(artifact => ({
        id: crypto.randomUUID(),
        value: artifact,
        job_id: id,
      }));
      await this.#dbClient('artifacts').insert(artifactRows);
    }

    const newJob: Job = {
      id,
      log: job.log || null,
      startedAt,
      finishedAt,
      status,
      moduleId: job.moduleId,
      artifacts,
    };

    this.#logger.info(`Created new job: ${JSON.stringify(newJob)}`);

    return newJob;
  }

  async getJob({ id }: { id: string }): Promise<Job | undefined> {
    this.#logger.info(`getJob called for id: ${id}`);

    const row = await this.#dbClient('jobs').where('id', id).first();
    if (!row) {
      return undefined;
    }

    const job = this.mapRowToJob(row);

    // Fetch artifacts for this job
    const artifactRows = await this.#dbClient('artifacts')
      .where('job_id', id)
      .select('value')
      .orderBy('id', 'asc');

    const artifacts = artifactRows.map(artifactRow => artifactRow.value);

    return {
      ...job,
      artifacts,
    };
  }

  async listJobs({ moduleId }: { moduleId: string }): Promise<Job[]> {
    this.#logger.info(`listJobs called for moduleId: ${moduleId}`);

    // Fetch all jobs for the given module
    const rows = await this.#dbClient('jobs')
      .where('module_id', moduleId)
      .select('*')
      .orderBy('started_at', 'desc');

    if (rows.length === 0) {
      return [];
    }

    const jobIds = rows.map(row => row.id);

    // Fetch all artifacts for these jobs in a single query
    const artifactRows = await this.#dbClient('artifacts')
      .whereIn('job_id', jobIds)
      .select('job_id', 'value')
      .orderBy('id', 'asc');

    // Group artifacts by job_id
    const artifactsByJobId = new Map<string, string[]>();
    for (const artifactRow of artifactRows) {
      if (!artifactsByJobId.has(artifactRow.job_id)) {
        artifactsByJobId.set(artifactRow.job_id, []);
      }
      artifactsByJobId.get(artifactRow.job_id)!.push(artifactRow.value);
    }

    // Build jobs with their artifacts
    const jobs: Job[] = rows.map(row => {
      const job = this.mapRowToJob(row);
      return {
        ...job,
        artifacts: artifactsByJobId.get(job.id) || [],
      };
    });

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
    artifacts,
  }: {
    id: string;
    log?: string | null;
    finishedAt?: Date | null;
    status?: JobStatus;
    artifacts?: string[];
  }): Promise<Job | undefined> {
    this.#logger.info(`updateJob called for id: ${id}`);

    // Check if job exists
    const existingJob = await this.getJob({ id });
    if (!existingJob) {
      this.#logger.warn(`No job found with id: ${id}`);
      return undefined;
    }

    // Update job fields
    const updateData: any = {};
    if (log !== undefined) {
      updateData.log = log;
    }
    if (finishedAt !== undefined) {
      updateData.finished_at = finishedAt;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    if (Object.keys(updateData).length > 0) {
      await this.#dbClient('jobs').where('id', id).update(updateData);
    }

    // Update artifacts if provided
    if (artifacts !== undefined) {
      // Delete existing artifacts
      await this.#dbClient('artifacts').where('job_id', id).delete();

      // Insert new artifacts
      if (artifacts.length > 0) {
        const artifactRows = artifacts.map(artifact => ({
          id: crypto.randomUUID(),
          value: artifact,
          job_id: id,
        }));
        await this.#dbClient('artifacts').insert(artifactRows);
      }
    }

    // Return updated job
    return this.getJob({ id });
  }

  async deleteJob({ id }: { id: string }): Promise<number> {
    this.#logger.info(`deleteJob called for id: ${id}`);

    // Delete from the database (artifacts will be deleted automatically due to CASCADE)
    const deletedCount = await this.#dbClient('jobs').where('id', id).delete();

    if (deletedCount === 0) {
      this.#logger.warn(`No job found with id: ${id}`);
    } else {
      this.#logger.info(`Deleted job with id: ${id}`);
    }

    return deletedCount;
  }
}

export const x2aDatabaseServiceRef = createServiceRef<
  Expand<X2ADatabaseService>
>({
  id: 'x2a-database',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
      },
      async factory(deps) {
        return X2ADatabaseService.create({
          ...deps,
          dbClient: await deps.database.getClient(),
        });
      },
    }),
});
