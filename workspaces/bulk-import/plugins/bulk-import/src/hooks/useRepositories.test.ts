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

import { useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { mockGetOrganizations, mockGetRepositories } from '../mocks/mockData';
import { ApprovalTool } from '../types';
import { useRepositories } from './useRepositories';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

describe('useRepositories', () => {
  it('should return repositories', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockGetRepositories,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() =>
      useRepositories({
        page: 1,
        querySize: 10,
        approvalTool: ApprovalTool.Git,
      }),
    );
    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
      expect(
        Object.values(result.current.data?.repositories || {}).length,
      ).toBe(10);
    });
  });

  it('should return organizations', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockGetOrganizations,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() =>
      useRepositories({
        page: 1,
        querySize: 10,
        showOrganizations: true,
        approvalTool: ApprovalTool.Git,
      }),
    );
    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
      expect(
        Object.values(result.current.data?.organizations || {}).length,
      ).toBe(3);
    });
  });

  it('should return repositories in an organization', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        ...mockGetRepositories,
        repositories: mockGetRepositories.repositories?.filter(
          r => r.organization === 'org/dessert',
        ),
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() =>
      useRepositories({
        page: 1,
        querySize: 10,
        orgName: 'org/dessert',
        approvalTool: ApprovalTool.Git,
      }),
    );
    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
      expect(
        Object.values(result.current.data?.repositories || {}).length,
      ).toBe(7);
    });
  });
});
