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

describe('OverwriteConfirmModal', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  const fileNames = ['report.pdf', 'data.yaml', 'notes.txt'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with file list when open', () => {
    render(
      <OverwriteConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        fileNames={fileNames}
      />,
    );

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('data.yaml')).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <OverwriteConfirmModal
        isOpen={false}
        onClose={onClose}
        onConfirm={onConfirm}
        fileNames={fileNames}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render a warning alert', () => {
    render(
      <OverwriteConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        fileNames={fileNames}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render FileTypeIcon badges for each file', () => {
    render(
      <OverwriteConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        fileNames={fileNames}
      />,
    );

    expect(screen.getByText('pdf')).toBeInTheDocument();
    expect(screen.getByText('yaml')).toBeInTheDocument();
    expect(screen.getByText('txt')).toBeInTheDocument();
  });

  it('should call onConfirm when overwrite button is clicked', () => {
    render(
      <OverwriteConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        fileNames={fileNames}
      />,
    );

    const overwriteButton = screen.getByRole('button', {
      name: 'Overwrite',
    });
    fireEvent.click(overwriteButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <OverwriteConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        fileNames={fileNames}
      />,
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close icon button is clicked', () => {
    render(
      <OverwriteConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        fileNames={fileNames}
      />,
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render an empty list for no files', () => {
    render(
      <OverwriteConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        fileNames={[]}
      />,
    );

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
