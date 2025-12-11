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

import { renderInTestApp } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from '../Table';

const MockItemRow = ({ itemKey, name }: { itemKey: string; name: string }) => (
  <tr>
    <td>{name}</td>
    <td>{itemKey}</td>
  </tr>
);

type MockDataItem = {
  itemKey: string;
  name: string;
};

describe('Table', () => {
  const mockData: MockDataItem[] = [
    { itemKey: 'key1', name: 'Item 1' },
    { itemKey: 'key2', name: 'Item 2' },
    { itemKey: 'key3', name: 'Item 3' },
  ];

  const mockColumns = ['Name', 'Key'];

  it('should render table with columns and data', async () => {
    await renderInTestApp(
      <Table columns={mockColumns} data={mockData} ItemRow={MockItemRow} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Key')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  it('should render spinner when isFetching is true', async () => {
    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        isFetching
      />,
    );

    await waitFor(() => {
      // PatternFly Spinner renders with role="progressbar"
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should not render spinner when isFetching is false', async () => {
    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('should render pagination when pagination prop is provided', async () => {
    const mockSetPage = jest.fn();
    const mockSetRowsPerPage = jest.fn();

    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        pagination={{
          page: 0,
          totalCount: 100,
          setPage: mockSetPage,
          rowsPerPage: 10,
          setRowsPerPage: mockSetRowsPerPage,
        }}
      />,
    );

    await waitFor(() => {
      // TablePagination shows "1-10 of 100"
      expect(screen.getByText(/1-10 of 100/)).toBeInTheDocument();
    });
  });

  it('should call setPage when page changes', async () => {
    const mockSetPage = jest.fn();
    const mockSetRowsPerPage = jest.fn();
    const user = userEvent.setup();

    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        pagination={{
          page: 0,
          totalCount: 100,
          setPage: mockSetPage,
          rowsPerPage: 10,
          setRowsPerPage: mockSetRowsPerPage,
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/1-10 of 100/)).toBeInTheDocument();
    });

    // Find and click the next page button
    const nextPageButton = screen.getByLabelText('Next page');
    await user.click(nextPageButton);

    expect(mockSetPage).toHaveBeenCalledWith(1);
  });

  it('should call setRowsPerPage and reset page to 0 when rows per page changes', async () => {
    const mockSetPage = jest.fn();
    const mockSetRowsPerPage = jest.fn();
    const user = userEvent.setup();

    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        pagination={{
          page: 2,
          totalCount: 100,
          setPage: mockSetPage,
          rowsPerPage: 10,
          setRowsPerPage: mockSetRowsPerPage,
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/21-30 of 100/)).toBeInTheDocument();
    });

    // Material-UI TablePagination uses a custom select that opens a menu
    // First, click the select button to open the menu
    const rowsPerPageSelect = screen.getByLabelText(/rows per page/i);
    await user.click(rowsPerPageSelect);

    // Wait for the menu to open and click on the "25" option
    await waitFor(async () => {
      const option25 = screen.getByRole('option', { name: '25' });
      await user.click(option25);
    });

    expect(mockSetRowsPerPage).toHaveBeenCalledWith(25);
    expect(mockSetPage).toHaveBeenCalledWith(0);
  });

  it('should render Load More button when onLoadMore and hasMore are provided', async () => {
    const mockLoadMore = jest.fn();

    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        onLoadMore={mockLoadMore}
        hasMore
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument();
      expect(
        screen.getByText('Fetches next page from clusters'),
      ).toBeInTheDocument();
    });
  });

  it('should not render Load More button when hasMore is false', async () => {
    const mockLoadMore = jest.fn();

    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        onLoadMore={mockLoadMore}
        hasMore={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
  });

  it('should not render Load More button when onLoadMore is not provided', async () => {
    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        hasMore
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
  });

  it('should call onLoadMore when Load More button is clicked', async () => {
    const mockLoadMore = jest.fn();
    const user = userEvent.setup();

    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        onLoadMore={mockLoadMore}
        hasMore
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText('Load More');
    await user.click(loadMoreButton);

    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });

  it('should disable Load More button when isFetching is true', async () => {
    const mockLoadMore = jest.fn();

    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        onLoadMore={mockLoadMore}
        hasMore
        isFetching
      />,
    );

    await waitFor(() => {
      const loadMoreButton = screen.getByTestId('load-more-button');
      expect(loadMoreButton).toBeDisabled();
    });
  });

  it('should show "Loading..." text on Load More button when isFetching is true', async () => {
    const mockLoadMore = jest.fn();

    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        onLoadMore={mockLoadMore}
        hasMore
        isFetching
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
  });

  it('should handle empty data array', async () => {
    await renderInTestApp(
      <Table columns={mockColumns} data={[]} ItemRow={MockItemRow} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Key')).toBeInTheDocument();
      // No data rows should be rendered
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });
  });

  it('should render all columns correctly', async () => {
    const multipleColumns = ['Column 1', 'Column 2', 'Column 3', 'Column 4'];

    await renderInTestApp(
      <Table columns={multipleColumns} data={mockData} ItemRow={MockItemRow} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Column 2')).toBeInTheDocument();
      expect(screen.getByText('Column 3')).toBeInTheDocument();
      expect(screen.getByText('Column 4')).toBeInTheDocument();
    });
  });

  it('should handle pagination with different page values', async () => {
    const mockSetPage = jest.fn();
    const mockSetRowsPerPage = jest.fn();

    await renderInTestApp(
      <Table
        columns={mockColumns}
        data={mockData}
        ItemRow={MockItemRow}
        pagination={{
          page: 5,
          totalCount: 100,
          setPage: mockSetPage,
          rowsPerPage: 10,
          setRowsPerPage: mockSetRowsPerPage,
        }}
      />,
    );

    await waitFor(() => {
      // Page 5 with 10 rows per page = 51-60 of 100
      expect(screen.getByText(/51-60 of 100/)).toBeInTheDocument();
    });
  });
});
