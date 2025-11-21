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

import { IdentityApi } from '@backstage/core-plugin-api';

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import {
  mockGetImportJobs,
  mockGetOrganizations,
  mockGetRepositories,
  mockSelectedRepositories,
} from '../mocks/mockData';
import {
  AddedRepositoryColumnNameEnum,
  ApprovalTool,
  ImportFlow,
  RepositoryStatus,
  SortingOrderEnum,
} from '../types';
import { prepareDataForSubmission } from '../utils/repository-utils';
import {
  BulkImportAPI,
  BulkImportBackendClient,
} from './BulkImportBackendClient';

const LOCAL_ADDR = 'https://localhost:7007';
const handlers = [
  rest.get(`${LOCAL_ADDR}/api/bulk-import/repositories`, (req, res, ctx) => {
    const searchParam = req.url.searchParams.get('search');
    const test = req.headers.get('Content-Type');
    if (searchParam) {
      return res(
        ctx.status(200),
        ctx.json(
          mockGetRepositories.repositories.filter(r =>
            r.repoName?.includes(searchParam),
          ),
        ),
      );
    }
    if (test === 'application/json') {
      return res(ctx.status(200), ctx.json(mockGetRepositories.repositories));
    }
    return res(ctx.status(404));
  }),
  rest.get(
    `${LOCAL_ADDR}/api/bulk-import/organizations/org/dessert/repositories`,
    (req, res, ctx) => {
      const test = req.headers.get('Content-Type');
      const searchParam = req.url.searchParams.get('search');
      if (searchParam) {
        return res(
          ctx.status(200),
          ctx.json(
            mockGetRepositories.repositories.filter(
              r =>
                r.orgName === 'org/dessert' &&
                r.repoName?.includes(searchParam),
            ),
          ),
        );
      }
      if (test === 'application/json') {
        return res(
          ctx.status(200),
          ctx.json(
            mockGetRepositories.repositories.filter(
              r => r.orgName === 'org/dessert',
            ),
          ),
        );
      }
      return res(ctx.status(404));
    },
  ),
  rest.get(`${LOCAL_ADDR}/api/bulk-import/organizations`, (req, res, ctx) => {
    const test = req.headers.get('Content-Type');
    const searchParam = req.url.searchParams.get('search');

    if (searchParam) {
      return res(
        ctx.status(200),
        ctx.json(
          mockGetOrganizations.organizations.filter(r =>
            r.orgName?.includes(searchParam),
          ),
        ),
      );
    }
    if (test === 'application/json') {
      return res(ctx.status(200), ctx.json(mockGetOrganizations.organizations));
    }
    return res(ctx.status(404));
  }),
  rest.get(
    `${LOCAL_ADDR}/api/bulk-import/import/by-repo?repo=org/dessert/donut&defaultBranch=master`,
    (req, res, ctx) => {
      const test = req.headers.get('Content-Type');
      if (test === 'application/json') {
        return res(
          ctx.status(200),
          ctx.json(
            mockGetImportJobs.imports.find(i => i.id === 'org/dessert/donut'),
          ),
        );
      }
      return res(ctx.status(404));
    },
  ),
  rest.get(`${LOCAL_ADDR}/api/bulk-import/imports`, (req, res, ctx) => {
    const test = req.headers.get('Content-Type');
    const searchParam = req.url.searchParams.get('search');

    if (searchParam) {
      return res(
        ctx.status(200),
        ctx.json(
          mockGetImportJobs.imports.filter(r =>
            r.repository.name?.includes(searchParam),
          ),
        ),
      );
    }
    if (test === 'application/json') {
      return res(ctx.status(200), ctx.json(mockGetImportJobs));
    }
    return res(ctx.status(404));
  }),
  rest.post(
    `${LOCAL_ADDR}/api/bulk-import/imports?dryRun=true`,
    async (req, res, ctx) => {
      const jobs = await req.json();
      if (
        !jobs ||
        jobs.length === 0 ||
        jobs.some(
          (job: { repository: { name: string } }) => job.repository.name === '',
        )
      ) {
        return res(
          ctx.json({
            message: 'Dry run for creating import jobs failed',
            ok: false,
            status: 404,
          }),
        );
      }
      return res(ctx.json(jobs));
    },
  ),
  rest.delete(
    `${LOCAL_ADDR}/api/bulk-import/import/by-repo?repo=org/dessert/donut&defaultBranch=master`,
    (req, res, ctx) => {
      const test = req.headers.get('Content-Type');
      if (test === 'application/json') {
        return res(ctx.json({ status: 200, ok: true }));
      }
      return res(ctx.json({ status: 404, ok: false }));
    },
  ),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.restoreHandlers());
afterAll(() => server.close());

const getConfigApi = (importAPI: ImportFlow) => ({
  has: jest.fn(),
  keys: jest.fn(),
  get: jest.fn(),
  getBoolean: jest.fn(),
  getConfig: jest.fn(),
  getConfigArray: jest.fn(),
  getNumber: jest.fn(),
  getString: jest.fn(key => {
    if (key === 'backend.baseUrl') {
      return LOCAL_ADDR;
    }
    return '';
  }),
  getStringArray: jest.fn(),
  getOptional: jest.fn(),
  getOptionalStringArray: jest.fn(),
  getOptionalBoolean: jest.fn(),
  getOptionalConfig: jest.fn(),
  getOptionalConfigArray: jest.fn(),
  getOptionalNumber: jest.fn(),
  getOptionalString: jest.fn(key => {
    if (key === 'bulkImport.importAPI') {
      return importAPI;
    }
    return undefined;
  }),
});

const bearerToken = 'test-token';

const identityApi = {
  async getCredentials() {
    return { token: bearerToken };
  },
} as IdentityApi;

describe('BulkImportBackendClient with open-pull-requests', () => {
  let bulkImportApi: BulkImportAPI;

  beforeEach(() => {
    bulkImportApi = new BulkImportBackendClient({
      configApi: getConfigApi(ImportFlow.OpenPullRequests),
      identityApi: identityApi,
    });
  });

  describe('getRepositories', () => {
    it('getRepositories should retrieve repositories successfully', async () => {
      const repositories = await bulkImportApi.dataFetcher(
        1,
        2,
        '',
        ApprovalTool.Git,
      );
      expect(repositories).toEqual(mockGetRepositories.repositories);
    });

    it('getRepositories should retrieve repositories based on search string', async () => {
      const repositories = await bulkImportApi.dataFetcher(
        1,
        2,
        'ap',
        ApprovalTool.Git,
      );
      expect(repositories).toEqual(
        mockGetRepositories.repositories.filter(r => r.repoName.includes('ap')),
      );
    });

    it('getRepositories should handle non-200/204 responses correctly', async () => {
      server.use(
        rest.get(
          `${LOCAL_ADDR}/api/bulk-import/repositories`,
          (_req, res, ctx) => {
            return res(ctx.status(404));
          },
        ),
      );

      await expect(
        bulkImportApi.dataFetcher(1, 2, '', ApprovalTool.Git),
      ).resolves.toEqual(expect.objectContaining([]));
    });
  });

  describe('getRepositories from an organization', () => {
    it('getRepositories should retrieve repositories from an organization successfully', async () => {
      const repositories = await bulkImportApi.dataFetcher(
        1,
        2,
        '',
        ApprovalTool.Git,
        {
          orgName: 'org/dessert',
        },
      );
      expect(repositories).toEqual(
        mockGetRepositories.repositories.filter(
          r => r.orgName === 'org/dessert',
        ),
      );
    });

    it('getRepositories should retrieve repositories from an organization based on search string', async () => {
      const repositories = await bulkImportApi.dataFetcher(
        1,
        2,
        'des',
        ApprovalTool.Git,
        {
          orgName: 'org/dessert',
        },
      );
      expect(repositories).toEqual(
        mockGetRepositories.repositories.filter(
          r => r.orgName === 'org/dessert' && r.repoName.includes('des'),
        ),
      );
    });
  });

  describe('getOrganizations', () => {
    it('getOrganizations should retrieve organizations successfully', async () => {
      const orgs = await bulkImportApi.dataFetcher(1, 2, '', ApprovalTool.Git, {
        fetchOrganizations: true,
      });
      expect(orgs).toEqual(mockGetOrganizations.organizations);
    });

    it('getOrganizations should retrieve organizations based on search string', async () => {
      const orgs = await bulkImportApi.dataFetcher(
        1,
        2,
        'des',
        ApprovalTool.Git,
        {
          fetchOrganizations: true,
        },
      );
      expect(orgs).toEqual(
        mockGetOrganizations.organizations.filter(r =>
          r.orgName.includes('des'),
        ),
      );
    });

    it('getOrganizations should handle non-200/204 responses correctly', async () => {
      server.use(
        rest.get(
          `${LOCAL_ADDR}/api/bulk-import/organizations`,
          (_req, res, ctx) => {
            return res(ctx.status(404));
          },
        ),
      );

      await expect(
        bulkImportApi.dataFetcher(1, 2, '', ApprovalTool.Git, {
          fetchOrganizations: true,
        }),
      ).resolves.toEqual(expect.objectContaining([]));
    });
  });

  describe('getImportJobs', () => {
    it('getImportJobs should retrieve the import jobs successfully', async () => {
      const jobs = await bulkImportApi.getImportJobs(
        1,
        2,
        '',
        AddedRepositoryColumnNameEnum.repoName,
        SortingOrderEnum.Asc,
      );
      expect(jobs).toEqual(mockGetImportJobs);
    });

    it('getImportJobs should retrieve the import jobs based on search string', async () => {
      const jobs = await bulkImportApi.getImportJobs(
        1,
        2,
        'cup',
        AddedRepositoryColumnNameEnum.repoName,
        SortingOrderEnum.Asc,
      );
      expect(jobs).toEqual(
        mockGetImportJobs.imports.filter(r =>
          r.repository.name?.includes('cup'),
        ),
      );
    });

    it('getImportJobs should handle non-200/204 responses correctly', async () => {
      await expect(
        bulkImportApi.getImportJobs(
          1,
          2,
          '',
          AddedRepositoryColumnNameEnum.repoName,
          SortingOrderEnum.Asc,
        ),
      ).resolves.toEqual(expect.objectContaining([]));
    });
  });

  describe('deleteImportAction', () => {
    it('deleteImportAction should send a DELETE request and handle successful response', async () => {
      const response = await bulkImportApi.deleteImportAction(
        'org/dessert/cupcake',
        'main',
      );

      expect(response.status).toBe(200);
    });
  });

  describe('getImportAction', () => {
    it('getImportAction should retrive the status of the repo', async () => {
      const response = await bulkImportApi.getImportAction(
        'org/dessert/donut',
        'master',
      );

      expect(response.status).toBe(RepositoryStatus.WAIT_PR_APPROVAL);
      expect(response).toEqual(
        mockGetImportJobs.imports.find(i => i.id === 'org/dessert/donut'),
      );
    });
  });

  describe('createImportJobs', () => {
    it('createImportJobs should be able to dry run and check for errors', async () => {
      let response = await bulkImportApi.createImportJobs(
        prepareDataForSubmission(mockSelectedRepositories, ApprovalTool.Git),
        true,
      );

      expect(response.length).toBe(4);

      response = await bulkImportApi.createImportJobs(
        prepareDataForSubmission(
          {
            ['org/dessert/cupcake']: {
              ...mockGetRepositories.repositories[0],
              repoName: '',
            },
          },
          ApprovalTool.Git,
        ),
        true,
      );

      expect(response).toEqual({
        message: 'Dry run for creating import jobs failed',
        ok: false,
        status: 404,
      });
    });
  });
});

describe('BulkImportBackendClient with scaffolder', () => {
  let bulkImportApi: BulkImportAPI;

  beforeEach(() => {
    bulkImportApi = new BulkImportBackendClient({
      configApi: getConfigApi(ImportFlow.Scaffolder),
      identityApi: identityApi,
    });
  });

  describe('createImportJobs', () => {
    it('should be able to dry run and return an empty object', async () => {
      const response = await bulkImportApi.createImportJobs(
        prepareDataForSubmission(mockSelectedRepositories, ApprovalTool.Git),
        true,
      );
      expect(response).toEqual({});
    });
  });
});
