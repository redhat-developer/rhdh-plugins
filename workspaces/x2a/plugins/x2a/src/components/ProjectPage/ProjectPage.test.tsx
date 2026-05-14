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

const mockProjectGet = jest.fn();
const mockModulesGet = jest.fn();
const clientServiceMock = {
  projectsProjectIdGet: mockProjectGet,
  projectsProjectIdModulesGet: mockModulesGet,
  projectsProjectIdDelete: jest.fn(),
};
jest.mock('../../ClientService', () => ({
  useClientService: () => clientServiceMock,
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: () => () => '/x2a',
  useRouteRefParams: () => ({ projectId: 'proj-1' }),
}));

const mockNavigate = jest.fn();
let mockLocation = {
  pathname: '/projects/proj-1',
  search: '',
  hash: '',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

const mockRetriggerInit = jest.fn().mockResolvedValue('job-1');
jest.mock('../../hooks/useBulkRun', () => ({
  useBulkRun: () => ({
    runAllForProject: jest.fn(),
    retriggerInit: (...args: unknown[]) => mockRetriggerInit(...args),
  }),
}));

jest.mock('../../hooks/useProjectWriteAccess', () => ({
  useProjectWriteAccess: () => ({
    loading: false,
    hasAnyWriteAccess: true,
    canWriteProject: () => true,
  }),
}));

jest.mock('./ProjectPageBreadcrumb', () => ({
  ProjectPageBreadcrumb: () => <div data-testid="breadcrumb" />,
}));

jest.mock('./ProjectDetailsCard', () => ({
  ProjectDetailsCard: ({ project }: { project: { name: string } }) => (
    <div data-testid="project-details">{project.name}</div>
  ),
}));

jest.mock('./ProjectModulesCard', () => ({
  ProjectModulesCard: ({ modules }: { modules: { name: string }[] }) => (
    <div data-testid="project-modules">{modules.length} modules</div>
  ),
}));

jest.mock('./InitPhaseCard', () => ({
  InitPhaseCard: () => <div data-testid="init-phase" />,
}));

jest.mock('../DeleteProjectDialog', () => ({
  DeleteProjectDialog: () => null,
}));

jest.mock('../BulkRunConfirmDialog', () => ({
  BulkRunConfirmDialog: (props: {
    open: boolean;
    idPostfix: string;
    onConfirm: () => void;
  }) =>
    props.open ? (
      <div data-testid={`confirm-dialog-${props.idPostfix}`}>
        <button
          data-testid={`confirm-btn-${props.idPostfix}`}
          onClick={props.onConfirm}
        >
          Confirm
        </button>
      </div>
    ) : null,
}));

jest.mock('../RetriggerInitConfirmDialog', () => ({
  RetriggerInitConfirmDialog: (props: {
    open: boolean;
    copyVariant?: string;
    onConfirm: (userPrompt: string) => void;
  }) =>
    props.open ? (
      <div
        data-testid="confirm-dialog-retrigger-init-page"
        data-copy-variant={props.copyVariant ?? 'retrigger'}
      >
        <button
          data-testid="confirm-btn-retrigger-init-page"
          onClick={() => props.onConfirm('test prompt')}
        >
          Confirm
        </button>
      </div>
    ) : null,
}));

const mockCanRunNextPhase = jest.fn();
jest.mock('../tools', () => ({
  ...jest.requireActual('../tools'),
  canRunNextPhase: (...args: unknown[]) => mockCanRunNextPhase(...args),
}));

jest.mock('./ProjectActions', () => ({
  ProjectActions: (props: {
    canRunAll: boolean;
    canRetriggerInit: boolean;
    handleRetriggerInitClick: () => void;
  }) => (
    <div
      data-testid="project-actions"
      data-can-run-all={String(props.canRunAll)}
      data-can-retrigger-init={String(props.canRetriggerInit)}
    >
      <button
        data-testid="retrigger-init-btn"
        onClick={props.handleRetriggerInitClick}
      >
        Retrigger init
      </button>
    </div>
  ),
}));

jest.mock('@backstage/core-components', () => ({
  Content: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Header: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Progress: () => <div role="progressbar" />,
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div role="alert">{error.message}</div>
  ),
}));

import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
import {
  POLLING_INTERVAL_MS,
  RUN_INIT_DEEP_LINK_HASH,
  RUN_NEXT_DEEP_LINK_HASH,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { ProjectPage } from './ProjectPage';

const mockProject = {
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test',
  sourceRepoUrl: 'https://github.com/org/source',
  targetRepoUrl: 'https://github.com/org/target',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  ownedBy: 'user:default/test',
};

const mockModules = [
  { name: 'module-a', id: 'mod-a' },
  { name: 'module-b', id: 'mod-b' },
];

function mockOkJsonResponse<T>(body: T) {
  return {
    ok: true as const,
    status: 200,
    json: async () => body,
  };
}

describe('ProjectPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockProjectGet.mockReset();
    mockModulesGet.mockReset();
    mockCanRunNextPhase.mockReset();
    mockRetriggerInit.mockReset().mockResolvedValue('job-1');
    mockNavigate.mockReset();
    mockLocation = { pathname: '/projects/proj-1', search: '', hash: '' };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows loading indicator while fetching', () => {
    mockProjectGet.mockReturnValue(new Promise(() => {}));
    mockModulesGet.mockReturnValue(new Promise(() => {}));

    render(<ProjectPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders project data after successful fetch', async () => {
    mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
    mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

    render(<ProjectPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('2 modules')).toBeInTheDocument();
  });

  it('shows error panel when fetch fails', async () => {
    mockProjectGet.mockRejectedValue(new Error('API failure'));
    mockModulesGet.mockResolvedValue(mockOkJsonResponse([]));

    render(<ProjectPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/API failure/)).toBeInTheDocument();
  });

  it('shows error panel when project API returns 404', async () => {
    mockProjectGet.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Project not found' } }),
    });
    mockModulesGet.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Modules not found' } }),
    });

    render(<ProjectPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Project not found/)).toBeInTheDocument();
  });

  it('polls for data after POLLING_INTERVAL_MS', async () => {
    mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
    mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

    render(<ProjectPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    const initialProjectCalls = mockProjectGet.mock.calls.length;
    const initialModulesCalls = mockModulesGet.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    });

    await waitFor(() => {
      expect(mockProjectGet.mock.calls.length).toBeGreaterThan(
        initialProjectCalls,
      );
      expect(mockModulesGet.mock.calls.length).toBeGreaterThan(
        initialModulesCalls,
      );
    });
  });

  it('does not show loading indicator during polling refresh', async () => {
    mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
    mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

    render(<ProjectPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    });

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('fetches project and modules in parallel', async () => {
    let projectResolve: (v: any) => void;
    let modulesResolve: (v: any) => void;

    mockProjectGet.mockReturnValue(
      new Promise(r => {
        projectResolve = r;
      }),
    );
    mockModulesGet.mockReturnValue(
      new Promise(r => {
        modulesResolve = r;
      }),
    );

    render(<ProjectPage />);

    expect(mockProjectGet).toHaveBeenCalledTimes(1);
    expect(mockModulesGet).toHaveBeenCalledTimes(1);

    projectResolve!(mockOkJsonResponse(mockProject));
    modulesResolve!(mockOkJsonResponse(mockModules));

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('recovers from error on next successful poll', async () => {
    mockProjectGet.mockRejectedValueOnce(new Error('Temporary failure'));
    mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

    render(<ProjectPage />);

    await waitFor(() => {
      expect(screen.getByText(/Temporary failure/)).toBeInTheDocument();
    });

    mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));

    // After first error, backoff = POLLING_INTERVAL_MS * 2
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS * 2);
    });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('does not update state after unmount', async () => {
    let projectResolve: (v: any) => void;
    mockProjectGet.mockReturnValue(
      new Promise(r => {
        projectResolve = r;
      }),
    );
    mockModulesGet.mockReturnValue(new Promise(() => {}));

    const { unmount } = render(<ProjectPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    unmount();

    projectResolve!(mockOkJsonResponse(mockProject));
  });

  describe('canRunAll prop', () => {
    it('is false when modules list is empty', async () => {
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse([]));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-actions')).toBeInTheDocument();
      });

      expect(screen.getByTestId('project-actions')).toHaveAttribute(
        'data-can-run-all',
        'false',
      );
      expect(mockCanRunNextPhase).not.toHaveBeenCalled();
    });

    it('is false when no module is eligible for next phase', async () => {
      mockCanRunNextPhase.mockReturnValue(false);
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-actions')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockCanRunNextPhase).toHaveBeenCalled();
      });

      expect(screen.getByTestId('project-actions')).toHaveAttribute(
        'data-can-run-all',
        'false',
      );
    });

    it('is true when at least one module is eligible for next phase', async () => {
      mockCanRunNextPhase.mockImplementation(
        (m: { id: string }) => m.id === 'mod-a',
      );
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-actions')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockCanRunNextPhase).toHaveBeenCalled();
      });

      expect(screen.getByTestId('project-actions')).toHaveAttribute(
        'data-can-run-all',
        'true',
      );
    });
  });

  describe('canRetriggerInit prop', () => {
    it('is true when project has no modules and no running init', async () => {
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse([]));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-actions')).toBeInTheDocument();
      });

      expect(screen.getByTestId('project-actions')).toHaveAttribute(
        'data-can-retrigger-init',
        'true',
      );
    });

    it('is false when project has modules', async () => {
      const projectWithModules = {
        ...mockProject,
        status: {
          state: 'inProgress',
          modulesSummary: {
            total: 2,
            finished: 0,
            waiting: 1,
            pending: 1,
            running: 0,
            error: 0,
            cancelled: 0,
          },
        },
      };
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(projectWithModules));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-actions')).toBeInTheDocument();
      });

      expect(screen.getByTestId('project-actions')).toHaveAttribute(
        'data-can-retrigger-init',
        'false',
      );
    });

    it('is false when init job is running', async () => {
      const projectWithRunningInit = {
        ...mockProject,
        initJob: { id: 'j1', status: 'running' },
      };
      mockProjectGet.mockResolvedValue(
        mockOkJsonResponse(projectWithRunningInit),
      );
      mockModulesGet.mockResolvedValue(mockOkJsonResponse([]));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-actions')).toBeInTheDocument();
      });

      expect(screen.getByTestId('project-actions')).toHaveAttribute(
        'data-can-retrigger-init',
        'false',
      );
    });
  });

  describe('retrigger init action', () => {
    it('opens confirmation dialog and calls retriggerInit on confirm', async () => {
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse([]));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('retrigger-init-btn')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('retrigger-init-btn'));
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('confirm-dialog-retrigger-init-page'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('confirm-dialog-retrigger-init-page'),
      ).toHaveAttribute('data-copy-variant', 'retrigger');

      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-btn-retrigger-init-page'));
      });

      expect(mockRetriggerInit).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'proj-1' }),
        'test prompt',
      );
    });

    it('shows error when retriggerInit fails', async () => {
      mockRetriggerInit.mockRejectedValue(new Error('init failed'));
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse([]));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('retrigger-init-btn')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('retrigger-init-btn'));
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('confirm-btn-retrigger-init-page'),
        ).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-btn-retrigger-init-page'));
      });

      await waitFor(() => {
        expect(screen.getByText(/init failed/)).toBeInTheDocument();
      });
    });
  });

  describe('#runinit deep link', () => {
    it('opens retrigger init dialog when hash is #runinit and project is eligible', async () => {
      mockLocation = {
        pathname: '/projects/proj-1',
        search: '',
        hash: RUN_INIT_DEEP_LINK_HASH,
      };
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse([]));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(
          screen.getByTestId('confirm-dialog-retrigger-init-page'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('confirm-dialog-retrigger-init-page'),
      ).toHaveAttribute('data-copy-variant', 'firstTrigger');

      expect(mockNavigate).toHaveBeenCalledWith(
        {
          pathname: '/projects/proj-1',
          search: '',
          hash: '',
        },
        { replace: true },
      );
    });

    it('does not open dialog when hash is #runinit but project is not eligible', async () => {
      mockLocation = {
        pathname: '/projects/proj-1',
        search: '',
        hash: RUN_INIT_DEEP_LINK_HASH,
      };
      const projectWithModules = {
        ...mockProject,
        status: {
          state: 'inProgress',
          modulesSummary: {
            total: 2,
            finished: 0,
            waiting: 1,
            pending: 1,
            running: 0,
            error: 0,
            cancelled: 0,
          },
        },
      };
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(projectWithModules));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-actions')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('confirm-dialog-retrigger-init-page'),
      ).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith(
        {
          pathname: '/projects/proj-1',
          search: '',
          hash: '',
        },
        { replace: true },
      );
    });
  });

  describe('#runnext deep link', () => {
    it('opens bulk run dialog when hash is #runnext and at least one module is eligible', async () => {
      mockLocation = {
        pathname: '/projects/proj-1',
        search: '',
        hash: RUN_NEXT_DEEP_LINK_HASH,
      };
      mockCanRunNextPhase.mockImplementation(
        (m: { id: string }) => m.id === 'mod-a',
      );
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(
          screen.getByTestId('confirm-dialog-project-page'),
        ).toBeInTheDocument();
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        {
          pathname: '/projects/proj-1',
          search: '',
          hash: '',
        },
        { replace: true },
      );
    });

    it('does not open bulk run dialog when hash is #runnext but no module is eligible', async () => {
      mockLocation = {
        pathname: '/projects/proj-1',
        search: '',
        hash: RUN_NEXT_DEEP_LINK_HASH,
      };
      mockCanRunNextPhase.mockReturnValue(false);
      mockProjectGet.mockResolvedValue(mockOkJsonResponse(mockProject));
      mockModulesGet.mockResolvedValue(mockOkJsonResponse(mockModules));

      render(<ProjectPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-actions')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('confirm-dialog-project-page'),
      ).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith(
        {
          pathname: '/projects/proj-1',
          search: '',
          hash: '',
        },
        { replace: true },
      );
    });
  });
});
