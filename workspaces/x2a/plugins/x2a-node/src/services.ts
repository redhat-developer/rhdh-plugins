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
  createServiceRef,
  type BackstageCredentials,
  type BackstageUserPrincipal,
  type LoggerService,
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

/**
 * X2A configuration structure.
 * Runtime type extracted from `app-config.yaml` under the `x2a` key.
 * Defaults for optional values are defined in `x2a-backend/src/services/constants.ts`.
 * @public
 */
export interface X2AConfig {
  kubernetes: {
    namespace: string;
    image: string;
    imageTag: string;
    ttlSecondsAfterFinished: number;
    resources: {
      requests: {
        cpu: string;
        memory: string;
      };
      limits: {
        cpu: string;
        memory: string;
      };
    };
  };
  git?: {
    author?: {
      name: string;
      email: string;
    };
  };
  credentials: {
    llm: Record<string, string>;
    aap?: {
      url: string;
      orgName: string;
      oauthToken?: string;
      username?: string;
      password?: string;
      skipSSLVerification?: boolean;
    };
  };
}

/** @public */
export interface JobStatusInfo {
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

/** @public */
export interface CreateJobInput {
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
}

/** @public */
export type GitRepo = {
  url: string;
  branch: string;
  token: string;
};

/** @public */
export interface AAPCredentials {
  url: string;
  orgName: string;
  oauthToken?: string;
  username?: string;
  password?: string;
}

/** @public */
export interface JobCreateParams {
  jobId: string;
  projectId: string;
  projectName: string;
  projectAbbrev: string;
  phase: MigrationPhase;
  user: string;
  userPrompt?: string;
  callbackToken: string;
  callbackUrl: string;
  moduleId?: string;
  moduleName?: string;
  sourceRepo: GitRepo;
  targetRepo: GitRepo;
  aapCredentials?: AAPCredentials;
}

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

/**
 * Public API surface of the X2A Kubernetes service.
 *
 * The implementation lives in `x2a-backend` (`KubeService` class).
 * Only methods whose signatures do not require `@kubernetes/client-node` types
 * are included; this keeps the node-library free of heavy dependencies.
 *
 * @public
 */
export interface KubeServiceApi {
  createJob(params: JobCreateParams): Promise<{ k8sJobName: string }>;
  getJobStatus(k8sJobName: string): Promise<JobStatusInfo>;
  getJobLogs(
    k8sJobName: string,
    streaming?: boolean,
  ): Promise<string | NodeJS.ReadableStream>;
  deleteJob(k8sJobName: string): Promise<void>;
}

/**
 * Dependencies for {@link reconcileJobStatus}.
 * @public
 */
export interface ReconcileJobDeps {
  kubeService: KubeServiceApi;
  x2aDatabase: X2ADatabaseServiceApi;
  logger: LoggerService;
}

// Service ref IDs -- keep in sync with x2a-backend's refs.
// See serviceRefSync.test.ts in x2a-backend for the guard test.

/** @public */
export const X2A_DATABASE_SERVICE_ID = 'x2a-database';

/** @public */
export const KUBE_SERVICE_ID = 'x2a-kubernetes';

// ---------------------------------------------------------------------------
// Canonical service refs — the ONLY refs all x2a plugins should use.
//
// These refs have no defaultFactory. The backend app must register the
// matching factories (exported by x2a-backend) via backend.add(...).
// ---------------------------------------------------------------------------

/**
 * Service ref for the X2A database service (root-scoped).
 *
 * The factory is exported by `x2a-backend` as `x2aDatabaseServiceFactory`
 * and must be registered in the backend app.
 *
 * @public
 */
export const x2aDatabaseServiceRef = createServiceRef<X2ADatabaseServiceApi>({
  id: X2A_DATABASE_SERVICE_ID,
  scope: 'root',
});

/**
 * Service ref for the X2A Kubernetes service.
 *
 * The factory is exported by `x2a-backend` as `kubeServiceFactory`
 * and must be registered in the backend app.
 *
 * @public
 */
export const kubeServiceRef = createServiceRef<KubeServiceApi>({
  id: KUBE_SERVICE_ID,
});
