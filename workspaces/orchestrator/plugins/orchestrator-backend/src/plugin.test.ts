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

import type { BackendFeature } from '@backstage/backend-plugin-api';
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import request from 'supertest';

import { orchestratorPlugin } from './plugin';

jest.mock('./service/DataIndexService', () => ({
  DataIndexService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./service/SonataFlowService', () => ({
  SonataFlowService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./service/WorkflowCacheService', () => ({
  WorkflowCacheService: jest.fn().mockImplementation(() => ({
    schedule: jest.fn(),
  })),
}));

jest.mock('./service/OrchestratorService', () => ({
  OrchestratorService: jest.fn().mockImplementation(() => ({
    fetchWorkflowInfo: jest.fn().mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://localhost:8080',
    }),
    fetchInstance: jest.fn().mockResolvedValue({
      id: 'instance1',
      processId: 'workflow1',
      processName: 'Workflow 1',
      nodes: [],
      state: 'ACTIVE',
      start: '2024-01-01T00:00:00.000Z',
      end: null,
      endpoint: '/workflow1',
      serviceUrl: 'http://localhost:8080',
      variables: {
        workflowdata: {},
        initiatorEntity: 'user:default/test',
      },
    }),
    hasLogProvider: jest.fn().mockReturnValue(true),
    fetchWorkflowLogsByInstance: jest.fn().mockResolvedValue({
      instanceId: 'instance1',
      logs: [],
    }),
  })),
}));

jest.mock('./service/DataInputSchemaService', () => ({
  DataInputSchemaService: jest.fn().mockImplementation(() => ({
    extractWorkflowData: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock('@red-hat-developer-hub/backstage-plugin-orchestrator-common', () => {
  const actual = jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-orchestrator-common',
  );
  const openApiDocument = structuredClone(actual.openApiDocument);
  if (openApiDocument.components?.schemas?.Filter) {
    openApiDocument.components.schemas.Filter = {
      type: 'object',
      additionalProperties: true,
    };
  }
  if (openApiDocument.components?.schemas?.LogicalFilter) {
    openApiDocument.components.schemas.LogicalFilter = {
      type: 'object',
      additionalProperties: true,
    };
  }
  if (openApiDocument.components?.schemas?.NestedFilter) {
    openApiDocument.components.schemas.NestedFilter = {
      type: 'object',
      additionalProperties: true,
    };
  }
  return { ...actual, openApiDocument };
});

const BASE_CONFIG = {
  backend: {
    database: {
      client: 'better-sqlite3',
      connection: ':memory:',
    },
  },
  orchestrator: {
    dataIndexService: { url: 'http://localhost:8080' },
    sonataFlowService: { autoStart: false },
  },
};

async function startOrchestratorBackend(options?: {
  authorizeResult?: AuthorizeResult.ALLOW | AuthorizeResult.DENY;
}) {
  const authorizeResult = options?.authorizeResult ?? AuthorizeResult.DENY;
  const features: (BackendFeature | Promise<{ default: BackendFeature }>)[] = [
    orchestratorPlugin,
    mockServices.rootLogger.factory(),
    mockServices.rootConfig.factory({ data: BASE_CONFIG }),
    mockServices.httpAuth.factory({
      defaultCredentials: mockCredentials.user('user:default/test'),
    }),
    mockServices.userInfo.factory(),
    mockServices.permissions.mock({
      authorize: async requests =>
        requests.map(() => ({ result: authorizeResult })),
      authorizeConditional: async requests =>
        requests.map(() => ({ result: authorizeResult })),
    }).factory,
  ];

  return (await startTestBackend({ features })).server;
}

describe('orchestratorPlugin (startTestBackend)', () => {
  it('GET /api/orchestrator/health returns ok without authentication', async () => {
    const server = await startOrchestratorBackend();

    const response = await request(server)
      .get('/api/orchestrator/health')
      .set('Authorization', mockCredentials.none.header());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /api/orchestrator/health returns ok when permissions deny', async () => {
    const server = await startOrchestratorBackend({
      authorizeResult: AuthorizeResult.DENY,
    });

    const response = await request(server).get('/api/orchestrator/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it.each([
    [
      'POST /v2/workflows/:workflowId/execute',
      (agent: ReturnType<typeof request>) =>
        agent
          .post('/api/orchestrator/v2/workflows/workflow1/execute')
          .send({ inputData: {} }),
    ],
    [
      'GET /v2/workflows/instances/:instanceId/logs',
      (agent: ReturnType<typeof request>) =>
        agent.get('/api/orchestrator/v2/workflows/instances/instance1/logs'),
    ],
  ] as const)(
    '%s returns 403 when permissions deny',
    async (_name, reqHandler) => {
      const server = await startOrchestratorBackend({
        authorizeResult: AuthorizeResult.DENY,
      });

      const response = await reqHandler(request(server));

      expect(response.status).toBe(403);
    },
  );
});
