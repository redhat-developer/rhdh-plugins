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
import { defaultWidgetsServiceRef } from './services/DefaultWidgetsService';

describe('createRouter', () => {
  let app: express.Express;
  let defaultWidgets: jest.Mocked<typeof defaultWidgetsServiceRef.T>;

  beforeEach(async () => {
    defaultWidgets = {
      getDefaultWidgets: jest.fn(),
    };
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      defaultWidgets,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('returns the visible default cards with customizable flag', async () => {
    defaultWidgets.getDefaultWidgets.mockResolvedValue({
      customizable: true,
      items: [
        {
          id: 'onboarding',
          ref: 'onboarding',
          props: { title: 'Get Started' },
        },
        { id: 'entities', ref: 'entities' },
      ],
    });

    const response = await request(app).get('/default-widgets');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      customizable: true,
      items: [
        {
          id: 'onboarding',
          ref: 'onboarding',
          props: { title: 'Get Started' },
        },
        { id: 'entities', ref: 'entities' },
      ],
    });
    expect(defaultWidgets.getDefaultWidgets).toHaveBeenCalledWith({
      credentials: expect.objectContaining({
        principal: expect.objectContaining({ type: 'user' }),
      }),
    });
  });

  it('rejects unauthenticated requests', async () => {
    const response = await request(app)
      .get('/default-widgets')
      .set('Authorization', mockCredentials.none.header());

    expect(response.status).toBe(401);
    expect(defaultWidgets.getDefaultWidgets).not.toHaveBeenCalled();
  });
});
