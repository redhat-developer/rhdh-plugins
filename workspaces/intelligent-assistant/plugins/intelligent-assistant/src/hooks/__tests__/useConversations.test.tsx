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
import { act, renderHook, waitFor } from '@testing-library/react';

import { useConversations } from '../useConversations';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockGetConversations = jest.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children?: React.ReactNode }): any => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useConversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('should fetch conversations successfully', async () => {
    const mockData = [
      {
        conversation_id: 'conv-1',
        last_message_timestamp: 1234567890,
        topic_summary: 'Test conversation',
      },
    ];
    mockGetConversations.mockResolvedValue(mockData);

    (useApi as jest.Mock).mockReturnValue({
      getConversations: mockGetConversations,
    });

    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetConversations).toHaveBeenCalledTimes(1);
  });

  it('should refetch when topic_summary is null', async () => {
    const conversationsWithNullSummary = [
      {
        conversation_id: 'conv-1',
        last_message_timestamp: 1234567890,
        topic_summary: null,
      },
    ];
    const conversationsWithSummary = [
      {
        conversation_id: 'conv-1',
        last_message_timestamp: 1234567890,
        topic_summary: 'Generated summary',
      },
    ];

    mockGetConversations
      .mockResolvedValueOnce(conversationsWithNullSummary)
      .mockResolvedValueOnce(conversationsWithSummary);

    (useApi as jest.Mock).mockReturnValue({
      getConversations: mockGetConversations,
    });

    jest.useFakeTimers();

    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(conversationsWithNullSummary);
    expect(mockGetConversations).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(
      () => {
        expect(mockGetConversations).toHaveBeenCalledTimes(2);
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        expect(result.current.data?.[0]?.topic_summary).toBe(
          'Generated summary',
        );
      },
      { timeout: 3000 },
    );

    jest.useRealTimers();
  });

  it('should not refetch when all topic_summary are set', async () => {
    const mockData = [
      {
        conversation_id: 'conv-1',
        last_message_timestamp: 1234567890,
        topic_summary: 'Has summary',
      },
    ];
    mockGetConversations.mockResolvedValue(mockData);

    (useApi as jest.Mock).mockReturnValue({
      getConversations: mockGetConversations,
    });

    jest.useFakeTimers();

    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetConversations).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockGetConversations).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
