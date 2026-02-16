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
  mockCredentials,
  mockErrorHandler,
  mockServices,
  TestDatabaseId,
  TestDatabases,
} from '@backstage/backend-test-utils';
import express from 'express';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { ProjectsPostRequest } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { Knex } from 'knex';

import { createRouter } from '..';
import { X2ADatabaseService } from '../../services/X2ADatabaseService';
import { migrate } from '../../services/dbMigrate';

const databases = TestDatabases.create({
  ids: ['SQLITE_3', 'POSTGRES_18'],
});
export const supportedDatabaseIds = databases.eachSupportedId();
export const clientsToDestroy: Knex[] = [];

export const mockInputProject: ProjectsPostRequest = {
  name: 'Mock Project',
  description: 'Mock Description',
  abbreviation: 'MP',
  sourceRepoUrl: 'https://github.com/source/repo',
  targetRepoUrl: 'https://github.com/target/repo',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
};

export const mockProject2: ProjectsPostRequest = {
  name: 'Another Project',
  description: 'Another Description',
  abbreviation: 'AP',
  sourceRepoUrl: 'https://github.com/source/repo2',
  targetRepoUrl: 'https://github.com/target/repo2',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
};

// Helper functions for test data setup
export async function createTestProject(
  x2aDatabase: X2ADatabaseService,
  projectData: ProjectsPostRequest = mockInputProject,
  userRef: string = 'user:default/mock',
) {
  return x2aDatabase.createProject(projectData, {
    credentials: mockCredentials.user(userRef),
  });
}

export async function createTestModule(
  x2aDatabase: X2ADatabaseService,
  projectId: string,
  moduleData: { name: string; sourcePath: string } = {
    name: 'Test Module',
    sourcePath: '/test/path',
  },
) {
  return x2aDatabase.createModule({
    ...moduleData,
    projectId,
  });
}

export async function createTestJob(
  x2aDatabase: X2ADatabaseService,
  jobData: {
    projectId: string;
    moduleId: string | null;
    phase: 'init' | 'analyze' | 'migrate' | 'publish';
    status?: 'pending' | 'running' | 'success' | 'error';
    log?: string;
    k8sJobName?: string;
  },
) {
  const job = await x2aDatabase.createJob({
    projectId: jobData.projectId,
    moduleId: jobData.moduleId,
    phase: jobData.phase,
    status: jobData.status || 'pending',
    callbackToken: 'test-token',
  });

  if (jobData.log || jobData.k8sJobName || jobData.status) {
    await x2aDatabase.updateJob({
      id: job.id,
      ...(jobData.log && { log: jobData.log }),
      ...(jobData.k8sJobName && { k8sJobName: jobData.k8sJobName }),
      ...(jobData.status && { status: jobData.status }),
    });
  }

  return job;
}

export async function createApp(
  client: Knex,
  authorizeResult?: AuthorizeResult,
  adminWriteResult?: AuthorizeResult,
  kubeServiceOverrides?: Record<string, unknown>,
  adminViewResult?: AuthorizeResult,
): Promise<express.Express> {
  const x2aDatabase = X2ADatabaseService.create({
    logger: mockServices.logger.mock(),
    dbClient: client,
  });
  const router = await createRouter({
    httpAuth: mockServices.httpAuth(),
    logger: mockServices.logger.mock(),
    permissionsSvc: mockServices.permissions.mock({
      authorize: async (
        requests: {
          permission?: { name?: string; attributes?: { action?: string } };
        }[],
      ) => {
        // Check which permission is being requested
        const permission = requests[0]?.permission;
        if (
          permission?.name === 'x2a.admin' &&
          permission?.attributes?.action === 'update'
        ) {
          // This is x2aAdminWritePermission
          return [
            {
              result:
                adminWriteResult ?? authorizeResult ?? AuthorizeResult.ALLOW,
            },
          ] as any;
        }
        if (
          permission?.name === 'x2a.admin' &&
          permission?.attributes?.action === 'read'
        ) {
          // This is x2aAdminViewPermission
          return [
            {
              result:
                adminViewResult ?? authorizeResult ?? AuthorizeResult.ALLOW,
            },
          ] as any;
        }
        // Default to the provided authorizeResult or ALLOW
        return [{ result: authorizeResult ?? AuthorizeResult.ALLOW }] as any;
      },
    }),
    discoveryApi: {
      getBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007/api/x2a'),
      getExternalBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007'),
    },
    config: mockServices.rootConfig({
      data: {
        x2a: {
          kubernetes: {
            namespace: 'test-namespace',
            image: 'test-image',
            imageTag: 'test',
            ttlSecondsAfterFinished: 86400,
            resources: {
              requests: { cpu: '100m', memory: '128Mi' },
              limits: { cpu: '200m', memory: '256Mi' },
            },
          },
          credentials: {
            llm: { LLM_MODEL: 'test-model' },
          },
        },
      },
    }),
    x2aDatabase,
    kubeService: {
      createProjectSecret: jest.fn().mockResolvedValue(undefined),
      getProjectSecret: jest.fn().mockResolvedValue(null),
      deleteProjectSecret: jest.fn().mockResolvedValue(undefined),
      createJobSecret: jest.fn().mockResolvedValue(undefined),
      createJob: jest.fn().mockResolvedValue({ k8sJobName: 'test-job' }),
      getJobStatus: jest.fn().mockResolvedValue('pending'),
      getJobLogs: jest.fn().mockResolvedValue(''),
      deleteJob: jest.fn().mockResolvedValue(undefined),
      listJobsForProject: jest.fn().mockResolvedValue([]),
      getPods: jest.fn().mockResolvedValue({ items: [] }),
      ...kubeServiceOverrides,
    },
  });

  const app = express();
  app.use(router);
  app.use(mockErrorHandler());

  return app;
}

export async function createDatabase(databaseId: TestDatabaseId) {
  const client = await databases.init(databaseId);
  clientsToDestroy.push(client);
  const mockDatabaseService = mockServices.database.mock({
    getClient: async () => client,
    migrations: { skip: false },
  });

  await migrate(mockDatabaseService);

  return { client };
}

export function tearDownRouters(): Promise<void> {
  return Promise.all(
    clientsToDestroy.splice(0).map(client => client.destroy()),
  ).then(() => undefined);
}

export interface MockRouterDeps {
  httpAuth: ReturnType<typeof mockServices.httpAuth>;
  discoveryApi: { getBaseUrl: jest.Mock; getExternalBaseUrl: jest.Mock };
  x2aDatabase: {
    getJob: jest.Mock;
    updateJob: jest.Mock;
    listProjects: jest.Mock;
    createProject: jest.Mock;
    getProject: jest.Mock;
    deleteProject: jest.Mock;
    listModules: jest.Mock;
    createModule: jest.Mock;
    getModule: jest.Mock;
    deleteModule: jest.Mock;
    listJobs: jest.Mock;
    listJobsForProject: jest.Mock;
    listJobsForModule: jest.Mock;
    createJob: jest.Mock;
    getJobLogs: jest.Mock;
  };
  kubeService: {
    createJob: jest.Mock;
    getJobLogs: jest.Mock;
    getJobStatus: jest.Mock;
    deleteJob: jest.Mock;
    createProjectSecret: jest.Mock;
    getProjectSecret: jest.Mock;
    deleteProjectSecret: jest.Mock;
    createJobSecret: jest.Mock;
    listJobsForProject: jest.Mock;
    getPods: jest.Mock;
  };
  logger: ReturnType<typeof mockServices.logger.mock>;
  permissionsSvc: ReturnType<typeof mockServices.permissions.mock>;
  config: ReturnType<typeof mockServices.rootConfig>;
}

export function createMockRouterDeps(): MockRouterDeps {
  return {
    httpAuth: mockServices.httpAuth(),
    discoveryApi: {
      getBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007/api/x2a'),
      getExternalBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007'),
    },
    x2aDatabase: {
      getJob: jest.fn(),
      updateJob: jest.fn(),
      listProjects: jest.fn(),
      createProject: jest.fn(),
      getProject: jest.fn(),
      deleteProject: jest.fn(),
      listModules: jest.fn().mockResolvedValue([]),
      createModule: jest.fn().mockResolvedValue({ id: 'mock-module-id' }),
      getModule: jest.fn(),
      deleteModule: jest.fn().mockResolvedValue(1),
      listJobs: jest.fn(),
      listJobsForProject: jest.fn(),
      listJobsForModule: jest.fn(),
      createJob: jest.fn(),
      getJobLogs: jest.fn(),
    },
    kubeService: {
      createJob: jest.fn().mockResolvedValue({ k8sJobName: 'test-job' }),
      getJobLogs: jest.fn().mockResolvedValue(''),
      getJobStatus: jest.fn().mockResolvedValue('pending'),
      deleteJob: jest.fn().mockResolvedValue(undefined),
      createProjectSecret: jest.fn().mockResolvedValue(undefined),
      getProjectSecret: jest.fn().mockResolvedValue(null),
      deleteProjectSecret: jest.fn().mockResolvedValue(undefined),
      createJobSecret: jest.fn().mockResolvedValue(undefined),
      listJobsForProject: jest.fn().mockResolvedValue([]),
      getPods: jest.fn().mockResolvedValue({ items: [] }),
    },
    logger: mockServices.logger.mock(),
    permissionsSvc: mockServices.permissions.mock(),
    config: mockServices.rootConfig({
      data: {
        x2a: {
          kubernetes: {
            namespace: 'test-namespace',
            image: 'test-image',
            imageTag: 'test',
            ttlSecondsAfterFinished: 86400,
          },
        },
      },
    }),
  };
}
