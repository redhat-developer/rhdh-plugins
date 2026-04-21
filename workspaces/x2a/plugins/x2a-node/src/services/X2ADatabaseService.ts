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

import type {
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import type {
  Project,
  Module,
  Job,
  JobStatusEnum,
  MigrationPhase,
  Artifact,
  Telemetry,
  ProjectsGet,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { CreateJobInput } from './types';

/**
 * Public API surface of the X2A database service.
 *
 * The implementation lives in `x2a-backend` (`X2ADatabaseService` class).
 * This interface is the contract that consumer plugins (e.g. `x2a-mcp-extras`) depend on.
 *
 * @public
 */
export interface X2ADatabaseServiceApi {
  createProject(
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
  ): Promise<Project>;

  listProjects(
    query: ProjectsGet['query'],
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
      groupsOfUser: string[];
    },
  ): Promise<{ projects: Project[]; totalCount: number }>;

  getProject(
    args: { projectId: string; skipEnrichment?: boolean },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
      groupsOfUser: string[];
    },
  ): Promise<Project | undefined>;

  deleteProject(
    args: { projectId: string },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canWriteAll?: boolean;
      groupsOfUser: string[];
    },
  ): Promise<number>;

  createModule(module: {
    name: string;
    sourcePath: string;
    projectId: string;
  }): Promise<Module>;

  getModule(args: {
    id: string;
    skipEnrichment?: boolean;
  }): Promise<Module | undefined>;

  listModules(args: { projectId: string }): Promise<Module[]>;

  deleteModule(args: { id: string }): Promise<number>;

  createJob(job: CreateJobInput): Promise<Job>;

  getJob(args: { id: string }): Promise<Job | undefined>;

  getJobWithLog(args: {
    id: string;
  }): Promise<(Job & { log?: string | null }) | undefined>;

  getJobLogs(args: { jobId: string }): Promise<string | undefined>;

  listJobsForProject(args: { projectId: string }): Promise<Job[]>;

  listJobsForModule(args: {
    projectId: string;
    moduleId: string;
  }): Promise<Job[]>;

  listJobs(args: {
    projectId: string;
    moduleId?: string;
    phase?: MigrationPhase;
    lastJobOnly?: boolean;
  }): Promise<Job[]>;

  updateJob(update: {
    id: string;
    log?: string | null;
    finishedAt?: Date | null;
    status?: JobStatusEnum;
    errorDetails?: string | null;
    k8sJobName?: string | null;
    artifacts?: Artifact[];
    telemetry?: Telemetry | null;
    commitId?: string;
  }): Promise<Job | undefined>;

  deleteJob(args: { id: string }): Promise<number>;
}
