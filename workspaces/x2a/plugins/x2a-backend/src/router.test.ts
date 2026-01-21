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
import {
  X2ADatabaseService,
  x2aDatabaseServiceRef,
} from './services/X2ADatabaseService';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

const mockProject: Project = {
  id: '123',
  name: 'Mock Project',
  abbreviation: 'MP',
  description: 'Mock Description',
  // sourceRepository: 'https://github.com/org/repo',
  createdBy: mockCredentials.user().principal.userEntityRef,
  createdAt: new Date(),
};

// TEMPLATE NOTE:
// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express;

  beforeEach(async () => {
    const x2aDatabase = X2ADatabaseService.create({
      logger: mockServices.logger.mock(),
      database: mockServices.database.mock(),
    });
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      logger: mockServices.logger.mock(),
      x2aDatabase,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should query empty project list', async () => {
    const response = await request(app).get('/projects').send();

    expect(response.status).toBe(200);
    expect(response.body.totalCount).toBe(2);
    expect(response.body.items).toEqual([
      {
        id: '1',
        name: 'Mock Migration 1',
        description: 'Mock Description 1',
        abbreviation: 'MP1',
        createdBy: 'user1',
        createdAt: '2026-01-20T12:24:56.615Z',
      },
      {
        id: '2',
        name: 'Mock Migration 2',
        description: 'Mock Description 2',
        abbreviation: 'MP2',
        createdBy: 'user2',
        createdAt: '2026-01-20T12:24:56.616Z',
      },
    ]);
  });

  it.skip('should create a project', async () => {
    x2aDatabase.createProject.mockResolvedValue(mockProject);

    const response = await request(app).post('/projects').send(
      // TODO: limit to the required data only
      mockProject,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProject);
  });

  it.skip('should not allow unauthenticated requests to create a migration', async () => {
    x2aDatabase.createProject.mockResolvedValue(mockProject);

    // TEMPLATE NOTE:
    // The HttpAuth mock service considers all requests to be authenticated as a
    // mock user by default. In order to test other cases we need to explicitly
    // pass an authorization header with mock credentials.
    const response = await request(app)
      .post('/projects')
      .set('Authorization', mockCredentials.none.header())
      .send({
        // TODO: limit to the required data only
        mockProject,
      });

    expect(response.status).toBe(401);
  });
});
