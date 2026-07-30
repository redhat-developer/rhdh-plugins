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

import { useNotebookSession } from '../notebooks/useNotebookSession';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockGetSession = jest.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children?: React.ReactNode }): any => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useNotebookSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    (useApi as jest.Mock).mockReturnValue({
      getSession: mockGetSession,
    });
  });

  it('should fetch session data when sessionId is provided', async () => {
    const mockSession = {
      session_id: 'vs_test-123',
      name: 'Test Notebook',
      metadata: { conversation_id: 'conv-456' },
    };
    mockGetSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useNotebookSession('vs_test-123'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSession);
    expect(mockGetSession).toHaveBeenCalledWith('vs_test-123');
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it('should not fetch when sessionId is undefined', async () => {
    const { result } = renderHook(() => useNotebookSession(undefined), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('should not fetch when sessionId is empty string', async () => {
    const { result } = renderHook(() => useNotebookSession(''), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('should handle error when session fetch fails', async () => {
    mockGetSession.mockRejectedValue(new Error('Session not found'));

    const { result } = renderHook(() => useNotebookSession('vs_invalid'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Session not found');
  });

  it('should return session with metadata containing conversation_id', async () => {
    const mockSession = {
      session_id: 'vs_test-123',
      name: 'Test Notebook',
      metadata: {
        conversation_id: 'conv-abc123',
        other_field: 'value',
      },
    };
    mockGetSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useNotebookSession('vs_test-123'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.metadata?.conversation_id).toBe('conv-abc123');
  });

  it('should refetch when sessionId changes', async () => {
    const mockSession1 = { session_id: 'vs_1', name: 'Notebook 1' };
    const mockSession2 = { session_id: 'vs_2', name: 'Notebook 2' };

    mockGetSession
      .mockResolvedValueOnce(mockSession1)
      .mockResolvedValueOnce(mockSession2);

    const { result, rerender } = renderHook(
      ({ sessionId }) => useNotebookSession(sessionId),
      {
        wrapper,
        initialProps: { sessionId: 'vs_1' },
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSession1);

    rerender({ sessionId: 'vs_2' });

    await waitFor(() => expect(result.current.data).toEqual(mockSession2));
    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });
});
