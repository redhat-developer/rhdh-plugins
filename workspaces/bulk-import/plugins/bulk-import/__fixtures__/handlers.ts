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
import { rest } from 'msw';

import {
  mockGetImportJobs,
  mockGetOrganizations,
  mockGetRepositories,
} from '../src/mocks/mockData';

export const LOCAL_ADDR = 'https://localhost:7007';
export const FRONTEND_TEST_HANDLERS = [
  // getApi src/utils/repository-utils.tsx
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
  // getApi in src/utils/repository-utils.tsx
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
  // getApi in src/utils/repository-utils.tsx
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
  // getImportAction src/api/PRBulkImportBackendClientImpl.ts
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
  // getImportJobs src/api/PRBulkImportBackendClientImpl.ts
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
  // createImportJobs src/api/PRBulkImportBackendClientImpl.ts
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
  // deleteImportAction src/api/PRBulkImportBackendClientImpl.ts
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
  // getApi src/utils/repository-utils.tsx
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
  // getApi in src/utils/repository-utils.tsx
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
  // getApi in src/utils/repository-utils.tsx
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
  // getImportAction src/api/ScaffolderBulkImportBackendClientImpl.ts
  rest.get(
    `${LOCAL_ADDR}/api/bulk-import/task-import/by-repo?repo=org/dessert/donut`,
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
  // getImportJobs src/api/ScaffolderBulkImportBackendClientImpl.ts
  rest.get(`${LOCAL_ADDR}/api/bulk-import/task-imports`, (req, res, ctx) => {
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
  // createImportJobs src/api/ScaffolderBulkImportBackendClientImpl.ts
  rest.post(
    `${LOCAL_ADDR}/api/bulk-import/task-imports?dryRun=true`,
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
  // deleteImportAction src/api/ScaffolderBulkImportBackendClientImpl.ts
  rest.delete(
    `${LOCAL_ADDR}/api/bulk-import/task-import/by-repo?repo=org/dessert/donut`,
    (req, res, ctx) => {
      const test = req.headers.get('Content-Type');
      if (test === 'application/json') {
        return res(ctx.json({ status: 200, ok: true }));
      }
      return res(ctx.json({ status: 404, ok: false }));
    },
  ),
];
