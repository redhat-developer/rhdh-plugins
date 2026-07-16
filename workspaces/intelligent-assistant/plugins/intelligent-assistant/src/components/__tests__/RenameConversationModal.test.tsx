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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useConversations } from '../../hooks/useConversations';
import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { RenameConversationModal } from '../RenameConversationModal';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });

const mockUseRenameConversation = jest.fn(() => ({
  mutateAsync: mockMutateAsync,
  isError: false,
  error: 'null',
}));

jest.mock('../../hooks/useRenameConversation', () => ({
  useRenameConversation: () => mockUseRenameConversation(),
}));

jest.mock('../../hooks/useConversations', () => ({
  useConversations: jest.fn().mockReturnValue({
    data: [
      {
        conversation_id: 'test-conversation-id',
        topic_summary: 'Old Chat Name',
        last_message_timestamp: Date.now(),
      },
    ],
    isRefetching: false,
    isLoading: false,
  }),
}));

const mockUseConversations = useConversations as jest.Mock;

describe('RenameConversationModal', () => {
  const onClose = jest.fn();
  const conversationId = 'test-conversation-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ success: true });
    mockUseConversations.mockReturnValue({
      data: [
        {
          conversation_id: 'test-conversation-id',
          topic_summary: 'Old Chat Name',
          last_message_timestamp: Date.now(),
        },
      ],
      isRefetching: false,
      isLoading: false,
    });
    mockUseRenameConversation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isError: false,
      error: 'null',
    });
  });

  test('should render the modal with correct content when open', async () => {
    render(
      <RenameConversationModal
        isOpen
        onClose={onClose}
        conversationId={conversationId}
      />,
    );

    expect(screen.getByText('Rename chat?')).toBeInTheDocument();
    const input = screen.getByLabelText('Chat name');
    expect(input).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    // Wait for the input to be populated with the old chat name
    await waitFor(() => {
      expect(input).toHaveValue('Old Chat Name');
    });
  });

  test('should not render when isOpen is false', () => {
    render(
      <RenameConversationModal
        isOpen={false}
        onClose={onClose}
        conversationId={conversationId}
      />,
    );

    const modal = screen.queryByRole('dialog');
    expect(modal).not.toBeInTheDocument();
  });

  test('should call onClose when the cancel button is clicked', () => {
    render(
      <RenameConversationModal
        isOpen
        onClose={onClose}
        conversationId={conversationId}
      />,
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('should call renameConversation with correct parameters when rename button is clicked', async () => {
    render(
      <RenameConversationModal
        isOpen
        onClose={onClose}
        conversationId={conversationId}
      />,
    );

    const input = screen.getByLabelText('Chat name');

    // Wait for the input to be populated with the old chat name
    await waitFor(() => {
      expect(input).toHaveValue('Old Chat Name');
    });

    const newName = 'My New Conversation Name';
    fireEvent.change(input, { target: { value: newName } });

    const renameButton = screen.getByRole('button', {
      name: 'Rename',
    });
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        conversation_id: conversationId,
        newName: newName,
        invalidateCache: false,
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test('should display error message when rename fails', async () => {
    mockUseRenameConversation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isError: true,
      error: new Error('Rename failed') as any,
    });

    render(
      <RenameConversationModal
        isOpen
        onClose={onClose}
        conversationId={conversationId}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Rename failed/i)).toBeInTheDocument();
  });

  test('should handle case when conversation is not found in list', async () => {
    mockUseConversations.mockReturnValueOnce({
      data: [
        {
          conversation_id: 'other-conversation-id',
          topic_summary: 'Other Chat',
          last_message_timestamp: Date.now(),
        },
      ],
      isRefetching: false,
      isLoading: false,
    });

    render(
      <RenameConversationModal
        isOpen
        onClose={onClose}
        conversationId={conversationId}
      />,
    );

    const input = screen.getByLabelText('Chat name');

    // Input should be empty when conversation is not found
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  test('should handle case when conversations data is undefined', async () => {
    mockUseConversations.mockReturnValueOnce({
      data: undefined,
      isRefetching: false,
      isLoading: false,
    });

    render(
      <RenameConversationModal
        isOpen
        onClose={onClose}
        conversationId={conversationId}
      />,
    );

    const input = screen.getByLabelText('Chat name');

    // Input should be empty when conversations data is undefined
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
});
