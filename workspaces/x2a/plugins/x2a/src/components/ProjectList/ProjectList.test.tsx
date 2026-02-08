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

describe('ProjectList', () => {
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

  describe('loading and data fetching', () => {
    it('renders the progress bar while loading', async () => {
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

      const progressbar = await findByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('renders empty state when no projects are returned', async () => {
      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([], 0),
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

      // EmptyProjectList is shown
      expect(
        screen.getByText('No conversion initiated yet'),
      ).toBeInTheDocument();
      expect(screen.getByText('Start first conversion')).toBeInTheDocument();
    });
  });

  describe('when data is loaded', () => {
    it('fetches projects and renders ProjectTable with data', async () => {
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

      // ProjectList delegates to ProjectTable; table shows project data
      expect(screen.getByText('Project 0')).toBeInTheDocument();
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

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

      const firstCall = fetchApiMock.mock.calls[0];
      const url = firstCall[0] as string;
      expect(url).toContain('page=0');
      expect(url).toContain('pageSize=10');
    });

    it('calls API with updated page when user navigates to next page', async () => {
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

      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);
      await waitFor(() => {
        expect(fetchApiMock).toHaveBeenCalled();
      });

      fetchApiMock.mockClear();

      const nextPageButton = screen.getByLabelText(/next page/i);
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(fetchApiMock).toHaveBeenCalled();
      });

      const lastCall =
        fetchApiMock.mock.calls[fetchApiMock.mock.calls.length - 1];
      const url = lastCall[0] as string;
      expect(url).toContain('sort=name');
      expect(url).toContain('order=desc');
      expect(url).toContain('page=1');
    });
  });
});
