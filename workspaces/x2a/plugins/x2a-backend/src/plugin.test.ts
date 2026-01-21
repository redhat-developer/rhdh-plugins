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
  startTestBackend,
} from '@backstage/backend-test-utils';
import { createServiceFactory } from '@backstage/backend-plugin-api';
import { x2aDatabaseServiceRef } from './services/X2ADatabaseService';
import { x2APlugin } from './plugin';
import request from 'supertest';
import {
  ConflictError,
  AuthenticationError,
  NotAllowedError,
  NotFoundError,
} from '@backstage/errors';

// TEMPLATE NOTE:
// Plugin tests are integration tests for your plugin, ensuring that all pieces
// work together end-to-end. You can still mock injected backend services
// however, just like anyone who installs your plugin might replace the
// services with their own implementations.
describe('plugin', () => {
  it('should create and read Project items', async () => {
    const { server } = await startTestBackend({
      features: [x2APlugin],
    });

    // TODO: so far BE provides mock data for the projects, so failing here
    await request(server).get('/api/x2a/projects').expect(200, {
      items: [],
    });

    const createRes = await request(server).post('/api/x2a/projcts').send({
      name: 'My Project',
      // TODO: more properties
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toEqual({
      id: expect.any(String),
      title: 'My Project',
      createdBy: mockCredentials.user().principal.userEntityRef,
      createdAt: expect.any(String),
    });

    const createdTodoItem = createRes.body;

    await request(server).get('/api/x2a/projects').expect(200, {
      items: [
        /* TODO */
      ],
    });

    await request(server)
      .get(`/api/x2a/projects/FOO_BAR_PROJECT_ID`)
      .expect(200, {
        /* TODO */
      });
  });

  it('should forward errors from the X2ADatabaseService', async () => {
    const { server } = await startTestBackend({
      features: [
        x2APlugin,
        createServiceFactory({
          service: x2aDatabaseServiceRef,
          deps: {},
          factory: () => ({
            createProject: jest.fn().mockRejectedValue(new ConflictError()),
            deleteProject: jest.fn().mockRejectedValue(new NotAllowedError()),
            listProjects: jest
              .fn()
              .mockRejectedValue(new AuthenticationError()),
            getProject: jest.fn().mockRejectedValue(new NotFoundError()),
          }),
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
      .send({ name: 'My Project' });
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
    expect(getRes.status).toBe(403);
    expect(getRes.body).toMatchObject({
      error: { name: 'NotFoundError' },
    });
  });
});
