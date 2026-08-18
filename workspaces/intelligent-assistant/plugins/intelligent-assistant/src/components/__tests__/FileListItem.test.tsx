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

import { FileListItem } from '../notebooks/FileListItem';

describe('FileListItem', () => {
  const createFile = (
    name: string,
    size: number,
    type: string = 'text/plain',
  ) => new File(['x'.repeat(size)], name, { type });

  const defaultProps = {
    file: createFile('test-file.txt', 1024),
    onRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the file name', () => {
    render(<FileListItem {...defaultProps} />);

    expect(screen.getByText('test-file.txt')).toBeInTheDocument();
  });

  it('should render the file type icon', () => {
    render(<FileListItem {...defaultProps} />);

    expect(screen.getByText('txt')).toBeInTheDocument();
  });

  it('should render the file size in KB', () => {
    render(<FileListItem {...defaultProps} />);

    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });

  it('should render the file size in MB for larger files', () => {
    const largeFile = createFile('large-file.pdf', 5 * 1024 * 1024);
    render(<FileListItem {...defaultProps} file={largeFile} />);

    expect(screen.getByText('5 MB')).toBeInTheDocument();
  });

  it('should render 0 B for empty files', () => {
    const emptyFile = createFile('empty.txt', 0);
    render(<FileListItem {...defaultProps} file={emptyFile} />);

    expect(screen.getByText('0 B')).toBeInTheDocument();
  });

  it('should call onRemove when remove button is clicked', () => {
    render(<FileListItem {...defaultProps} />);

    const removeButton = screen.getByRole('button', { name: 'Remove file' });
    fireEvent.click(removeButton);

    expect(defaultProps.onRemove).toHaveBeenCalledTimes(1);
  });

  it('should use custom aria-label for remove button', () => {
    render(
      <FileListItem {...defaultProps} removeAriaLabel="Remove test-file.txt" />,
    );

    expect(
      screen.getByRole('button', { name: 'Remove test-file.txt' }),
    ).toBeInTheDocument();
  });

  it('should render different file type icons based on extension', () => {
    const pdfFile = createFile('document.pdf', 1024);
    const { rerender } = render(
      <FileListItem {...defaultProps} file={pdfFile} />,
    );

    expect(screen.getByText('pdf')).toBeInTheDocument();

    const yamlFile = createFile('config.yaml', 1024);
    rerender(<FileListItem {...defaultProps} file={yamlFile} />);

    expect(screen.getByText('yaml')).toBeInTheDocument();
  });

  it('should show title tooltip for long file names', () => {
    const longNameFile = createFile(
      'this-is-a-very-long-filename-that-should-be-truncated.txt',
      1024,
    );
    render(<FileListItem {...defaultProps} file={longNameFile} />);

    const fileNameElement = screen.getByTitle(
      'this-is-a-very-long-filename-that-should-be-truncated.txt',
    );
    expect(fileNameElement).toBeInTheDocument();
  });

  it('should truncate long file names while preserving extension', () => {
    const longNameFile = createFile(
      'this-is-a-very-long-filename-that-should-be-truncated.txt',
      1024,
    );
    render(<FileListItem {...defaultProps} file={longNameFile} />);

    expect(
      screen.getByText('this-is-a-very-long-fil....txt'),
    ).toBeInTheDocument();
  });

  it('should not truncate short file names', () => {
    const shortNameFile = createFile('short-name.pdf', 1024);
    render(<FileListItem {...defaultProps} file={shortNameFile} />);

    expect(screen.getByText('short-name.pdf')).toBeInTheDocument();
  });
});
