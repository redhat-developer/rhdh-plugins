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
  Module,
  Job,
  JobStatusEnum,
  MigrationPhase,
  Artifact,
  Telemetry,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { ProjectsGet } from '../../schema/openapi';

import { JobOperations, CreateJobInput } from './jobOperations';
import { ModuleOperations } from './moduleOperations';
import { ProjectOperations } from './projectOperations';

export class X2ADatabaseService {
  readonly #logger: LoggerService;
  readonly #projectOps: ProjectOperations;
  readonly #moduleOps: ModuleOperations;
  readonly #jobOps: JobOperations;

  static create(options: { logger: LoggerService; dbClient: Knex }) {
    return new X2ADatabaseService(options.logger, options.dbClient);
  }

  private constructor(logger: LoggerService, dbClient: Knex) {
    this.#logger = logger;
    this.#projectOps = new ProjectOperations(logger, dbClient);
    this.#moduleOps = new ModuleOperations(logger, dbClient);
    this.#jobOps = new JobOperations(logger, dbClient);
  }

  private async getMigrationPlanForProject(
    projectId: string,
  ): Promise<Artifact | undefined> {
    const lastInitJob = await this.#jobOps.listJobs({
      projectId,
      phase: 'init',
      lastJobOnly: true,
    });
    if (lastInitJob.length === 0) return undefined;
    return lastInitJob[0].artifacts?.find(
      artifact => artifact.type === 'migration_plan',
    );
  }

  // Projects (facade enriches basic objects when needed)

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
    return this.#projectOps.createProject(input, options);
  }

  async listProjects(
    query: ProjectsGet['query'],
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
    },
  ): Promise<{ projects: Project[]; totalCount: number }> {
    const result = await this.#projectOps.listProjects(query, options);

    this.#logger.info(
      `this.#projectOps.listProjects finished, adding migration plans to projects`,
    );
    await Promise.all(
      result.projects.map(async project => {
        project.migrationPlan = await this.getMigrationPlanForProject(
          project.id,
        );
      }),
    );
    return result;
  }

  async getProject(
    { projectId }: { projectId: string },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
    },
  ): Promise<Project | undefined> {
    const project = await this.#projectOps.getProject({ projectId }, options);
    if (!project) return undefined;
    this.#logger.info(
      `this.#projectOps.getProject finished, adding migration plan to project`,
    );
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
    return this.#projectOps.deleteProject({ projectId }, options);
  }

  // Modules

  async createModule(module: {
    name: string;
    sourcePath: string;
    projectId: string;
  }): Promise<Module> {
    return this.#moduleOps.createModule(module);
  }

  async getModule({ id }: { id: string }): Promise<Module | undefined> {
    return this.#moduleOps.getModule({ id });
  }

  async listModules({ projectId }: { projectId: string }): Promise<Module[]> {
    return this.#moduleOps.listModules({ projectId });
  }

  async deleteModule({ id }: { id: string }): Promise<number> {
    return this.#moduleOps.deleteModule({ id });
  }

  // Jobs

  async createJob(job: CreateJobInput): Promise<Job> {
    return this.#jobOps.createJob(job);
  }

  async getJob({ id }: { id: string }): Promise<Job | undefined> {
    return this.#jobOps.getJob({ id });
  }

  async getJobWithLog({
    id,
  }: {
    id: string;
  }): Promise<(Job & { log?: string | null }) | undefined> {
    return this.#jobOps.getJobWithLog({ id });
  }

  async getJobLogs({ jobId }: { jobId: string }): Promise<string | undefined> {
    return this.#jobOps.getJobLogs({ jobId });
  }

  async listJobsForProject({
    projectId,
  }: {
    projectId: string;
  }): Promise<Job[]> {
    return this.#jobOps.listJobsForProject({ projectId });
  }

  async listJobsForModule({
    projectId,
    moduleId,
  }: {
    projectId: string;
    moduleId: string;
  }): Promise<Job[]> {
    return this.#jobOps.listJobsForModule({ projectId, moduleId });
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
    return this.#jobOps.listJobs({
      projectId,
      moduleId,
      phase,
      lastJobOnly,
    });
  }

  async updateJob(update: {
    id: string;
    log?: string | null;
    finishedAt?: Date | null;
    status?: JobStatusEnum;
    errorDetails?: string | null;
    k8sJobName?: string | null;
    artifacts?: Artifact[];
    telemetry?: Telemetry | null;
  }): Promise<Job | undefined> {
    return this.#jobOps.updateJob(update);
  }

  async deleteJob({ id }: { id: string }): Promise<number> {
    return this.#jobOps.deleteJob({ id });
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
