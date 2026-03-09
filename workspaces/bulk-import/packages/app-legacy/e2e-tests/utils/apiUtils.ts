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
import { Page } from '@playwright/test';

/**
 * API route patterns for bulk import endpoints
 */
export const ApiRoutes = {
  repositories: '**/api/bulk-import/repositories*',
  importsDryRun: '**/api/bulk-import/imports?dryRun=true*',
  imports: '**/api/bulk-import/imports',
  byRepoBackend:
    '**/api/bulk-import/import/by-repo?repo=https://github.com/test-org/backend-service*',
  byRepoFrontend:
    '**/api/bulk-import/import/by-repo?repo=https://github.com/test-org/frontend-app*',
} as const;

type ApiRouteKey = keyof typeof ApiRoutes;

/**
 * Generic helper to mock any bulk import API response
 */
async function mockApiResponse(
  page: Page,
  route: string,
  responseData: object,
  status = 200,
) {
  await page.route(route, async r => {
    await r.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

/**
 * Mock bulk import API response by route key
 */
export async function mockBulkImportResponse(
  page: Page,
  routeKey: ApiRouteKey,
  responseData: object,
  status = 200,
) {
  await mockApiResponse(page, ApiRoutes[routeKey], responseData, status);
}

// Convenience functions for specific routes (preserves backward compatibility)
export const mockBulkImportRepositoriesResponse = (
  page: Page,
  responseData: object,
  status = 200,
) => mockApiResponse(page, ApiRoutes.repositories, responseData, status);

export const mockBulkImportDryRunResponse = (
  page: Page,
  responseData: object,
  status = 200,
) => mockApiResponse(page, ApiRoutes.importsDryRun, responseData, status);

export const mockBulkImportImportsResponse = (
  page: Page,
  responseData: object,
  status = 200,
) => mockApiResponse(page, ApiRoutes.imports, responseData, status);

export const mockBulkImportByRepoResponse = (
  page: Page,
  responseData: object,
  status = 200,
) => mockApiResponse(page, ApiRoutes.byRepoBackend, responseData, status);

export const mockBulkImportByRepoFrontendResponse = (
  page: Page,
  responseData: object,
  status = 200,
) => mockApiResponse(page, ApiRoutes.byRepoFrontend, responseData, status);

// Reusable repository definitions
const repositories = {
  backendService: {
    id: 'test-org/backend-service',
    name: 'backend-service',
    organization: 'test-org',
    url: 'https://github.com/test-org/backend-service',
    defaultBranch: 'main',
    lastUpdate: '2024-12-21T15:21:03Z',
  },
  frontendApp: {
    id: 'test-org/frontend-app',
    name: 'frontend-app',
    organization: 'test-org',
    url: 'https://github.com/test-org/frontend-app',
    defaultBranch: 'main',
    lastUpdate: '2024-12-27T06:12:46Z',
  },
  apiGateway: {
    id: 'sample-org/api-gateway',
    name: 'api-gateway',
    organization: 'sample-org',
    url: 'https://github.com/sample-org/api-gateway',
    defaultBranch: 'main',
    lastUpdate: '2024-06-12T11:00:00Z',
  },
  sharedComponents: {
    id: 'sample-org/shared-components',
    name: 'shared-components',
    organization: 'sample-org',
    url: 'https://github.com/sample-org/shared-components',
    defaultBranch: 'main',
    lastUpdate: '2025-05-22T06:54:21Z',
  },
  exampleService: {
    id: 'demo-org/example-service',
    name: 'example-service',
    organization: 'demo-org',
    url: 'https://github.com/demo-org/example-service',
    defaultBranch: 'master',
    lastUpdate: '2025-05-16T18:52:04Z',
  },
} as const;

/** Mock data for repositories list response */
export const mockRepositoriesData = {
  errors: [],
  repositories: [
    { ...repositories.backendService, errors: [] },
    { ...repositories.frontendApp, errors: [] },
    { ...repositories.apiGateway, errors: [] },
    { ...repositories.sharedComponents, errors: [] },
    { ...repositories.exampleService, errors: [] },
  ],
  totalCount: 325,
  pagePerIntegration: 1,
  sizePerIntegration: 5,
  approvalTool: 'GIT',
};

/** Mock data for dry run import response - validation results */
export const mockImportsDryRunData = [
  {
    errors: ['CATALOG_INFO_FILE_EXISTS_IN_REPO'],
    catalogEntityName: repositories.backendService.name,
    repository: {
      url: repositories.backendService.url,
      name: repositories.backendService.name,
      organization: repositories.backendService.organization,
    },
  },
];

/** Mock data for import response - successful import */
export const mockImportsData = [
  {
    status: 'ADDED',
    repository: {
      url: repositories.backendService.url,
      name: repositories.backendService.name,
      organization: repositories.backendService.organization,
    },
  },
];

/** Mock data for backend-service import by repo response */
export const mockImportByRepoData = {
  id: repositories.backendService.url,
  repository: repositories.backendService,
  approvalTool: 'GIT',
  status: 'ADDED',
  lastUpdate: repositories.backendService.lastUpdate,
};

/** Mock data for frontend-app import by repo response - waiting for PR approval */
export const mockImportByRepoFrontendData = {
  id: repositories.frontendApp.url,
  repository: repositories.frontendApp,
  approvalTool: 'GIT',
  status: 'WAIT_PR_APPROVAL',
  github: {
    pullRequest: {
      number: 1,
      url: `${repositories.frontendApp.url}/pull/1`,
      title: 'Add catalog-info.yaml config file',
      body: `This pull request adds a **Backstage entity metadata file**
to this repository so that the component can
be added to the [software catalog](http://localhost:3000/catalog).
After this pull request is merged, the component will become available.
For more information, read an [overview of the Backstage software catalog](https://backstage.io/docs/features/software-catalog/).
View the import job in your app [here](http://localhost:3000/bulk-import?repository=${repositories.frontendApp.url}&defaultBranch=${repositories.frontendApp.defaultBranch}).`,
      catalogInfoContent: `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${repositories.frontendApp.name}
  annotations:
    github.com/project-slug: ${repositories.frontendApp.id}
spec:
  type: other
  lifecycle: unknown
  owner: user:development/guest
`,
    },
  },
  lastUpdate: repositories.frontendApp.lastUpdate,
};
