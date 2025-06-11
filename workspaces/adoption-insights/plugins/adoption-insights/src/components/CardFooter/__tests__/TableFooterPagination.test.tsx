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

import TableFooterPagination from '../TableFooterPagination';
import { ThemeProvider, createTheme } from '@mui/material/styles';

describe('TableFooterPagination', () => {
  const defaultProps = {
    count: 100,
    rowsPerPage: 10,
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
    await userEvent.click(screen.getByText('Top 5'));

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
});
