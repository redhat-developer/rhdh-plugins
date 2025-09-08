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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  MockTrans,
  mockUseTranslation,
} from '../../../test-utils/mockTranslations';

import TableFooterPagination from '../TableFooterPagination';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));
import { ThemeProvider, createTheme } from '@mui/material/styles';

describe('TableFooterPagination', () => {
  const defaultProps = {
    count: 100,
    rowsPerPage: 5,
    page: 0,
    handleChangePage: jest.fn(),
    handleChangeRowsPerPage: jest.fn(),
  };

  const theme = createTheme();

  const renderComponent = (props = defaultProps) => {
    return render(
      <ThemeProvider theme={theme}>
        <TableFooterPagination {...props} />
      </ThemeProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    renderComponent();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should call handleChangeRowsPerPage when rows per page is changed', async () => {
    renderComponent();
    const select = screen.getByRole('combobox');

    await userEvent.click(select);
    const options = screen.getAllByRole('option');
    await userEvent.click(options[0]);

    expect(defaultProps.handleChangeRowsPerPage).toHaveBeenCalled();
  });

  it('should apply correct styles to the Box component', () => {
    const { container } = renderComponent();
    const box = container.firstChild as HTMLElement;

    expect(box).toHaveStyle({
      display: 'flex',
      justifyContent: 'flex-end',
      padding: '8px',
    });
  });

  it('should hide pagination labels and actions as specified', () => {
    renderComponent();

    expect(screen.queryByText(/rows per page/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /previous page/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /next page/i }),
    ).not.toBeInTheDocument();
  });

  it('should apply correct styles to the select menu', async () => {
    renderComponent();
    const select = screen.getByRole('combobox');

    await userEvent.click(select);

    const menu = document.querySelector('.MuiMenu-paper');
    expect(menu).toHaveStyle({
      width: '190px',
      borderRadius: '8px',
    });
  });

  describe('Dynamic "Top X" options logic', () => {
    it('should not render when count is 1 (single option)', () => {
      const { container } = renderComponent({ ...defaultProps, count: 1 });
      expect(container.firstChild).toBeNull();
    });

    it('should not render when count is 2 (single option)', () => {
      const { container } = renderComponent({ ...defaultProps, count: 2 });
      expect(container.firstChild).toBeNull();
    });

    it('should show only "Top 3" option for 3 items (exact match, single option)', () => {
      const { container } = renderComponent({ ...defaultProps, count: 3 });
      expect(container.firstChild).toBeNull(); // Still hidden because only one option
    });

    it('should show "Top 3, All" options for 4 items', async () => {
      renderComponent({ ...defaultProps, count: 4, rowsPerPage: 3 });
      const select = screen.getByRole('combobox');

      await userEvent.click(select);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('Top 3');
      expect(options[1]).toHaveTextContent('All');
      expect(screen.queryByText('Top 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Top 5')).not.toBeInTheDocument();
    });

    it('should show "Top 3, Top 5" options for 5 items (exact match)', async () => {
      renderComponent({ ...defaultProps, count: 5, rowsPerPage: 3 });
      const select = screen.getByRole('combobox');

      await userEvent.click(select);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('Top 3');
      expect(options[1]).toHaveTextContent('Top 5');
      expect(screen.queryByText('Top 4')).not.toBeInTheDocument();
    });

    it('should show "Top 3, Top 5, All" options for 6 items', async () => {
      renderComponent({ ...defaultProps, count: 6, rowsPerPage: 3 });
      const select = screen.getByRole('combobox');

      await userEvent.click(select);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Top 3');
      expect(options[1]).toHaveTextContent('Top 5');
      expect(options[2]).toHaveTextContent('All');
      expect(screen.queryByText('Top 6')).not.toBeInTheDocument();
    });

    it('should show "Top 3, Top 5, All" options for 7 items', async () => {
      renderComponent({ ...defaultProps, count: 7, rowsPerPage: 3 });
      const select = screen.getByRole('combobox');

      await userEvent.click(select);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Top 3');
      expect(options[1]).toHaveTextContent('Top 5');
      expect(options[2]).toHaveTextContent('All');
      expect(screen.queryByText('Top 7')).not.toBeInTheDocument();
    });

    it('should show "Top 3, Top 5, Top 10" options for 10 items (exact match)', async () => {
      renderComponent({ ...defaultProps, count: 10, rowsPerPage: 5 });
      const select = screen.getByRole('combobox');

      await userEvent.click(select);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Top 3');
      expect(options[1]).toHaveTextContent('Top 5');
      expect(options[2]).toHaveTextContent('Top 10');
    });

    it('should show "Top 3, Top 5, Top 10, All" options for 11 items', async () => {
      renderComponent({ ...defaultProps, count: 11, rowsPerPage: 3 });
      const select = screen.getByRole('combobox');

      await userEvent.click(select);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveTextContent('Top 3');
      expect(options[1]).toHaveTextContent('Top 5');
      expect(options[2]).toHaveTextContent('Top 10');
      expect(options[3]).toHaveTextContent('All');
      expect(screen.queryByText('Top 11')).not.toBeInTheDocument();
    });

    it('should show "Top 3, Top 5, Top 10, Top 20" options for 20 items (exact match)', async () => {
      renderComponent({ ...defaultProps, count: 20, rowsPerPage: 5 });
      const select = screen.getByRole('combobox');

      await userEvent.click(select);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveTextContent('Top 3');
      expect(options[1]).toHaveTextContent('Top 5');
      expect(options[2]).toHaveTextContent('Top 10');
      expect(options[3]).toHaveTextContent('Top 20');
    });

    it('should show "Top 3, Top 5, Top 10, Top 20" options for 25 items (no All - exceeds max)', async () => {
      renderComponent({ ...defaultProps, count: 25, rowsPerPage: 5 });
      const select = screen.getByRole('combobox');

      await userEvent.click(select);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveTextContent('Top 3');
      expect(options[1]).toHaveTextContent('Top 5');
      expect(options[2]).toHaveTextContent('Top 10');
      expect(options[3]).toHaveTextContent('Top 20');
      expect(screen.queryByText('All')).not.toBeInTheDocument();
      expect(screen.queryByText('Top 25')).not.toBeInTheDocument();
    });
  });
});
