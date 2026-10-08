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

import type { ReactNode } from 'react';

import {
  configApiRef,
  identityApiRef,
  type IdentityApi,
} from '@backstage/core-plugin-api';
import { scmAuthApiRef } from '@backstage/integration-react';
import { MockConfigApi, TestApiProvider } from '@backstage/test-utils';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { bulkImportApiRef } from '../api/BulkImportBackendClient';
import { mockGetOrganizations, mockGetRepositories } from '../mocks/mockData';
import { ApprovalTool } from '../types';
import { useRepositories } from './useRepositories';

const mockIdentityApi = {
  getBackstageIdentity: jest
    .fn()
    .mockResolvedValue({ userEntityRef: 'user:default/test' }),
  getProfileInfo: jest.fn(),
  getCredentials: jest.fn(),
  signOut: jest.fn(),
} as unknown as IdentityApi;

const mockConfigApi = new MockConfigApi({
  app: { baseUrl: 'http://localhost:3000' },
});

// Avoid long-lived refetch intervals from the hook default (60s).
const LONG_POLL_MS = 60 * 60 * 1000;

type HookApis = Parameters<typeof TestApiProvider>[0]['apis'];

function createWrapper(apis: HookApis, queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestApiProvider apis={apis}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </TestApiProvider>
    );
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe('useRepositories', () => {
  it('should return repositories', async () => {
    const dataFetcher = jest.fn().mockResolvedValue(mockGetRepositories);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () =>
        useRepositories(
          {
            page: 1,
            querySize: 10,
            approvalTool: ApprovalTool.Git,
          },
          LONG_POLL_MS,
        ),
      {
        wrapper: createWrapper(
          [
            [configApiRef, mockConfigApi],
            [identityApiRef, mockIdentityApi],
            [bulkImportApiRef, { getSCMHosts: jest.fn(), dataFetcher }],
          ],
          queryClient,
        ),
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
      expect(
        Object.values(result.current.data?.repositories || {}).length,
      ).toBe(10);
    });
    expect(dataFetcher).toHaveBeenCalled();
  });

  it('should return organizations', async () => {
    const dataFetcher = jest.fn().mockResolvedValue(mockGetOrganizations);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () =>
        useRepositories(
          {
            page: 1,
            querySize: 10,
            showOrganizations: true,
            approvalTool: ApprovalTool.Git,
          },
          LONG_POLL_MS,
        ),
      {
        wrapper: createWrapper(
          [
            [configApiRef, mockConfigApi],
            [identityApiRef, mockIdentityApi],
            [bulkImportApiRef, { getSCMHosts: jest.fn(), dataFetcher }],
          ],
          queryClient,
        ),
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
      expect(
        Object.values(result.current.data?.organizations || {}).length,
      ).toBe(3);
    });
  });

  it('should return repositories in an organization', async () => {
    const filtered = {
      ...mockGetRepositories,
      repositories: mockGetRepositories.repositories?.filter(
        r => r.organization === 'org/dessert',
      ),
    };
    const dataFetcher = jest.fn().mockResolvedValue(filtered);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () =>
        useRepositories(
          {
            page: 1,
            querySize: 10,
            orgName: 'org/dessert',
            approvalTool: ApprovalTool.Git,
          },
          LONG_POLL_MS,
        ),
      {
        wrapper: createWrapper(
          [
            [configApiRef, mockConfigApi],
            [identityApiRef, mockIdentityApi],
            [bulkImportApiRef, { getSCMHosts: jest.fn(), dataFetcher }],
          ],
          queryClient,
        ),
      },
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
      const dataFetcher = jest.fn().mockResolvedValue(mockGetRepositories);
      const getSCMHosts = jest.fn();
      const queryClient = createQueryClient();

      const { result } = renderHook(
        () =>
          useRepositories(
            {
              page: 1,
              querySize: 10,
              approvalTool: ApprovalTool.Git,
            },
            LONG_POLL_MS,
          ),
        {
          wrapper: createWrapper(
            [
              [configApiRef, mockConfigApi],
              [identityApiRef, mockIdentityApi],
              [bulkImportApiRef, { getSCMHosts, dataFetcher }],
            ],
            queryClient,
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBeFalsy();
        expect(result.current.data?.repositories).toBeDefined();
      });
      expect(getSCMHosts).not.toHaveBeenCalled();
      expect(dataFetcher).toHaveBeenCalled();
    });

    it('collects tokens from scmAuth when it is registered and getSCMHosts succeeds', async () => {
      const mockGetCredentials = jest
        .fn()
        .mockResolvedValue({ token: 'user-oauth-token-123' });
      const dataFetcher = jest.fn().mockResolvedValue(mockGetRepositories);
      const getSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: [],
      });
      const queryClient = createQueryClient();

      const { result } = renderHook(
        () =>
          useRepositories(
            {
              page: 1,
              querySize: 10,
              approvalTool: ApprovalTool.Git,
            },
            LONG_POLL_MS,
          ),
        {
          wrapper: createWrapper(
            [
              [configApiRef, mockConfigApi],
              [identityApiRef, mockIdentityApi],
              [bulkImportApiRef, { getSCMHosts, dataFetcher }],
              [scmAuthApiRef, { getCredentials: mockGetCredentials }],
            ],
            queryClient,
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBeFalsy();
        expect(dataFetcher).toHaveBeenCalled();
      });

      expect(getSCMHosts).toHaveBeenCalled();
      expect(mockGetCredentials).toHaveBeenCalledWith({
        url: 'https://github.com',
        additionalScope: { repoWrite: false },
      });
      expect(dataFetcher.mock.calls[0][4]).toEqual(
        expect.objectContaining({
          scmAuthTokens: { 'https://github.com': 'user-oauth-token-123' },
        }),
      );
    });

    it('surfaces a tokenFetchError when scmAuth is registered but all token fetches fail', async () => {
      const mockGetCredentials = jest
        .fn()
        .mockRejectedValue(new Error('No OAuth provider for this host'));
      const dataFetcher = jest.fn().mockResolvedValue(mockGetRepositories);
      const getSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: [],
      });
      const queryClient = createQueryClient();

      const { result } = renderHook(
        () =>
          useRepositories(
            {
              page: 1,
              querySize: 10,
              approvalTool: ApprovalTool.Git,
            },
            LONG_POLL_MS,
          ),
        {
          wrapper: createWrapper(
            [
              [configApiRef, mockConfigApi],
              [identityApiRef, mockIdentityApi],
              [bulkImportApiRef, { getSCMHosts, dataFetcher }],
              [scmAuthApiRef, { getCredentials: mockGetCredentials }],
            ],
            queryClient,
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBeFalsy();
      });

      expect(result.current.error?.errors).toEqual([
        'No user SCM credentials could be obtained. Please ensure your SCM OAuth integration is configured.',
      ]);
      expect(result.current.loginRejected).toBe(false);
      expect(dataFetcher).not.toHaveBeenCalled();
    });

    it('does not fire dataFetcher when token fetch fails (query gated)', async () => {
      const mockGetCredentials = jest
        .fn()
        .mockRejectedValue(new Error('No OAuth provider for this host'));
      const dataFetcher = jest.fn().mockResolvedValue(mockGetRepositories);
      const getSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: [],
      });
      const queryClient = createQueryClient();

      const { result } = renderHook(
        () =>
          useRepositories(
            {
              page: 1,
              querySize: 10,
              approvalTool: ApprovalTool.Git,
            },
            LONG_POLL_MS,
          ),
        {
          wrapper: createWrapper(
            [
              [configApiRef, mockConfigApi],
              [identityApiRef, mockIdentityApi],
              [bulkImportApiRef, { getSCMHosts, dataFetcher }],
              [scmAuthApiRef, { getCredentials: mockGetCredentials }],
            ],
            queryClient,
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(dataFetcher).not.toHaveBeenCalled();
    });

    it('treats OAuth login dismissal as loginRejected without surfacing SCM config error', async () => {
      const rejected = new Error('Login failed, rejected by user');
      rejected.name = 'RejectedError';
      const mockGetCredentials = jest.fn().mockRejectedValue(rejected);
      const dataFetcher = jest.fn().mockResolvedValue(mockGetRepositories);
      const getSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: ['https://gitlab.example.com'],
      });
      const queryClient = createQueryClient();

      const { result } = renderHook(
        () =>
          useRepositories(
            {
              page: 1,
              querySize: 10,
              approvalTool: ApprovalTool.Gitlab,
            },
            LONG_POLL_MS,
          ),
        {
          wrapper: createWrapper(
            [
              [configApiRef, mockConfigApi],
              [identityApiRef, mockIdentityApi],
              [bulkImportApiRef, { getSCMHosts, dataFetcher }],
              [scmAuthApiRef, { getCredentials: mockGetCredentials }],
            ],
            queryClient,
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBeFalsy();
        expect(result.current.loginRejected).toBe(true);
      });

      expect(result.current.error?.errors).toBeUndefined();
      expect(dataFetcher).not.toHaveBeenCalled();
    });

    it('treats login dismissal by message when error name is not RejectedError', async () => {
      const rejected = new Error('Login failed, rejected by user');
      rejected.name = 'Error';
      const mockGetCredentials = jest.fn().mockRejectedValue(rejected);
      const dataFetcher = jest.fn().mockResolvedValue(mockGetRepositories);
      const getSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: [],
      });
      const queryClient = createQueryClient();

      const { result } = renderHook(
        () =>
          useRepositories(
            {
              page: 1,
              querySize: 10,
              approvalTool: ApprovalTool.Git,
            },
            LONG_POLL_MS,
          ),
        {
          wrapper: createWrapper(
            [
              [configApiRef, mockConfigApi],
              [identityApiRef, mockIdentityApi],
              [bulkImportApiRef, { getSCMHosts, dataFetcher }],
              [scmAuthApiRef, { getCredentials: mockGetCredentials }],
            ],
            queryClient,
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.loginRejected).toBe(true);
      });
      expect(dataFetcher).not.toHaveBeenCalled();
    });

    it('does not include raw token values in the React Query key', async () => {
      const secretToken = 'super-secret-oauth-token';
      const mockGetCredentials = jest
        .fn()
        .mockResolvedValue({ token: secretToken });
      const dataFetcher = jest.fn().mockResolvedValue(mockGetRepositories);
      const getSCMHosts = jest.fn().mockResolvedValue({
        github: ['https://github.com'],
        gitlab: [],
      });
      const queryClient = createQueryClient();

      const { result } = renderHook(
        () =>
          useRepositories(
            {
              page: 1,
              querySize: 10,
              approvalTool: ApprovalTool.Git,
            },
            LONG_POLL_MS,
          ),
        {
          wrapper: createWrapper(
            [
              [configApiRef, mockConfigApi],
              [identityApiRef, mockIdentityApi],
              [bulkImportApiRef, { getSCMHosts, dataFetcher }],
              [scmAuthApiRef, { getCredentials: mockGetCredentials }],
            ],
            queryClient,
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBeFalsy();
        expect(dataFetcher).toHaveBeenCalled();
      });

      const serialised = JSON.stringify(
        queryClient
          .getQueryCache()
          .getAll()
          .map(q => q.queryKey),
      );
      expect(serialised).not.toContain(secretToken);
      expect(serialised).toContain('https://github.com');
    });

    it('skips token fetching when getSCMHosts returns a Response error', async () => {
      const mockGetCredentials = jest.fn();
      const dataFetcher = jest.fn().mockResolvedValue(mockGetRepositories);
      const getSCMHosts = jest
        .fn()
        .mockResolvedValue(new Response(null, { status: 403 }));
      const queryClient = createQueryClient();

      const { result } = renderHook(
        () =>
          useRepositories(
            {
              page: 1,
              querySize: 10,
              approvalTool: ApprovalTool.Git,
            },
            LONG_POLL_MS,
          ),
        {
          wrapper: createWrapper(
            [
              [configApiRef, mockConfigApi],
              [identityApiRef, mockIdentityApi],
              [bulkImportApiRef, { getSCMHosts, dataFetcher }],
              [scmAuthApiRef, { getCredentials: mockGetCredentials }],
            ],
            queryClient,
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBeFalsy();
      });

      expect(mockGetCredentials).not.toHaveBeenCalled();
      expect(dataFetcher).toHaveBeenCalled();
    });
  });
});
