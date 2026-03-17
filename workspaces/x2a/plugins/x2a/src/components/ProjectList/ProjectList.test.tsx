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

import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { ProjectList } from './ProjectList';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { permissionApiRef } from '@backstage/plugin-permission-react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { POLLING_INTERVAL_MS } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import {
  createMockProjects,
  createMockResponse,
  mockPermissionApi,
} from '../../test-utils/projectListTestUtils';

describe('ProjectList', () => {
  let fetchApiMock: jest.Mock;
  let discoveryApiMock: ReturnType<typeof mockApis.discovery>;

  beforeEach(() => {
    jest.useFakeTimers();
    discoveryApiMock = mockApis.discovery({
      baseUrl: 'http://localhost:1234',
    });
    fetchApiMock = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
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
            [permissionApiRef, mockPermissionApi],
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
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
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
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
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
        expect(screen.getByText('Project 0')).toBeInTheDocument();
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

  describe('polling', () => {
    it('polls for new data after POLLING_INTERVAL_MS', async () => {
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
        expect(screen.getByText('Project 0')).toBeInTheDocument();
      });

      const initialCallCount = fetchApiMock.mock.calls.length;

      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS);
      });

      await waitFor(() => {
        expect(fetchApiMock.mock.calls.length).toBeGreaterThan(
          initialCallCount,
        );
      });
    });

    it('does not show loading indicator during polling refresh', async () => {
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
        expect(screen.getByText('Project 0')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS);
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Project 0')).toBeInTheDocument();
    });

    it('updates data when the API returns new content', async () => {
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
        expect(screen.getByText('Project 0')).toBeInTheDocument();
      });

      const updatedProjects = createMockProjects(2, 10);
      const updatedResponse = createMockResponse(updatedProjects, 2);
      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => updatedResponse,
      } as Response);

      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS);
      });

      await waitFor(() => {
        expect(screen.getByText('Project 10')).toBeInTheDocument();
      });
      expect(screen.queryByText('Project 0')).not.toBeInTheDocument();
    });

    it('recovers from error on next successful poll', async () => {
      const mockProjects = createMockProjects(2);
      const mockResponse = createMockResponse(mockProjects, 2);

      fetchApiMock.mockRejectedValueOnce(new Error('Temporary failure'));

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
      expect(screen.getAllByText(/Temporary failure/).length).toBeGreaterThan(
        0,
      );

      fetchApiMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // After first error, backoff = POLLING_INTERVAL_MS * 2
      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS * 2);
      });

      await waitFor(() => {
        expect(screen.getByText('Project 0')).toBeInTheDocument();
      });
    });
  });
});
