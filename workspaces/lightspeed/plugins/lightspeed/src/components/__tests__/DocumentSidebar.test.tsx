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
import { SessionDocument } from '../../types';
import { DocumentSidebar } from '../notebooks/DocumentSidebar';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockDocument = (id: string, title: string): SessionDocument => ({
  document_id: id,
  title,
  session_id: 'session-1',
  user_id: 'user-1',
  source_type: 'text',
  created_at: new Date().toISOString(),
});

describe('DocumentSidebar', () => {
  const onToggleCollapse = jest.fn();
  const onAddDocument = jest.fn();

  const defaultProps = {
    notebookName: 'Test Notebook',
    documents: [] as SessionDocument[],
    uploadingFileNames: [] as string[],
    collapsed: false,
    onToggleCollapse,
    onAddDocument,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the notebook name', () => {
    render(<DocumentSidebar {...defaultProps} />);
    expect(screen.getByText('Test Notebook')).toBeInTheDocument();
  });

  it('should render nothing when collapsed', () => {
    const { container } = render(
      <DocumentSidebar {...defaultProps} collapsed />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should display existing documents', () => {
    const documents = [
      mockDocument('doc-1', 'readme.md'),
      mockDocument('doc-2', 'config.yaml'),
    ];
    render(<DocumentSidebar {...defaultProps} documents={documents} />);

    expect(screen.getByText('readme.md')).toBeInTheDocument();
    expect(screen.getByText('config.yaml')).toBeInTheDocument();
  });

  it('should display FileTypeIcon badges for documents', () => {
    const documents = [mockDocument('doc-1', 'report.pdf')];
    render(<DocumentSidebar {...defaultProps} documents={documents} />);

    expect(screen.getByText('pdf')).toBeInTheDocument();
  });

  it('should display uploading files with spinners', () => {
    render(
      <DocumentSidebar
        {...defaultProps}
        uploadingFileNames={['uploading.txt']}
      />,
    );

    expect(screen.getByText('uploading.txt')).toBeInTheDocument();
    expect(screen.getByText('txt')).toBeInTheDocument();
  });

  it('should hide spinner for completed uploads', () => {
    const completedFileNames = new Set(['done.pdf']);
    render(
      <DocumentSidebar
        {...defaultProps}
        uploadingFileNames={['done.pdf']}
        completedFileNames={completedFileNames}
      />,
    );

    expect(screen.getByText('done.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should not show pending files that already appear in documents', () => {
    const documents = [mockDocument('doc-1', 'existing.md')];
    render(
      <DocumentSidebar
        {...defaultProps}
        documents={documents}
        uploadingFileNames={['existing.md']}
      />,
    );

    const items = screen.getAllByText('existing.md');
    expect(items).toHaveLength(1);
  });

  it('should call onAddDocument when add button is clicked', () => {
    render(<DocumentSidebar {...defaultProps} />);

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(onAddDocument).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleCollapse when collapse button is clicked', () => {
    render(<DocumentSidebar {...defaultProps} />);

    const collapseButton = screen.getByRole('button', {
      name: 'Collapse sidebar',
    });
    fireEvent.click(collapseButton);

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });
});
