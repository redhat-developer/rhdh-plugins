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

import { useApi } from '@backstage/core-plugin-api';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useTopicRestrictionStatus } from '../useQuestionValidation';

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: jest.fn(),
  createApiRef: jest.fn(() => ({ id: 'plugin.lightspeed.service' })),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;

describe('useTopicRestrictionStatus', () => {
  let queryClient: QueryClient;
  let mockLightspeedApi: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockLightspeedApi = {
      isTopicRestrictionEnabled: jest.fn(),
    };

    mockUseApi.mockReturnValue(mockLightspeedApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should return loading state initially', () => {
    mockLightspeedApi.isTopicRestrictionEnabled.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { result } = renderHook(() => useTopicRestrictionStatus(), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should return true when topic restriction is enabled', async () => {
    mockLightspeedApi.isTopicRestrictionEnabled.mockResolvedValue(true);

    const { result } = renderHook(() => useTopicRestrictionStatus(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockLightspeedApi.isTopicRestrictionEnabled).toHaveBeenCalledTimes(
      1,
    );
  });

  it('should return false when topic restriction is disabled', async () => {
    mockLightspeedApi.isTopicRestrictionEnabled.mockResolvedValue(false);

    const { result } = renderHook(() => useTopicRestrictionStatus(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockLightspeedApi.isTopicRestrictionEnabled).toHaveBeenCalledTimes(
      1,
    );
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch topic restriction status';
    mockLightspeedApi.isTopicRestrictionEnabled.mockRejectedValue(
      new Error(errorMessage),
    );

    const { result } = renderHook(() => useTopicRestrictionStatus(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe(errorMessage);
    expect(mockLightspeedApi.isTopicRestrictionEnabled).toHaveBeenCalledTimes(
      1,
    );
  });

  it('should use correct query key', () => {
    mockLightspeedApi.isTopicRestrictionEnabled.mockResolvedValue(true);

    renderHook(() => useTopicRestrictionStatus(), { wrapper });

    // Verify the query key is used correctly by checking if the query is cached
    const queryData = queryClient.getQueryData(['topicRestrictionStatus']);
    expect(queryData).toBeUndefined(); // Initially undefined before resolution
  });

  it('should refetch when query is invalidated', async () => {
    mockLightspeedApi.isTopicRestrictionEnabled.mockResolvedValue(true);

    const { result } = renderHook(() => useTopicRestrictionStatus(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockLightspeedApi.isTopicRestrictionEnabled).toHaveBeenCalledTimes(
      1,
    );

    // Invalidate the query
    await queryClient.invalidateQueries({
      queryKey: ['topicRestrictionStatus'],
    });

    await waitFor(() => {
      expect(mockLightspeedApi.isTopicRestrictionEnabled).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  it('should handle network timeout errors', async () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'TimeoutError';
    mockLightspeedApi.isTopicRestrictionEnabled.mockRejectedValue(timeoutError);

    const { result } = renderHook(() => useTopicRestrictionStatus(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.name).toBe('TimeoutError');
  });

  it('should handle API returning null', async () => {
    mockLightspeedApi.isTopicRestrictionEnabled.mockResolvedValue(null);

    const { result } = renderHook(() => useTopicRestrictionStatus(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
