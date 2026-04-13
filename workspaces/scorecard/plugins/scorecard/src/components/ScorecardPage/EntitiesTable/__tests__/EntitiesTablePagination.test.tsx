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
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { EntitiesTablePagination } from '../EntitiesTablePagination';

const theme = createTheme();
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('EntitiesTablePagination', () => {
  const defaultProps = {
    count: 25,
    page: 1,
    rowsPerPage: 10,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render range text and navigation buttons', () => {
    render(
      <TestWrapper>
        <EntitiesTablePagination {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByLabelText('first page')).toBeInTheDocument();
    expect(screen.getByLabelText('previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('next page')).toBeInTheDocument();
    expect(screen.getByLabelText('last page')).toBeInTheDocument();
    expect(screen.getByText(/1-10 of 25/)).toBeInTheDocument();
  });

  it('should display correct range for middle page', () => {
    render(
      <TestWrapper>
        <EntitiesTablePagination {...defaultProps} page={2} />
      </TestWrapper>,
    );

    expect(screen.getByText(/11-20 of 25/)).toBeInTheDocument();
  });

  it('should display correct range for last partial page', () => {
    render(
      <TestWrapper>
        <EntitiesTablePagination {...defaultProps} page={3} />
      </TestWrapper>,
    );

    expect(screen.getByText(/21-25 of 25/)).toBeInTheDocument();
  });

  it('should call onPageChange with 1 when first page is clicked', async () => {
    const onPageChange = jest.fn();
    render(
      <TestWrapper>
        <EntitiesTablePagination
          {...defaultProps}
          page={2}
          onPageChange={onPageChange}
        />
      </TestWrapper>,
    );

    await userEvent.click(screen.getByLabelText('first page'));

    expect(onPageChange).toHaveBeenCalledWith(expect.any(Object), 1);
  });

  it('should call onPageChange with page - 1 when previous is clicked', async () => {
    const onPageChange = jest.fn();
    render(
      <TestWrapper>
        <EntitiesTablePagination
          {...defaultProps}
          page={2}
          onPageChange={onPageChange}
        />
      </TestWrapper>,
    );

    await userEvent.click(screen.getByLabelText('previous page'));

    expect(onPageChange).toHaveBeenCalledWith(expect.any(Object), 1);
  });

  it('should call onPageChange with page + 1 when next is clicked', async () => {
    const onPageChange = jest.fn();
    render(
      <TestWrapper>
        <EntitiesTablePagination
          {...defaultProps}
          page={1}
          onPageChange={onPageChange}
        />
      </TestWrapper>,
    );

    await userEvent.click(screen.getByLabelText('next page'));

    expect(onPageChange).toHaveBeenCalledWith(expect.any(Object), 2);
  });

  it('should call onPageChange with last page when last page is clicked', async () => {
    const onPageChange = jest.fn();
    render(
      <TestWrapper>
        <EntitiesTablePagination
          {...defaultProps}
          page={1}
          onPageChange={onPageChange}
        />
      </TestWrapper>,
    );

    await userEvent.click(screen.getByLabelText('last page'));

    expect(onPageChange).toHaveBeenCalledWith(expect.any(Object), 3);
  });

  it('should disable first and previous when page is 1', () => {
    render(
      <TestWrapper>
        <EntitiesTablePagination {...defaultProps} page={1} />
      </TestWrapper>,
    );

    expect(screen.getByLabelText('first page')).toBeDisabled();
    expect(screen.getByLabelText('previous page')).toBeDisabled();
  });

  it('should disable next and last when on last page', () => {
    render(
      <TestWrapper>
        <EntitiesTablePagination
          {...defaultProps}
          page={3}
          count={25}
          rowsPerPage={10}
        />
      </TestWrapper>,
    );

    expect(screen.getByLabelText('next page')).toBeDisabled();
    expect(screen.getByLabelText('last page')).toBeDisabled();
  });

  it('should show 0-0 of 0 when count is 0', () => {
    render(
      <TestWrapper>
        <EntitiesTablePagination {...defaultProps} count={0} page={1} />
      </TestWrapper>,
    );

    expect(screen.getByText(/0-0 of 0/)).toBeInTheDocument();
  });
});
