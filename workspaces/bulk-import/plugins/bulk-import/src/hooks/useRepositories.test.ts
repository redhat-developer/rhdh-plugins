/*
 * Copyright 2024 The Backstage Authors
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
 */ import { useApi } from '@backstage/core-plugin-api';

import { renderHook, waitFor } from '@testing-library/react';

import { mockGetOrganizations, mockGetRepositories } from '../mocks/mockData';
import { useRepositories } from './useRepositories';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;

describe('useRepositories', () => {
  it('should return repositories', async () => {
    mockUseApi.mockReturnValue({
      dataFetcher: jest.fn().mockReturnValue(mockGetRepositories),
    });
    const { result } = renderHook(() =>
      useRepositories({
        page: 1,
        querySize: 10,
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
    mockUseApi.mockReturnValue({
      dataFetcher: jest.fn().mockReturnValue(mockGetOrganizations),
    });
    const { result } = renderHook(() =>
      useRepositories({ page: 1, querySize: 10, showOrganizations: true }),
    );
    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
      expect(
        Object.values(result.current.data?.organizations || {}).length,
      ).toBe(3);
    });
  });

  it('should return repositories in an organization', async () => {
    mockUseApi.mockReturnValue({
      dataFetcher: jest.fn().mockReturnValue({
        ...mockGetRepositories,
        repositories: mockGetRepositories.repositories?.filter(
          r => r.organization === 'org/dessert',
        ),
      }),
    });
    const { result } = renderHook(() =>
      useRepositories({ page: 1, querySize: 10, orgName: 'org/dessert' }),
    );
    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
      expect(
        Object.values(result.current.data?.repositories || {}).length,
      ).toBe(7);
    });
  });
});
