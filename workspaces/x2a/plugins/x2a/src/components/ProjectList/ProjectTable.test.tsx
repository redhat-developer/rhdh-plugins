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
import { mockUseTranslation } from '../../test-utils/mockTranslations';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: require('../../test-utils/mockRouteRef').mockUseRouteRef,
}));

import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mapOrderByToSort, ProjectTable } from './ProjectTable';
import {
  createMockProjects,
  defaultTableProps,
} from '../../test-utils/projectListTestUtils';

describe('ProjectTable', () => {
  let fetchApiMock: jest.Mock;
  let discoveryApiMock: ReturnType<typeof mockApis.discovery>;

  beforeEach(() => {
    discoveryApiMock = mockApis.discovery({
      baseUrl: 'http://localhost:1234',
    });
    fetchApiMock = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Columns', () => {
    it('renders all expected column headers', async () => {
      const mockProjects = createMockProjects(5);
      const props = defaultTableProps(mockProjects, 5);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Source Repository')).toBeInTheDocument();
      expect(screen.getByText('Target Repository')).toBeInTheDocument();
      expect(screen.getByText('Created At')).toBeInTheDocument();
    });

    it('displays project data in columns', async () => {
      const mockProjects = createMockProjects(2);
      const props = defaultTableProps(mockProjects, 2);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      expect(screen.getByText('Project 0')).toBeInTheDocument();
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('calls setOrderBy and setOrderDirection when Name column is clicked', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(5);
      const setOrderBy = jest.fn();
      const setOrderDirection = jest.fn();
      const props = defaultTableProps(mockProjects, 5, {
        orderBy: 1,
        orderDirection: 'asc',
      });

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable
            {...props}
            setOrderBy={setOrderBy}
            setOrderDirection={setOrderDirection}
          />
        </TestApiProvider>,
      );

      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);

      await waitFor(() => {
        expect(setOrderBy).toHaveBeenCalled();
        expect(setOrderDirection).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('calls onPageChange when navigating to next page', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(10);
      const onPageChange = jest.fn();
      const props = defaultTableProps(mockProjects, 25, {
        page: 0,
        pageSize: 10,
      });

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} onPageChange={onPageChange} />
        </TestApiProvider>,
      );

      const nextPageButton = screen.getByLabelText(/next page/i);
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(1, 10);
      });
    });

    it('calls onRowsPerPageChange when changing rows per page', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(10);
      const onRowsPerPageChange = jest.fn();
      const props = defaultTableProps(mockProjects, 25);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} onRowsPerPageChange={onRowsPerPageChange} />
        </TestApiProvider>,
      );

      const rowsPerPageSelect = screen.getByLabelText(/rows per page/i);
      await user.click(rowsPerPageSelect);

      const option20 = await screen.findByText('20');
      await user.click(option20);

      await waitFor(() => {
        expect(onRowsPerPageChange).toHaveBeenCalledWith(20);
      });
    });

    it('displays table title with projects count', async () => {
      const mockProjects = createMockProjects(10);
      const props = defaultTableProps(mockProjects, 20);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      expect(screen.getByText(/Projects \(20\)/)).toBeInTheDocument();
    });
  });

  describe('Detail panel', () => {
    it('shows DetailPanel content when row is expanded', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(1);
      const props = defaultTableProps(mockProjects, 1);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      const expandButton = screen.getByLabelText('Expand row');
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Description 0')).toBeInTheDocument();
        expect(screen.getByText('Abbreviation')).toBeInTheDocument();
        expect(screen.getByText('P0')).toBeInTheDocument();
      });
    });
  });

  describe('Expand/Collapse All', () => {
    it('renders expand all toggle in the Name column header', async () => {
      const mockProjects = createMockProjects(1);
      const props = defaultTableProps(mockProjects, 1);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      expect(screen.getByLabelText('Expand all rows')).toBeInTheDocument();
    });

    it('expands all rows when expand all is clicked', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(2);
      const props = defaultTableProps(mockProjects, 2);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      const expandAllButton = screen.getByLabelText('Expand all rows');
      await user.click(expandAllButton);

      await waitFor(() => {
        expect(screen.getByText('Description 0')).toBeInTheDocument();
        expect(screen.getByText('Description 1')).toBeInTheDocument();
      });
    });

    it('collapses all rows when collapse all is clicked after expand', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(2);
      const props = defaultTableProps(mockProjects, 2);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      await user.click(screen.getByLabelText('Expand all rows'));

      await waitFor(() => {
        expect(screen.getByText('Description 0')).toBeInTheDocument();
        expect(screen.getByText('Description 1')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Collapse all rows'));

      await waitFor(() => {
        expect(screen.queryByText('Description 0')).not.toBeInTheDocument();
        expect(screen.queryByText('Description 1')).not.toBeInTheDocument();
      });
    });

    it('expands remaining rows when partially expanded and expand all is clicked', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(3);
      const props = defaultTableProps(mockProjects, 3);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      const rowToggleButtons = screen.getAllByLabelText('Expand row');
      await user.click(rowToggleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Description 0')).toBeInTheDocument();
        expect(screen.queryByText('Description 1')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText('Expand all rows')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Expand all rows'));

      await waitFor(() => {
        expect(screen.getByText('Description 0')).toBeInTheDocument();
        expect(screen.getByText('Description 1')).toBeInTheDocument();
        expect(screen.getByText('Description 2')).toBeInTheDocument();
      });
    });

    it('updates header toggle after expanding all then collapsing one row', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(2);
      const props = defaultTableProps(mockProjects, 2);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      await user.click(screen.getByLabelText('Expand all rows'));

      await waitFor(() => {
        expect(screen.getByLabelText('Collapse all rows')).toBeInTheDocument();
      });

      const collapseRowButtons = screen.getAllByLabelText('Collapse row');
      await user.click(collapseRowButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText('Expand all rows')).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('renders New Project button', async () => {
      const mockProjects = createMockProjects(1);
      const props = defaultTableProps(mockProjects, 1);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectTable {...props} />
        </TestApiProvider>,
      );

      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });
});

describe('mapOrderByToSort', () => {
  it('returns undefined for index 0 (toggle column)', () => {
    expect(() => mapOrderByToSort(0)).toThrow('Invalid orderBy: 0');
  });

  it('maps index 1 to name', () => {
    expect(mapOrderByToSort(1)).toBe('name');
  });

  it('maps index 2 to status', () => {
    expect(mapOrderByToSort(2)).toBe('status');
  });

  it('throws for unsortable column index 3', () => {
    expect(() => mapOrderByToSort(3)).toThrow('Invalid orderBy: 3');
  });

  it('throws for unsortable column index 4', () => {
    expect(() => mapOrderByToSort(4)).toThrow('Invalid orderBy: 4');
  });

  it('maps index 5 to createdAt', () => {
    expect(mapOrderByToSort(5)).toBe('createdAt');
  });

  it('falls back to name for negative index', () => {
    expect(mapOrderByToSort(-1)).toBe('name');
  });
});
