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

import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Project,
  ProjectsGet,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { ProjectTable } from './ProjectTable';

const createMockProjects = (count: number, offset: number = 0): Project[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = offset + i;
    return {
      id: `project-${index}`,
      name: `Project ${index}`,
      abbreviation: `P${index}`,
      description: `Description ${index}`,
      sourceRepoUrl: `https://github.com/org/source-repo${index}`,
      targetRepoUrl: `https://github.com/org/target-repo${index}`,
      sourceRepoBranch: `main${index}`,
      targetRepoBranch: `main${index}`,
      createdAt: new Date(
        `2024-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
      ),
      createdBy: `user:default/user${index}`,
    };
  });
};

const defaultTableProps = (
  projects: Project[],
  totalCount: number,
  overrides?: Partial<{
    page: number;
    pageSize: number;
    orderBy: number;
    orderDirection: ProjectsGet['query']['order'];
  }>,
) => {
  const orderBy = overrides?.orderBy ?? 0;
  const orderDirection = overrides?.orderDirection ?? 'asc';
  const page = overrides?.page ?? 0;
  const pageSize = overrides?.pageSize ?? 10;

  return {
    projects,
    totalCount,
    forceRefresh: jest.fn(),
    orderBy,
    orderDirection,
    setOrderBy: jest.fn(),
    setOrderDirection: jest.fn(),
    page,
    pageSize,
    onPageChange: jest.fn(),
    onRowsPerPageChange: jest.fn(),
  };
};

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
        orderBy: 0,
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

      expect(screen.getByText(/Projects \(10\)/)).toBeInTheDocument();
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

      // Expand the first row (detail panel toggle)
      const expandButton = screen.getByLabelText(
        'Detail panel visiblity toggle',
      );
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Description 0')).toBeInTheDocument();
        expect(screen.getByText('Abbreviation')).toBeInTheDocument();
        expect(screen.getByText('P0')).toBeInTheDocument();
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('project-0')).toBeInTheDocument();
        expect(screen.getByText('Created By')).toBeInTheDocument();
        expect(screen.getByText('user:default/user0')).toBeInTheDocument();
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
