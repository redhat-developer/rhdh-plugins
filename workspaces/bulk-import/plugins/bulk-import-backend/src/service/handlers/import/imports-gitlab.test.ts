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

import type {
  CatalogRequestOptions,
  QueryEntitiesRequest,
  QueryEntitiesResponse,
} from '@backstage/catalog-client';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { rest } from 'msw';
import request from 'supertest';

import { randomInt } from 'node:crypto';

import { loadTestFixture, LOCAL_ADDR } from '../../../../__fixtures__/handlers';
import {
  setupTest,
  startBackendServer,
} from '../../../../__fixtures__/testUtils';

describe('imports', () => {
  const useTestData = setupTest();

  describe('POST /imports', () => {
    it('returns 400 if there is nothing in request body', async () => {
      const { mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      const response = await request(backendServer)
        .post('/api/bulk-import/imports')
        .send([]);

      expect(response.status).toEqual(400);
    });

    it('returns 202 with appropriate import statuses', async () => {
      const { server, mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      mockCatalogClient.addLocation = jest
        .fn()
        .mockImplementation(
          (location: { type: string; target: string; dryRun: boolean }) => {
            let exists = false;
            switch (location.target) {
              case 'https://gitlab.com/my-org-ent-1/java-quarkus-starter/blob/main/catalog-info.yaml':
                exists = true;
                break;
              case 'https://gitlab.com/my-org-ent-1/does-not-exist-in-catalog-but-errors-with-pr-creation/blob/dev/catalog-info.yaml':
              case 'https://gitlab.com/my-org-ent-2/animated-happiness/blob/main/catalog-info.yaml':
              default:
                break;
            }
            return Promise.resolve({ exists: exists });
          },
        );
      mockCatalogClient.queryEntities = jest
        .fn()
        .mockImplementation(
          async (
            _request?: QueryEntitiesRequest,
            _options?: CatalogRequestOptions,
          ): Promise<QueryEntitiesResponse> => {
            return {
              items: [
                {
                  apiVersion: 'backstage.io/v1alpha1',
                  kind: 'Location',
                  metadata: {
                    name: `generated-from-tests-${randomInt(1, 100)}`,
                    namespace: 'default',
                  },
                },
              ],
              totalItems: 1,
              pageInfo: {},
            };
          },
        );

      server.use(
        rest.post(
          `http://localhost:${backendServer.port()}/api/catalog/analyze-location`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json({
                existingEntityFiles: [],
                generateEntities: [],
              }),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fdoes-not-exist-in-catalog-but-errors-with-pr-creation/repository/files/catalog-info.yaml`,
          (_req, res, ctx) => res(ctx.status(404)),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fdoes-not-exist-in-catalog-but-errors-with-pr-creation/merge_requests`,
          (_req, res, ctx) => res(ctx.status(200), ctx.json([])),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fdoes-not-exist-in-catalog-but-errors-with-pr-creation`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json({
                name: 'does-not-exist-in-catalog-but-errors-with-pr-creation',
                path_with_namespace:
                  'my-org-ent-1/does-not-exist-in-catalog-but-errors-with-pr-creation',
                _links: {
                  self: 'https://gitlab.com/my-org-ent-1/does-not-exist-in-catalog-but-errors-with-pr-creation',
                },
                web_url:
                  'https://gitlab.com/my-org-ent-1/does-not-exist-in-catalog-but-errors-with-pr-creation',
                default_branch: 'dev',
                updated_at: '2017-07-08T16:18:44-04:00',
              }),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fdoes-not-exist-in-catalog-but-errors-with-pr-creation/repository/branches/dev`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json({
                name: 'dev',
                web_url:
                  'https://gitlab.com/my-org-ent-1/does-not-exist-in-catalog-but-errors-with-pr-creation/-/tree/dev',
                commit: {
                  type: 'commit',
                  id: 'aa218f56b14c9653891f9e74264a383fa43fefbd',
                  web_url:
                    'https://gitlab.com/my-org-ent-1/does-not-exist-in-catalog-but-errors-with-pr-creation/-/commit/aa218f56b14c9653891f9e74264a383fa43fefbd',
                },
              }),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fdoes-not-exist-in-catalog-but-errors-with-pr-creation/repository/branches/backstage-integration`,
          (_req, res, ctx) => res(ctx.status(404)),
        ),
        rest.post(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fdoes-not-exist-in-catalog-but-errors-with-pr-creation/repository/branches`,
          (_req, res, ctx) =>
            res(
              ctx.status(422),
              ctx.json({
                message: 'unable to create PR due to a server error',
              }),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fanimated-happiness/repository/files/catalog-info.yaml`,
          (_req, res, ctx) => res(ctx.status(404)),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fanimated-happiness/merge_requests`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json(
                loadTestFixture(
                  'gitlab/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-pr/pulls/opened.json',
                ),
              ),
            ),
        ),
        rest.put(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fanimated-happiness/merge_requests/454`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json(
                loadTestFixture(
                  'gitlab/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-pr/pulls/opened.json',
                )[0],
              ),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fanimated-happiness`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json({
                name: 'animated-happiness',
                _links: {
                  self: 'https://gitlab.com/my-org-ent-2/animated-happiness',
                },
                path_with_namespace: 'my-org-ent-2/animated-happiness',
                web_url: 'https://gitlab.com/my-org-ent-2/animated-happiness',
                default_branch: 'main',
                updated_at: '2017-07-08T16:18:44-04:00',
              }),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fanimated-happiness/repository/branches/main`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json({
                name: 'main',
                web_url:
                  'https://gitlab.com/my-org-ent-2/animated-happiness/-/tree/main',
                commit: {
                  type: 'commit',
                  id: 'aa218f56b14c9653891f9e74264a383fa43fefbd',
                  web_url:
                    'https://gitlab.com/my-org-ent-2/animated-happinessn/-/commit/aa218f56b14c9653891f9e74264a383fa43fefbd',
                },
              }),
            ),
        ),
        rest.post(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fanimated-happiness/repository/files/catalog-info.yaml`,
          (_req, res, ctx) => res(ctx.status(201)),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fjava-quarkus-starter/repository/files/catalog-info.yaml`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json(
                loadTestFixture(
                  'gitlab/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch/contents/catalog-info.yaml.json',
                ),
              ),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fjava-quarkus-starter`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json({
                name: 'animated-happiness',
                path_with_namespace: 'my-org-ent-1/java-quarkus-starter',
                _links: {
                  self: 'https://gitlab.com/my-org-ent-1/java-quarkus-starter',
                },
                web_url: 'https://gitlab.com/my-org-ent-1/java-quarkus-starter',
                default_branch: 'main',
                updated_at: '2024-07-08T16:18:44-04:00',
              }),
            ),
        ),
      );

      const response = await request(backendServer)
        .post('/api/bulk-import/imports')
        .send([
          {
            approvalTool: 'GITLAB',
            repository: {
              url: 'https://gitlab.com/my-org-ent-1/does-not-exist-in-catalog-but-errors-with-pr-creation',
              defaultBranch: 'dev',
            },
          },
          {
            approvalTool: 'GITLAB',
            repository: {
              url: 'https://gitlab.com/my-org-ent-2/animated-happiness',
              defaultBranch: 'main',
            },
            catalogInfoContent: `---
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: animated-happiness
  annotations:
    gitlab.com/project-slug: my-org-ent-2/animated-happiness
spec:
  type: other
  lifecycle: unknown
  owner: my-org-ent-2
---
`,
            gitlab: {
              pullRequest: {
                title: 'Custom PR title: catalog-info.yaml',
              },
            },
          },
          {
            approvalTool: 'GITLAB',
            repository: {
              url: 'https://gitlab.com/my-org-ent-1/java-quarkus-starter',
              defaultBranch: 'main',
            },
          },
        ]);

      expect(response.status).toEqual(202);
      expect(response.body).toEqual([
        {
          errors: ['unable to create PR due to a server error'],
          repository: {
            defaultBranch: 'dev',
            url: 'https://gitlab.com/my-org-ent-1/does-not-exist-in-catalog-but-errors-with-pr-creation',
          },
          status: 'PR_ERROR',
        },
        {
          approvalTool: 'GITLAB',
          gitlab: {
            pullRequest: {
              number: 454,
              url: 'https://gitlab.com/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-p/-/merge_requests/454',
            },
          },
          lastUpdate: '2025-08-20T18:16:50.667Z',
          repository: {
            name: 'animated-happiness',
            organization: 'my-org-ent-2',
            url: 'https://gitlab.com/my-org-ent-2/animated-happiness',
          },
          status: 'WAIT_PR_APPROVAL',
        },
        {
          lastUpdate: '2024-07-08T16:18:44-04:00',
          repository: {
            name: 'java-quarkus-starter',
            organization: 'my-org-ent-1',
            url: 'https://gitlab.com/my-org-ent-1/java-quarkus-starter',
          },
          status: 'ADDED',
        },
      ]);
      // Location entity refresh triggered (on each 'ADDED' repo)
      expect(mockCatalogClient.refreshEntity).toHaveBeenCalledTimes(1);
    });

    it('return dry-run results in errors array for each item in request body', async () => {
      const { server, mockCatalogClient } = useTestData();
      const backendServer = await startBackendServer(
        mockCatalogClient,
        AuthorizeResult.ALLOW,
      );

      mockCatalogClient.queryEntities = jest.fn().mockImplementation(
        async (req: {
          filter: {
            'metadata.name': string;
          };
        }) => {
          if (req.filter['metadata.name'] === 'my-entity-b') {
            return {
              totalItems: 1,
              items: [
                {
                  apiVersion: 'backstage.io/v1alpha1',
                  kind: 'Component',
                  component: {
                    name: 'my-entity-b',
                  },
                },
              ],
            };
          }
          return { totalItems: 0, items: [] };
        },
      );
      server.use(
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fmy-repo-a/repository/contributors`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json([loadTestFixture('gitlab/user/user.json')]),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-1%2Fmy-repo-a/repository/files/catalog-info.yaml`,
          (_req, res, ctx) => res(ctx.status(404)),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fmy-repo-b/repository/contributors`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json([loadTestFixture('gitlab/user/user.json')]),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fmy-repo-b/repository/files/catalog-info.yaml`,
          (_req, res, ctx) => res(ctx.status(200)),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fmy-repo-c/repository/contributors`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json([]), // gitlab will return an empty array if there are no contributors
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fmy-repo-c/repository/files/catalog-info.yaml`,
          (_req, res, ctx) => res(ctx.status(404)),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fmy-repo-d/repository/contributors`,
          (_req, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json([loadTestFixture('gitlab/user/user.json')]),
            ),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fmy-repo-d/repository/files/catalog-info.yaml`,
          (_req, res, ctx) => res(ctx.status(404)),
        ),
        rest.get(
          `${LOCAL_ADDR}/api/v4/projects/my-org-ent-2%2Fmy-repo-d/repository/files/.gitlab%2FCODEOWNERS`,
          (_req, res, ctx) => res(ctx.status(404)),
        ),
      );

      const response = await request(backendServer)
        .post('/api/bulk-import/imports')
        .query({ dryRun: true })
        .send([
          {
            // catalogEntityName not specified => catalog entity checks will be skipped
            approvalTool: 'GITLAB',
            repository: {
              url: 'https://gitlab.com/my-org-ent-1/my-repo-a',
              defaultBranch: 'dev',
            },
          },
          {
            approvalTool: 'GITLAB',
            catalogEntityName: 'my-entity-b',
            repository: {
              url: 'https://gitlab.com/my-org-ent-2/my-repo-b',
              defaultBranch: 'main',
            },
          },
          {
            approvalTool: 'GITLAB',
            catalogEntityName: 'my-entity-c',
            repository: {
              url: 'https://gitlab.com/my-org-ent-2/my-repo-c',
              defaultBranch: 'trunk',
            },
          },
          {
            approvalTool: 'GITLAB',
            catalogEntityName: 'my-entity-d',
            codeOwnersFileAsEntityOwner: true,
            repository: {
              url: 'https://gitlab.com/my-org-ent-2/my-repo-d',
              defaultBranch: 'devBranch',
            },
          },
        ]);
      expect(response.status).toEqual(202);
      expect(response.body).toEqual([
        {
          errors: [],
          repository: {
            url: 'https://gitlab.com/my-org-ent-1/my-repo-a',
            name: 'my-repo-a',
            organization: 'my-org-ent-1',
          },
        },
        {
          errors: [
            'CATALOG_ENTITY_CONFLICT',
            'CATALOG_INFO_FILE_EXISTS_IN_REPO',
          ],
          catalogEntityName: 'my-entity-b',
          repository: {
            url: 'https://gitlab.com/my-org-ent-2/my-repo-b',
            name: 'my-repo-b',
            organization: 'my-org-ent-2',
          },
        },
        {
          errors: ['REPO_EMPTY'],
          catalogEntityName: 'my-entity-c',
          repository: {
            url: 'https://gitlab.com/my-org-ent-2/my-repo-c',
            name: 'my-repo-c',
            organization: 'my-org-ent-2',
          },
        },
        {
          errors: ['CODEOWNERS_FILE_NOT_FOUND_IN_REPO'],
          catalogEntityName: 'my-entity-d',
          repository: {
            url: 'https://gitlab.com/my-org-ent-2/my-repo-d',
            name: 'my-repo-d',
            organization: 'my-org-ent-2',
          },
        },
      ]);
    });
  });
});
