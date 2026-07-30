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

import { ConversationList } from '../../types';
import { useRenameConversation } from '../useRenameConversation';

// Mocking the useApi and lightspeed API
jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockRenameConversation = jest.fn().mockResolvedValue({ success: true });
const mockGetQueryData = jest.fn();
const mockSetQueryData = jest.fn();
const mockCancelQueries = jest.fn();
const mockInvalidateQueries = jest.fn();

// Provide a query client with mock methods for cache manipulation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

queryClient.getQueryData = mockGetQueryData;
queryClient.setQueryData = mockSetQueryData;
queryClient.cancelQueries = mockCancelQueries;
queryClient.invalidateQueries = mockInvalidateQueries;

const wrapper = ({
  children,
}: {
  conversationId?: string;
  children?: React.ReactNode;
}): any => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useRenameConversation', () => {
  beforeEach(() => {
    queryClient.clear();
    mockRenameConversation.mockClear();
    mockGetQueryData.mockClear();
    mockSetQueryData.mockClear();
    mockCancelQueries.mockClear();
    mockInvalidateQueries.mockClear();

    // Mocking lightspeedApiRef and queryClient methods
    (useApi as jest.Mock).mockReturnValue({
      renameConversation: mockRenameConversation,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls renameConversation API and updates cache correctly with topic_summary', async () => {
    const conversationId = 'test-id';
    const newName = 'New Conversation Name';
    const previousConversations: ConversationList = [
      {
        conversation_id: conversationId,
        topic_summary: 'Old Name',
        last_message_timestamp: 1234567890,
      },
      {
        conversation_id: 'other-id',
        topic_summary: 'Other Conversation',
        last_message_timestamp: 1234567891,
      },
    ];

    mockGetQueryData.mockReturnValue(previousConversations);

    const { result } = renderHook(() => useRenameConversation(), { wrapper });

    await act(async () => {
      await result.current.mutate({
        conversation_id: conversationId,
        newName,
      });
    });

    expect(mockRenameConversation).toHaveBeenCalledWith(
      conversationId,
      newName,
    );
    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: ['conversations'],
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['conversations'],
      expect.any(Function),
    );

    // Verify the update function correctly updates topic_summary
    const updateFn = mockSetQueryData.mock.calls[0][1] as (
      old: ConversationList,
    ) => ConversationList;
    const updated = updateFn(previousConversations);
    expect(updated[0].topic_summary).toBe(newName);
    expect(updated[0].conversation_id).toBe(conversationId);
    expect(updated[1].topic_summary).toBe('Other Conversation'); // Unchanged
  });

  it('invalidates cache on success if invalidateCache is true', async () => {
    const conversationId = 'test-conv-id';
    const newName = 'Renamed Conversation';

    const { result } = renderHook(() => useRenameConversation(), { wrapper });

    await act(async () => {
      await result.current.mutate({
        conversation_id: conversationId,
        newName,
        invalidateCache: true,
      });
    });

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['conversations'],
      });
    });
  });

  it('does not invalidate cache on success if invalidateCache is false', async () => {
    const conversationId = 'test-conv-id';
    const newName = 'Renamed Conversation';

    const { result } = renderHook(() => useRenameConversation(), { wrapper });

    await act(async () => {
      await result.current.mutate({
        conversation_id: conversationId,
        newName,
        invalidateCache: false,
      });
    });

    await waitFor(() => {
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });

  it('reverts cache on error', async () => {
    const conversationId = 'test-cache-error-id';
    const newName = 'New Name';
    const previousConversations: ConversationList = [
      {
        conversation_id: conversationId,
        topic_summary: 'Original Name',
        last_message_timestamp: 1234567890,
      },
    ];

    mockGetQueryData.mockReturnValue(previousConversations);
    mockRenameConversation.mockRejectedValue(new Error('Rename failed'));

    const { result } = renderHook(() => useRenameConversation(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutate({
          conversation_id: conversationId,
          newName,
        });
      } catch (e) {
        // Expected error
      }
    });

    // Wait for error handling
    await waitFor(() => {
      expect(mockSetQueryData).toHaveBeenCalledWith(
        ['conversations'],
        previousConversations,
      );
    });
  });

  it('handles empty conversation list gracefully', async () => {
    const conversationId = 'test-id';
    const newName = 'New Name';
    const previousConversations: ConversationList = [];

    mockGetQueryData.mockReturnValue(previousConversations);

    const { result } = renderHook(() => useRenameConversation(), { wrapper });

    await act(async () => {
      await result.current.mutate({
        conversation_id: conversationId,
        newName,
      });
    });

    expect(mockRenameConversation).toHaveBeenCalled();
    expect(mockSetQueryData).toHaveBeenCalled();
  });

  it('only updates the matching conversation', async () => {
    const conversationId = 'target-id';
    const newName = 'Updated Name';
    const previousConversations: ConversationList = [
      {
        conversation_id: conversationId,
        topic_summary: 'Original',
        last_message_timestamp: 1234567890,
      },
      {
        conversation_id: 'other-id-1',
        topic_summary: 'Should Not Change',
        last_message_timestamp: 1234567891,
      },
      {
        conversation_id: 'other-id-2',
        topic_summary: 'Also Should Not Change',
        last_message_timestamp: 1234567892,
      },
    ];

    mockGetQueryData.mockReturnValue(previousConversations);

    const { result } = renderHook(() => useRenameConversation(), { wrapper });

    await act(async () => {
      await result.current.mutate({
        conversation_id: conversationId,
        newName,
      });
    });

    const updateFn = mockSetQueryData.mock.calls[0][1] as (
      old: ConversationList,
    ) => ConversationList;
    const updated = updateFn(previousConversations);

    expect(updated).toHaveLength(3);
    expect(updated[0].topic_summary).toBe(newName);
    expect(updated[0].conversation_id).toBe(conversationId);
    expect(updated[1].topic_summary).toBe('Should Not Change');
    expect(updated[2].topic_summary).toBe('Also Should Not Change');
  });
});
