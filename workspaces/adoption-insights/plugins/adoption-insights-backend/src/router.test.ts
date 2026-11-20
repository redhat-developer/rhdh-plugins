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
import {
  mockCredentials,
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import { AnalyticsEvent } from '@backstage/core-plugin-api';
import EventApiController from './controllers/EventApiController';
import { NotificationPreferenceController } from './controllers/NotificationPreferenceController';
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
      userId: 'user:default/test-user', // Added userId to pass the filter
      timestamp: '2025-03-02T16:25:32.819Z',
    },
    attributes: { key: 'value' },
  };

  const setupApp = async (
    authorizeResult: AuthorizeResult.ALLOW | AuthorizeResult.DENY,
  ) => {
    const mockEventDatabase = {
      isJsonSupported: jest.fn().mockReturnValue(true),
    };

    const mockEventBatchProcessor = {
      addEvent: jest.fn(),
    };

    const mockAuditor = {
      createEvent: jest.fn().mockResolvedValue({
        fail: jest.fn(),
        success: jest.fn(),
        commit: jest.fn(),
      }),
    };

    const mockHttpAuth = mockServices.httpAuth.mock();
    jest
      .mocked(mockHttpAuth.credentials)
      .mockResolvedValue(mockCredentials.user('user:default/test-user'));

    const eventApiController = new EventApiController(
      mockEventDatabase as any,
      mockEventBatchProcessor as any,
      mockServices.rootConfig.mock(),
      mockAuditor as any,
      mockServices.auth.mock(),
      mockHttpAuth,
      mockServices.discovery.mock(),
      { getEntityByRef: jest.fn() } as any,
      mockServices.logger.mock(),
    );

    const mockPreferenceStore = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue({ previous: undefined }),
    };
    const notificationPreferenceController =
      new NotificationPreferenceController(
        mockPreferenceStore as any,
        mockAuditor as any,
        mockHttpAuth,
      );

    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      eventApiController,
      notificationPreferenceController,
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

  it('gets and updates the caller notification preference', async () => {
    const get = await request(app).get('/notification-preference');
    expect(get.status).toBe(200);
    expect(get.body).toEqual({ frequency: 'off' });

    const put = await request(app)
      .put('/notification-preference')
      .send({ frequency: 'weekly' });
    expect(put.status).toBe(200);
    expect(put.body).toEqual({ frequency: 'weekly' });
  });

  it('allows preference routes when board-read permission is denied', async () => {
    await setupApp(AuthorizeResult.DENY);
    const get = await request(app).get('/notification-preference');
    const put = await request(app)
      .put('/notification-preference')
      .send({ frequency: 'daily' });
    expect(get.status).toBe(200);
    expect(put.status).toBe(200);
  });

  it('rejects requests without user credentials on preference routes', async () => {
    const get = await request(app)
      .get('/notification-preference')
      .set('Authorization', mockCredentials.none.header());
    const put = await request(app)
      .put('/notification-preference')
      .set('Authorization', mockCredentials.none.header())
      .send({ frequency: 'daily' });
    expect(get.status).toBe(401);
    expect(put.status).toBe(401);
  });
});
