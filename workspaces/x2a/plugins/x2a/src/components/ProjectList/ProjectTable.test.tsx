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

jest.mock('../../hooks/useBulkRun', () => ({
  useBulkRun: () => ({
    runAllForProject: jest.fn(),
    runAllGlobal: jest.fn(),
  }),
}));

jest.mock('../../hooks/useProjectWriteAccess', () => ({
  useProjectWriteAccess: () => ({
    loading: false,
    hasAnyWriteAccess: true,
    canWriteProject: () => true,
  }),
}));

import { TestApiProvider } from '@backstage/test-utils';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { mapOrderByToSort, ProjectTable } from './ProjectTable';
import {
  backstageTableApis,
  createMockProjects,
  defaultTableProps,
} from '../../test-utils/projectListTestUtils';

describe('ProjectTable', () => {
  let fetchApiMock: jest.Mock;
  let discoveryApiMock: { getBaseUrl: jest.Mock };

  beforeEach(() => {
    discoveryApiMock = {
      getBaseUrl: jest.fn().mockResolvedValue('http://localhost:1234'),
    };
    fetchApiMock = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Columns', () => {
    it('renders all expected column headers', () => {
      const mockProjects = createMockProjects(5);
      const props = defaultTableProps(mockProjects, 5);

      render(
        <MemoryRouter>
          <TestApiProvider
            apis={[
              [fetchApiRef, { fetch: fetchApiMock }],
              [discoveryApiRef, discoveryApiMock],
              ...backstageTableApis,
            ]}
          >
            <ProjectTable {...props} />
          </TestApiProvider>
        </MemoryRouter>,
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Source Repository')).toBeInTheDocument();
      expect(screen.getByText('Target Repository')).toBeInTheDocument();
      expect(screen.getByText('Created At')).toBeInTheDocument();
    });

    it('displays project data in columns', () => {
      const mockProjects = createMockProjects(2);
      const props = defaultTableProps(mockProjects, 2);

      render(
        <MemoryRouter>
          <TestApiProvider
            apis={[
              [fetchApiRef, { fetch: fetchApiMock }],
              [discoveryApiRef, discoveryApiMock],
              ...backstageTableApis,
            ]}
          >
            <ProjectTable {...props} />
          </TestApiProvider>
        </MemoryRouter>,
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

      render(
        <MemoryRouter>
          <TestApiProvider
            apis={[
              [fetchApiRef, { fetch: fetchApiMock }],
              [discoveryApiRef, discoveryApiMock],
              ...backstageTableApis,
            ]}
          >
            <ProjectTable
              {...props}
              setOrderBy={setOrderBy}
              setOrderDirection={setOrderDirection}
            />
          </TestApiProvider>
        </MemoryRouter>,
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

      render(
        <MemoryRouter>
          <TestApiProvider
            apis={[
              [fetchApiRef, { fetch: fetchApiMock }],
              [discoveryApiRef, discoveryApiMock],
              ...backstageTableApis,
            ]}
          >
            <ProjectTable {...props} onPageChange={onPageChange} />
          </TestApiProvider>
        </MemoryRouter>,
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

      render(
        <MemoryRouter>
          <TestApiProvider
            apis={[
              [fetchApiRef, { fetch: fetchApiMock }],
              [discoveryApiRef, discoveryApiMock],
              ...backstageTableApis,
            ]}
          >
            <ProjectTable
              {...props}
              onRowsPerPageChange={onRowsPerPageChange}
            />
          </TestApiProvider>
        </MemoryRouter>,
      );

      const rowsPerPageSelect = screen.getByLabelText(/rows per page/i);
      await user.click(rowsPerPageSelect);

      const option20 = await screen.findByText('20');
      await user.click(option20);

      await waitFor(() => {
        expect(onRowsPerPageChange).toHaveBeenCalledWith(20);
      });
    });

    it('displays table title with projects count', () => {
      const mockProjects = createMockProjects(10);
      const props = defaultTableProps(mockProjects, 20);

      render(
        <MemoryRouter>
          <TestApiProvider
            apis={[
              [fetchApiRef, { fetch: fetchApiMock }],
              [discoveryApiRef, discoveryApiMock],
              ...backstageTableApis,
            ]}
          >
            <ProjectTable {...props} />
          </TestApiProvider>
        </MemoryRouter>,
      );

      expect(screen.getByText(/Projects \(20\)/)).toBeInTheDocument();
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
