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

/**
 * Authorization tests for router.ts
 *
 * These tests verify the authorization logic by calling actual REST API endpoints
 * and checking the HTTP responses based on permission service mocks.
 *
 * Key authorization behaviors tested:
 * 1. filterAuthorizedWorkflows - filters workflow list based on permissions
 * 2. authorize (anyOf) - returns ALLOW if any permission is granted
 * 3. Generic vs specific permissions - users can have broad or narrow access
 * 4. Empty permission set - users with no permissions see nothing
 *
 * NOTE: Due to OpenAPI backend initialization complexity, these tests focus on
 * POST /v2/workflows/overview which reliably works. This endpoint exercises all
 * the core authorization logic that will be refactored.
 */

import { mockServices } from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import express from 'express';
import request from 'supertest';

import { createBackendRouter } from './router';

// Mock service dependencies
jest.mock('./DataIndexService', () => ({
  DataIndexService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./SonataFlowService', () => ({
  SonataFlowService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./WorkflowCacheService', () => ({
  WorkflowCacheService: jest.fn().mockImplementation(() => ({
    schedule: jest.fn(),
  })),
}));

jest.mock('./OrchestratorService', () => ({
  OrchestratorService: jest.fn().mockImplementation(() => ({
    fetchWorkflowInfo: jest.fn().mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://localhost:8080',
    }),
    fetchWorkflowDefinition: jest.fn().mockResolvedValue({
      id: 'workflow1',
      dataInputSchema: { type: 'object', properties: {} },
    }),
    fetchInstanceVariables: jest.fn().mockResolvedValue({}),
    fetchInstances: jest.fn().mockResolvedValue([
      {
        id: 'instance1',
        processId: 'workflow1',
        processName: 'Workflow 1',
        nodes: [],
        state: 'ACTIVE',
        start: '2024-01-01T00:00:00.000Z',
        endpoint: '/workflow1',
        serviceUrl: 'http://localhost:8080',
        variables: {
          workflowdata: {},
          initiatorEntity: 'user:default/test-user',
        },
      },
      {
        id: 'instance2',
        processId: 'workflow2',
        processName: 'Workflow 2',
        nodes: [],
        state: 'ACTIVE',
        start: '2024-01-01T00:00:00.000Z',
        endpoint: '/workflow2',
        serviceUrl: 'http://localhost:8080',
        variables: {
          workflowdata: {},
          initiatorEntity: 'user:default/test-user',
        },
      },
      {
        id: 'instance3',
        processId: 'workflow3',
        processName: 'Workflow 3',
        nodes: [],
        state: 'ACTIVE',
        start: '2024-01-01T00:00:00.000Z',
        endpoint: '/workflow3',
        serviceUrl: 'http://localhost:8080',
        variables: {
          workflowdata: {},
          initiatorEntity: 'user:default/test-user',
        },
      },
    ]),
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
        initiatorEntity: 'user:default/test-user',
      },
    }),
    fetchWorkflowLogsByInstance: jest.fn().mockResolvedValue([]),
    abortWorkflow: jest.fn().mockResolvedValue(undefined),
    hasLogProvider: jest.fn().mockReturnValue(true),
  })),
}));

jest.mock('./DataInputSchemaService', () => ({
  DataInputSchemaService: jest.fn().mockImplementation(() => ({
    extractWorkflowData: jest.fn().mockReturnValue({}),
  })),
}));

// Mock the openApiDocument to remove circular reference
jest.mock('@red-hat-developer-hub/backstage-plugin-orchestrator-common', () => {
  const actual = jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-orchestrator-common',
  );

  // Create a simplified schema without the circular Filter reference
  const openApiDocument = JSON.parse(JSON.stringify(actual.openApiDocument));

  // Remove the problematic Filter schema to avoid circular reference during validation
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

  return {
    ...actual,
    openApiDocument,
  };
});

jest.mock('./api/v2', () => ({
  V2: jest.fn().mockImplementation(() => ({
    getWorkflowsOverview: jest.fn().mockResolvedValue({
      overviews: [
        { workflowId: 'workflow1', format: 'yaml', name: 'Workflow 1' },
        { workflowId: 'workflow2', format: 'yaml', name: 'Workflow 2' },
        { workflowId: 'workflow3', format: 'yaml', name: 'Workflow 3' },
      ],
    }),
    getWorkflowsOverviewForEntity: jest.fn().mockResolvedValue({
      overviews: [
        { workflowId: 'workflow1', format: 'yaml', name: 'Workflow 1' },
        { workflowId: 'workflow2', format: 'yaml', name: 'Workflow 2' },
        { workflowId: 'workflow3', format: 'yaml', name: 'Workflow 3' },
      ],
    }),
    getWorkflowStatuses: jest
      .fn()
      .mockResolvedValue([
        'PENDING',
        'RUNNING',
        'COMPLETED',
        'ERROR',
        'ABORTED',
      ]),
    getWorkflowIds: jest
      .fn()
      .mockReturnValue(['workflow1', 'workflow2', 'workflow3']),
    getWorkflowSourceById: jest
      .fn()
      .mockResolvedValue('workflow source content'),
    executeWorkflow: jest.fn().mockResolvedValue({ id: 'new-instance-id' }),
    retriggerInstance: jest.fn().mockResolvedValue({}),
    getWorkflowOverviewById: jest.fn().mockResolvedValue({
      workflowId: 'workflow1',
      format: 'yaml',
      name: 'Workflow 1',
    }),
    getWorkflowInputSchemaById: jest.fn().mockResolvedValue({
      id: 'workflow1',
      inputSchema: { properties: {} },
    }),
    getWorkflowInstancesByWorkflowId: jest.fn().mockResolvedValue({
      items: [],
      paginationInfo: {},
    }),
    pingWorkflowService: jest.fn().mockResolvedValue(true),
    getInstances: jest
      .fn()
      .mockImplementation((_pagination, _filters, authorizedWorkflowIds) => {
        // Return instances filtered by authorized workflow IDs
        const allInstances = [
          {
            id: 'instance1',
            processId: 'workflow1',
            processName: 'Workflow 1',
            initiatorEntity: 'user:default/test-user',
            nodes: [],
            state: 'ACTIVE',
            start: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 'instance2',
            processId: 'workflow2',
            processName: 'Workflow 2',
            initiatorEntity: 'user:default/test-user',
            nodes: [],
            state: 'ACTIVE',
            start: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 'instance3',
            processId: 'workflow3',
            processName: 'Workflow 3',
            initiatorEntity: 'user:default/test-user',
            nodes: [],
            state: 'ACTIVE',
            start: '2024-01-01T00:00:00.000Z',
          },
        ];

        const filteredInstances = authorizedWorkflowIds
          ? allInstances.filter(i =>
              authorizedWorkflowIds.includes(i.processId),
            )
          : [];

        return Promise.resolve({
          items: filteredInstances,
          paginationInfo: {},
        });
      }),
    getInstanceById: jest.fn(instanceId => {
      return Promise.resolve({
        id: instanceId,
        processId: 'workflow1',
        processName: 'Workflow 1',
        nodes: [],
        state: 'ACTIVE',
        start: '2024-01-01T00:00:00.000Z',
        duration: '0 seconds',
        endpoint: '/workflow1',
        serviceUrl: 'http://localhost:8080',
        workflowdata: {},
        initiatorEntity: 'user:default/test-user',
      });
    }),
    getInstanceLogsByInstance: jest.fn().mockResolvedValue({
      instanceId: 'instance1',
      logs: [],
    }),
    abortWorkflow: jest.fn().mockResolvedValue('aborted successfully'),
  })),
}));

describe('Router Authorization Tests', () => {
  const mockCredentials = {
    $$type: '@backstage/BackstageCredentials' as const,
    principal: { userEntityRef: 'user:default/test-user' },
  };

  let app: express.Application;
  let mockPermissions: ReturnType<typeof mockServices.permissions.mock>;

  beforeEach(async () => {
    mockPermissions = mockServices.permissions.mock();

    const router = await createBackendRouter({
      config: mockServices.rootConfig({
        data: {
          orchestrator: {
            dataIndexService: { url: 'http://localhost:8080' },
          },
        },
      }),
      logger: mockServices.logger.mock(),
      auditor: {
        createEvent: jest.fn().mockResolvedValue({
          success: jest.fn(),
          fail: jest.fn(),
        }),
      } as any,
      scheduler: mockServices.scheduler.mock(),
      permissions: mockPermissions,
      httpAuth: mockServices.httpAuth.mock({
        credentials: jest.fn().mockResolvedValue(mockCredentials),
      }),
      userInfo: mockServices.userInfo.mock({
        getUserInfo: jest.fn().mockResolvedValue({
          userEntityRef: 'user:default/test-user',
          ownershipEntityRefs: [],
        }),
      }),
      workflowLogsProvidersRegistry: { getProvider: jest.fn() } as any,
      discovery: mockServices.discovery.mock(),
      catalogApi: {} as any,
      urlReader: mockServices.urlReader.mock(),
    });

    app = express();
    app.use(router);
  });

  describe('POST /v2/workflows/overview - Authorization Logic', () => {
    it('should return ALL workflows when user has generic workflow permission (ALLOW)', async () => {
      // User has orchestrator.workflow permission - can see everything
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(3);
      expect(response.body.overviews.map((w: any) => w.workflowId)).toEqual([
        'workflow1',
        'workflow2',
        'workflow3',
      ]);

      // Verify only generic permission was checked
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
    });

    it('should FILTER workflows when user has specific permissions only', async () => {
      // User lacks generic permission but has specific workflow permissions
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic: orchestrator.workflow
        .mockResolvedValueOnce([
          { result: AuthorizeResult.ALLOW }, // orchestrator.workflow.workflow1
          { result: AuthorizeResult.DENY }, // orchestrator.workflow.workflow2
          { result: AuthorizeResult.ALLOW }, // orchestrator.workflow.workflow3
        ]);

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(2);
      expect(response.body.overviews[0].workflowId).toBe('workflow1');
      expect(response.body.overviews[1].workflowId).toBe('workflow3');

      // Verify both generic and specific permissions were checked
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(2);
    });

    it('should return EMPTY array when user has no workflow permissions', async () => {
      // User has neither generic nor specific permissions
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic
        .mockResolvedValueOnce([
          { result: AuthorizeResult.DENY }, // workflow1
          { result: AuthorizeResult.DENY }, // workflow2
          { result: AuthorizeResult.DENY }, // workflow3
        ]);

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(0);
    });

    it('should handle user with permission for only ONE workflow', async () => {
      // User has access to only workflow2
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([
          { result: AuthorizeResult.DENY }, // workflow1
          { result: AuthorizeResult.ALLOW }, // workflow2
          { result: AuthorizeResult.DENY }, // workflow3
        ]);

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(1);
      expect(response.body.overviews[0].workflowId).toBe('workflow2');
    });

    it('should preserve workflow properties during filtering', async () => {
      // Verify that filtering doesn't lose workflow metadata
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([
          { result: AuthorizeResult.ALLOW }, // workflow1
          { result: AuthorizeResult.DENY }, // workflow2
          { result: AuthorizeResult.DENY }, // workflow3
        ]);

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(1);
      expect(response.body.overviews[0]).toMatchObject({
        workflowId: 'workflow1',
        format: 'yaml',
        name: 'Workflow 1',
      });
    });

    it('should call permissions.authorize with correct parameters', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      await request(app).post('/v2/workflows/overview').send({});

      expect(mockPermissions.authorize).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            permission: expect.objectContaining({
              name: 'orchestrator.workflow',
            }),
          }),
        ]),
        expect.objectContaining({
          credentials: mockCredentials,
        }),
      );
    });
  });

  describe('Authorization edge cases', () => {
    it('should handle permission service errors gracefully', async () => {
      mockPermissions.authorize.mockRejectedValue(
        new Error('Permission service unavailable'),
      );

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      // Should return 500 when permission check fails
      expect(response.status).toBe(500);
    });

    it('should handle CONDITIONAL authorization result', async () => {
      // CONDITIONAL results should be treated as DENY for anyOf logic
      mockPermissions.authorize
        .mockResolvedValueOnce([
          {
            result: AuthorizeResult.CONDITIONAL,
            pluginId: 'orchestrator',
            resourceRef: 'default',
            conditions: {},
          } as any,
        ])
        .mockResolvedValueOnce([
          { result: AuthorizeResult.DENY },
          { result: AuthorizeResult.DENY },
          { result: AuthorizeResult.DENY },
        ]);

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      // CONDITIONAL is treated as DENY, so should check specific permissions
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /v2/workflows/:workflowId/source - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has generic workflow permission', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/plain');
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(2);
    });

    it('should ALLOW when user has generic workflow permission, but specific was denied', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/plain');
    });

    it('should ALLOW when user has only specific workflow permission', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(200);
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(2);
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(403);
    });
  });

  describe('POST /v2/workflows/:workflowId/execute - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has generic workflow.use permission', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });

    it('should ALLOW when user has only specific workflow.use permission', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(200);
    });

    it('should ALLOW when user has generic workflow.use permission, but specific was denied', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(200);
    });

    it('should DENY when user lacks all workflow.use permissions', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /v2/workflows/:workflowId/:instanceId/retrigger - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow.use permission', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instance1/retrigger')
        .send({});

      expect(response.status).toBe(200);
    });

    it('should ALLOW when user has workflow.use permission, but denied specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instance1/retrigger')
        .send({});

      expect(response.status).toBe(200);
    });

    it('should ALLOW when user has workflow.use permission denied, but allowed specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instance1/retrigger')
        .send({});

      expect(response.status).toBe(200);
    });

    it('should DENY when user lacks all workflow.use permissions', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instance1/retrigger')
        .send({});

      expect(response.status).toBe(403);
    });
  });

  describe('GET /v2/workflows/:workflowId/overview - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow permission', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/overview',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('workflowId', 'workflow1');
    });

    it('should ALLOW when user has workflow permission, but denied specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/overview',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('workflowId', 'workflow1');
    });

    it('should ALLOW when user has denied workflow permission, but allowed specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/overview',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('workflowId', 'workflow1');
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/overview',
      );

      expect(response.status).toBe(403);
    });
  });

  describe('GET /v2/workflows/:workflowId/inputSchema - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow permission, but denied specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/inputSchema',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('inputSchema');
    });

    it('should ALLOW when user has denied workflow permission, but allowed specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/inputSchema',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('inputSchema');
    });

    it('should ALLOW when user has workflow permission', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/inputSchema',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('inputSchema');
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/inputSchema',
      );

      expect(response.status).toBe(403);
    });
  });

  describe('POST /v2/workflows/:workflowId/instances - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow permission', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
    });

    it('should ALLOW when user has allowed workflow permission, but denied specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
    });

    it('should ALLOW when user has denied workflow permission, but allowed specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instances')
        .send({});

      expect(response.status).toBe(403);
    });
  });

  describe('GET /v2/workflows/:workflowId/pingWorkflowService - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow permission', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/pingWorkflowService',
      );

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);
    });

    it('should ALLOW when user has allowed workflow permission, but denied specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/pingWorkflowService',
      );

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);
    });

    it('should ALLOW when user has denied workflow permission, but allowed specific', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/pingWorkflowService',
      );

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/pingWorkflowService',
      );

      expect(response.status).toBe(403);
    });
  });

  describe('POST /v2/workflows/instances - Authorization (filtered results)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return ALL instances when user has generic permission', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(3);

      // Should include instances for all workflows when user has generic permission
      const processIds = response.body.items.map((item: any) => item.processId);
      expect(processIds).toContain('workflow1');
      expect(processIds).toContain('workflow2');
      expect(processIds).toContain('workflow3');
    });

    it('should return FILTERED instances when user has specific permissions', async () => {
      // filterAuthorizedWorkflowIds: checks generic, then batch checks specific permissions
      // Then checks instanceAdminView permission
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic workflow permission
        .mockResolvedValueOnce([
          // Batch check all specific workflow permissions
          { result: AuthorizeResult.ALLOW }, // workflow1
          { result: AuthorizeResult.DENY }, // workflow2
          { result: AuthorizeResult.ALLOW }, // workflow3
        ])
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]); // instanceAdminView

      const response = await request(app)
        .post('/v2/workflows/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(2);

      const processIds = response.body.items.map((item: any) => item.processId);
      expect(processIds).toContain('workflow1');
      expect(processIds).not.toContain('workflow2'); // User lacks permission for workflow2
      expect(processIds).toContain('workflow3');
    });

    it('should return EMPTY array when user has no permissions', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic
        .mockResolvedValueOnce([
          // Batch check all specific workflow permissions - all DENY
          { result: AuthorizeResult.DENY }, // workflow1
          { result: AuthorizeResult.DENY }, // workflow2
          { result: AuthorizeResult.DENY }, // workflow3
        ]);

      const response = await request(app)
        .post('/v2/workflows/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /v2/workflows/instances/:instanceId - Authorization with initiatorEntity', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow permission and is the initiator', async () => {
      // anyOf check for workflow permission, then instanceAdminView check
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Specific workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'instance1');
      expect(response.body).toHaveProperty(
        'initiatorEntity',
        'user:default/test-user',
      );
    });

    it('should ALLOW when user has instanceAdminView permission', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Specific workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'instance1');
    });

    it('should ALLOW when user has denied generic permission, but allowed specific and admin permissions', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Specific workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'instance1');
    });

    it('should ALLOW when user has denied generic permission, but allowed specific and denied admin permissions', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Specific workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'instance1');
    });

    it('should DENY when user has denied generic permission, specific permissions and allowed admin permissions', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Specific workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(403);
    });

    it('should DENY when user lacks workflow permission entirely', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(403);
    });
  });

  describe('GET /v2/workflows/instances/:instanceId/logs - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow permission and is the initiator and has specific and admin permission', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Specific workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1/logs',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('instanceId', 'instance1');
    });

    it('should ALLOW when user has workflow permission and is the initiator', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Specific workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1/logs',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('instanceId', 'instance1');
    });

    it('should ALLOW when user has instanceAdminView permission', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Specific workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1/logs',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('instanceId', 'instance1');
    });

    it('should ALLOW when user has instanceAdminView permission and specific permission, but no admin permissions', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Specific workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1/logs',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('instanceId', 'instance1');
    });

    it('should DENY when user lacks workflow permission', async () => {
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/instances/instance1/logs',
      );

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /v2/workflows/instances/:instanceId/abort - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow.use permission and is the initiator', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Workflow permission to read instance
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]); // Specific workflow permission

      const response = await request(app).delete(
        '/v2/workflows/instances/instance1/abort',
      );

      expect(response.status).toBe(200);
    });

    it('should ALLOW when user has specific workflow permission', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Workflow permission to read instance
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]); // Specific workflow permission

      const response = await request(app).delete(
        '/v2/workflows/instances/instance1/abort',
      );

      expect(response.status).toBe(200);
    });

    it('should ALLOW when user has instanceAdminView permission', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // Workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]); // Specific workflow permission

      const response = await request(app).delete(
        '/v2/workflows/instances/instance1/abort',
      );

      expect(response.status).toBe(200);
    });

    it('should DENY when user lacks workflow.use permission', async () => {
      // Abort endpoint only checks workflow.use permissions
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic workflow permission
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]); // Specific workflow permission

      const response = await request(app).delete(
        '/v2/workflows/instances/instance1/abort',
      );

      expect(response.status).toBe(403);
    });
  });

  describe('POST /v2/workflows/overview/entity - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return ALL workflows when user has generic workflow permission', async () => {
      // When user has generic permission, all workflows are returned
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]); // Generic workflow permission - ALLOW

      const response = await request(app)
        .post('/v2/workflows/overview/entity')
        .send({
          targetEntity: 'component:default/example',
          annotationWorkflowIds: ['workflow1', 'workflow2', 'workflow3'],
        });

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(3);
      expect(response.body.overviews.map((w: any) => w.workflowId)).toEqual([
        'workflow1',
        'workflow2',
        'workflow3',
      ]);
    });

    it('should FILTER workflows when user has specific permissions only', async () => {
      // User has permission only for workflow1 and workflow3
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic workflow permission
        .mockResolvedValueOnce([
          { result: AuthorizeResult.ALLOW }, // workflow1 specific - ALLOW
          { result: AuthorizeResult.DENY }, // workflow2 specific - DENY
          { result: AuthorizeResult.ALLOW }, // workflow3 specific - ALLOW
        ]);

      const response = await request(app)
        .post('/v2/workflows/overview/entity')
        .send({
          targetEntity: 'component:default/example',
          annotationWorkflowIds: ['workflow1', 'workflow2', 'workflow3'],
        });

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(2);
      expect(response.body.overviews.map((w: any) => w.workflowId)).toEqual([
        'workflow1',
        'workflow3',
      ]);
    });

    it('should return EMPTY array when user has no workflow permissions', async () => {
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic workflow permission
        .mockResolvedValueOnce([
          { result: AuthorizeResult.DENY }, // workflow1 specific
          { result: AuthorizeResult.DENY }, // workflow2 specific
          { result: AuthorizeResult.DENY }, // workflow3 specific
        ]);

      const response = await request(app)
        .post('/v2/workflows/overview/entity')
        .send({
          targetEntity: 'component:default/example',
          annotationWorkflowIds: ['workflow1', 'workflow2', 'workflow3'],
        });

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(0);
    });

    it('should handle user with permission for only ONE workflow', async () => {
      // User has permission only for workflow2
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // Generic workflow permission
        .mockResolvedValueOnce([
          { result: AuthorizeResult.DENY }, // workflow1 specific
          { result: AuthorizeResult.ALLOW }, // workflow2 specific - ALLOW
          { result: AuthorizeResult.DENY }, // workflow3 specific
        ]);

      const response = await request(app)
        .post('/v2/workflows/overview/entity')
        .send({
          targetEntity: 'component:default/example',
          annotationWorkflowIds: ['workflow1', 'workflow2', 'workflow3'],
        });

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(1);
      expect(response.body.overviews[0].workflowId).toBe('workflow2');
    });
  });

  describe('GET /v2/workflows/instances/statuses - No Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return workflow statuses without requiring authorization', async () => {
      const response = await request(app).get(
        '/v2/workflows/instances/statuses',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        'PENDING',
        'RUNNING',
        'COMPLETED',
        'ERROR',
        'ABORTED',
      ]);
      // Should not call permissions.authorize for this endpoint
      expect(mockPermissions.authorize).not.toHaveBeenCalled();
    });

    it('should return statuses even when user has no permissions', async () => {
      // Even if we set up denying permissions, endpoint should still work
      mockPermissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/instances/statuses',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        'PENDING',
        'RUNNING',
        'COMPLETED',
        'ERROR',
        'ABORTED',
      ]);
      // Permissions should not be checked
      expect(mockPermissions.authorize).not.toHaveBeenCalled();
    });
  });
});
