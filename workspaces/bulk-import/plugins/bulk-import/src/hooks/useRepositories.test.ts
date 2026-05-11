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

const mockUseApiHolder = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
  useApiHolder: () => mockUseApiHolder(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

beforeEach(() => {
  // Default: no scmAuth registered → tokenLoading is immediately false
  mockUseApiHolder.mockReturnValue({
    get: jest.fn().mockReturnValue(undefined),
  });
});

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

  describe('scmAuth token collection', () => {
    it('skips token fetching and renders successfully when scmAuth is not registered', async () => {
      // Default mock: apiHolder.get returns undefined for scmAuthApiRef
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
        expect(result.current.data?.repositories).toBeDefined();
      });
    });

    it('collects tokens from scmAuth when it is registered and getSCMHosts succeeds', async () => {
      const mockGetCredentials = jest
        .fn()
        .mockResolvedValue({ token: 'user-oauth-token-123' });
      const mockScmAuth = { getCredentials: mockGetCredentials };

      const mockGetSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: [],
      });
      const mockBulkImportApi = {
        getSCMHosts: mockGetSCMHosts,
        dataFetcher: jest.fn(),
      };

      mockUseApiHolder.mockReturnValue({
        get: jest.fn().mockReturnValue(mockScmAuth),
      });

      const mockUseApi = jest.requireMock('@backstage/core-plugin-api').useApi;
      mockUseApi.mockImplementation((ref: { id: string }) => {
        if (ref.id === 'plugin.bulk-import.service') return mockBulkImportApi;
        return undefined;
      });

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
      });

      expect(mockGetSCMHosts).toHaveBeenCalled();
      expect(mockGetCredentials).toHaveBeenCalledWith({
        url: 'https://github.com',
        additionalScope: { repoWrite: false },
      });
    });

    it('surfaces a tokenFetchError when scmAuth is registered but all token fetches fail', async () => {
      const mockGetCredentials = jest
        .fn()
        .mockRejectedValue(new Error('No OAuth provider for this host'));
      const mockScmAuth = { getCredentials: mockGetCredentials };

      const mockGetSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: [],
      });
      const mockBulkImportApi = {
        getSCMHosts: mockGetSCMHosts,
        dataFetcher: jest.fn(),
      };

      mockUseApiHolder.mockReturnValue({
        get: jest.fn().mockReturnValue(mockScmAuth),
      });

      const mockUseApi = jest.requireMock('@backstage/core-plugin-api').useApi;
      mockUseApi.mockImplementation((ref: { id: string }) => {
        if (ref.id === 'plugin.bulk-import.service') return mockBulkImportApi;
        return undefined;
      });

      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
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
      });

      // When all token fetches fail, the hook surfaces an error so the UI can
      // prompt the user to configure the SCM OAuth integration.
      expect(result.current.error?.errors).toEqual([
        'No user SCM credentials could be obtained. Please ensure your SCM OAuth integration is configured.',
      ]);
      expect(result.current.loginRejected).toBe(false);
    });

    it('disables the query when tokenFetchError is set (no request fired without tokens)', async () => {
      const mockGetCredentials = jest
        .fn()
        .mockRejectedValue(new Error('No OAuth provider for this host'));
      const mockScmAuth = { getCredentials: mockGetCredentials };

      const mockGetSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: [],
      });
      const mockBulkImportApi = {
        getSCMHosts: mockGetSCMHosts,
        dataFetcher: jest.fn(),
      };

      mockUseApiHolder.mockReturnValue({
        get: jest.fn().mockReturnValue(mockScmAuth),
      });

      const mockUseApi = jest.requireMock('@backstage/core-plugin-api').useApi;
      mockUseApi.mockImplementation((ref: { id: string }) => {
        if (ref.id === 'plugin.bulk-import.service') return mockBulkImportApi;
        return undefined;
      });

      (useQuery as jest.Mock).mockClear();
      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
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
      });

      // useQuery must have been called with enabled: false so no HTTP request
      // is fired when user tokens are unavailable.
      const lastOptions = (useQuery as jest.Mock).mock.calls.at(-1)?.[2];
      expect(lastOptions?.enabled).toBe(false);
      // Disabled TanStack Query v4 observers still report isLoading=true; the
      // hook must not forward that as UI loading once token fetch failed.
      expect(result.current.loading).toBe(false);
    });

    it('treats OAuth login dismissal as loginRejected without surfacing SCM config error', async () => {
      const rejected = new Error('Login failed, rejected by user');
      rejected.name = 'RejectedError';
      const mockGetCredentials = jest.fn().mockRejectedValue(rejected);
      const mockScmAuth = { getCredentials: mockGetCredentials };

      const mockGetSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: ['https://gitlab.example.com'],
      });
      const mockBulkImportApi = {
        getSCMHosts: mockGetSCMHosts,
        dataFetcher: jest.fn(),
      };

      mockUseApiHolder.mockReturnValue({
        get: jest.fn().mockReturnValue(mockScmAuth),
      });

      const mockUseApi = jest.requireMock('@backstage/core-plugin-api').useApi;
      mockUseApi.mockImplementation((ref: { id: string }) => {
        if (ref.id === 'plugin.bulk-import.service') return mockBulkImportApi;
        return undefined;
      });

      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useRepositories({
          page: 1,
          querySize: 10,
          approvalTool: ApprovalTool.Gitlab,
        }),
      );

      await waitFor(() => {
        expect(result.current.loading).toBeFalsy();
        expect(result.current.loginRejected).toBe(true);
      });

      expect(result.current.error?.errors).toBeUndefined();
      const lastOptions = (useQuery as jest.Mock).mock.calls.at(-1)?.[2];
      expect(lastOptions?.enabled).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it('does not include raw token values in the React Query key', async () => {
      const secretToken = 'super-secret-oauth-token';
      const mockGetCredentials = jest
        .fn()
        .mockResolvedValue({ token: secretToken });
      const mockScmAuth = { getCredentials: mockGetCredentials };

      const mockGetSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: [],
      });
      const mockBulkImportApi = {
        getSCMHosts: mockGetSCMHosts,
        dataFetcher: jest.fn(),
      };

      mockUseApiHolder.mockReturnValue({
        get: jest.fn().mockReturnValue(mockScmAuth),
      });

      const mockUseApi = jest.requireMock('@backstage/core-plugin-api').useApi;
      mockUseApi.mockImplementation((ref: { id: string }) => {
        if (ref.id === 'plugin.bulk-import.service') return mockBulkImportApi;
        return undefined;
      });

      (useQuery as jest.Mock).mockClear();
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
      });

      // Inspect the query key from the most recent render — it must never
      // expose raw token values; only the sorted host URLs should appear.
      const lastQueryKey = (useQuery as jest.Mock).mock.calls.at(-1)?.[0];
      const serialised = JSON.stringify(lastQueryKey);
      expect(serialised).not.toContain(secretToken);
      expect(serialised).toContain('https://github.com');
    });

    it('skips token fetching when getSCMHosts returns a Response error', async () => {
      const mockScmAuth = { getCredentials: jest.fn() };
      const mockGetSCMHosts = jest
        .fn()
        .mockResolvedValue(new Response(null, { status: 403 }));
      const mockBulkImportApi = {
        getSCMHosts: mockGetSCMHosts,
        dataFetcher: jest.fn(),
      };

      mockUseApiHolder.mockReturnValue({
        get: jest.fn().mockReturnValue(mockScmAuth),
      });

      const mockUseApi = jest.requireMock('@backstage/core-plugin-api').useApi;
      mockUseApi.mockImplementation((ref: { id: string }) => {
        if (ref.id === 'plugin.bulk-import.service') return mockBulkImportApi;
        return undefined;
      });

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
      });

      // getCredentials should not be called since getSCMHosts failed
      expect(mockScmAuth.getCredentials).not.toHaveBeenCalled();
    });
  });
});
