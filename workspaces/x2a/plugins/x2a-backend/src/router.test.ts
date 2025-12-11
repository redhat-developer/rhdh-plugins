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
import { convertorServiceRef } from './services/ConvertorService';
import { Migration } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

const mockMigration: Migration = {
  id: '123',
  name: 'Mock Migration',
  status: 'Created',
  sourceRepository: 'https://github.com/org/repo',
  createdBy: mockCredentials.user().principal.userEntityRef,
  createdAt: new Date().toISOString(),
};

// TEMPLATE NOTE:
// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express;
  let convertor: jest.Mocked<typeof convertorServiceRef.T>;

  beforeEach(async () => {
    convertor = {
      createMigration: jest.fn(),
      listMigrations: jest.fn(),
      getMigration: jest.fn(),
    };
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      convertor,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should create a migration', async () => {
    convertor.createMigration.mockResolvedValue(mockMigration);

    const response = await request(app).post('/migrations').send({
      name: mockMigration.name,
      // TODO: more
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockMigration);
  });

  it('should not allow unauthenticated requests to create a migration', async () => {
    convertor.createMigration.mockResolvedValue(mockMigration);

    // TEMPLATE NOTE:
    // The HttpAuth mock service considers all requests to be authenticated as a
    // mock user by default. In order to test other cases we need to explicitly
    // pass an authorization header with mock credentials.
    const response = await request(app)
      .post('/migrations')
      .set('Authorization', mockCredentials.none.header())
      .send({
        name: mockMigration.name,
        // TODO: more
      });

    expect(response.status).toBe(401);
  });
});
