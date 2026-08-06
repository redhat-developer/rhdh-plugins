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

import { type ReactNode } from 'react';

import { useApi } from '@backstage/core-plugin-api';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { NotebookSession } from '../../../types';
import { useRenameNotebook } from '../useRenameNotebook';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockRenameSession = jest.fn();

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children?: ReactNode }): any => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockSessions: NotebookSession[] = [
  {
    session_id: 'session-1',
    name: 'First Notebook',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  } as NotebookSession,
  {
    session_id: 'session-2',
    name: 'Second Notebook',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  } as NotebookSession,
];

const mockSingleSession: NotebookSession = {
  session_id: 'session-1',
  name: 'First Notebook',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as NotebookSession;

describe('useRenameNotebook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createQueryClient();
    (useApi as jest.Mock).mockReturnValue({
      renameSession: mockRenameSession,
    });
  });

  it('should call renameSession with correct arguments', async () => {
    mockRenameSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRenameNotebook(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        sessionId: 'session-1',
        name: 'New Name',
      });
    });

    expect(mockRenameSession).toHaveBeenCalledWith('session-1', 'New Name');
  });

  describe('optimistic updates', () => {
    it('should optimistically update sessions list cache', async () => {
      mockRenameSession.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      );
      queryClient.setQueryData(['notebooks', 'sessions'], mockSessions);

      const { result } = renderHook(() => useRenameNotebook(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ sessionId: 'session-1', name: 'Renamed' });
      });

      await waitFor(() => {
        const sessions = queryClient.getQueryData<NotebookSession[]>([
          'notebooks',
          'sessions',
        ]);
        expect(sessions?.[0].name).toBe('Renamed');
        expect(sessions?.[1].name).toBe('Second Notebook');
      });
    });

    it('should optimistically update individual session cache', async () => {
      mockRenameSession.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      );
      queryClient.setQueryData(
        ['notebooks', 'session', 'session-1'],
        mockSingleSession,
      );

      const { result } = renderHook(() => useRenameNotebook(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ sessionId: 'session-1', name: 'Renamed' });
      });

      await waitFor(() => {
        const session = queryClient.getQueryData<NotebookSession>([
          'notebooks',
          'session',
          'session-1',
        ]);
        expect(session?.name).toBe('Renamed');
      });
    });
  });

  describe('rollback on error', () => {
    it('should rollback sessions list to previous state on failure', async () => {
      mockRenameSession.mockRejectedValue(new Error('API failure'));
      queryClient.setQueryData(['notebooks', 'sessions'], mockSessions);

      const { result } = renderHook(() => useRenameNotebook(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            sessionId: 'session-1',
            name: 'Should Rollback',
          });
        } catch {
          // expected
        }
      });

      const sessions = queryClient.getQueryData<NotebookSession[]>([
        'notebooks',
        'sessions',
      ]);
      expect(sessions?.[0].name).toBe('First Notebook');
      expect(sessions?.[1].name).toBe('Second Notebook');
    });

    it('should rollback individual session cache on failure', async () => {
      mockRenameSession.mockRejectedValue(new Error('API failure'));
      queryClient.setQueryData(
        ['notebooks', 'session', 'session-1'],
        mockSingleSession,
      );

      const { result } = renderHook(() => useRenameNotebook(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            sessionId: 'session-1',
            name: 'Should Rollback',
          });
        } catch {
          // expected
        }
      });

      const session = queryClient.getQueryData<NotebookSession>([
        'notebooks',
        'session',
        'session-1',
      ]);
      expect(session?.name).toBe('First Notebook');
    });

    it('should rollback both caches simultaneously on failure', async () => {
      mockRenameSession.mockRejectedValue(new Error('API failure'));
      queryClient.setQueryData(['notebooks', 'sessions'], mockSessions);
      queryClient.setQueryData(
        ['notebooks', 'session', 'session-1'],
        mockSingleSession,
      );

      const { result } = renderHook(() => useRenameNotebook(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            sessionId: 'session-1',
            name: 'Fail',
          });
        } catch {
          // expected
        }
      });

      const sessions = queryClient.getQueryData<NotebookSession[]>([
        'notebooks',
        'sessions',
      ]);
      const session = queryClient.getQueryData<NotebookSession>([
        'notebooks',
        'session',
        'session-1',
      ]);
      expect(sessions?.[0].name).toBe('First Notebook');
      expect(session?.name).toBe('First Notebook');
    });
  });

  describe('onSettled invalidation', () => {
    it('should invalidate queries on success', async () => {
      mockRenameSession.mockResolvedValue(undefined);
      queryClient.setQueryData(['notebooks', 'sessions'], mockSessions);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRenameNotebook(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          sessionId: 'session-1',
          name: 'Success',
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['notebooks', 'sessions'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['notebooks', 'session', 'session-1'],
      });
    });

    it('should invalidate queries on failure', async () => {
      mockRenameSession.mockRejectedValue(new Error('fail'));
      queryClient.setQueryData(['notebooks', 'sessions'], mockSessions);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRenameNotebook(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            sessionId: 'session-1',
            name: 'Fail',
          });
        } catch {
          // expected
        }
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['notebooks', 'sessions'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['notebooks', 'session', 'session-1'],
      });
    });
  });

  it('should not modify other sessions during optimistic update', async () => {
    mockRenameSession.mockResolvedValue(undefined);
    queryClient.setQueryData(['notebooks', 'sessions'], mockSessions);

    const { result } = renderHook(() => useRenameNotebook(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        sessionId: 'session-1',
        name: 'Updated',
      });
    });

    const sessions = queryClient.getQueryData<NotebookSession[]>([
      'notebooks',
      'sessions',
    ]);
    expect(sessions?.[1]).toEqual(mockSessions[1]);
  });

  it('should handle missing sessions cache gracefully', async () => {
    mockRenameSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRenameNotebook(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        sessionId: 'session-1',
        name: 'New Name',
      });
    });

    expect(mockRenameSession).toHaveBeenCalledWith('session-1', 'New Name');
  });
});
