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

import express from 'express';
import request from 'supertest';
import { mockServices } from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { applyRecommendation } from './applyRecommendation';
import type { RouterOptions } from '../models/RouterOptions';

const validBody = {
  workflowId: 'patch-k8s-resource',
  inputData: {
    clusterName: 'test-cluster',
    resourceType: 'deployment',
    resourceNamespace: 'default',
    resourceName: 'my-app',
    containerName: 'main',
    containerResources: {
      limits: { cpu: 0.5, memory: 134217728 },
      requests: { cpu: 0.25, memory: 67108864 },
    },
  },
};

describe('applyRecommendation', () => {
  let app: express.Express;
  let mockPermissions: ReturnType<typeof mockServices.permissions.mock>;
  let mockDiscovery: ReturnType<typeof mockServices.discovery>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockPermissions = mockServices.permissions.mock();
    mockDiscovery = mockServices.discovery();

    const options: RouterOptions = {
      logger: mockServices.rootLogger(),
      httpAuth: mockServices.httpAuth(),
      permissions: mockPermissions,
      cache: mockServices.cache.mock(),
      discovery: mockDiscovery,
      auth: mockServices.auth(),
      optimizationApi: {
        getRecommendationList: jest.fn(),
        getRecommendationById: jest.fn(),
      },
      costManagementApi: {
        getCostManagementReport: jest.fn(),
        downloadCostManagementReport: jest.fn(),
        searchOpenShiftProjects: jest.fn(),
        searchOpenShiftClusters: jest.fn(),
        searchOpenShiftNodes: jest.fn(),
        getOpenShiftTags: jest.fn(),
        getOpenShiftTagValues: jest.fn(),
      },
    };

    app = express();
    app.use(express.json());
    app.post('/apply-recommendation', applyRecommendation(options));
  });

  it('returns 400 when workflowId is missing', async () => {
    const response = await request(app)
      .post('/apply-recommendation')
      .send({ inputData: validBody.inputData });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('workflowId');
  });

  it('returns 400 for invalid resourceType', async () => {
    mockPermissions.authorize.mockResolvedValueOnce([
      { result: AuthorizeResult.ALLOW },
    ]);

    const response = await request(app)
      .post('/apply-recommendation')
      .send({
        ...validBody,
        inputData: { ...validBody.inputData, resourceType: 'cronjob' },
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid resourceType');
    expect(response.body.error).toContain('cronjob');
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await request(app)
      .post('/apply-recommendation')
      .send({
        workflowId: 'patch-k8s-resource',
        inputData: {
          resourceType: 'deployment',
          containerResources: {},
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing or invalid');
  });

  it('returns 403 when ros.apply permission is denied', async () => {
    mockPermissions.authorize.mockResolvedValueOnce([
      { result: AuthorizeResult.DENY },
    ]);

    const response = await request(app)
      .post('/apply-recommendation')
      .send(validBody);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('ros.apply');
  });

  it('validates all allowed resourceType values', async () => {
    const allowedTypes = [
      'deployment',
      'replicaset',
      'daemonset',
      'statefulset',
      'deploymentconfig',
      'replicationcontroller',
    ];

    for (const resourceType of allowedTypes) {
      mockPermissions.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // eslint-disable-next-line no-restricted-syntax
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 'instance-1' }), { status: 200 }),
        );

      const response = await request(app)
        .post('/apply-recommendation')
        .send({
          ...validBody,
          inputData: { ...validBody.inputData, resourceType },
        });

      expect(response.status).toBe(200);
      fetchSpy.mockRestore();
    }
  });

  it('forwards to orchestrator and returns instance id on success', async () => {
    mockPermissions.authorize.mockResolvedValueOnce([
      { result: AuthorizeResult.ALLOW },
    ]);

    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'workflow-instance-123' }), {
        status: 200,
      }),
    );

    const response = await request(app)
      .post('/apply-recommendation')
      .send(validBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'workflow-instance-123' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const fetchUrl = fetchSpy.mock.calls[0][0] as string;
    expect(fetchUrl).toContain('/v2/workflows/patch-k8s-resource/execute');

    fetchSpy.mockRestore();
  });

  it('returns upstream error status on orchestrator failure', async () => {
    mockPermissions.authorize.mockResolvedValueOnce([
      { result: AuthorizeResult.ALLOW },
    ]);

    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
      }),
    );

    const response = await request(app)
      .post('/apply-recommendation')
      .send(validBody);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Workflow not found' });

    fetchSpy.mockRestore();
  });
});
