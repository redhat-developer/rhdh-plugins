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

import { fireEvent, render, screen } from '@testing-library/react';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { OverwriteConfirmModal } from '../notebooks/OverwriteConfirmModal';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const createFile = (name: string) =>
  new File(['content'], name, { type: 'text/plain' });

describe('OverwriteConfirmModal', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  const onBack = jest.fn();

  const allFiles = [
    createFile('report.pdf'),
    createFile('data.yaml'),
    createFile('notes.txt'),
  ];
  const duplicateFileNames = ['report.pdf', 'data.yaml'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) =>
    render(
      <OverwriteConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        onBack={onBack}
        allFiles={allFiles}
        duplicateFileNames={duplicateFileNames}
        {...props}
      />,
    );

  it('should render the modal with all files when open', () => {
    renderModal();

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('data.yaml')).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render a warning alert', () => {
    renderModal();

    expect(screen.getByText(/2 files already exist/)).toBeInTheDocument();
  });

  it('should render radio options for replace and ignore', () => {
    renderModal();

    expect(screen.getByLabelText('Replace existing files')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Ignore duplicated files'),
    ).toBeInTheDocument();
  });

  it('should render FileTypeIcon badges for each file', () => {
    renderModal();

    expect(screen.getByText('pdf')).toBeInTheDocument();
    expect(screen.getByText('yaml')).toBeInTheDocument();
    expect(screen.getByText('txt')).toBeInTheDocument();
  });

  it('should call onConfirm with all files when replace is selected', () => {
    renderModal();

    const uploadButton = screen.getByRole('button', {
      name: /Upload \(3\)/,
    });
    fireEvent.click(uploadButton);

    expect(onConfirm).toHaveBeenCalledWith(allFiles);
  });

  it('should call onConfirm with only new files when ignore is selected', () => {
    renderModal();

    const ignoreRadio = screen.getByLabelText('Ignore duplicated files');
    fireEvent.click(ignoreRadio);

    const uploadButton = screen.getByRole('button', {
      name: /Upload \(1\)/,
    });
    fireEvent.click(uploadButton);

    expect(onConfirm).toHaveBeenCalledWith([allFiles[2]]);
  });

  it('should call onBack when Back button is clicked', () => {
    renderModal();

    const backButton = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close icon button is clicked', () => {
    renderModal();

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
