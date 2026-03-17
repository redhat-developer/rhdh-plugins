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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../hooks/useBulkRun', () => ({
  useBulkRun: () => ({
    runAllForProject: jest.fn(),
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
  BulkRunConfirmDialog: () => null,
}));

jest.mock('./ProjectActions', () => ({
  ProjectActions: () => null,
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

import { render, screen, waitFor, act } from '@testing-library/react';
import { POLLING_INTERVAL_MS } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { ProjectPage } from './ProjectPage';

const mockProject = {
  id: 'proj-1',
  name: 'Test Project',
  abbreviation: 'TP',
  description: 'Test',
  sourceRepoUrl: 'https://github.com/org/source',
  targetRepoUrl: 'https://github.com/org/target',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'user:default/test',
};

const mockModules = [
  { name: 'module-a', id: 'mod-a' },
  { name: 'module-b', id: 'mod-b' },
];

describe('ProjectPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockProjectGet.mockReset();
    mockModulesGet.mockReset();
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
    mockProjectGet.mockResolvedValue({ json: async () => mockProject });
    mockModulesGet.mockResolvedValue({ json: async () => mockModules });

    render(<ProjectPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('2 modules')).toBeInTheDocument();
  });

  it('shows error panel when fetch fails', async () => {
    mockProjectGet.mockRejectedValue(new Error('API failure'));
    mockModulesGet.mockResolvedValue({ json: async () => [] });

    render(<ProjectPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/API failure/)).toBeInTheDocument();
  });

  it('polls for data after POLLING_INTERVAL_MS', async () => {
    mockProjectGet.mockResolvedValue({ json: async () => mockProject });
    mockModulesGet.mockResolvedValue({ json: async () => mockModules });

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
    mockProjectGet.mockResolvedValue({ json: async () => mockProject });
    mockModulesGet.mockResolvedValue({ json: async () => mockModules });

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

    projectResolve!({ json: async () => mockProject });
    modulesResolve!({ json: async () => mockModules });

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('recovers from error on next successful poll', async () => {
    mockProjectGet.mockRejectedValueOnce(new Error('Temporary failure'));
    mockModulesGet.mockResolvedValue({ json: async () => mockModules });

    render(<ProjectPage />);

    await waitFor(() => {
      expect(screen.getByText(/Temporary failure/)).toBeInTheDocument();
    });

    mockProjectGet.mockResolvedValue({ json: async () => mockProject });

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

    projectResolve!({ json: async () => mockProject });
  });
});
