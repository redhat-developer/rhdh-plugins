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

describe('RenameConversationModal', () => {
  const onClose = jest.fn();
  const conversationId = 'test-conversation-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ success: true });
  });

  test('should render the modal with correct content when open', () => {
    render(
      <RenameConversationModal
        isOpen
        onClose={onClose}
        conversationId={conversationId}
      />,
    );

    expect(screen.getByText('Rename chat?')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
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

  test('should display error message when rename fails', () => {
    mockUseRenameConversation.mockReturnValueOnce({
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

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Error occured/i)).toBeInTheDocument();
  });
});
