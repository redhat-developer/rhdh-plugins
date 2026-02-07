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
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  LoggerService,
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import { Expand } from '@backstage/types';
import {
  Project,
  DEFAULT_PAGE_ORDER,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SORT,
  JobStatusEnum,
  Module,
  Job,
  MigrationPhase,
  Artifact,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { ProjectsGet } from '../schema/openapi';

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
      sourceRepoUrl: row.source_repo_url,
      targetRepoUrl: row.target_repo_url,
      sourceRepoBranch: row.source_repo_branch,
      targetRepoBranch: row.target_repo_branch,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    };
  }

  // Map REST sort param to database column name
  private mapSortToDatabaseColumn(sort?: string): string | undefined {
    const mapping = {
      createdAt: 'created_at',
      createdBy: 'created_by',
      finishedAt: 'finished_at',
      startedAt: 'started_at',
    };

    return sort ? mapping[sort as keyof typeof mapping] || sort : undefined;
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
  private mapRowToJob(row: any): Job & { callbackToken?: string } {
    return {
      id: row.id,
      projectId: row.project_id,
      moduleId: row.module_id,
      startedAt: row.started_at ? new Date(row.started_at) : new Date(),
      finishedAt: row.finished_at ? new Date(row.finished_at) : undefined,
      status: (row.status || 'pending') as JobStatusEnum,
      phase: row.phase,
      errorDetails: row.error_details,
      k8sJobName: row.k8s_job_name,
      callbackToken: row.callback_token,
    };
  }

  // Map a database row to an Artifact object
  private mapRowToArtifact(row: any): Artifact {
    return {
      id: row.id,
      type: row.type,
      value: row.value,
    };
  }

  /**
   * Load the migration plan artifact for a project (from the latest init job).
   * Reused by getProject() and listProjects().
   */
  private async getMigrationPlanForProject(
    projectId: string,
  ): Promise<Artifact | undefined> {
    const lastInitJob = await this.listJobs({
      projectId,
      phase: 'init',
      lastJobOnly: true,
    });
    if (lastInitJob.length === 0) return undefined;
    return lastInitJob[0].artifacts?.find(
      artifact => artifact.type === 'migration_plan',
    );
  }

  // Filter query by user permissions
  private filterPermissions(
    queryBuilder: Knex.QueryBuilder,
    canDoAll: boolean | undefined,
    userEntityRef: string,
  ): void {
    if (!canDoAll) {
      // Filter by the user who created the project.
      // For admins, the WHERE clause is not applied so matching all records.
      // If multiple non-admin users are allowed to do the action, we need to
      // either pass their full list here or do the permission check outside of the DB
      queryBuilder.where('created_by', userEntityRef);
    }
  }

  async createProject(
    input: {
      name: string;
      abbreviation: string;
      description: string;
      sourceRepoUrl: string;
      targetRepoUrl: string;
      sourceRepoBranch: string;
      targetRepoBranch: string;
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
      sourceRepoUrl: input.sourceRepoUrl,
      targetRepoUrl: input.targetRepoUrl,
      sourceRepoBranch: input.sourceRepoBranch,
      targetRepoBranch: input.targetRepoBranch,
      createdBy,
      createdAt,
    };

    // Persist in the database
    await this.#dbClient('projects').insert({
      id,
      name: input.name,
      abbreviation: input.abbreviation,
      description: input.description,
      source_repo_url: input.sourceRepoUrl,
      target_repo_url: input.targetRepoUrl,
      source_repo_branch: input.sourceRepoBranch,
      target_repo_branch: input.targetRepoBranch,
      created_by: createdBy,
      created_at: createdAt,
    });

    this.#logger.info(`Created new project: ${JSON.stringify(newProject)}`);

    return newProject;
  }

  async listProjects(
    query: ProjectsGet['query'],
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
    },
  ): Promise<{ projects: Project[]; totalCount: number }> {
    const calledByUserRef = options.credentials.principal.userEntityRef;
    this.#logger.info(`listProjects called by ${calledByUserRef}`);

    const pageSize = query.pageSize || DEFAULT_PAGE_SIZE;
    // Fetch all records from the database
    const rows = await this.#dbClient('projects')
      .limit(pageSize)
      .offset((query.page || 0) * pageSize)
      .select('*')
      .modify(queryBuilder =>
        this.filterPermissions(
          queryBuilder,
          options.canViewAll,
          calledByUserRef,
        ),
      )
      .orderBy(
        this.mapSortToDatabaseColumn(query.sort) || DEFAULT_PAGE_SORT,
        query.order || DEFAULT_PAGE_ORDER,
      );

    const totalCount = (await this.#dbClient('projects')
      .count('*', { as: 'count' })
      .modify(queryBuilder =>
        this.filterPermissions(
          queryBuilder,
          options.canViewAll,
          calledByUserRef,
        ),
      )
      .first()) as { count: any };

    const projects: Project[] = rows.map(this.mapRowToProject);

    // This can be optimized by using a single query to get all the migration plan artifacts for all projects but the query is pretty complex to maintain.
    // Thanks to pagination, this should not be a bottleneck.
    await Promise.all(
      projects.map(async project => {
        project.migrationPlan = await this.getMigrationPlanForProject(
          project.id,
        );
      }),
    );

    this.#logger.debug(
      `Fetched ${projects.length} out of ${totalCount.count} projects from database (permissions applied)`,
    );

    return { projects, totalCount: Number.parseInt(totalCount.count, 10) };
  }

  async getProject(
    {
      projectId,
    }: {
      projectId: string;
    },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
    },
  ): Promise<Project | undefined> {
    const calledByUserRef = options.credentials.principal.userEntityRef;
    this.#logger.info(
      `getProject called for projectId: ${projectId} by ${calledByUserRef}`,
    );

    const row = await this.#dbClient('projects')
      .where('id', projectId)
      .modify(queryBuilder =>
        this.filterPermissions(
          queryBuilder,
          options.canViewAll,
          calledByUserRef,
        ),
      )
      .first();
    if (!row) {
      return undefined;
    }
    const project = this.mapRowToProject(row);
    project.migrationPlan = await this.getMigrationPlanForProject(project.id);
    return project;
  }

  async deleteProject(
    { projectId }: { projectId: string },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canWriteAll?: boolean;
    },
  ): Promise<number> {
    const calledByUserRef = options.credentials.principal.userEntityRef;
    this.#logger.info(
      `deleteProject called for projectId: ${projectId} by ${calledByUserRef}`,
    );

    // Delete from the database
    const deletedCount = await this.#dbClient('projects')
      .where('id', projectId)
      .modify(queryBuilder =>
        this.filterPermissions(
          queryBuilder,
          options.canWriteAll,
          calledByUserRef,
        ),
      )
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

  /**
   * List modules for the given project without loading jobs
   */
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
    const startedAt = job.startedAt || new Date();
    const finishedAt = job.finishedAt || null;
    const status = job.status || 'pending';
    const artifacts = job.artifacts || [];

    // Persist the job in the database
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

    // Insert artifacts if provided
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

  async getJob({ id }: { id: string }): Promise<Job | undefined> {
    this.#logger.info(`getJob called for id: ${id}`);

    // Fetches log as well
    const row = await this.#dbClient('jobs')
      .where('id', id)
      // we need to name all the columns to avoid the expensive "log" column to be loaded
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

    const job = this.mapRowToJob(row);

    // Fetch artifacts for this job
    const artifactRows = await this.#dbClient('artifacts')
      .where('job_id', id)
      .select('*')
      .orderBy('id', 'asc');

    const artifacts: Artifact[] = artifactRows.map(this.mapRowToArtifact);

    return {
      ...job,
      artifacts,
    };
  }

  /**
   * Logs can be pretty large, we do not load them unless requested.
   */
  async getJobLogs({ jobId }: { jobId: string }): Promise<string | undefined> {
    this.#logger.info(`getJobLogs called for id: ${jobId}`);
    const row = await this.#dbClient('jobs').where('id', jobId).first();
    return row ? row.log : undefined;
  }

  /**
   * List jobs for the given module.
   * If lastJobOnly is true, only the last job will be returned.
   * Otherwise, all jobs will be returned.
   *
   * @returns List of jobs for the given module
   */
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

    // Fetch all jobs for the given module
    const rows: Job[] = await this.#dbClient('jobs')
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
      // we need to name all the columns to avoid the expensive "log" column to be loaded
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

    if (rows.length === 0) {
      return [];
    }

    const jobIds = rows.map((row: any) => row.id);

    // Fetch all artifacts for these jobs in a single query
    const artifactRows: (Artifact & { job_id: string })[] =
      await this.#dbClient('artifacts')
        .whereIn('job_id', jobIds)
        .select('*')
        .orderBy('id', 'asc');

    // Group artifacts by job_id
    const artifactsByJobId = new Map<string, Artifact[]>();
    artifactRows.forEach(artifact => {
      const jobId = artifact.job_id;
      if (jobId) {
        artifactsByJobId.set(jobId, [
          ...(artifactsByJobId.get(jobId) || []),
          artifact,
        ]);
      }
    });

    // Build jobs with their artifacts
    const jobs: Job[] = rows.map((row: any) => {
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
    if (errorDetails !== undefined) {
      updateData.error_details = errorDetails;
    }
    if (k8sJobName !== undefined) {
      updateData.k8s_job_name = k8sJobName;
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
          id: artifact.id ?? crypto.randomUUID(),
          type: artifact.type,
          value: artifact.value,
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
