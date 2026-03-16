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

const mockFetch = jest.fn();
const clientServiceMock = {
  projectsProjectIdModulesGet: mockFetch,
};
jest.mock('../../ClientService', () => ({
  useClientService: () => clientServiceMock,
}));

jest.mock('../ItemField', () => ({
  ItemField: ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div data-testid={`field-${label}`}>{value}</div>
  ),
}));

jest.mock('../ModuleTable', () => ({
  ModuleTable: ({ modules }: { modules: { name: string }[] }) => (
    <div data-testid="module-table">
      {modules.map(m => (
        <span key={m.name}>{m.name}</span>
      ))}
    </div>
  ),
}));

jest.mock('../Artifacts', () => ({
  ArtifactLink: () => null,
}));

jest.mock('@backstage/core-components', () => ({
  Progress: () => <div role="progressbar" />,
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div role="alert">{error.message}</div>
  ),
}));

import { render, screen, waitFor } from '@testing-library/react';
import {
  POLLING_INTERVAL_MS,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { DetailPanel, clearModulesCache } from './DetailPanel';

const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  abbreviation: 'TP',
  description: 'A test project',
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

describe('DetailPanel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockReset();
    clearModulesCache();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows loading indicator on initial fetch', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    render(<DetailPanel project={mockProject} forceRefresh={jest.fn()} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders modules after successful fetch', async () => {
    mockFetch.mockResolvedValue({
      json: async () => mockModules,
    });

    render(
      <DetailPanel
        project={{ ...mockProject, id: 'proj-render' }}
        forceRefresh={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('module-a')).toBeInTheDocument();
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('module-b')).toBeInTheDocument();
  });

  it('polls for data after POLLING_INTERVAL_MS', async () => {
    mockFetch.mockResolvedValue({
      json: async () => mockModules,
    });

    render(
      <DetailPanel
        project={{ ...mockProject, id: 'proj-poll' }}
        forceRefresh={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('module-a')).toBeInTheDocument();
    });

    const initialCallCount = mockFetch.mock.calls.length;

    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('does not show loading indicator during polling refresh', async () => {
    mockFetch.mockResolvedValue({
      json: async () => mockModules,
    });

    render(
      <DetailPanel
        project={{ ...mockProject, id: 'proj-noload' }}
        forceRefresh={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('module-a')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByText('module-a')).toBeInTheDocument();
  });

  it('uses cached data to avoid loading flash on re-mount', async () => {
    mockFetch.mockResolvedValue({
      json: async () => mockModules,
    });

    const projectForCache = { ...mockProject, id: 'proj-cache' };

    const { unmount } = render(
      <DetailPanel project={projectForCache} forceRefresh={jest.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText('module-a')).toBeInTheDocument();
    });

    unmount();

    render(<DetailPanel project={projectForCache} forceRefresh={jest.fn()} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('module-a')).toBeInTheDocument();
  });

  it('shows error panel when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(
      <DetailPanel
        project={{ ...mockProject, id: 'proj-err' }}
        forceRefresh={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('recovers from error on next successful poll', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Temporary'))
      .mockResolvedValue({ json: async () => mockModules });

    render(
      <DetailPanel
        project={{ ...mockProject, id: 'proj-recover' }}
        forceRefresh={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Temporary/)).toBeInTheDocument();
    });

    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByText('module-a')).toBeInTheDocument();
  });

  it('does not update state after unmount', async () => {
    let resolve: (v: any) => void;
    mockFetch.mockReturnValue(
      new Promise(r => {
        resolve = r;
      }),
    );

    const { unmount } = render(
      <DetailPanel
        project={{ ...mockProject, id: 'proj-abort' }}
        forceRefresh={jest.fn()}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    unmount();

    // Resolve after unmount – should not throw
    resolve!({ json: async () => mockModules });
  });
});
