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
import userEvent from '@testing-library/user-event';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { AttachPlusMenu } from '../AttachPlusMenu';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('AttachPlusMenu', () => {
  const mockOnAttach = jest.fn();
  const mockOnAttachRejected = jest.fn();
  const allowedFileTypes = {
    'text/plain': ['.txt'],
    'application/json': ['.json'],
    'application/yaml': ['.yaml', '.yml'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the plus button toggle', () => {
    render(<AttachPlusMenu onAttach={mockOnAttach} />);

    const toggleButton = screen.getByRole('button', { name: 'Attach' });
    expect(toggleButton).toBeInTheDocument();
  });

  it('should open dropdown menu when toggle is clicked', async () => {
    render(<AttachPlusMenu onAttach={mockOnAttach} />);

    const toggleButton = screen.getByRole('button', { name: 'Attach' });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Attach')).toBeInTheDocument();
    });
  });

  it('should show attach menu item with description', async () => {
    render(<AttachPlusMenu onAttach={mockOnAttach} />);

    const toggleButton = screen.getByRole('button', { name: 'Attach' });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Attach')).toBeInTheDocument();
      expect(
        screen.getByText('Attach a JSON, YAML, TXT, or XML file'),
      ).toBeInTheDocument();
    });
  });

  it('should have hidden file input', () => {
    render(<AttachPlusMenu onAttach={mockOnAttach} />);

    const fileInput = screen.getByTestId('attachment-input');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
  });

  it('should set correct accept attribute when allowedFileTypes provided', () => {
    render(
      <AttachPlusMenu
        onAttach={mockOnAttach}
        allowedFileTypes={allowedFileTypes}
      />,
    );

    const fileInput = screen.getByTestId(
      'attachment-input',
    ) as HTMLInputElement;
    expect(fileInput.accept).toContain('text/plain');
    expect(fileInput.accept).toContain('.txt');
    expect(fileInput.accept).toContain('application/json');
    expect(fileInput.accept).toContain('.json');
  });

  it('should call onAttach when valid files are selected', async () => {
    render(<AttachPlusMenu onAttach={mockOnAttach} />);

    const fileInput = screen.getByTestId('attachment-input');
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockOnAttach).toHaveBeenCalledWith([file], expect.any(Object));
  });

  it('should call onAttachRejected for invalid file types', async () => {
    render(
      <AttachPlusMenu
        onAttach={mockOnAttach}
        allowedFileTypes={allowedFileTypes}
        onAttachRejected={mockOnAttachRejected}
      />,
    );

    const fileInput = screen.getByTestId('attachment-input');
    const invalidFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(mockOnAttachRejected).toHaveBeenCalledWith([
      expect.objectContaining({
        file: invalidFile,
        errors: expect.arrayContaining([
          expect.objectContaining({
            code: 'file-invalid-type',
          }),
        ]),
      }),
    ]);
    expect(mockOnAttach).not.toHaveBeenCalled();
  });

  it('should accept valid files and reject invalid files in mixed selection', async () => {
    render(
      <AttachPlusMenu
        onAttach={mockOnAttach}
        allowedFileTypes={allowedFileTypes}
        onAttachRejected={mockOnAttachRejected}
      />,
    );

    const fileInput = screen.getByTestId('attachment-input');
    const validFile = new File(['valid'], 'valid.txt', { type: 'text/plain' });
    const invalidFile = new File(['invalid'], 'invalid.exe', {
      type: 'application/octet-stream',
    });

    fireEvent.change(fileInput, {
      target: { files: [validFile, invalidFile] },
    });

    expect(mockOnAttach).toHaveBeenCalledWith([validFile], expect.any(Object));
    expect(mockOnAttachRejected).toHaveBeenCalledWith([
      expect.objectContaining({
        file: invalidFile,
      }),
    ]);
  });

  it('should close dropdown after clicking attach menu item', async () => {
    render(<AttachPlusMenu onAttach={mockOnAttach} />);

    const toggleButton = screen.getByRole('button', { name: 'Attach' });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(
        screen.getByText('Attach a JSON, YAML, TXT, or XML file'),
      ).toBeInTheDocument();
    });

    const attachMenuItem = screen.getByText(
      'Attach a JSON, YAML, TXT, or XML file',
    );
    await userEvent.click(attachMenuItem);

    await waitFor(() => {
      expect(
        screen.queryByText('Attach a JSON, YAML, TXT, or XML file'),
      ).not.toBeInTheDocument();
    });
  });

  it('should not call onAttach when no files are selected', () => {
    render(<AttachPlusMenu onAttach={mockOnAttach} />);

    const fileInput = screen.getByTestId('attachment-input');
    fireEvent.change(fileInput, { target: { files: [] } });

    expect(mockOnAttach).not.toHaveBeenCalled();
  });
});
