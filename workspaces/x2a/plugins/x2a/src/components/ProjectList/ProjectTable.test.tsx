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

const mockRetriggerInit = jest.fn().mockResolvedValue('job-1');

jest.mock('../../hooks/useBulkRun', () => ({
  useBulkRun: () => ({
    runAllForProject: jest.fn(),
    runAllGlobal: jest.fn(),
    retriggerInit: mockRetriggerInit,
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
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
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

  describe('Retrigger init action', () => {
    const RETRIGGER_TOOLTIP = 'Retrigger project init phase';

    const zeroSummary = {
      total: 0,
      finished: 0,
      waiting: 0,
      pending: 0,
      running: 0,
      error: 0,
      cancelled: 0,
    };

    const renderTable = (projects: Project[]) => {
      const props = defaultTableProps(projects, projects.length);
      return render(
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
    };

    it('shows retrigger icon when project has no modules and init is not running', () => {
      const projects = createMockProjects(1);
      renderTable(projects);

      expect(screen.queryAllByTitle(RETRIGGER_TOOLTIP).length).toBeGreaterThan(
        0,
      );
    });

    it('shows retrigger icon when status exists but modulesSummary.total is 0', () => {
      const projects: Project[] = [
        {
          ...createMockProjects(1)[0],
          status: { state: 'created', modulesSummary: zeroSummary },
        },
      ];
      renderTable(projects);

      expect(screen.queryAllByTitle(RETRIGGER_TOOLTIP).length).toBeGreaterThan(
        0,
      );
    });

    it('hides retrigger icon when project has modules', () => {
      const projects: Project[] = [
        {
          ...createMockProjects(1)[0],
          status: {
            state: 'initialized',
            modulesSummary: { ...zeroSummary, total: 3 },
          },
        },
      ];
      renderTable(projects);

      expect(screen.queryByTitle(RETRIGGER_TOOLTIP)).toBeNull();
    });

    it('hides retrigger icon when init job is running', () => {
      const projects: Project[] = [
        {
          ...createMockProjects(1)[0],
          initJob: {
            id: 'job-1',
            projectId: 'project-0',
            startedAt: new Date(),
            phase: 'init',
            k8sJobName: 'k8s-init-1',
            status: 'running',
          },
        },
      ];
      renderTable(projects);

      expect(screen.queryByTitle(RETRIGGER_TOOLTIP)).toBeNull();
    });

    it('hides retrigger icon when init job is pending', () => {
      const projects: Project[] = [
        {
          ...createMockProjects(1)[0],
          initJob: {
            id: 'job-2',
            projectId: 'project-0',
            startedAt: new Date(),
            phase: 'init',
            k8sJobName: 'k8s-init-2',
            status: 'pending',
          },
        },
      ];
      renderTable(projects);

      expect(screen.queryByTitle(RETRIGGER_TOOLTIP)).toBeNull();
    });

    it('shows retrigger icon when init job finished with error and no modules', () => {
      const projects: Project[] = [
        {
          ...createMockProjects(1)[0],
          initJob: {
            id: 'job-3',
            projectId: 'project-0',
            startedAt: new Date(),
            finishedAt: new Date(),
            phase: 'init',
            k8sJobName: 'k8s-init-3',
            status: 'error',
          },
        },
      ];
      renderTable(projects);

      expect(screen.queryAllByTitle(RETRIGGER_TOOLTIP).length).toBeGreaterThan(
        0,
      );
    });

    it('shows retrigger icon when init job succeeded but no modules exist', () => {
      const projects: Project[] = [
        {
          ...createMockProjects(1)[0],
          initJob: {
            id: 'job-4',
            projectId: 'project-0',
            startedAt: new Date(),
            finishedAt: new Date(),
            phase: 'init',
            k8sJobName: 'k8s-init-4',
            status: 'success',
          },
        },
      ];
      renderTable(projects);

      expect(screen.queryAllByTitle(RETRIGGER_TOOLTIP).length).toBeGreaterThan(
        0,
      );
    });

    it('calls retriggerInit after confirming the dialog', async () => {
      const projects = createMockProjects(1);
      renderTable(projects);

      const retriggerSpan = screen.getAllByTitle(RETRIGGER_TOOLTIP)[0];
      const button = retriggerSpan.querySelector('button') ?? retriggerSpan;
      fireEvent.click(button);

      const confirmButton = await screen.findByRole('button', {
        name: 'Retrigger',
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockRetriggerInit).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'project-0' }),
          undefined,
        );
      });
    });

    it('passes userPrompt to retriggerInit when provided', async () => {
      const projects = createMockProjects(1);
      renderTable(projects);

      const retriggerSpan = screen.getAllByTitle(RETRIGGER_TOOLTIP)[0];
      const button = retriggerSpan.querySelector('button') ?? retriggerSpan;
      fireEvent.click(button);

      const promptInput = await screen.findByTestId(
        'retrigger-init-user-prompt',
      );
      fireEvent.change(promptInput, { target: { value: 'custom prompt' } });

      const confirmButton = screen.getByRole('button', {
        name: 'Retrigger',
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockRetriggerInit).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'project-0' }),
          'custom prompt',
        );
      });
    });
  });

  describe('Global Run All dialog', () => {
    const NO_INIT_ELIGIBLE =
      'No projects are currently eligible for re-running the init phase.';
    const INIT_RETRIGGER_MSG =
      'Some projects are eligible for re-running the init phase. Their discovery phase will also be retriggered.';

    const zeroSummary = {
      total: 0,
      finished: 0,
      waiting: 0,
      pending: 0,
      running: 0,
      error: 0,
      cancelled: 0,
    };

    const openGlobalDialog = (projects: Project[]) => {
      const props = defaultTableProps(projects, projects.length);
      render(
        <MemoryRouter>
          <TestApiProvider
            apis={[
              [fetchApiRef, { fetch: jest.fn() }],
              [discoveryApiRef, { getBaseUrl: jest.fn() }],
              ...backstageTableApis,
            ]}
          >
            <ProjectTable {...props} />
          </TestApiProvider>
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Run all' }));
    };

    it('shows init retrigger message and prompt when projects are eligible', async () => {
      const projects = createMockProjects(2);
      openGlobalDialog(projects);

      await waitFor(() => {
        expect(screen.getByText(INIT_RETRIGGER_MSG)).toBeInTheDocument();
      });
      expect(
        screen.getByTestId('global-run-all-user-prompt'),
      ).toBeInTheDocument();
      expect(screen.queryByText(NO_INIT_ELIGIBLE)).not.toBeInTheDocument();
    });

    it('shows no-eligible message and hides prompt when no projects are eligible', async () => {
      const projects: Project[] = [
        {
          ...createMockProjects(1)[0],
          status: {
            state: 'initialized',
            modulesSummary: { ...zeroSummary, total: 3 },
          },
        },
      ];
      openGlobalDialog(projects);

      await waitFor(() => {
        expect(screen.getByText(NO_INIT_ELIGIBLE)).toBeInTheDocument();
      });
      expect(screen.queryByText(INIT_RETRIGGER_MSG)).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('global-run-all-user-prompt'),
      ).not.toBeInTheDocument();
    });

    it('shows no-eligible message when all projects have running init jobs', async () => {
      const projects: Project[] = [
        {
          ...createMockProjects(1)[0],
          initJob: {
            id: 'job-1',
            projectId: 'project-0',
            startedAt: new Date(),
            phase: 'init',
            k8sJobName: 'k8s-init-1',
            status: 'running',
          },
        },
      ];
      openGlobalDialog(projects);

      await waitFor(() => {
        expect(screen.getByText(NO_INIT_ELIGIBLE)).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('global-run-all-user-prompt'),
      ).not.toBeInTheDocument();
    });

    it('shows init retrigger section when at least one project is eligible among many', async () => {
      const eligible = createMockProjects(1);
      const ineligible: Project[] = [
        {
          ...createMockProjects(1, 1)[0],
          status: {
            state: 'initialized',
            modulesSummary: { ...zeroSummary, total: 5 },
          },
        },
      ];
      openGlobalDialog([...eligible, ...ineligible]);

      await waitFor(() => {
        expect(screen.getByText(INIT_RETRIGGER_MSG)).toBeInTheDocument();
      });
      expect(
        screen.getByTestId('global-run-all-user-prompt'),
      ).toBeInTheDocument();
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
