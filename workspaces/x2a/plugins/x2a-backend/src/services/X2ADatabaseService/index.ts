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
  LoggerService,
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import { DatabaseManager } from '@backstage/backend-defaults/database';
import {
  Project,
  Module,
  Job,
  JobStatusEnum,
  MigrationPhase,
  Artifact,
  Telemetry,
  ProjectStatusState,
  DEFAULT_PAGE_ORDER,
  DEFAULT_PAGE_SIZE,
  IN_MEMORY_SORT_WARN_THRESHOLD,
  ProjectsGet,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import {
  x2aDatabaseServiceRef,
  type X2ADatabaseServiceApi,
  type CreateJobInput,
} from '@red-hat-developer-hub/backstage-plugin-x2a-node';

import { JobOperations } from './jobOperations';
import { ModuleOperations } from './moduleOperations';
import { ProjectOperations } from './projectOperations';
import { isNonDbSortField } from './queryHelpers';
import { removeSensitiveFromJob } from '../../router/common';
import { MAX_CONCURRENT_ENRICHMENT_JOBS } from '../constants';
import { migrate } from '../dbMigrate';
import { maxConcurrency } from '../../utils';
import { calculateModuleStatus, calculateProjectStatus } from './status';

export class X2ADatabaseService implements X2ADatabaseServiceApi {
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

    project.initJob = removeSensitiveFromJob(lastInitJob);
  }

  // Projects (facade enriches basic objects when needed)

  async createProject(
    input: {
      name: string;
      ownedByGroup?: string;
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

  /**
   * Semantic ordering for ProjectStatusState.
   * Lower values appear first in ascending sort.
   */
  static readonly STATE_ORDER: Record<ProjectStatusState, number> = {
    created: 0,
    initializing: 1,
    initialized: 2,
    inProgress: 3,
    failed: 4,
    completed: 5,
  };

  async listProjects(
    query: ProjectsGet['query'],
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
      groupsOfUser: string[];
    },
  ): Promise<{ projects: Project[]; totalCount: number }> {
    const sortByComputedField = isNonDbSortField(query.sort);

    const result = await this.#projectOps.listProjects(query, options, {
      skipPagination: sortByComputedField,
    });

    if (
      sortByComputedField &&
      result.totalCount > IN_MEMORY_SORT_WARN_THRESHOLD
    ) {
      // If this proves to be a performance bottleneck, let's consider either
      // removing the sort by status
      // or having materialized DB column (works with Postgres only)
      // or introducing a separate complex DB SELECT for the case of sorting
      // by status which will join/group jobs.
      this.#logger.warn(
        `In-memory sort by "${query.sort}" is loading ${result.totalCount} projects.`,
      );
    }

    this.#logger.info(
      `this.#projectOps.listProjects finished, adding migration plans to projects`,
    );
    await maxConcurrency(
      result.projects.map(p => () => this.enrichProject(p)),
      MAX_CONCURRENT_ENRICHMENT_JOBS,
    );

    if (sortByComputedField) {
      this.sortAndPaginateInMemory(result, query);
    }

    return result;
  }

  /**
   * Sort enriched projects by a computed field and apply pagination in memory.
   * Used when the sort field (e.g. "status") has no DB column.
   */
  private sortAndPaginateInMemory(
    result: { projects: Project[]; totalCount: number },
    query: ProjectsGet['query'],
  ): void {
    const order = query.order || DEFAULT_PAGE_ORDER;

    if (query.sort === 'status') {
      const summaryKeys = [
        'finished',
        'error',
        'running',
        'waiting',
        'pending',
        'cancelled',
      ] as const;

      const sign = order === 'asc' ? 1 : -1;

      const stateRank = (p: Project): number =>
        X2ADatabaseService.STATE_ORDER[p.status?.state as ProjectStatusState] ??
        99;

      result.projects.sort((a, b) => {
        // Primary: project-level state (created to completed).
        const stateCmp = stateRank(a) - stateRank(b);
        if (stateCmp !== 0) return sign * stateCmp;

        // Secondary: compare module-summary proportions in priority order
        // (finished to cancelled) so projects further along sort first.
        // Cross-multiplication (a/b vs c/d to a*d vs c*b) avoids floating-point
        // division. The sign is preserved because both totals are non-negative.
        const sumA = a.status?.modulesSummary;
        const sumB = b.status?.modulesSummary;
        const totalA = sumA?.total || 0;
        const totalB = sumB?.total || 0;

        for (const key of summaryKeys) {
          const diff =
            (sumA?.[key] ?? 0) * totalB - (sumB?.[key] ?? 0) * totalA;
          if (diff !== 0) return sign * diff;
        }

        return 0;
      });
    } else {
      this.#logger.error(
        `No in-memory sort implementation for computed field "${query.sort}", result will be unsorted.`,
      );
    }

    const pageSize = query.pageSize || DEFAULT_PAGE_SIZE;
    const page = query.page || 0;
    const start = page * pageSize;
    result.projects = result.projects.slice(start, start + pageSize);
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
      groupsOfUser: string[];
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
      groupsOfUser: string[];
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
      const migrateJob = removeSensitiveFromJob(
        lastMigrateJobsOfModules[idxModule][0],
      );
      const publish = removeSensitiveFromJob(
        lastPublishJobsOfModules[idxModule][0],
      );
      const lastJobs = { analyze, migrate: migrateJob, publish };
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
    commitId?: string;
  }): Promise<Job | undefined> {
    return this.#jobOps.updateJob(update);
  }

  async deleteJob({ id }: { id: string }): Promise<number> {
    return this.#jobOps.deleteJob({ id });
  }
}

// Re-export the canonical service ref from x2a-node.
// All plugins MUST use the same ref object so Backstage can wire deps.
export { x2aDatabaseServiceRef } from '@red-hat-developer-hub/backstage-plugin-x2a-node';

/**
 * Service factory for the X2A database service.
 *
 * Must be registered explicitly in the backend app via `backend.add(...)`.
 * @public
 */
export const x2aDatabaseServiceFactory = createServiceFactory({
  service: x2aDatabaseServiceRef,
  deps: {
    logger: coreServices.rootLogger,
    config: coreServices.rootConfig,
    lifecycle: coreServices.rootLifecycle,
  },
  async factory(deps) {
    // coreServices.database is plugin-scoped, but this ref is root-scoped
    // (shared across plugins). We construct DatabaseManager directly so the
    // factory can be registered at root scope while still targeting the 'x2a'
    // plugin database.
    const dbManager = DatabaseManager.fromConfig(deps.config, {
      rootLogger: deps.logger,
      rootLifecycle: deps.lifecycle,
    });
    const database = dbManager.forPlugin('x2a', {
      logger: deps.logger,
      lifecycle: deps.lifecycle,
    });
    await migrate(database);
    return X2ADatabaseService.create({
      logger: deps.logger,
      dbClient: await database.getClient(),
    });
  },
});
