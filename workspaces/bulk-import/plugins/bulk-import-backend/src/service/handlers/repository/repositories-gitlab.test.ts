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

describe('repositories', () => {
  const useTestData = setupTest();

  describe('GET /repositories', () => {
    it('returns 200 when repositories are fetched without errors', async () => {
      const { mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      const response = await request(backendServer)
        .get('/api/bulk-import/repositories')
        .query({ approvalTool: 'GITLAB' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        approvalTool: 'GITLAB',
        errors: [],
        repositories: [
          {
            defaultBranch: 'main',
            errors: [],
            id: 'saltypig1/dolbear',
            lastUpdate: '2025-07-31T14:52:27.849Z',
            name: 'dolbear',
            organization: 'saltypig1',
            url: 'http://localhost:8765/saltypig1/dolbear',
          },
          {
            defaultBranch: 'main',
            errors: [],
            id: 'saltypig1/funtimes',
            lastUpdate: '2025-08-15T15:03:44.927Z',
            name: 'funtimes',
            organization: 'saltypig1',
            url: 'http://localhost:8765/saltypig1/funtimes',
          },
          {
            defaultBranch: 'main',
            errors: [],
            id: 'saltypig1/swapi-node',
            lastUpdate: '2025-07-31T14:54:57.289Z',
            name: 'swapi-node',
            organization: 'saltypig1',
            url: 'http://localhost:8765/saltypig1/swapi-node',
          },
        ],
        totalCount: 3,
      });
    });

    it('returns 200 when an error is returned with no successful repository fetched', async () => {
      const { server, mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );
      // change the response to 'GET /api/v4/projects'
      // to simulate an error retrieving list of repos from GL Token.
      server.use(
        rest.get(`${LOCAL_ADDR}/api/v4/projects`, (_, res, ctx) =>
          res(
            ctx.status(401),
            ctx.json({ message: 'Gitlab Token auth did not succeed' }),
          ),
        ),
      );

      const response = await request(backendServer)
        .get('/api/bulk-import/repositories')
        .query({ approvalTool: 'GITLAB' });

      expect(response.status).toEqual(500);
      expect(response.body).toEqual({
        approvalTool: 'GITLAB',
        errors: ['Gitlab Token auth did not succeed'],
      });
    });
  });

  describe('GET /organizations/{org}/repositories', () => {
    it('returns 200 when repositories are fetched without errors', async () => {
      const { mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      let response = await request(backendServer)
        .get('/api/bulk-import/organizations/my-ent-org-1/repositories')
        .query({ approvalTool: 'GITLAB' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        approvalTool: 'GITLAB',
        errors: [],
        repositories: [
          {
            defaultBranch: 'main',
            errors: [],
            id: 'my-ent-org-1/Hello-World',
            lastUpdate: '2025-07-30T18:36:10.744Z',
            name: 'Hello-World',
            organization: 'my-ent-org-1',
            url: 'http://localhost:8765/my-ent-org-1/Hello-World',
          },
        ],
        totalCount: 1,
      });

      response = await request(backendServer)
        .get('/api/bulk-import/organizations/my-ent-org-2/repositories')
        .query({ approvalTool: 'GITLAB' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        approvalTool: 'GITLAB',
        errors: [],
        repositories: [
          {
            defaultBranch: 'main',
            errors: [],
            id: 'my-ent-org-2/awesome-dogs',
            lastUpdate: '2025-07-30T18:36:10.744Z',
            name: 'awesome-dogs',
            organization: 'my-ent-org-2',
            url: 'http://localhost:8765/my-ent-org-2/awesome-dogs',
          },
          {
            defaultBranch: 'main',
            errors: [],
            id: 'my-ent-org-2/lorem-ipsum',
            lastUpdate: '2025-07-30T18:36:10.744Z',
            name: 'lorem-ipsum',
            organization: 'my-ent-org-2',
            url: 'http://localhost:8765/my-ent-org-2/lorem-ipsum',
          },
        ],
        totalCount: 2,
      });

      response = await request(backendServer)
        .get('/api/bulk-import/organizations/my-ent-org--no-repos/repositories')
        .query({ approvalTool: 'GITLAB' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        approvalTool: 'GITLAB',
        errors: [],
        repositories: [],
        totalCount: 0,
      });
    });

    it('returns 401 when one or more errors are returned with no successful repository fetched', async () => {
      const { server, mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );
      // change the response to simulate an error retrieving list from GH Token.
      // addHandlersForGHTokenAppErrors(server);
      server.use(
        rest.get(
          `${LOCAL_ADDR}/api/v4/groups/some-org/projects`,
          (_, res, ctx) =>
            res(
              ctx.status(401),
              ctx.json({ message: 'Gitlab Token auth did not succeed' }),
            ),
        ),
      );

      const orgReposResp = await request(backendServer)
        .get('/api/bulk-import/organizations/some-org/repositories')
        .query({ approvalTool: 'GITLAB' });

      expect(orgReposResp.status).toEqual(500);
      expect(orgReposResp.body).toEqual({
        approvalTool: 'GITLAB',
        errors: ['Gitlab Token auth did not succeed'],
      });
    });
  });
});
