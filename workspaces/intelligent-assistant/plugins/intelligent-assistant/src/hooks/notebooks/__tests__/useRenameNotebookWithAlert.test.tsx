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
import { act, renderHook } from '@testing-library/react';

import { useRenameNotebookWithAlert } from '../useRenameNotebookWithAlert';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('@backstage/core-plugin-api/alpha', () => ({
  ...jest.requireActual('@backstage/core-plugin-api/alpha'),
  useTranslationRef: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (key === 'notebooks.rename.inline.error') {
        return `Failed to rename "${opts?.notebookName}".`;
      }
      return key;
    },
  }),
}));

const mockRenameSession = jest.fn();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children?: React.ReactNode }): any => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useRenameNotebookWithAlert', () => {
  const mockSetAlerts = jest.fn();
  const mockGetNotebookName = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    (useApi as jest.Mock).mockReturnValue({
      renameSession: mockRenameSession,
    });
    mockGetNotebookName.mockReturnValue('My Notebook');
  });

  it('should call renameSession with the correct payload on success', async () => {
    mockRenameSession.mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useRenameNotebookWithAlert({
          setAlerts: mockSetAlerts,
          getNotebookName: mockGetNotebookName,
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current('session-123', 'New Name');
    });

    expect(mockRenameSession).toHaveBeenCalledWith('session-123', 'New Name');
    expect(mockSetAlerts).not.toHaveBeenCalled();
  });

  it('should add a danger alert when rename fails', async () => {
    mockRenameSession.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () =>
        useRenameNotebookWithAlert({
          setAlerts: mockSetAlerts,
          getNotebookName: mockGetNotebookName,
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current('session-456', 'Failing Name');
    });

    expect(mockSetAlerts).toHaveBeenCalledTimes(1);
    const updater = mockSetAlerts.mock.calls[0][0];
    const newAlerts = updater([]);
    expect(newAlerts).toHaveLength(1);
    expect(newAlerts[0].title).toBe('Failed to rename "My Notebook".');
    expect(newAlerts[0].variant).toBe('danger');
  });

  it('should call getNotebookName with the sessionId', async () => {
    mockRenameSession.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(
      () =>
        useRenameNotebookWithAlert({
          setAlerts: mockSetAlerts,
          getNotebookName: mockGetNotebookName,
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current('session-789', 'Whatever');
    });

    expect(mockGetNotebookName).toHaveBeenCalledWith('session-789');
  });

  it('should prepend new alerts to existing alerts', async () => {
    mockRenameSession.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(
      () =>
        useRenameNotebookWithAlert({
          setAlerts: mockSetAlerts,
          getNotebookName: mockGetNotebookName,
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current('session-1', 'New');
    });

    const updater = mockSetAlerts.mock.calls[0][0];
    const existingAlerts = [{ key: 'old', title: 'Old alert' }];
    const newAlerts = updater(existingAlerts);
    expect(newAlerts).toHaveLength(2);
    expect(newAlerts[1]).toEqual({ key: 'old', title: 'Old alert' });
  });
});
