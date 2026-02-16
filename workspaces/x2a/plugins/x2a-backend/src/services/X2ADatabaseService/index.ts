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
import { removeSensitiveFromJob } from '../../router/common';
import { calculateModuleStatus, calculateProjectStatus } from './status';

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

  /**
   * Enriches a project with migration plan and status (used by listProjects and getProject).
   */
  private async enrichProject(project: Project): Promise<void> {
    const projectId = project.id;

    const initJob = await this.listJobs({
      projectId,
      phase: 'init',
      lastJobOnly: true,
    });
    const lastInitJob = initJob[0];

    project.status = calculateProjectStatus(
      await this.listModules({ projectId }),
      lastInitJob,
    );

    project.migrationPlan = lastInitJob?.artifacts?.find(
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
    await Promise.all(result.projects.map(p => this.enrichProject(p)));
    return result;
  }

  /**
   *  Use skipEnrichment to avoid fetching the migration plan and status for a project.
   */
  async getProject(
    {
      projectId,
      skipEnrichment = false,
    }: { projectId: string; skipEnrichment?: boolean },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
    },
  ): Promise<Project | undefined> {
    const project = await this.#projectOps.getProject({ projectId }, options);
    if (!project) return undefined;

    this.#logger.debug(
      `this.#projectOps.getProject finished, adding migration plan and status to project`,
    );
    if (!skipEnrichment) {
      await this.enrichProject(project);
    }
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

  async getModule({
    id,
    skipEnrichment = false,
  }: {
    id: string;
    skipEnrichment?: boolean;
  }): Promise<Module | undefined> {
    const module = await this.#moduleOps.getModule({ id });
    if (!module) return undefined;

    if (!skipEnrichment) {
      // Fetch last jobs
      const lastAnalyzeJobsOfModule = await this.listJobs({
        projectId: module.projectId,
        moduleId: id,
        phase: 'analyze',
        lastJobOnly: true,
      });
      const lastMigrateJobsOfModule = await this.listJobs({
        projectId: module.projectId,
        moduleId: id,
        phase: 'migrate',
        lastJobOnly: true,
      });
      const lastPublishJobsOfModule = await this.listJobs({
        projectId: module.projectId,
        moduleId: id,
        phase: 'publish',
        lastJobOnly: true,
      });

      // Update module with last jobs
      module.analyze = removeSensitiveFromJob(lastAnalyzeJobsOfModule[0]);
      module.migrate = removeSensitiveFromJob(lastMigrateJobsOfModule[0]);
      module.publish = removeSensitiveFromJob(lastPublishJobsOfModule[0]);

      const { status, errorDetails } = calculateModuleStatus({
        analyze: module.analyze,
        migrate: module.migrate,
        publish: module.publish,
      });
      module.status = status;
      module.errorDetails = errorDetails;
    }

    return module;
  }

  async listModules({ projectId }: { projectId: string }): Promise<Module[]> {
    const modules = await this.#moduleOps.listModules({ projectId });
    // TODO: This can be optimized by using a single query to list all jobs for all modules.
    const lastAnalyzeJobsOfModules = await Promise.all(
      modules.map(module =>
        this.listJobs({
          projectId,
          moduleId: module.id,
          phase: 'analyze',
          lastJobOnly: true,
        }),
      ),
    );
    const lastMigrateJobsOfModules = await Promise.all(
      modules.map(module =>
        this.listJobs({
          projectId,
          moduleId: module.id,
          phase: 'migrate',
          lastJobOnly: true,
        }),
      ),
    );
    const lastPublishJobsOfModules = await Promise.all(
      modules.map(module =>
        this.listJobs({
          projectId,
          moduleId: module.id,
          phase: 'publish',
          lastJobOnly: true,
        }),
      ),
    );

    const response: Array<Module> = modules.map((module, idxModule) => {
      const analyze = removeSensitiveFromJob(
        lastAnalyzeJobsOfModules[idxModule][0],
      );
      const migrate = removeSensitiveFromJob(
        lastMigrateJobsOfModules[idxModule][0],
      );
      const publish = removeSensitiveFromJob(
        lastPublishJobsOfModules[idxModule][0],
      );
      const lastJobs = { analyze, migrate, publish };
      return {
        ...module,
        ...lastJobs,
        ...calculateModuleStatus(lastJobs),
      };
    });

    return response;
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
