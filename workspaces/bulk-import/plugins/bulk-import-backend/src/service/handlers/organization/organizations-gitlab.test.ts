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

import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { rest } from 'msw';
import request from 'supertest';

import { LOCAL_ADDR } from '../../../../__fixtures__/handlers';
import {
  setupTest,
  startBackendServer,
} from '../../../../__fixtures__/testUtils';

describe('organizations', () => {
  const useTestData = setupTest();

  describe('GET /organizations', () => {
    it('returns 200 when organizations are fetched without errors', async () => {
      const { mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      const response = await request(backendServer)
        .get('/api/bulk-import/organizations')
        .query({ approvalTool: 'GITLAB' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        approvalTool: 'GITLAB',
        errors: [],
        organizations: [
          {
            description: 'A great organization',
            errors: [],
            id: '112015960',
            name: 'gl-lincolnhawk',
            url: 'http://localhost:8765/groups/gl-lincolnhawk',
          },
          {
            description: 'A great organization',
            errors: [],
            id: '111',
            name: 'my-org-1',
            url: 'http://localhost:8765/groups/my-org-1',
          },
          {
            description: 'A second great organization',
            errors: [],
            id: '110779644',
            name: 'saltypig1',
            url: 'http://localhost:8765/groups/saltypig1',
          },
        ],
        pagePerIntegration: 1,
        sizePerIntegration: 20,
        totalCount: 3,
      });
    });

    it('filters out organizations when a search query parameter is provided', async () => {
      const { mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      const response = await request(backendServer)
        .get('/api/bulk-import/organizations?search=saltypig')
        .query({ approvalTool: 'GITLAB' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        approvalTool: 'GITLAB',
        errors: [],
        organizations: [
          {
            errors: [],
            id: '110779644',
            description: 'A second great organization',
            name: 'saltypig1',
            url: 'http://localhost:8765/groups/saltypig1',
          },
        ],
        pagePerIntegration: 1,
        sizePerIntegration: 20,
        totalCount: 1,
      });
    });

    it('returns 500 when an error is returned with no successful organization fetched', async () => {
      const { server, mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );
      // change the response to 'GET /api/v4/groups'
      // to simulate an error retrieving list of orgs for a GL Token.
      server.use(
        rest.get(`${LOCAL_ADDR}/api/v4/groups`, (_, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ message: 'Gitlab Token auth did not succeed' }),
          );
        }),
      );

      const response = await request(backendServer)
        .get('/api/bulk-import/organizations')
        .query({ approvalTool: 'GITLAB' });

      expect(response.status).toEqual(500);
      expect(response.body).toEqual({
        approvalTool: 'GITLAB',
        errors: ['Gitlab Token auth did not succeed'],
      });
    });
  });
});
