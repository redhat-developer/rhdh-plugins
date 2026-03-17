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
const mockModuleGet = jest.fn();
const clientServiceMock = {
  projectsProjectIdGet: mockProjectGet,
  projectsProjectIdModulesModuleIdGet: mockModuleGet,
  projectsProjectIdModulesModuleIdRunPost: jest.fn(),
  projectsProjectIdModulesModuleIdCancelPost: jest.fn(),
};
jest.mock('../../ClientService', () => ({
  useClientService: () => clientServiceMock,
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRefParams: () => ({ projectId: 'proj-1', moduleId: 'mod-1' }),
}));

jest.mock('../../hooks/useScmHostMap', () => ({
  useScmHostMap: () => ({}),
}));

jest.mock('../../repoAuth', () => ({
  useRepoAuthentication: () => ({
    authenticate: jest.fn().mockResolvedValue([{ token: 'mock-token' }]),
  }),
}));

jest.mock('./ModulePageBreadcrumb', () => ({
  ModulePageBreadcrumb: () => <div data-testid="breadcrumb" />,
}));

jest.mock('./ArtifactsCard', () => ({
  ArtifactsCard: () => <div data-testid="artifacts-card" />,
}));

jest.mock('./ModuleDetailsCard', () => ({
  ModuleDetailsCard: ({ module }: { module?: { name: string } }) => (
    <div data-testid="module-details">{module?.name}</div>
  ),
}));

jest.mock('./PhasesCard', () => ({
  PhasesCard: ({
    project,
    module,
  }: {
    project?: { name: string };
    module?: { name: string };
  }) => (
    <div data-testid="phases-card">
      {project?.name} / {module?.name}
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

import { render, screen, waitFor, act } from '@testing-library/react';
import { POLLING_INTERVAL_MS } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { ModulePage } from './ModulePage';

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

const mockModule = {
  id: 'mod-1',
  name: 'module-a',
  projectId: 'proj-1',
};

describe('ModulePage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockProjectGet.mockReset();
    mockModuleGet.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows loading indicator while fetching', () => {
    mockProjectGet.mockReturnValue(new Promise(() => {}));
    mockModuleGet.mockReturnValue(new Promise(() => {}));

    render(<ModulePage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders module data after successful fetch', async () => {
    mockProjectGet.mockResolvedValue({ json: async () => mockProject });
    mockModuleGet.mockResolvedValue({ json: async () => mockModule });

    render(<ModulePage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('module-a')).toBeInTheDocument();
    expect(screen.getByText('Test Project / module-a')).toBeInTheDocument();
  });

  it('shows error panel when fetch fails', async () => {
    mockProjectGet.mockRejectedValue(new Error('API failure'));
    mockModuleGet.mockResolvedValue({ json: async () => mockModule });

    render(<ModulePage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/API failure/)).toBeInTheDocument();
  });

  it('polls for data after POLLING_INTERVAL_MS', async () => {
    mockProjectGet.mockResolvedValue({ json: async () => mockProject });
    mockModuleGet.mockResolvedValue({ json: async () => mockModule });

    render(<ModulePage />);

    await waitFor(() => {
      expect(screen.getByText('module-a')).toBeInTheDocument();
    });

    const initialProjectCalls = mockProjectGet.mock.calls.length;
    const initialModuleCalls = mockModuleGet.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    });

    await waitFor(() => {
      expect(mockProjectGet.mock.calls.length).toBeGreaterThan(
        initialProjectCalls,
      );
      expect(mockModuleGet.mock.calls.length).toBeGreaterThan(
        initialModuleCalls,
      );
    });
  });

  it('does not show loading indicator during polling refresh', async () => {
    mockProjectGet.mockResolvedValue({ json: async () => mockProject });
    mockModuleGet.mockResolvedValue({ json: async () => mockModule });

    render(<ModulePage />);

    await waitFor(() => {
      expect(screen.getByText('module-a')).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    });

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByText('module-a')).toBeInTheDocument();
  });

  it('fetches project and module in parallel', async () => {
    let projectResolve: (v: any) => void;
    let moduleResolve: (v: any) => void;

    mockProjectGet.mockReturnValue(
      new Promise(r => {
        projectResolve = r;
      }),
    );
    mockModuleGet.mockReturnValue(
      new Promise(r => {
        moduleResolve = r;
      }),
    );

    render(<ModulePage />);

    expect(mockProjectGet).toHaveBeenCalledTimes(1);
    expect(mockModuleGet).toHaveBeenCalledTimes(1);

    projectResolve!({ json: async () => mockProject });
    moduleResolve!({ json: async () => mockModule });

    await waitFor(() => {
      expect(screen.getByText('module-a')).toBeInTheDocument();
    });
  });

  it('recovers from error on next successful poll', async () => {
    mockProjectGet.mockRejectedValueOnce(new Error('Temporary failure'));
    mockModuleGet.mockResolvedValue({ json: async () => mockModule });

    render(<ModulePage />);

    await waitFor(() => {
      expect(screen.getByText(/Temporary failure/)).toBeInTheDocument();
    });

    mockProjectGet.mockResolvedValue({ json: async () => mockProject });

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByText('module-a')).toBeInTheDocument();
  });

  it('does not update state after unmount', async () => {
    let projectResolve: (v: any) => void;
    mockProjectGet.mockReturnValue(
      new Promise(r => {
        projectResolve = r;
      }),
    );
    mockModuleGet.mockReturnValue(new Promise(() => {}));

    const { unmount } = render(<ModulePage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    unmount();

    // Resolve after unmount – should not throw
    projectResolve!({ json: async () => mockProject });
  });
});
