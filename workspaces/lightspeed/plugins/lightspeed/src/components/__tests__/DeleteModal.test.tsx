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

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { DeleteModal } from '../DeleteModal';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });

const mockUseDeleteConversation = jest.fn(() => ({
  mutateAsync: mockMutateAsync,
  isError: false,
  error: null,
  isPending: false,
}));

jest.mock('../../hooks', () => ({
  useDeleteConversation: () => mockUseDeleteConversation(),
}));

describe('DeleteModal', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  const conversationId = 'test-conversation-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ success: true });
    mockUseDeleteConversation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isError: false,
      error: null,
      isPending: false,
    });
  });

  test('should render the modal with correct content when open', () => {
    render(
      <DeleteModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        conversationId={conversationId}
      />,
    );

    expect(screen.getByText('Delete chat?')).toBeInTheDocument();
    expect(
      screen.getByText(
        "You'll no longer see this chat here. This will also delete related activity like prompts, responses, and feedback from your Lightspeed Activity.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('should not render when isOpen is false', () => {
    render(
      <DeleteModal
        isOpen={false}
        onClose={onClose}
        onConfirm={onConfirm}
        conversationId={conversationId}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('should call onClose when the cancel button is clicked', () => {
    render(
      <DeleteModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        conversationId={conversationId}
      />,
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('should call deleteConversation and onConfirm when delete button is clicked', async () => {
    render(
      <DeleteModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        conversationId={conversationId}
      />,
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        conversation_id: conversationId,
        invalidateCache: false,
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  test('should display error message when delete fails', () => {
    mockUseDeleteConversation.mockReturnValueOnce({
      mutateAsync: mockMutateAsync,
      isError: true,
      error: new Error('Delete failed') as any,
      isPending: false,
    });

    render(
      <DeleteModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        conversationId={conversationId}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Error occured/i)).toBeInTheDocument();
  });

  test('should not call onConfirm when delete fails', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Delete failed'));
    mockUseDeleteConversation.mockReturnValueOnce({
      mutateAsync: mockMutateAsync,
      isError: true,
      error: new Error('Delete failed') as any,
      isPending: false,
    });

    render(
      <DeleteModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        conversationId={conversationId}
      />,
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
