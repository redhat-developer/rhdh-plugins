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

import { useStopConversation } from '../useStopConversation';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockStopMessage = jest.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children?: React.ReactNode }): any => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useStopConversation', () => {
  beforeEach(() => {
    mockStopMessage.mockResolvedValue({ success: true });
    (useApi as jest.Mock).mockReturnValue({
      stopMessage: mockStopMessage,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls stopMessage API with requestId', async () => {
    const requestId = 'req-123';

    const { result } = renderHook(() => useStopConversation(), { wrapper });

    await act(async () => {
      result.current.mutate(requestId);
    });

    expect(mockStopMessage).toHaveBeenCalledWith(requestId);
  });

  it('returns success when stop succeeds', async () => {
    mockStopMessage.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useStopConversation(), { wrapper });

    let mutateResult: { success: boolean } | undefined;
    await act(async () => {
      mutateResult = await result.current.mutateAsync('req-456');
    });

    expect(mutateResult).toEqual({ success: true });
  });

  it('handles API errors', async () => {
    mockStopMessage.mockRejectedValue(new Error('Stop failed'));

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { result } = renderHook(() => useStopConversation(), { wrapper });

    await act(async () => {
      result.current.mutate('req-789');
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
