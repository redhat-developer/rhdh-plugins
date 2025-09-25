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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';
import type { CatalogClient } from '@backstage/catalog-client';

import gitUrlParse from 'git-url-parse';

import { CatalogHttpClient } from '../../../catalog/catalogHttpClient';
import { CatalogLocation } from '../../../catalog/types';
import { Paths } from '../../../generated/openapi';
import { GithubApiService } from '../../../github';
import { GitlabApiService } from '../../../gitlab';
import { deleteImportByRepo, findAllImports } from './bulkImports';

const config = mockServices.rootConfig({
  data: {
    app: {
      baseUrl: 'https://my-backstage-app.example.com',
    },
    integrations: {
      gitlab: [
        {
          host: 'gitlab.com',
          token: 'hardcoded_token', // notsecret
        },
      ],
      github: [
        {
          host: 'github.com',
          apps: [
            {
              appId: 1,
              privateKey: 'privateKey',
              webhookSecret: '123',
              clientId: 'CLIENT_ID',
              clientSecret: 'CLIENT_SECRET',
            },
          ],
          token: 'hardcoded_token', // notsecret
        },
      ],
    },
  },
});

describe('bulkimports.ts unit tests', () => {
  let logger: LoggerService;
  let mockCatalogHttpClient: CatalogHttpClient;
  let mockGithubApiService: GithubApiService;
  let mockGitlabApiService: GitlabApiService;

  beforeEach(() => {
    logger = mockServices.logger.mock();
    const mockAuth = mockServices.auth.mock({
      getPluginRequestToken: async () => {
        return {
          token: 'ey123.abc.xyzzz', // notsecret
        };
      },
    });
    const mockCache = mockServices.cache.mock();
    const mockDiscovery = mockServices.discovery.mock();
    // TODO(rm3l): Use 'catalogServiceMock' from '@backstage/plugin-catalog-node/testUtils'
    //  once '@backstage/plugin-catalog-node' is upgraded
    const mockCatalogClient = {
      getEntitiesByRefs: jest.fn(),
      validateEntity: jest.fn(),
      addLocation: jest.fn(),
      queryEntities: jest.fn(),
      refreshEntity: jest.fn(),
    } as unknown as CatalogClient;
    mockCatalogHttpClient = new CatalogHttpClient({
      logger,
      config,
      discovery: mockDiscovery,
      auth: mockAuth,
      catalogApi: mockCatalogClient,
    });
    mockGithubApiService = new GithubApiService(logger, config, mockCache);
    initializeGithubApiServiceMock();

    mockGitlabApiService = new GitlabApiService(logger, config, mockCache);
    initializeGitlabApiServiceMock();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function initializeGitlabApiServiceMock() {
    jest
      .spyOn(mockGitlabApiService, 'getRepositoryFromIntegrations')
      .mockImplementation(async (repoUrl: string) => {
        let defaultBranch = 'main';
        switch (repoUrl) {
          case 'https://gitlab.com/my-org-2/my-repo-21':
          case 'https://gitlab.com/my-org-2/my-repo-22':
            defaultBranch = 'master';
            break;
          case 'https://gitlab.com/my-org-3/my-repo-32':
          case 'https://gitlab.com/my-org-3/my-repo-33':
            defaultBranch = 'dev';
            break;
          default:
            break;
        }
        const gitUrl = gitUrlParse(repoUrl);
        return {
          repository: {
            name: gitUrl.name,
            full_name: gitUrl.full_name,
            url: repoUrl,
            html_url: repoUrl,
            updated_at: null,
            default_branch: defaultBranch,
          },
        };
      });

    jest
      .spyOn(mockGitlabApiService, 'findImportOpenPr')
      .mockImplementation((_logger, input) => {
        const resp: {
          prNum?: number;
          prUrl?: string;
        } = {};
        switch (input.repoUrl) {
          case 'https://gitlab.com/my-user/my-repo-123':
            return Promise.reject(
              new Error(
                'could not find out if there is an import PR open on this repo',
              ),
            );
          case 'https://gitlab.com/my-org-1/my-repo-11':
            resp.prNum = 987;
            resp.prUrl = `https://gitlab.com/my-org-1/my-repo-11/pull/${resp.prNum}`;
            break;
          case 'https://gitlab.com/my-org-3/my-repo-32':
            resp.prNum = 100;
            resp.prUrl = `https://gitlab.com/my-org-2/my-repo-21/pull/${resp.prNum}`;
            break;
          default:
            break;
        }
        return Promise.resolve(resp);
      });

    jest
      .spyOn(mockGitlabApiService, 'hasFileInRepo')
      .mockImplementation(async input => {
        if (input.fileName === 'catalog-info.yaml') {
          return [
            'https://gitlab.com/my-org-2/my-repo-21',
            'https://gitlab.com/my-org-3/my-repo-31',
          ].includes(input.repoUrl);
        }
        throw new Error(
          `searching for presence of a file named ${input.fileName} has to be implemented in this test`,
        );
      });
  }

  function initializeGithubApiServiceMock() {
    jest
      .spyOn(mockGithubApiService, 'getRepositoryFromIntegrations')
      .mockImplementation(async (repoUrl: string) => {
        let defaultBranch = 'main';
        switch (repoUrl) {
          case 'https://github.com/my-org-2/my-repo-21':
          case 'https://github.com/my-org-2/my-repo-22':
            defaultBranch = 'master';
            break;
          case 'https://github.com/my-org-3/my-repo-32':
          case 'https://github.com/my-org-3/my-repo-33':
            defaultBranch = 'dev';
            break;
          default:
            break;
        }
        const gitUrl = gitUrlParse(repoUrl);
        return {
          repository: {
            name: gitUrl.name,
            full_name: gitUrl.full_name,
            url: repoUrl,
            html_url: repoUrl,
            updated_at: null,
            default_branch: defaultBranch,
          },
        };
      });

    jest
      .spyOn(mockGithubApiService, 'findImportOpenPr')
      .mockImplementation((_logger, input) => {
        const resp: {
          prNum?: number;
          prUrl?: string;
        } = {};
        switch (input.repoUrl) {
          case 'https://github.com/my-user/my-repo-123':
            return Promise.reject(
              new Error(
                'could not find out if there is an import PR open on this repo',
              ),
            );
          case 'https://github.com/my-org-1/my-repo-11':
            resp.prNum = 987;
            resp.prUrl = `https://github.com/my-org-1/my-repo-11/pull/${resp.prNum}`;
            break;
          case 'https://github.com/my-org-3/my-repo-32':
            resp.prNum = 100;
            resp.prUrl = `https://github.com/my-org-2/my-repo-21/pull/${resp.prNum}`;
            break;
          default:
            break;
        }
        return Promise.resolve(resp);
      });

    jest
      .spyOn(mockGithubApiService, 'hasFileInRepo')
      .mockImplementation(async input => {
        if (input.fileName === 'catalog-info.yaml') {
          return [
            'https://github.com/my-org-2/my-repo-21',
            'https://github.com/my-org-3/my-repo-31',
          ].includes(input.repoUrl);
        }
        throw new Error(
          `searching for presence of a file named ${input.fileName} has to be implemented in this test`,
        );
      });
  }

  function intersect(target: string[], input: string[]) {
    return input.filter(loc => target.includes(loc));
  }

  describe('findAllImports', () => {
    const locationUrls = [
      // from app-config
      {
        id: 'app-config--location-https://github.com/my-org-1/my-repo-11/blob/main/catalog-info.yaml',
        target:
          'https://github.com/my-org-1/my-repo-11/blob/main/catalog-info.yaml',
        source: 'config',
      },
      {
        id: 'app-config--location-https://github.com/my-org-1/my-repo-12/blob/main/some/path/to/catalog-info.yaml',
        target:
          'https://github.com/my-org-1/my-repo-12/blob/main/some/path/to/catalog-info.yaml',
        source: 'config',
      },
      {
        id: 'app-config--location-https://github.com/my-user/my-repo-123/blob/main/catalog-info.yaml',
        target:
          'https://github.com/my-user/my-repo-123/blob/main/catalog-info.yaml',
        source: 'config',
      },
      {
        id: 'app-config--location-https://github.com/some-public-org/some-public-repo/blob/main/catalog-info.yaml',
        target:
          'https://github.com/some-public-org/some-public-repo/blob/main/catalog-info.yaml',
        source: 'config',
      },

      // from some Locations
      {
        id: 'l-21',
        target:
          'https://github.com/my-org-2/my-repo-21/blob/master/catalog-info.yaml',
        source: 'location',
      },
      {
        id: 'l-22',
        target:
          'https://github.com/my-org-2/my-repo-22/blob/master/catalog-info.yaml',
        source: 'location',
      },
      {
        id: 'l-211',
        target:
          'https://github.com/my-org-21/my-repo-211/blob/another-branch/catalog-info.yaml',
        source: 'location',
      },

      // from some Location entities (simulating repos that could be auto-discovered by the discovery plugin)
      {
        id: 'o-31',
        target:
          'https://github.com/my-org-3/my-repo-31/blob/main/catalog-info.yaml',
        source: 'integration',
      },
      {
        id: 'o-32',
        target:
          'https://github.com/my-org-3/my-repo-32/blob/dev/catalog-info.yaml',
        source: 'integration',
      },
      {
        id: 'o-33',
        target: 'https://github.com/my-org-3/my-repo-33/blob/dev/all.yaml',
        source: 'integration',
      },
      {
        id: 'o-34',
        target:
          'https://github.com/my-org-3/my-repo-34/blob/dev/path/to/catalog-info.yaml',
        source: 'integration',
      },

      // Gitlab related
      {
        id: 'app-config--location-https://gitlab.com/my-org-1/my-repo-11/blob/main/catalog-info.yaml',
        target:
          'https://gitlab.com/my-org-1/my-repo-11/blob/main/catalog-info.yaml',
        source: 'config',
      },
      {
        id: 'app-config--location-https://gitlab.com/my-org-1/my-repo-12/blob/main/some/path/to/catalog-info.yaml',
        target:
          'https://gitlab.com/my-org-1/my-repo-12/blob/main/some/path/to/catalog-info.yaml',
        source: 'config',
      },
      {
        id: 'app-config--location-https://gitlab.com/my-user/my-repo-123/blob/main/catalog-info.yaml',
        target:
          'https://gitlab.com/my-user/my-repo-123/blob/main/catalog-info.yaml',
        source: 'config',
      },
      {
        id: 'app-config--location-https://gitlab.com/some-public-org/some-public-repo/blob/main/catalog-info.yaml',
        target:
          'https://gitlab.com/some-public-org/some-public-repo/blob/main/catalog-info.yaml',
        source: 'config',
      },

      // from some Locations
      {
        id: 'l-21',
        target:
          'https://gitlab.com/my-org-2/my-repo-21/blob/master/catalog-info.yaml',
        source: 'location',
      },
      {
        id: 'l-22',
        target:
          'https://gitlab.com/my-org-2/my-repo-22/blob/master/catalog-info.yaml',
        source: 'location',
      },
      {
        id: 'l-211',
        target:
          'https://gitlab.com/my-org-21/my-repo-211/blob/another-branch/catalog-info.yaml',
        source: 'location',
      },

      // from some Location entities (simulating repos that could be auto-discovered by the discovery plugin)
      {
        id: 'o-31',
        target:
          'https://gitlab.com/my-org-3/my-repo-31/blob/main/catalog-info.yaml',
        source: 'integration',
      },
      {
        id: 'o-32',
        target:
          'https://gitlab.com/my-org-3/my-repo-32/blob/dev/catalog-info.yaml',
        source: 'integration',
      },
      {
        id: 'o-33',
        target: 'https://gitlab.com/my-org-3/my-repo-33/blob/dev/all.yaml',
        source: 'integration',
      },
      {
        id: 'o-34',
        target:
          'https://gitlab.com/my-org-3/my-repo-34/blob/dev/path/to/catalog-info.yaml',
        source: 'integration',
      },
    ] as CatalogLocation[];

    function searchInLocationUrls(
      locations: CatalogLocation[],
      search?: string,
    ) {
      return search
        ? locations.filter(l => l.target.toLowerCase().includes(search))
        : locations;
    }

    it.each([undefined, 'v1', 'v2'])(
      'should return only imports from repos that are accessible from the configured GH/GL integrations (API Version: %s)',
      async apiVersionStr => {
        jest
          .spyOn(mockCatalogHttpClient, 'listCatalogUrlLocationsById')
          .mockResolvedValue({
            locations: locationUrls,
            totalCount: locationUrls.length,
          });
        jest
          .spyOn(
            mockGitlabApiService,
            'filterLocationsAccessibleFromIntegrations',
          )
          .mockResolvedValue([
            // only repos that are accessible from the configured GL integrations
            // are considered as valid Imports
            'https://gitlab.com/my-org-1/my-repo-11/blob/main/catalog-info.yaml', // PR
            'https://gitlab.com/my-user/my-repo-123/blob/main/catalog-info.yaml', // PR Error
            'https://gitlab.com/my-org-2/my-repo-21/blob/master/catalog-info.yaml', // ADDED
            'https://gitlab.com/my-org-2/my-repo-22/blob/master/catalog-info.yaml', // no PR => null status
            'https://gitlab.com/my-org-3/my-repo-31/blob/main/catalog-info.yaml', // ADDED
            'https://gitlab.com/my-org-3/my-repo-32/blob/dev/catalog-info.yaml', // PR
          ]);
        jest
          .spyOn(
            mockGithubApiService,
            'filterLocationsAccessibleFromIntegrations',
          )
          .mockResolvedValue([
            // only repos that are accessible from the configured GH integrations
            // are considered as valid Imports
            'https://github.com/my-org-1/my-repo-11/blob/main/catalog-info.yaml', // PR
            'https://github.com/my-user/my-repo-123/blob/main/catalog-info.yaml', // PR Error
            'https://github.com/my-org-2/my-repo-21/blob/master/catalog-info.yaml', // ADDED
            'https://github.com/my-org-2/my-repo-22/blob/master/catalog-info.yaml', // no PR => null status
            'https://github.com/my-org-3/my-repo-31/blob/main/catalog-info.yaml', // ADDED
            'https://github.com/my-org-3/my-repo-32/blob/dev/catalog-info.yaml', // PR
          ]);
        jest
          .spyOn(mockCatalogHttpClient, 'findLocationEntitiesByTargetUrl')
          .mockResolvedValue([]);

        const apiVersion = apiVersionStr as
          | Paths.FindAllImports.Parameters.ApiVersion
          | undefined;
        let resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
        );
        expect(resp.statusCode).toEqual(200);
        const allImportsExpected = [
          {
            id: 'https://github.com/my-org-1/my-repo-11',
            repository: {
              url: 'https://github.com/my-org-1/my-repo-11',
              name: 'my-repo-11',
              organization: 'my-org-1',
              id: 'my-org-1/my-repo-11',
              defaultBranch: 'main',
            },
            approvalTool: 'GIT',
            status: 'WAIT_PR_APPROVAL',
            github: {
              pullRequest: {
                number: 987,
                url: 'https://github.com/my-org-1/my-repo-11/pull/987',
              },
            },
            source: 'config',
          },
          {
            id: 'https://gitlab.com/my-org-1/my-repo-11',
            repository: {
              url: 'https://gitlab.com/my-org-1/my-repo-11',
              name: 'my-repo-11',
              organization: 'my-org-1',
              id: 'my-org-1/my-repo-11',
              defaultBranch: 'main',
            },
            approvalTool: 'GITLAB',
            status: 'WAIT_PR_APPROVAL',
            gitlab: {
              pullRequest: {
                number: 987,
                url: 'https://gitlab.com/my-org-1/my-repo-11/pull/987',
              },
            },
            source: 'config',
          },
          {
            id: 'https://github.com/my-user/my-repo-123',
            repository: {
              url: 'https://github.com/my-user/my-repo-123',
              name: 'my-repo-123',
              organization: 'my-user',
              id: 'my-user/my-repo-123',
              defaultBranch: 'main',
            },
            approvalTool: 'GIT',
            status: 'PR_ERROR',
            source: 'config',
            errors: [
              'could not find out if there is an import PR open on this repo',
            ],
          },
          {
            id: 'https://gitlab.com/my-user/my-repo-123',
            repository: {
              url: 'https://gitlab.com/my-user/my-repo-123',
              name: 'my-repo-123',
              organization: 'my-user',
              id: 'my-user/my-repo-123',
              defaultBranch: 'main',
            },
            approvalTool: 'GITLAB',
            status: 'PR_ERROR',
            source: 'config',
            errors: [
              'could not find out if there is an import PR open on this repo',
            ],
          },
          {
            id: 'https://github.com/my-org-2/my-repo-21',
            repository: {
              url: 'https://github.com/my-org-2/my-repo-21',
              name: 'my-repo-21',
              organization: 'my-org-2',
              id: 'my-org-2/my-repo-21',
              defaultBranch: 'master',
            },
            approvalTool: 'GIT',
            status: 'ADDED',
            source: 'location',
          },
          {
            id: 'https://gitlab.com/my-org-2/my-repo-21',
            repository: {
              url: 'https://gitlab.com/my-org-2/my-repo-21',
              name: 'my-repo-21',
              organization: 'my-org-2',
              id: 'my-org-2/my-repo-21',
              defaultBranch: 'master',
            },
            approvalTool: 'GITLAB',
            status: 'ADDED',
            source: 'location',
          },
          {
            id: 'https://github.com/my-org-2/my-repo-22',
            repository: {
              url: 'https://github.com/my-org-2/my-repo-22',
              name: 'my-repo-22',
              organization: 'my-org-2',
              id: 'my-org-2/my-repo-22',
              defaultBranch: 'master',
            },
            approvalTool: 'GIT',
            status: null,
            source: 'location',
          },
          {
            id: 'https://gitlab.com/my-org-2/my-repo-22',
            repository: {
              url: 'https://gitlab.com/my-org-2/my-repo-22',
              name: 'my-repo-22',
              organization: 'my-org-2',
              id: 'my-org-2/my-repo-22',
              defaultBranch: 'master',
            },
            approvalTool: 'GITLAB',
            status: null,
            source: 'location',
          },
          {
            id: 'https://github.com/my-org-3/my-repo-31',
            repository: {
              url: 'https://github.com/my-org-3/my-repo-31',
              name: 'my-repo-31',
              organization: 'my-org-3',
              id: 'my-org-3/my-repo-31',
              defaultBranch: 'main',
            },
            approvalTool: 'GIT',
            status: 'ADDED',
            source: 'integration',
          },
          {
            id: 'https://gitlab.com/my-org-3/my-repo-31',
            repository: {
              url: 'https://gitlab.com/my-org-3/my-repo-31',
              name: 'my-repo-31',
              organization: 'my-org-3',
              id: 'my-org-3/my-repo-31',
              defaultBranch: 'main',
            },
            approvalTool: 'GITLAB',
            status: 'ADDED',
            source: 'integration',
          },
          {
            id: 'https://github.com/my-org-3/my-repo-32',
            repository: {
              url: 'https://github.com/my-org-3/my-repo-32',
              name: 'my-repo-32',
              organization: 'my-org-3',
              id: 'my-org-3/my-repo-32',
              defaultBranch: 'dev',
            },
            approvalTool: 'GIT',
            status: 'WAIT_PR_APPROVAL',
            source: 'integration',
            github: {
              pullRequest: {
                number: 100,
                url: 'https://github.com/my-org-2/my-repo-21/pull/100',
              },
            },
          },
          {
            id: 'https://gitlab.com/my-org-3/my-repo-32',
            repository: {
              url: 'https://gitlab.com/my-org-3/my-repo-32',
              name: 'my-repo-32',
              organization: 'my-org-3',
              id: 'my-org-3/my-repo-32',
              defaultBranch: 'dev',
            },
            approvalTool: 'GITLAB',
            status: 'WAIT_PR_APPROVAL',
            source: 'integration',
            gitlab: {
              pullRequest: {
                number: 100,
                url: 'https://gitlab.com/my-org-2/my-repo-21/pull/100',
              },
            },
          },
        ];
        let expectedResponse: any = allImportsExpected;
        if (apiVersion === 'v2') {
          expectedResponse = {
            imports: allImportsExpected,
            page: 1,
            size: 20,
            totalCount: 12,
          };
        }
        expect(resp.responseBody).toEqual(expectedResponse);

        // Request different pages and sizes
        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            pageNumber: 1,
            pageSize: 4,
          },
        );
        expect(resp.statusCode).toEqual(200);
        expectedResponse = allImportsExpected.slice(0, 4);
        if (apiVersion === 'v2') {
          expectedResponse = {
            imports: expectedResponse,
            page: 1,
            size: 4,
            totalCount: 12,
          };
        }
        expect(resp.responseBody).toEqual(expectedResponse);

        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            pageNumber: 2,
            pageSize: 4,
          },
        );
        expect(resp.statusCode).toEqual(200);
        expectedResponse = allImportsExpected.slice(4, 8);
        if (apiVersion === 'v2') {
          expectedResponse = {
            imports: expectedResponse,
            page: 2,
            size: 4,
            totalCount: 12,
          };
        }
        expect(resp.responseBody).toEqual(expectedResponse);

        // No data for this page
        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            pageNumber: 4,
            pageSize: 4,
          },
        );
        expect(resp.statusCode).toEqual(200);
        expectedResponse = [];
        if (apiVersion === 'v2') {
          expectedResponse = {
            imports: expectedResponse,
            page: 4,
            size: 4,
            totalCount: 12,
          };
        }
        expect(resp.responseBody).toEqual(expectedResponse);
      },
    );

    it.each([undefined, 'v1', 'v2'])(
      'should respect search and pagination when returning imports (API Version: %s)',
      async apiVersionStr => {
        const listCatalogUrlLocationsMockFn = async (
          search?: string | undefined,
          _pageNumber?: number | undefined,
          _pageSize?: number | undefined,
        ) => {
          const filteredLocations = searchInLocationUrls(locationUrls, search);
          return {
            locations: filteredLocations,
            totalCount: filteredLocations.length,
          };
        };
        jest
          .spyOn(mockCatalogHttpClient, 'listCatalogUrlLocationsById')
          .mockImplementation(listCatalogUrlLocationsMockFn);
        jest
          .spyOn(
            mockGitlabApiService,
            'filterLocationsAccessibleFromIntegrations',
          )
          .mockImplementation(async (locs: string[]) => {
            const accessible = [
              // only repos that are accessible from the configured GH integrations
              // are considered as valid Imports
              'https://gitlab.com/my-org-1/my-repo-11/blob/main/catalog-info.yaml', // PR
              'https://gitlab.com/my-user/my-repo-123/blob/main/catalog-info.yaml', // PR Error
              'https://gitlab.com/my-org-2/my-repo-21/blob/master/catalog-info.yaml', // ADDED
              'https://gitlab.com/my-org-2/my-repo-22/blob/master/catalog-info.yaml', // no PR => null status
              'https://gitlab.com/my-org-3/my-repo-31/blob/main/catalog-info.yaml', // ADDED
              'https://gitlab.com/my-org-3/my-repo-32/blob/dev/catalog-info.yaml', // PR
            ];
            return intersect(accessible, locs);
          });
        jest
          .spyOn(
            mockGithubApiService,
            'filterLocationsAccessibleFromIntegrations',
          )
          .mockImplementation(async (locs: string[]) => {
            const accessible = [
              // only repos that are accessible from the configured GH integrations
              // are considered as valid Imports
              'https://github.com/my-org-1/my-repo-11/blob/main/catalog-info.yaml', // PR
              'https://github.com/my-user/my-repo-123/blob/main/catalog-info.yaml', // PR Error
              'https://github.com/my-org-2/my-repo-21/blob/master/catalog-info.yaml', // ADDED
              'https://github.com/my-org-2/my-repo-22/blob/master/catalog-info.yaml', // no PR => null status
              'https://github.com/my-org-3/my-repo-31/blob/main/catalog-info.yaml', // ADDED
              'https://github.com/my-org-3/my-repo-32/blob/dev/catalog-info.yaml', // PR
            ];
            return intersect(accessible, locs);
          });
        jest
          .spyOn(mockCatalogHttpClient, 'findLocationEntitiesByTargetUrl')
          .mockResolvedValue([]);

        const apiVersion = apiVersionStr as
          | Paths.FindAllImports.Parameters.ApiVersion
          | undefined;
        let resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            search: 'lorem ipsum dolor sit amet should not return any data',
          },
        );
        expect(resp.statusCode).toEqual(200);
        let expectedResponse: any = [];
        if (apiVersion === 'v2') {
          expectedResponse = {
            imports: expectedResponse,
            page: 1,
            size: 20,
            totalCount: 0,
          };
        }
        expect(resp.responseBody).toEqual(expectedResponse);

        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            search: 'my-repo-2',
          },
        );
        expect(resp.statusCode).toEqual(200);
        const allImportsExpected = [
          {
            id: 'https://github.com/my-org-2/my-repo-21',
            repository: {
              url: 'https://github.com/my-org-2/my-repo-21',
              name: 'my-repo-21',
              organization: 'my-org-2',
              id: 'my-org-2/my-repo-21',
              defaultBranch: 'master',
            },
            approvalTool: 'GIT',
            status: 'ADDED',
            source: 'location',
          },
          {
            id: 'https://gitlab.com/my-org-2/my-repo-21',
            repository: {
              url: 'https://gitlab.com/my-org-2/my-repo-21',
              name: 'my-repo-21',
              organization: 'my-org-2',
              id: 'my-org-2/my-repo-21',
              defaultBranch: 'master',
            },
            approvalTool: 'GITLAB',
            status: 'ADDED',
            source: 'location',
          },
          {
            id: 'https://github.com/my-org-2/my-repo-22',
            repository: {
              url: 'https://github.com/my-org-2/my-repo-22',
              name: 'my-repo-22',
              organization: 'my-org-2',
              id: 'my-org-2/my-repo-22',
              defaultBranch: 'master',
            },
            approvalTool: 'GIT',
            status: null,
            source: 'location',
          },
          {
            id: 'https://gitlab.com/my-org-2/my-repo-22',
            repository: {
              url: 'https://gitlab.com/my-org-2/my-repo-22',
              name: 'my-repo-22',
              organization: 'my-org-2',
              id: 'my-org-2/my-repo-22',
              defaultBranch: 'master',
            },
            approvalTool: 'GITLAB',
            status: null,
            source: 'location',
          },
        ];
        expectedResponse = allImportsExpected;
        if (apiVersion === 'v2') {
          expectedResponse = {
            imports: expectedResponse,
            page: 1,
            size: 20,
            totalCount: 4,
          };
        }
        expect(resp.responseBody).toEqual(expectedResponse);

        // Request different pages and sizes
        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            search: 'my-repo-2',
            pageNumber: 1,
            pageSize: 1,
          },
        );
        expect(resp.statusCode).toEqual(200);
        expectedResponse = allImportsExpected.slice(0, 1);
        if (apiVersion === 'v2') {
          expectedResponse = {
            imports: expectedResponse,
            page: 1,
            size: 1,
            totalCount: 4,
          };
        }
        expect(resp.responseBody).toEqual(expectedResponse);

        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            search: 'my-repo-2',
            pageNumber: 2,
            pageSize: 1,
          },
        );
        expect(resp.statusCode).toEqual(200);
        expectedResponse = allImportsExpected.slice(1, 2);
        if (apiVersion === 'v2') {
          expectedResponse = {
            imports: expectedResponse,
            page: 2,
            size: 1,
            totalCount: 4,
          };
        }
        expect(resp.responseBody).toEqual(expectedResponse);

        // Unit test for sort if nothing is provided sorting should be based on name in asc order
        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            pageNumber: 1,
            pageSize: 6,
          },
        );
        const sortedNames =
          apiVersion === 'v2'
            ? (
                resp?.responseBody as {
                  imports: { repository: { name: any } }[];
                }
              )?.imports?.map(importObj => importObj.repository.name)
            : (resp?.responseBody as { repository: { name: any } }[])?.map(
                importObj => importObj.repository.name,
              );
        let expectedSortedArray = [
          'my-repo-11',
          'my-repo-11',
          'my-repo-123',
          'my-repo-123',
          'my-repo-21',
          'my-repo-21',
        ];
        expect(sortedNames).toEqual(expectedSortedArray);

        // sorting  based on organization in asc order
        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            pageNumber: 1,
            pageSize: 6,
            sortColumn: 'repository.organization',
            sortOrder: 'asc',
          },
        );

        let sortedOrganization =
          apiVersion === 'v2'
            ? (
                resp?.responseBody as {
                  imports: { repository: { organization: any } }[];
                }
              )?.imports?.map(importObj => importObj.repository.organization)
            : (
                resp?.responseBody as { repository: { organization: any } }[]
              )?.map(importObj => importObj.repository.organization);
        expectedSortedArray = [
          'my-org-1',
          'my-org-1',
          'my-org-2',
          'my-org-2',
          'my-org-2',
          'my-org-2',
        ];
        expect(sortedOrganization).toEqual(expectedSortedArray);
        // sorting  based on organization in desc order
        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            pageNumber: 1,
            pageSize: 6,
            sortColumn: 'repository.organization',
            sortOrder: 'desc',
          },
        );

        sortedOrganization =
          apiVersion === 'v2'
            ? (
                resp?.responseBody as {
                  imports: { repository: { organization: any } }[];
                }
              )?.imports?.map(importObj => importObj.repository.organization)
            : (
                resp?.responseBody as { repository: { organization: any } }[]
              )?.map(importObj => importObj.repository.organization);
        expectedSortedArray = [
          'my-user',
          'my-user',
          'my-org-3',
          'my-org-3',
          'my-org-3',
          'my-org-3',
        ];
        expect(sortedOrganization).toEqual(expectedSortedArray);

        // No data for this page
        resp = await findAllImports(
          {
            logger,
            config,
            gitlabApiService: mockGitlabApiService,
            githubApiService: mockGithubApiService,
            catalogHttpClient: mockCatalogHttpClient,
          },
          {
            apiVersion,
          },
          {
            search: 'my-repo-2',
            pageNumber: 5,
            pageSize: 1,
          },
        );
        expect(resp.statusCode).toEqual(200);
        expectedResponse = [];
        if (apiVersion === 'v2') {
          expectedResponse = {
            imports: expectedResponse,
            page: 5,
            size: 1,
            totalCount: 4,
          };
        }
        expect(resp.responseBody).toEqual(expectedResponse);
      },
    );
  });

  describe('deleteImportByRepo', () => {
    const repoUrl = 'https://github.com/my-org-1/my-repo-11';
    const defaultBranch = 'main';

    beforeEach(() => {
      jest.spyOn(mockGithubApiService, 'closeImportPR').mockResolvedValue();
      jest
        .spyOn(mockGithubApiService, 'deleteImportBranch')
        .mockResolvedValue();
      jest
        .spyOn(
          mockCatalogHttpClient,
          'listCatalogUrlLocationsByIdFromLocationsEndpoint',
        )
        .mockResolvedValue({
          locations: [
            {
              id: 'location-id-11',
              target: `${repoUrl}/blob/${defaultBranch}/catalog-info.yaml`,
              source: 'location',
            },
          ],
          totalCount: 1,
        });
      jest
        .spyOn(mockCatalogHttpClient, 'deleteCatalogLocationById')
        .mockResolvedValue();
    });

    it('should not try to delete PR is there is no open import PR, but still try to delete import branch if any', async () => {
      jest
        .spyOn(mockGithubApiService, 'findImportOpenPr')
        .mockResolvedValue({});

      await deleteImportByRepo(
        {
          logger,
          config,
          gitApiService: mockGithubApiService,
          catalogHttpClient: mockCatalogHttpClient,
        },
        repoUrl,
        defaultBranch,
      );

      expect(mockGithubApiService.closeImportPR).not.toHaveBeenCalled();
      expect(mockGithubApiService.deleteImportBranch).toHaveBeenCalledTimes(1);
      expect(mockGithubApiService.deleteImportBranch).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          repoUrl,
        }),
      );
      expect(
        mockCatalogHttpClient.deleteCatalogLocationById,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCatalogHttpClient.deleteCatalogLocationById,
      ).toHaveBeenNthCalledWith(1, 'location-id-11');
    });

    it('should try to delete both PR and branch if there is an open import PR', async () => {
      const prNum = 123456789;
      jest.spyOn(mockGithubApiService, 'findImportOpenPr').mockResolvedValue({
        prNum,
        prUrl: `${repoUrl}/pull/${prNum}`,
      });

      await deleteImportByRepo(
        {
          logger,
          config,
          gitApiService: mockGithubApiService,
          catalogHttpClient: mockCatalogHttpClient,
        },
        repoUrl,
        defaultBranch,
      );

      expect(mockGithubApiService.closeImportPR).toHaveBeenCalledTimes(1);
      expect(mockGithubApiService.closeImportPR).toHaveBeenCalledWith(
        logger,
        expect.objectContaining({
          repoUrl,
          comment:
            'Closing PR upon request for bulk import deletion. This request was created from [Red Hat Developer Hub](https://my-backstage-app.example.com).',
        }),
      );
      expect(mockGithubApiService.deleteImportBranch).toHaveBeenCalledTimes(1);
      expect(mockGithubApiService.deleteImportBranch).toHaveBeenCalledWith(
        expect.objectContaining({
          repoUrl,
        }),
      );
      expect(
        mockCatalogHttpClient.deleteCatalogLocationById,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCatalogHttpClient.deleteCatalogLocationById,
      ).toHaveBeenCalledWith('location-id-11');
    });
  });

  describe('deleteImportByRepo - ApprovalTool = Gitlab', () => {
    const repoUrl = 'https://gitlab.com/my-org-1/my-repo-11';
    const defaultBranch = 'main';

    beforeEach(() => {
      jest.spyOn(mockGitlabApiService, 'closeImportPR').mockResolvedValue();
      jest
        .spyOn(mockGitlabApiService, 'deleteImportBranch')
        .mockResolvedValue();
      jest
        .spyOn(
          mockCatalogHttpClient,
          'listCatalogUrlLocationsByIdFromLocationsEndpoint',
        )
        .mockResolvedValue({
          locations: [
            {
              id: 'location-id-11',
              target: `${repoUrl}/blob/${defaultBranch}/catalog-info.yaml`,
              source: 'location',
            },
          ],
          totalCount: 1,
        });
      jest
        .spyOn(mockCatalogHttpClient, 'deleteCatalogLocationById')
        .mockResolvedValue();
    });

    it('should not try to delete PR is there is no open import PR, but still try to delete import branch if any', async () => {
      jest
        .spyOn(mockGitlabApiService, 'findImportOpenPr')
        .mockResolvedValue({});

      await deleteImportByRepo(
        {
          logger,
          config,
          gitApiService: mockGitlabApiService,
          catalogHttpClient: mockCatalogHttpClient,
        },
        repoUrl,
        defaultBranch,
      );

      expect(mockGitlabApiService.closeImportPR).not.toHaveBeenCalled();
      expect(mockGitlabApiService.deleteImportBranch).toHaveBeenCalledTimes(1);
      expect(mockGitlabApiService.deleteImportBranch).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          repoUrl,
        }),
      );
      expect(
        mockCatalogHttpClient.deleteCatalogLocationById,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCatalogHttpClient.deleteCatalogLocationById,
      ).toHaveBeenNthCalledWith(1, 'location-id-11');
    });

    it('should try to delete both PR and branch if there is an open import PR', async () => {
      const prNum = 123456789;
      jest.spyOn(mockGitlabApiService, 'findImportOpenPr').mockResolvedValue({
        prNum,
        prUrl: `${repoUrl}/pull/${prNum}`,
      });

      await deleteImportByRepo(
        {
          logger,
          config,
          gitApiService: mockGitlabApiService,
          catalogHttpClient: mockCatalogHttpClient,
        },
        repoUrl,
        defaultBranch,
      );

      expect(mockGitlabApiService.closeImportPR).toHaveBeenCalledTimes(1);
      expect(mockGitlabApiService.closeImportPR).toHaveBeenCalledWith(
        logger,
        expect.objectContaining({
          repoUrl,
          comment:
            'Closing PR upon request for bulk import deletion. This request was created from [Red Hat Developer Hub](https://my-backstage-app.example.com).',
        }),
      );
      expect(mockGitlabApiService.deleteImportBranch).toHaveBeenCalledTimes(1);
      expect(mockGitlabApiService.deleteImportBranch).toHaveBeenCalledWith(
        expect.objectContaining({
          repoUrl,
        }),
      );
      expect(
        mockCatalogHttpClient.deleteCatalogLocationById,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCatalogHttpClient.deleteCatalogLocationById,
      ).toHaveBeenCalledWith('location-id-11');
    });
  });
});
