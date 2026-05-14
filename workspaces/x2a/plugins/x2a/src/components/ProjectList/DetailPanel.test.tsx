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

import { render, screen } from '@testing-library/react';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { DetailPanel } from './DetailPanel';

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
  ownedBy: 'user:default/test',
};

const mockModules = [
  { name: 'module-a', id: 'mod-a' },
  { name: 'module-b', id: 'mod-b' },
];

describe('DetailPanel', () => {
  it('shows loading indicator when modulesLoading is true and no modules', () => {
    render(
      <DetailPanel
        project={mockProject}
        forceRefresh={jest.fn()}
        modulesLoading
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders modules when provided', () => {
    render(
      <DetailPanel
        project={mockProject}
        forceRefresh={jest.fn()}
        modules={mockModules as any}
      />,
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('module-a')).toBeInTheDocument();
    expect(screen.getByText('module-b')).toBeInTheDocument();
  });

  it('shows error panel when modulesError is provided', () => {
    render(
      <DetailPanel
        project={mockProject}
        forceRefresh={jest.fn()}
        modulesError={new Error('Network error')}
      />,
    );

    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('shows "no modules" when modules is an empty array', () => {
    render(
      <DetailPanel
        project={mockProject}
        forceRefresh={jest.fn()}
        modules={[]}
      />,
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('No modules found yet...')).toBeInTheDocument();
  });

  it('renders project fields', () => {
    render(
      <DetailPanel
        project={mockProject}
        forceRefresh={jest.fn()}
        modules={mockModules as any}
      />,
    );

    expect(screen.getByTestId('field-Abbreviation')).toBeInTheDocument();
    expect(screen.getByTestId('field-Description')).toBeInTheDocument();
  });
});
