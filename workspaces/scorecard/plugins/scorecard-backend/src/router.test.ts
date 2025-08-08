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
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { TodoListService } from './services/TodoListService/types';
import { MetricProvidersRegistry } from './services/MetricProviders/MetricProvidersRegistry';
import {
  MockNumberProvider,
  MockStringProvider,
} from '../__fixtures__/mockProviders';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

const mockTodoItem = {
  title: 'Do the thing',
  id: '123',
  createdBy: mockCredentials.user().principal.userEntityRef,
  createdAt: new Date().toISOString(),
};

// TEMPLATE NOTE:
// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express;
  let todoListService: jest.Mocked<TodoListService>;
  let metricProvidersRegistry: MetricProvidersRegistry;

  beforeEach(async () => {
    todoListService = {
      createTodo: jest.fn(),
      listTodos: jest.fn(),
      getTodo: jest.fn(),
    };
    metricProvidersRegistry = new MetricProvidersRegistry();
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      todoListService,
      metricProvidersRegistry,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should create a TODO', async () => {
    todoListService.createTodo.mockResolvedValue(mockTodoItem);

    const response = await request(app).post('/todos').send({
      title: 'Do the thing',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockTodoItem);
  });

  it('should not allow unauthenticated requests to create a TODO', async () => {
    todoListService.createTodo.mockResolvedValue(mockTodoItem);

    // TEMPLATE NOTE:
    // The HttpAuth mock service considers all requests to be authenticated as a
    // mock user by default. In order to test other cases we need to explicitly
    // pass an authorization header with mock credentials.
    const response = await request(app)
      .post('/todos')
      .set('Authorization', mockCredentials.none.header())
      .send({
        title: 'Do the thing',
      });

    expect(response.status).toBe(401);
  });

  describe('GET /metrics', () => {
    beforeEach(() => {
      const githubProvider1 = new MockNumberProvider(
        'github.open-prs',
        'github',
        'GitHub Open PRs',
      );
      const githubProvider2 = new MockNumberProvider(
        'github.open-issues',
        'github',
        'GitHub Open Issues',
      );
      const sonarProvider = new MockStringProvider(
        'sonar.quality',
        'sonar',
        'Code Quality',
      );

      metricProvidersRegistry.register(githubProvider1);
      metricProvidersRegistry.register(githubProvider2);
      metricProvidersRegistry.register(sonarProvider);
    });

    it('should return all metrics', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(3);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open-prs');
      expect(metricIds).toContain('github.open-issues');
      expect(metricIds).toContain('sonar.quality');
    });

    it('should return metrics filtered by datasource', async () => {
      const response = await request(app).get('/metrics?datasource=github');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(2);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open-prs');
      expect(metricIds).toContain('github.open-issues');
    });

    it('should return 400 InputError when invalid datasource parameter - empty string', async () => {
      const response = await request(app).get('/metrics?datasource=');

      expect(response.status).toEqual(400);
      expect(response.body.error.name).toEqual('InputError');
      expect(response.body.error.message).toContain('Invalid query parameters');
    });
  });
});
