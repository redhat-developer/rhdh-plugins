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
 * 1. filterAuthorizedWorkflows — list filtering via authorizeConditional + conditionTransformer/matches
 * 2. authorize (anyOf) — ALLOW if any permission is granted; CONDITIONAL handled at route via assertWorkflowAccess
 * 3. Generic vs specific permissions — broad or narrow access
 * 4. Empty permission set — users with no permissions see nothing
 *
 * NOTE: Due to OpenAPI backend initialization complexity, many tests focus on
 * POST /v2/workflows/overview, which exercises the core authorization paths.
 */

import { mockServices } from '@backstage/backend-test-utils';
import {
  AuthorizeResult,
  type PolicyDecision,
} from '@backstage/plugin-permission-common';

import express from 'express';
import request from 'supertest';

import { ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { initPublicServices } from './initPublicServices';
import {
  orchestratorPermissionRules,
  orchestratorWorkflowResourceRef,
} from './permission-rules';
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
  const openApiDocument = structuredClone(actual.openApiDocument);

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

function rbacConditionalRead(workflowIds: string[]): PolicyDecision {
  return {
    result: AuthorizeResult.CONDITIONAL,
    pluginId: 'orchestrator',
    resourceType: ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE,
    conditions: {
      anyOf: [
        {
          rule: 'IS_ALLOWED_WORKFLOW_ID',
          resourceType: ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE,
          params: { workflowIds },
        },
      ],
    },
  } as PolicyDecision;
}

describe('Router Authorization Tests', () => {
  const mockCredentials = {
    $$type: '@backstage/BackstageCredentials' as const,
    principal: { userEntityRef: 'user:default/test-user' },
  };

  let app: express.Application;
  let mockPermissions: ReturnType<typeof mockServices.permissions.mock>;

  beforeEach(async () => {
    mockPermissions = mockServices.permissions.mock();
    // Default: both conditional and basic authorize return DENY
    mockPermissions.authorizeConditional = jest
      .fn()
      .mockResolvedValue([{ result: AuthorizeResult.DENY }]);
    mockPermissions.authorize = jest
      .fn()
      .mockResolvedValue([{ result: AuthorizeResult.DENY }]);

    const config = mockServices.rootConfig({
      data: {
        orchestrator: {
          dataIndexService: { url: 'http://localhost:8080' },
        },
      },
    });
    const logger = mockServices.logger.mock();
    const scheduler = mockServices.scheduler.mock();
    const workflowLogsProvidersRegistry = { getProvider: jest.fn() } as any;
    const publicServices = initPublicServices(
      logger,
      config,
      scheduler,
      workflowLogsProvidersRegistry,
    );

    const router = await createBackendRouter({
      config,
      logger,
      auditor: {
        createEvent: jest.fn().mockResolvedValue({
          success: jest.fn(),
          fail: jest.fn(),
        }),
      } as any,
      scheduler,
      permissions: mockPermissions,
      permissionsRegistry: {
        registerPermissions: jest.fn(),
        addResourceType: jest.fn(),
        getPermissionRuleset: jest.fn().mockImplementation(ref => {
          if (ref !== orchestratorWorkflowResourceRef) {
            throw new Error('getPermissionRuleset called with unexpected ref');
          }
          return {
            getRuleByName: (name: string) => {
              const rule = orchestratorPermissionRules.find(
                r => r.name === name,
              );
              if (!rule) {
                throw new Error(`Unknown rule: ${name}`);
              }
              return rule;
            },
          };
        }),
      } as any,
      httpAuth: mockServices.httpAuth.mock({
        credentials: jest.fn().mockResolvedValue(mockCredentials),
      }),
      userInfo: mockServices.userInfo.mock({
        getUserInfo: jest.fn().mockResolvedValue({
          userEntityRef: 'user:default/test-user',
          ownershipEntityRefs: [],
        }),
      }),
      workflowLogsProvidersRegistry,
      publicServices,
      discovery: mockServices.discovery.mock(),
      urlReader: mockServices.urlReader.mock(),
    });

    app = express();
    app.use(router);
  });

  describe('POST /v2/workflows/overview - Authorization Logic', () => {
    it('should return ALL workflows when user has generic workflow permission (ALLOW)', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
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

      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
      expect(mockPermissions.authorize).not.toHaveBeenCalled();
    });

    it('should return EMPTY array when user has no workflow permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(0);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should preserve workflow properties during filtering', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
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
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should call permissions.authorizeConditional with correct parameters', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      await request(app).post('/v2/workflows/overview').send({});

      expect(mockPermissions.authorizeConditional).toHaveBeenCalledWith(
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

    it('should handle permission service errors gracefully', async () => {
      mockPermissions.authorizeConditional.mockRejectedValue(
        new Error('Permission service unavailable'),
      );

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      // Should return 500 when permission check fails
      expect(response.status).toBe(500);
    });
  });

  describe('Conditional policies (RBAC CONDITIONAL + IS_ALLOWED_WORKFLOW_ID)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('POST /v2/workflows/overview filters by workflowIds in condition, legacy fallback for unmatched', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1', 'workflow3']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(2);
      expect(
        response.body.overviews
          .map((o: { workflowId: string }) => o.workflowId)
          .sort(),
      ).toEqual(['workflow1', 'workflow3']);
      // @deprecated legacy fallback calls authorize for unmatched workflow2
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
    });

    it('POST /v2/workflows/overview returns empty when allowed ids do not match catalog', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow99']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(0);
      // @deprecated legacy fallback calls authorize for all 3 unmatched workflows
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(3);
    });

    it('GET /v2/workflows/:workflowId/source allows when workflowId matches condition', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow2']),
      ]);

      const response = await request(app).get('/v2/workflows/workflow2/source');

      expect(response.status).toBe(200);
      expect(response.text).toBe('workflow source content');
      expect(mockPermissions.authorize).not.toHaveBeenCalled();
    });

    it('GET /v2/workflows/:workflowId/source returns 403 when workflowId not in condition and legacy denies', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app).get('/v2/workflows/workflow2/source');

      expect(response.status).toBe(403);
      // @deprecated legacy fallback called for workflow2, returns DENY
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
    });

    it('POST /v2/workflows/:workflowId/execute allows when workflowId matches condition', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(200);
      expect(mockPermissions.authorize).not.toHaveBeenCalled();
    });

    it('POST /v2/workflows/:workflowId/execute returns 403 when workflowId not in condition and legacy denies', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow2']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(403);
      // @deprecated legacy fallback called for workflow1, returns DENY
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
    });

    it('POST /v2/workflows/instances returns only instances for allowed workflow ids', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1', 'workflow3']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(2);
      expect(
        response.body.items
          .map((i: { processId: string }) => i.processId)
          .sort(),
      ).toEqual(['workflow1', 'workflow3']);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
      // @deprecated 1 legacy fallback for unmatched workflow2 + 1 instanceAdminView = 2
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(2);
    });

    it('POST /v2/workflows/instances returns empty array when condition matches no workflows', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow99']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      // @deprecated legacy fallback called for all 3 unmatched workflows
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(3);
    });
  });

  describe('GET /v2/workflows/:workflowId/source - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has unconditional workflow permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/plain');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/plain');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /v2/workflows/:workflowId/execute - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has unconditional workflow.use permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(200);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user lacks all workflow.use permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /v2/workflows/:workflowId/:instanceId/retrigger - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has unconditional workflow.use permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instance1/retrigger')
        .send({});

      expect(response.status).toBe(200);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instance1/retrigger')
        .send({});

      expect(response.status).toBe(200);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user lacks all workflow.use permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instance1/retrigger')
        .send({});

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /v2/workflows/:workflowId/overview - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has unconditional workflow permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/overview',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('workflowId', 'workflow1');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/overview',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('workflowId', 'workflow1');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/overview',
      );

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /v2/workflows/:workflowId/inputSchema - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has unconditional workflow permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/inputSchema',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('inputSchema');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/inputSchema',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('inputSchema');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/inputSchema',
      );

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /v2/workflows/:workflowId/instances - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has unconditional workflow permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/instances')
        .send({});

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /v2/workflows/:workflowId/pingWorkflowService - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has unconditional workflow permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/pingWorkflowService',
      );

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/pingWorkflowService',
      );

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user lacks all permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/workflow1/pingWorkflowService',
      );

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /v2/workflows/instances - Authorization (filtered results)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return ALL instances when user has unconditional permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(3);

      const processIds = response.body.items.map((item: any) => item.processId);
      expect(processIds).toContain('workflow1');
      expect(processIds).toContain('workflow2');
      expect(processIds).toContain('workflow3');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
    });

    it('should return FILTERED instances when user has conditional permission for specific workflows', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow2', 'workflow3']),
      ]);

      const response = await request(app)
        .post('/v2/workflows/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(2);

      const processIds = response.body.items
        .map((item: any) => item.processId)
        .sort();
      expect(processIds).toEqual(['workflow2', 'workflow3']);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
      // @deprecated 1 legacy fallback for unmatched workflow1 + 1 instanceAdminView = 2
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(2);
    });

    it('should return EMPTY array when user has no permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/v2/workflows/instances')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
      // @deprecated 3 legacy fallback calls for all unmatched workflows
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(3);
    });
  });

  describe('GET /v2/workflows/instances/:instanceId - Authorization with initiatorEntity', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow permission and is the initiator', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'instance1');
      expect(response.body).toHaveProperty(
        'initiatorEntity',
        'user:default/test-user',
      );
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has instanceAdminView permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'instance1');
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user has denied workflow permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'instance1');
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /v2/workflows/instances/:instanceId/logs - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has workflow permission and is the initiator and has admin permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1/logs',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('instanceId', 'instance1');
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has workflow permission and is the initiator', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1/logs',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('instanceId', 'instance1');
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow and is the initiator', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]); // instanceAdminView

      const response = await request(app).get(
        '/v2/workflows/instances/instance1/logs',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('instanceId', 'instance1');
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user lacks workflow permission and user is not view admin', async () => {
      mockPermissions.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get(
        '/v2/workflows/instances/instance1/logs',
      );

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /v2/workflows/instances/:instanceId/abort - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should ALLOW when user has unconditional workflow.use permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).delete(
        '/v2/workflows/instances/instance1/abort',
      );

      expect(response.status).toBe(200);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW when user has conditional permission matching the workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app).delete(
        '/v2/workflows/instances/instance1/abort',
      );

      expect(response.status).toBe(200);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should DENY when user lacks workflow.use permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).delete(
        '/v2/workflows/instances/instance1/abort',
      );

      expect(response.status).toBe(403);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /v2/workflows/overview/entity - Authorization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return ALL workflows when user has unconditional workflow permission', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

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
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should return EMPTY array when user has no workflow permissions', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/v2/workflows/overview/entity')
        .send({
          targetEntity: 'component:default/example',
          annotationWorkflowIds: ['workflow1', 'workflow2', 'workflow3'],
        });

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(0);
      expect(mockPermissions.authorizeConditional).toHaveBeenCalledTimes(1);
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

  // @deprecated Remove this entire describe block in next release
  describe('Legacy dynamic permissions fallback (DEPRECATED)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('POST /v2/workflows/overview grants access via legacy dynamic permission when conditional denies', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);
      // Legacy dynamic permission allows workflow1 and workflow2
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // workflow1
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]) // workflow2
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]); // workflow3

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(2);
      expect(
        response.body.overviews
          .map((o: { workflowId: string }) => o.workflowId)
          .sort(),
      ).toEqual(['workflow1', 'workflow2']);
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(3);
    });

    it('POST /v2/workflows/overview combines conditional and legacy access', async () => {
      // Conditional allows workflow1
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);
      // Legacy allows workflow3 (workflow2 denied by both)
      mockPermissions.authorize
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]) // workflow2
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]); // workflow3

      const response = await request(app)
        .post('/v2/workflows/overview')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.overviews).toHaveLength(2);
      expect(
        response.body.overviews
          .map((o: { workflowId: string }) => o.workflowId)
          .sort(),
      ).toEqual(['workflow1', 'workflow3']);
    });

    it('GET /v2/workflows/:workflowId/source allows via legacy when conditional denies', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);
      // Legacy dynamic permission allows
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(200);
      expect(response.text).toBe('workflow source content');
      expect(mockPermissions.authorize).toHaveBeenCalledTimes(1);
    });

    it('POST /v2/workflows/:workflowId/execute allows via legacy when conditional denies', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);
      // Legacy dynamic permission allows
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app)
        .post('/v2/workflows/workflow1/execute')
        .send({ inputData: {} });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });

    it('denies when both conditional and legacy deny', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(403);
    });

    it('does not call legacy authorize when conditional ALLOW grants access', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(200);
      expect(mockPermissions.authorize).not.toHaveBeenCalled();
    });

    it('does not call legacy authorize when conditional policy matches workflow', async () => {
      mockPermissions.authorizeConditional.mockResolvedValueOnce([
        rbacConditionalRead(['workflow1']),
      ]);

      const response = await request(app).get('/v2/workflows/workflow1/source');

      expect(response.status).toBe(200);
      expect(mockPermissions.authorize).not.toHaveBeenCalled();
    });
  });
});
