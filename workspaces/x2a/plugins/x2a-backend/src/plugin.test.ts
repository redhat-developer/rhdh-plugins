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
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import {
  BackendFeature,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { x2aDatabaseServiceRef } from './services/X2ADatabaseService';
import { kubeServiceRef } from './services/KubeService';
import { x2APlugin } from './plugin';
import request from 'supertest';
import {
  ConflictError,
  AuthenticationError,
  NotAllowedError,
  NotFoundError,
} from '@backstage/errors';
import { ProjectsPostRequest } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

// Mock the Kubernetes client to avoid ES Module import issues
jest.mock('./services/makeK8sClient', () => ({
  makeK8sClient: jest.fn(() => ({
    coreV1Api: {},
    batchV1Api: {},
  })),
}));

const mockInputProject: ProjectsPostRequest = {
  name: 'Mock Project',
  description: 'Mock Description',
  abbreviation: 'MP',
  sourceRepoUrl: 'https://github.com/source/repo',
  targetRepoUrl: 'https://github.com/target/repo',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
};

const mockUserId = `user: default/user1`;
const BASE_CONFIG = {
  x2a: {
    kubernetes: {
      namespace: 'test-namespace',
      image: 'test-image',
      imageTag: 'test',
      ttlSecondsAfterFinished: 86400,
      resources: {
        requests: {
          cpu: '100m',
          memory: '128Mi',
        },
        limits: {
          cpu: '200m',
          memory: '256Mi',
        },
      },
    },
    credentials: {
      llm: {
        LLM_MODEL: 'test-model',
      },
    },
  },
};

jest.mock('@backstage/backend-plugin-api', () => ({
  ...jest.requireActual('@backstage/backend-plugin-api'),
  UserInfoService: jest.fn().mockImplementation(() => ({
    getUserInfo: jest.fn().mockResolvedValue({
      BackstageUserInfo: {
        userEntityRef: mockUserId,
      },
    }),
  })),
}));

const getX2aDatabaseServiceMock = () => ({
  // projects
  createProject: jest
    .fn()
    .mockRejectedValue(new ConflictError('expected mock error')),
  deleteProject: jest
    .fn()
    .mockRejectedValue(new NotAllowedError('expected mock error')),
  listProjects: jest
    .fn()
    .mockRejectedValue(new AuthenticationError('expected mock error')),
  getProject: jest
    .fn()
    .mockRejectedValue(new NotFoundError('expected mock error')),
  // modules
  createModule: jest.fn().mockRejectedValue(new NotAllowedError('mock error')),
  deleteModule: jest.fn().mockRejectedValue(new NotAllowedError('mock error')),
  listModules: jest.fn().mockRejectedValue(new NotAllowedError('mock error')),
  getModule: jest.fn().mockRejectedValue(new NotAllowedError('mock error')),
  // jobs
  createJob: jest.fn().mockRejectedValue(new NotAllowedError('mock error')),
  deleteJob: jest.fn().mockRejectedValue(new NotAllowedError('mock error')),
  listJobs: jest.fn().mockRejectedValue(new NotAllowedError('mock error')),
  getJob: jest.fn().mockRejectedValue(new NotAllowedError('mock error')),
  updateJob: jest.fn().mockRejectedValue(new NotAllowedError('mock error')),
});

const getKubeServiceMock = () =>
  ({
    // Project secret operations
    createProjectSecret: jest.fn().mockResolvedValue(undefined),
    getProjectSecret: jest.fn().mockResolvedValue(null),
    deleteProjectSecret: jest.fn().mockResolvedValue(undefined),
    // Job operations
    createJob: jest.fn().mockResolvedValue({ k8sJobName: 'test-job' }),
    getJobStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    getJobLogs: jest.fn().mockResolvedValue(''),
    deleteJob: jest.fn().mockResolvedValue(undefined),
    listJobsForProject: jest.fn().mockResolvedValue([]),
    // Test method
    getPods: jest.fn().mockResolvedValue({ items: [] }),
  }) as any;

async function startBackendServer(
  config?: Record<PropertyKey, unknown>,
  authorizeResult?: AuthorizeResult.DENY | AuthorizeResult.ALLOW,
) {
  const features: (BackendFeature | Promise<{ default: BackendFeature }>)[] = [
    x2APlugin,
    mockServices.rootLogger.factory(),
    mockServices.rootConfig.factory({
      data: { ...BASE_CONFIG, ...config },
    }),
    mockServices.httpAuth.factory({
      defaultCredentials: mockCredentials.user(mockUserId),
    }),
    mockServices.permissions.mock({
      authorize: async () => [
        { result: authorizeResult ?? AuthorizeResult.ALLOW },
      ],
    }).factory,
    mockServices.userInfo.factory(),
    createServiceFactory({
      service: kubeServiceRef,
      deps: {},
      factory: () => getKubeServiceMock(),
    }),
  ];
  return (await startTestBackend({ features })).server;
}

// TEMPLATE NOTE:
// Plugin tests are integration tests for your plugin, ensuring that all pieces
// work together end-to-end. You can still mock injected backend services
// however, just like anyone who installs your plugin might replace the
// services with their own implementations.
describe('plugin', () => {
  it('should create and read Project items', async () => {
    const server = await startBackendServer();

    await request(server).get('/api/x2a/projects').expect(200, {
      totalCount: 0,
      items: [],
    });

    const createRes = await request(server)
      .post('/api/x2a/projects')
      .send(mockInputProject);

    expect(createRes.status).toBe(200);
    expect(createRes.body).toMatchObject({
      ...mockInputProject,
      createdBy: 'user: default/user1',
    });

    const listRes = await request(server).get('/api/x2a/projects');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toMatchObject({
      totalCount: 1,
      items: [
        {
          ...mockInputProject,
          createdBy: 'user: default/user1',
        },
      ],
    });

    const projectId = createRes.body.id;
    const getRes = await request(server).get(`/api/x2a/projects/${projectId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject({
      ...mockInputProject,
      createdBy: 'user: default/user1',
    });
  });

  it('should forward errors from the X2ADatabaseService', async () => {
    const { server } = await startTestBackend({
      features: [
        x2APlugin,
        mockServices.rootConfig.factory({
          data: BASE_CONFIG,
        }),
        createServiceFactory({
          service: x2aDatabaseServiceRef,
          deps: {},
          factory: getX2aDatabaseServiceMock,
        }),
        createServiceFactory({
          service: kubeServiceRef,
          deps: {},
          factory: () => getKubeServiceMock(),
        }),
      ],
    });

    const listRes = await request(server).get('/api/x2a/projects');
    expect(listRes.status).toBe(401);
    expect(listRes.body).toMatchObject({
      error: { name: 'AuthenticationError' },
    });

    const createRes = await request(server)
      .post('/api/x2a/projects')
      .send(mockInputProject);
    expect(createRes.status).toBe(409);
    expect(createRes.body).toMatchObject({
      error: { name: 'ConflictError' },
    });

    const deleteRes = await request(server).delete('/api/x2a/projects/123');
    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body).toMatchObject({
      error: { name: 'NotAllowedError' },
    });

    const getRes = await request(server).get('/api/x2a/projects/123');
    expect(getRes.status).toBe(404);
    expect(getRes.body).toMatchObject({
      error: { name: 'NotFoundError' },
    });
  });
});
