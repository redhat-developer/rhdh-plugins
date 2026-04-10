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
  addHandlersForGHTokenAppErrors,
  setupTest,
  startBackendServer,
} from '../../../../__fixtures__/testUtils';

// Token header used across repo-listing tests.
// With user tokens provided for github.com only, the GitHub App path
// (enterprise.github.com) is skipped — results are scoped to the user's
// own OAuth credential.
const GH_USER_TOKENS = JSON.stringify({
  'https://github.com': 'test-user-token',
});

describe('repositories', () => {
  const useTestData = setupTest();

  describe('GET /repositories', () => {
    it('returns 401 when X-SCM-Tokens header is absent', async () => {
      const { mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      const response = await request(backendServer).get(
        '/api/bulk-import/repositories',
      );

      expect(response.status).toEqual(401);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 200 when repositories are fetched without errors', async () => {
      const { mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      const response = await request(backendServer)
        .get('/api/bulk-import/repositories')
        .set('X-SCM-Tokens', GH_USER_TOKENS);

      expect(response.status).toEqual(200);
      // With user-scoped tokens, only repos accessible via the user's OAuth
      // credential (GET /user/repos) are returned. The GitHub App path for
      // enterprise.github.com is intentionally skipped.
      expect(response.body).toEqual({
        errors: [],
        repositories: [
          {
            defaultBranch: 'master',
            errors: [],
            id: 'octocat/animated-happiness',
            lastUpdate: '2011-01-26T19:14:43Z',
            name: 'animated-happiness',
            organization: 'octocat',
            url: 'http://localhost:8765/octocat/animated-happiness',
          },
          {
            defaultBranch: 'master',
            errors: [],
            id: 'my-user/Lorem-Ipsum',
            lastUpdate: '2011-01-26T19:14:43Z',
            name: 'Lorem-Ipsum',
            organization: 'my-user',
            url: 'http://localhost:8765/my-user/Lorem-Ipsum',
          },
        ],
        totalCount: 2,
      });
    });

    it('returns 500 when the user token call fails for all integrations', async () => {
      const { server, mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );
      // Override GET /user/repos to simulate a failed user-token credential.
      server.use(
        rest.get(`${LOCAL_ADDR}/user/repos`, (_, res, ctx) =>
          res(
            ctx.status(403),
            ctx.json({ message: 'Github Token auth did not succeed' }),
          ),
        ),
      );

      const response = await request(backendServer)
        .get('/api/bulk-import/repositories')
        .set('X-SCM-Tokens', GH_USER_TOKENS);

      expect(response.status).toEqual(500);
      expect(response.body).toEqual({
        errors: ['Github Token auth did not succeed'],
      });
    });

    it('returns 500 when one or more errors are returned with no successful repository fetches', async () => {
      const { server, mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );
      // Override all GH integration endpoints to simulate total failure.
      addHandlersForGHTokenAppErrors(server);

      const reposResp = await request(backendServer)
        .get('/api/bulk-import/repositories')
        .set('X-SCM-Tokens', GH_USER_TOKENS);

      expect(reposResp.status).toEqual(500);
      // With user tokens only the user-token path runs; the GitHub App path is
      // not taken, so only the user-token error is surfaced.
      expect(reposResp.body).toEqual({
        errors: ['Github Token auth did not succeed'],
      });
    });
  });

  describe('GET /organizations/{org}/repositories', () => {
    it('returns 401 when X-SCM-Tokens header is absent', async () => {
      const { mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      const response = await request(backendServer).get(
        '/api/bulk-import/organizations/my-ent-org-1/repositories',
      );

      expect(response.status).toEqual(401);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 200 when repositories are fetched without errors', async () => {
      const { mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      let response = await request(backendServer)
        .get('/api/bulk-import/organizations/my-ent-org-1/repositories')
        .set('X-SCM-Tokens', GH_USER_TOKENS);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        errors: [],
        repositories: [
          {
            defaultBranch: 'main',
            errors: [],
            id: 'my-ent-org-1/Hello-World',
            lastUpdate: '2011-01-26T19:14:43Z',
            name: 'Hello-World',
            organization: 'my-ent-org-1',
            url: 'http://localhost:8765/my-ent-org-1/Hello-World',
          },
        ],
        totalCount: 1,
      });

      response = await request(backendServer)
        .get('/api/bulk-import/organizations/my-ent-org-2/repositories')
        .set('X-SCM-Tokens', GH_USER_TOKENS);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        errors: [],
        repositories: [
          {
            defaultBranch: 'main',
            errors: [],
            id: 'my-ent-org-2/awesome-dogs',
            lastUpdate: '2011-01-26T19:14:43Z',
            name: 'awesome-dogs',
            organization: 'my-ent-org-2',
            url: 'http://localhost:8765/my-ent-org-2/awesome-dogs',
          },
          {
            defaultBranch: 'main',
            errors: [],
            id: 'my-ent-org-2/lorem-ipsum',
            lastUpdate: '2011-01-26T19:14:43Z',
            name: 'lorem-ipsum',
            organization: 'my-ent-org-2',
            url: 'http://localhost:8765/my-ent-org-2/lorem-ipsum',
          },
        ],
        totalCount: 2,
      });

      response = await request(backendServer)
        .get('/api/bulk-import/organizations/my-ent-org--no-repos/repositories')
        .set('X-SCM-Tokens', GH_USER_TOKENS);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        errors: [],
        repositories: [],
        totalCount: 0,
      });
    });

    it('returns 500 when one or more errors are returned with no successful repository fetched', async () => {
      const { server, mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );
      // Override GH integration endpoints to simulate failure.
      addHandlersForGHTokenAppErrors(server);

      const orgReposResp = await request(backendServer)
        .get('/api/bulk-import/organizations/some-org/repositories')
        .set('X-SCM-Tokens', GH_USER_TOKENS);

      expect(orgReposResp.status).toEqual(500);
      expect(orgReposResp.body).toEqual({
        errors: ['Github Token auth did not succeed'],
      });
    });
  });
});
