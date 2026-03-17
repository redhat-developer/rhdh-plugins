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

// This file is handled as a non-test file by Jest, even if it is used for tests only.
// We want to keep these dependencies among devDependencies in the package.json file.
// eslint-disable-next-line @backstage/no-undeclared-imports
import { mockApis, MockErrorApi } from '@backstage/test-utils';
// eslint-disable-next-line @backstage/no-undeclared-imports
import { featureFlagsApiRef } from '@backstage/frontend-plugin-api';

import { ApiRef, configApiRef, errorApiRef } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';
import {
  Project,
  ProjectsGet,
  ProjectsGet200Response,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export const createMockProjects = (
  count: number,
  offset: number = 0,
): Project[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = offset + i;
    return {
      id: `project-${index}`,
      name: `Project ${index}`,
      abbreviation: `P${index}`,
      description: `Description ${index}`,
      sourceRepoUrl: `https://github.com/org/source-repo${index}`,
      targetRepoUrl: `https://github.com/org/target-repo${index}`,
      sourceRepoBranch: `main${index}`,
      targetRepoBranch: `main${index}`,
      createdAt: new Date(
        `2024-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
      ),
      createdBy: `user:default/user${index}`,
    };
  });
};

export const createMockResponse = (
  items: Project[],
  totalCount: number,
): ProjectsGet200Response => ({
  items,
  totalCount,
});

/**
 * APIs required by Backstage's Table component when rendering outside of
 * `renderInTestApp` (which sets these up automatically via wrapInTestApp).
 */
export const backstageTableApis: [ApiRef<any>, any][] = [
  [errorApiRef, new MockErrorApi()],
  [translationApiRef, mockApis.translation()],
  [configApiRef, mockApis.config({})],
  [
    featureFlagsApiRef,
    {
      registerFlag: jest.fn(),
      getRegisteredFlags: jest.fn().mockReturnValue([]),
      isActive: jest.fn().mockReturnValue(false),
      save: jest.fn(),
    },
  ],
];

export const mockPermissionApi = {
  authorize: jest.fn().mockResolvedValue({ result: 'ALLOW' }),
};

export const defaultTableProps = (
  projects: Project[],
  totalCount: number,
  overrides?: Partial<{
    page: number;
    pageSize: number;
    orderBy: number;
    orderDirection: ProjectsGet['query']['order'];
  }>,
) => {
  const orderBy = overrides?.orderBy ?? 1;
  const orderDirection = overrides?.orderDirection ?? 'asc';
  const page = overrides?.page ?? 0;
  const pageSize = overrides?.pageSize ?? 10;

  return {
    projects,
    totalCount,
    forceRefresh: jest.fn(),
    orderBy,
    orderDirection,
    setOrderBy: jest.fn(),
    setOrderDirection: jest.fn(),
    page,
    pageSize,
    onPageChange: jest.fn(),
    onRowsPerPageChange: jest.fn(),
  };
};
