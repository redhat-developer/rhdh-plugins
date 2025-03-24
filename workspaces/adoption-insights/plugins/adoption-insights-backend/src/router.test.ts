// /*
//  * Copyright Red Hat, Inc.
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
import express from 'express';
import request from 'supertest';
//  */
import {
  mockCredentials,
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import { AnalyticsEvent } from '@backstage/core-plugin-api';
import EventApiController from './controllers/EventApiController';
import { createRouter } from './router';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

// TEMPLATE NOTE:
// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express;

  const mockEvent: AnalyticsEvent = {
    action: 'test-action',
    subject: 'test-subject',
    value: 42,
    context: {
      routeRef: 'test-route',
      pluginId: 'test-plugin',
      extension: 'routeRef',
      userName: 'test-user',
      timestamp: '2025-03-02T16:25:32.819Z',
    },
    attributes: { key: 'value' },
  };

  const setupApp = async (
    authorizeResult: AuthorizeResult.ALLOW | AuthorizeResult.DENY,
  ) => {
    const eventApiController = new EventApiController(
      jest.fn() as any,
      jest.fn() as any,
      mockServices.rootConfig.mock(),
    );
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      eventApiController,
      permissions: mockServices.permissions.mock({
        authorize: async () => [{ result: authorizeResult }],
      }),
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  };

  beforeEach(async () => {
    await setupApp(AuthorizeResult.ALLOW);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should track an event', async () => {
    const response = await request(app).post('/events').send([mockEvent]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Event received' });
  });

  it('should not allow unauthenticated requests to track Events', async () => {
    // TEMPLATE NOTE:
    // The HttpAuth mock service considers all requests to be authenticated as a
    // mock user by default. In order to test other cases we need to explicitly
    // pass an authorization header with mock credentials.
    const response = await request(app)
      .post('/events')
      .set('Authorization', mockCredentials.none.header())
      .send([mockEvent]);

    expect(response.status).toBe(401);
  });

  it('should return 403 for unAuthorized request', async () => {
    await setupApp(AuthorizeResult.DENY);
    const response = await request(app).get('/events');
    expect(response.status).toBe(403);
  });

  it('should return 400 for invalid request', async () => {
    const response = await request(app).get('/events');
    expect(response.status).toBe(400);
  });

  it('should return the health of the API service', async () => {
    const response = await request(app).get('/health');
    expect(response.body).toEqual({ status: 'ok' });
  });
});
