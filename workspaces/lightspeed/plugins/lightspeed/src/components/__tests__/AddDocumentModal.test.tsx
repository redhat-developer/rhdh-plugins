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
import { AddDocumentModal } from '../notebooks/AddDocumentModal';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockMutateAsync = jest.fn();
jest.mock('../../hooks/notebooks/useUploadDocument', () => ({
  useUploadDocument: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

describe('AddDocumentModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    sessionId: 'test-session-id',
    existingDocumentNames: [],
    onFilesUploading: jest.fn(),
    onUploadStarted: jest.fn(),
    onUploadFailed: jest.fn(),
    onDuplicatesFound: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ document_id: 'test-doc-id' });
  });

  it('should render the modal when open', () => {
    render(<AddDocumentModal {...defaultProps} />);

    expect(screen.getByText('Add a document to Notebook')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop files here')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<AddDocumentModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render Cancel and Add buttons', () => {
    render(<AddDocumentModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add (0)' })).toBeInTheDocument();
  });

  it('should have Add button disabled when no files selected', () => {
    render(<AddDocumentModal {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: 'Add (0)' });
    expect(addButton).toBeDisabled();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<AddDocumentModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close icon is clicked', () => {
    render(<AddDocumentModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should display file list when files are dropped', async () => {
    render(<AddDocumentModal {...defaultProps} />);

    const dropzone = screen
      .getByText('Drag and drop files here')
      .closest('div');
    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });
  });

  it('should update Add button count when files are selected', async () => {
    render(<AddDocumentModal {...defaultProps} />);

    const dropzone = screen
      .getByText('Drag and drop files here')
      .closest('div');
    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Add (1)' }),
      ).toBeInTheDocument();
    });
  });

  it('should not auto-close modal after file drop', async () => {
    render(<AddDocumentModal {...defaultProps} />);

    const dropzone = screen
      .getByText('Drag and drop files here')
      .closest('div');
    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should trigger upload and close when Add button is clicked', async () => {
    render(<AddDocumentModal {...defaultProps} />);

    const dropzone = screen
      .getByText('Drag and drop files here')
      .closest('div');
    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Add (1)' }),
      ).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add (1)' }));

    await waitFor(() => {
      expect(defaultProps.onFilesUploading).toHaveBeenCalledWith([file]);
      expect(mockMutateAsync).toHaveBeenCalledWith({
        sessionId: 'test-session-id',
        file,
      });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('should allow removing files from the list', async () => {
    render(<AddDocumentModal {...defaultProps} />);

    const dropzone = screen
      .getByText('Drag and drop files here')
      .closest('div');
    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', {
      name: 'Remove test-file.txt',
    });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add (0)' })).toBeDisabled();
    });
  });

  it('should clear selected files when modal is closed', async () => {
    const { rerender } = render(<AddDocumentModal {...defaultProps} />);

    const dropzone = screen
      .getByText('Drag and drop files here')
      .closest('div');
    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    rerender(<AddDocumentModal {...defaultProps} isOpen />);

    expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument();
  });

  it('should call onDuplicatesFound for files that already exist', async () => {
    render(
      <AddDocumentModal
        {...defaultProps}
        existingDocumentNames={['existing-file.txt']}
      />,
    );

    const dropzone = screen
      .getByText('Drag and drop files here')
      .closest('div');
    const existingFile = new File(['content'], 'existing-file.txt', {
      type: 'text/plain',
    });
    const newFile = new File(['content'], 'new-file.txt', {
      type: 'text/plain',
    });

    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [existingFile, newFile],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(defaultProps.onDuplicatesFound).toHaveBeenCalledWith([
        existingFile,
      ]);
      expect(screen.getByText('new-file.txt')).toBeInTheDocument();
      expect(screen.queryByText('existing-file.txt')).not.toBeInTheDocument();
    });
  });
});
