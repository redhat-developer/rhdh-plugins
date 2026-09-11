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

import { useAllModels } from '../useAllModels';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockGetAllModels = jest.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children?: React.ReactNode }): any => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useAllModels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    (useApi as jest.Mock).mockReturnValue({
      getAllModels: mockGetAllModels,
    });
  });

  it('fetches models when enabled', async () => {
    mockGetAllModels.mockResolvedValue([]);

    const { result } = renderHook(() => useAllModels(true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetAllModels).toHaveBeenCalledTimes(1);
  });

  it('does not fetch models when disabled', async () => {
    renderHook(() => useAllModels(false), { wrapper });

    await waitFor(() => {
      expect(mockGetAllModels).not.toHaveBeenCalled();
    });
  });
});
