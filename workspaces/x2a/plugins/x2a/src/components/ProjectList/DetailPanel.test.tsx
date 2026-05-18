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

jest.mock('../../hooks/useProjectWriteAccess', () => ({
  useProjectWriteAccess: () => ({
    loading: false,
    hasAnyWriteAccess: true,
    canWriteProject: () => true,
  }),
}));

jest.mock('../../hooks/useBulkRun', () => ({
  useBulkRun: () => ({
    runAllForProject: jest.fn(),
    runAllGlobal: jest.fn(),
  }),
}));

import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { MemoryRouter } from 'react-router-dom';
import { TestApiProvider, mockApis, MockErrorApi } from '@backstage/test-utils';

import {
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';
// eslint-disable-next-line @backstage/no-undeclared-imports
import { featureFlagsApiRef } from '@backstage/frontend-plugin-api';
import {
  Project,
  Module,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { DetailPanel } from './DetailPanel';

const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  description: 'A test project',
  dirName: 'test-project-proj-1',
  sourceRepoUrl: 'https://github.com/org/source',
  targetRepoUrl: 'https://github.com/org/target',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  ownedBy: 'user:default/test',
};

const mockModules: Module[] = [
  {
    id: 'mod-a',
    name: 'module-a',
    sourcePath: '/src/module-a',
    projectId: 'proj-1',
    status: 'pending',
  },
  {
    id: 'mod-b',
    name: 'module-b',
    sourcePath: '/src/module-b',
    projectId: 'proj-1',
    status: 'pending',
  },
];

const theme = createTheme({
  palette: {
    status: {
      ok: '#71CF88',
      warning: '#FFB84D',
      error: '#F84C55',
      running: '#3E8635',
      pending: '#6A6E73',
      aborted: '#8F4700',
    },
  },
} as any);

const testApis: [any, any][] = [
  [configApiRef, mockApis.config({})],
  [errorApiRef, new MockErrorApi()],
  [translationApiRef, mockApis.translation()],
  [
    discoveryApiRef,
    { getBaseUrl: jest.fn().mockResolvedValue('http://localhost') },
  ],
  [fetchApiRef, { fetch: jest.fn() }],
  [
    featureFlagsApiRef,
    {
      registerFlag: jest.fn(),
      getRegisteredFlags: jest.fn().mockReturnValue([]),
      isActive: jest.fn().mockReturnValue(false),
      save: jest.fn(),
    },
  ],
];

function renderDetailPanel(
  props: Partial<React.ComponentProps<typeof DetailPanel>> = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <TestApiProvider apis={testApis}>
          <DetailPanel
            project={mockProject}
            forceRefresh={jest.fn()}
            {...props}
          />
        </TestApiProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('DetailPanel', () => {
  it('shows loading indicator when modulesLoading is true and no modules', async () => {
    renderDetailPanel({ modulesLoading: true });

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('renders modules when provided', () => {
    renderDetailPanel({ modules: mockModules });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('module-a')).toBeInTheDocument();
    expect(screen.getByText('module-b')).toBeInTheDocument();
  });

  it('shows error panel when modulesError is provided', () => {
    renderDetailPanel({ modulesError: new Error('Network error') });

    expect(screen.getAllByText(/Network error/).length).toBeGreaterThan(0);
  });

  it('shows "no modules" when modules is an empty array', () => {
    renderDetailPanel({ modules: [] });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('No modules found yet...')).toBeInTheDocument();
  });

  it('renders project fields', () => {
    renderDetailPanel({ modules: mockModules });

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('A test project')).toBeInTheDocument();
    expect(screen.getByText('Directory Name')).toBeInTheDocument();
    expect(screen.getByText('test-project-proj-1')).toBeInTheDocument();
  });
});
