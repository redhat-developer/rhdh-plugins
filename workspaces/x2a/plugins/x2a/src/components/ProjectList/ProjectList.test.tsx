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
import { ProjectList } from './ProjectList';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Project,
  ProjectsGet200Response,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

// Mock useSeedTestData to prevent it from making API calls during tests
jest.mock('../../useSeedTestData', () => ({
  useSeedTestData: jest.fn(),
}));

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

const createMockResponse = (
  items: Project[],
  totalCount: number,
): ProjectsGet200Response => ({
  items,
  totalCount,
});

describe('ProjectList component', () => {
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

  it('renders the progressbar', async () => {
    fetchApiMock.mockReturnValue(new Promise(() => {}));

    const { findByRole } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [fetchApiRef, { fetch: fetchApiMock }],
          [discoveryApiRef, discoveryApiMock],
        ]}
      >
        <ProjectList />
      </TestApiProvider>,
    );

    // Wait for the progressbar to render
    const progressbar = await findByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  describe('Columns', () => {
    it('renders all expected columns', async () => {
      const mockProjects = createMockProjects(5);
      const mockResponse = createMockResponse(mockProjects, 5);

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectList />
        </TestApiProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check that all column headers are present
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Abbreviation')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Created At')).toBeInTheDocument();
    });

    it('displays project data in columns', async () => {
      const mockProjects = createMockProjects(2);
      const mockResponse = createMockResponse(mockProjects, 2);

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectList />
        </TestApiProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check that project data is displayed
      expect(screen.getByText('Project 0')).toBeInTheDocument();
      expect(screen.getByText('P0')).toBeInTheDocument();
      expect(screen.getByText('Description 0')).toBeInTheDocument();
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('P1')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('calls API with correct sort parameters when Name column is clicked', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(5);
      const mockResponse = createMockResponse(mockProjects, 5);

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectList />
        </TestApiProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Clear previous calls
      fetchApiMock.mockClear();

      // Click on Name column header to sort
      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);

      await waitFor(() => {
        expect(fetchApiMock).toHaveBeenCalled();
      });

      // Verify the API was called with sort=name
      const lastCall =
        fetchApiMock.mock.calls[fetchApiMock.mock.calls.length - 1];
      const url = lastCall[0] as string;
      expect(url).toContain('sort=name');
    });

    it('calls API with correct sort parameters when Abbreviation column is clicked', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(5);
      const mockResponse = createMockResponse(mockProjects, 5);

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectList />
        </TestApiProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      fetchApiMock.mockClear();

      // Click on Abbreviation column header
      const abbreviationHeader = screen.getByText('Abbreviation');
      await user.click(abbreviationHeader);

      await waitFor(() => {
        expect(fetchApiMock).toHaveBeenCalled();
      });

      const lastCall =
        fetchApiMock.mock.calls[fetchApiMock.mock.calls.length - 1];
      const url = lastCall[0] as string;
      expect(url).toContain('sort=abbreviation');
    });
  });

  describe('Pagination', () => {
    it('calls API with default page and pageSize on initial load', async () => {
      const mockProjects = createMockProjects(10);
      const mockResponse = createMockResponse(mockProjects, 25);

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectList />
        </TestApiProvider>,
      );

      await waitFor(() => {
        expect(fetchApiMock).toHaveBeenCalled();
      });

      // Verify initial call has page=0 and pageSize=10 (DEFAULT_PAGE_SIZE)
      const firstCall = fetchApiMock.mock.calls[0];
      const url = firstCall[0] as string;
      expect(url).toContain('page=0');
      expect(url).toContain('pageSize=10');
    });

    it('calls API with updated page when navigating to next page', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(10);
      const mockResponse = createMockResponse(mockProjects, 25);

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectList />
        </TestApiProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      fetchApiMock.mockClear();

      // Find and click the "Next Page" button
      // Material Table uses aria-label for navigation buttons
      const nextPageButton = screen.getByLabelText(/next page/i);
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(fetchApiMock).toHaveBeenCalled();
      });

      const lastCall =
        fetchApiMock.mock.calls[fetchApiMock.mock.calls.length - 1];
      const url = lastCall[0] as string;
      expect(url).toContain('page=1');
    });

    it('calls API with updated pageSize when changing rows per page', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(10);
      const mockResponse = createMockResponse(mockProjects, 25);

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectList />
        </TestApiProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      fetchApiMock.mockClear();

      // Find the rows per page selector and change it
      // Material Table typically uses a select element for page size
      const rowsPerPageSelect = screen.getByLabelText(/rows per page/i);
      await user.click(rowsPerPageSelect);

      const option20 = await screen.findByText('20');
      await user.click(option20);

      await waitFor(() => {
        expect(fetchApiMock).toHaveBeenCalled();
      });

      const lastCall =
        fetchApiMock.mock.calls[fetchApiMock.mock.calls.length - 1];
      const url = lastCall[0] as string;
      expect(url).toContain('pageSize=20');
    });

    it('displays correct total count in table title', async () => {
      const mockProjects = createMockProjects(10);
      const mockResponse = createMockResponse(mockProjects, 20);

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectList />
        </TestApiProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // The table title should show the number of items on current page, not totalCount
      expect(screen.getByText(/Projects \(10\)/)).toBeInTheDocument();
    });
  });

  describe('Combined functionality', () => {
    it('maintains sort order when changing pages', async () => {
      const user = userEvent.setup();
      const mockProjects = createMockProjects(10);
      const mockResponse = createMockResponse(mockProjects, 25);

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await renderInTestApp(
        <TestApiProvider
          apis={[
            [fetchApiRef, { fetch: fetchApiMock }],
            [discoveryApiRef, discoveryApiMock],
          ]}
        >
          <ProjectList />
        </TestApiProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      fetchApiMock.mockClear();

      // Sort by name descending
      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);
      await waitFor(() => {
        expect(fetchApiMock).toHaveBeenCalled();
      });

      fetchApiMock.mockClear();

      // Navigate to next page
      const nextPageButton = screen.getByLabelText(/next page/i);
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(fetchApiMock).toHaveBeenCalled();
      });

      // Verify that sort parameters are still present
      const lastCall =
        fetchApiMock.mock.calls[fetchApiMock.mock.calls.length - 1];
      const url = lastCall[0] as string;
      expect(url).toContain('sort=name');
      expect(url).toContain('order=desc');
      expect(url).toContain('page=1');
    });
  });
});
