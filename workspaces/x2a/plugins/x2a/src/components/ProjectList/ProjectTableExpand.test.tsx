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
import { ProjectTable } from './ProjectTable';
import {
  backstageTableApis,
  createMockProjects,
  defaultTableProps,
} from '../../test-utils/projectListTestUtils';

describe('ProjectTable – expand & actions', () => {
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

  describe('Detail panel', () => {
    it('shows DetailPanel content when row is expanded', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(1);
      const props = defaultTableProps(mockProjects, 1);

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
    it('renders expand all toggle in the Name column header', () => {
      const mockProjects = createMockProjects(1);
      const props = defaultTableProps(mockProjects, 1);

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

      expect(screen.getByLabelText('Expand all rows')).toBeInTheDocument();
    });

    it('expands all rows when expand all is clicked', async () => {
      const user = userEvent.setup();
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
    it('renders New Project button', () => {
      const mockProjects = createMockProjects(1);
      const props = defaultTableProps(mockProjects, 1);

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

      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });
});
