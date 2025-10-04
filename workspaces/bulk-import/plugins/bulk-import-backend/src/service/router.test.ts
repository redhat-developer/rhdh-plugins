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
  coreServices,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { Knex } from 'knex';
import request from 'supertest';

import { setupTest, startBackendServer } from '../../__fixtures__/testUtils';

describe('router tests', () => {
  const useTestData = setupTest();

  describe('permission framework denial', () => {
    it.each([
      [
        'GET /organizations',
        async (req: request.SuperTest<request.Test>) =>
          req.get('/api/bulk-import/organizations'),
      ],
      [
        'GET /repositories',
        async (req: request.SuperTest<request.Test>) =>
          req.get('/api/bulk-import/repositories'),
      ],
      [
        'GET /organizations/:org/repositories',
        async (req: request.SuperTest<request.Test>) =>
          req.get('/api/bulk-import/organizations/my-org-1/repositories'),
      ],
      [
        'GET /imports',
        async (req: request.SuperTest<request.Test>) =>
          req.get('/api/bulk-import/imports'),
      ],
      [
        'POST /imports',
        async (req: request.SuperTest<request.Test>) =>
          req.post('/api/bulk-import/imports'),
      ],
      [
        'GET /import/by-repo',
        async (req: request.SuperTest<request.Test>) =>
          req.get('/api/bulk-import/import/by-repo'),
      ],
      [
        'DELETE /import/by-repo',
        async (req: request.SuperTest<request.Test>) =>
          req.delete('/api/bulk-import/import/by-repo'),
      ],
    ])(
      '%s: returns 403 when denied by permission framework',
      async (
        _endpoint: string,
        reqHandler: (
          req: request.SuperTest<request.Test>,
        ) => Promise<request.Response>,
      ) => {
        const { mockCatalogClient } = useTestData();
        const mockDb = createServiceFactory({
          service: coreServices.database,
          deps: {},
          factory: async () => ({
            getClient: async () =>
              ({
                migrate: {
                  latest: jest.fn(),
                },
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                whereIn: jest.fn().mockReturnThis(),
                offset: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                count: jest.fn().mockReturnThis(),
                first: jest.fn().mockReturnThis(),
                delete: jest.fn().mockReturnThis(),
                raw: jest.fn().mockReturnThis(),
              }) as unknown as Knex,
          }),
        });
        const backendServer = await startBackendServer(
          mockCatalogClient,
          AuthorizeResult.DENY,
          undefined,
          mockDb,
        );

        const response = await reqHandler(request(backendServer));

        expect(response.status).toEqual(403);
      },
    );
  });
});
