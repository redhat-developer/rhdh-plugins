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

import { mockT } from '../../test-utils/mockTranslations';
import { NotebookSession } from '../../types';
import { NotebookCard } from '../notebooks/NotebookCard';

const mockNotebook: NotebookSession = {
  session_id: 'session-123',
  user_id: 'user-1',
  name: 'My Notebook',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  document_count: 2,
  metadata: {
    document_ids: ['doc-1', 'doc-2'],
  },
};

const mockClasses: Record<string, string> = {
  notebookCard: 'notebookCard',
  notebookCardHeader: 'notebookCardHeader',
  notebookDropdownMenu: 'notebookDropdownMenu',
  notebookMenuButton: 'notebookMenuButton',
  notebookDropdownList: 'notebookDropdownList',
  notebookDropdownItem: 'notebookDropdownItem',
  notebookCardHeaderActions: 'notebookCardHeaderActions',
  notebookTitle: 'notebookTitle',
  notebookTitleText: 'notebookTitleText',
  notebookCardDivider: 'notebookCardDivider',
  notebookCardBody: 'notebookCardBody',
  notebookDocuments: 'notebookDocuments',
  notebookUpdated: 'notebookUpdated',
};

describe('NotebookCard', () => {
  const onClick = jest.fn();
  const onRename = jest.fn();
  const onDelete = jest.fn();
  const setOpenNotebookMenuId = jest.fn();

  const defaultProps = {
    notebook: mockNotebook,
    classes: mockClasses,
    openNotebookMenuId: null as string | null,
    setOpenNotebookMenuId,
    onClick,
    onRename,
    onDelete,
    t: mockT as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the notebook name', () => {
    render(<NotebookCard {...defaultProps} />);
    expect(screen.getByText('My Notebook')).toBeInTheDocument();
  });

  it('should render the document count', () => {
    render(<NotebookCard {...defaultProps} />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('should call onClick with notebook when card is clicked', () => {
    render(<NotebookCard {...defaultProps} />);
    const card = screen
      .getByText('My Notebook')
      .closest('[class*="notebookCard"]');
    fireEvent.click(card!);
    expect(onClick).toHaveBeenCalledWith(mockNotebook);
  });

  it('should toggle dropdown menu when menu button is clicked', () => {
    render(<NotebookCard {...defaultProps} />);
    const menuButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(menuButton);
    expect(setOpenNotebookMenuId).toHaveBeenCalled();
  });

  it('should stop event propagation when menu toggle is clicked', () => {
    render(<NotebookCard {...defaultProps} />);
    onClick.mockClear();

    const menuButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(menuButton);

    expect(onClick).not.toHaveBeenCalled();
  });

  describe('dropdown actions', () => {
    const propsWithOpenMenu = {
      ...defaultProps,
      openNotebookMenuId: 'session-123',
    };

    it('should render rename and delete options when menu is open', () => {
      render(<NotebookCard {...propsWithOpenMenu} />);
      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onRename and stop propagation when rename is clicked', () => {
      render(<NotebookCard {...propsWithOpenMenu} />);
      onClick.mockClear();

      const renameItem = screen.getByText('Rename');
      fireEvent.click(renameItem);

      expect(onRename).toHaveBeenCalledWith('session-123');
      expect(setOpenNotebookMenuId).toHaveBeenCalledWith(null);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should call onDelete and stop propagation when delete is clicked', () => {
      render(<NotebookCard {...propsWithOpenMenu} />);
      onClick.mockClear();

      const deleteItem = screen.getByText('Delete');
      fireEvent.click(deleteItem);

      expect(onDelete).toHaveBeenCalledWith('session-123');
      expect(setOpenNotebookMenuId).toHaveBeenCalledWith(null);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  it('should render document_count from the notebook session', () => {
    render(<NotebookCard {...defaultProps} />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });
});
