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

import { fireEvent, screen } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { EditMigrationPlanButton } from './EditMigrationPlanButton';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: (ref: { id: string }) =>
    ref.id === 'x2a.module.plan.edit'
      ? (p: { projectId: string; moduleId: string }) =>
          `/x2a/projects/${p.projectId}/modules/${p.moduleId}/plan/edit`
      : (p: { projectId: string }) => `/x2a/projects/${p.projectId}/plan/edit`,
}));

let mockCanWrite = true;
jest.mock('../../hooks/useProjectWriteAccess', () => ({
  useProjectWriteAccess: () => ({
    loading: false,
    hasAnyWriteAccess: mockCanWrite,
    canWriteProject: () => mockCanWrite,
  }),
}));

let mockHostMap = new Map();
jest.mock('../../hooks/useScmHostMap', () => ({
  useScmHostMap: () => mockHostMap,
}));

const project = {
  id: 'proj-1',
  name: 'Project',
  targetRepoUrl: 'https://github.com/org/repo.git',
  targetRepoBranch: 'main',
  ownedBy: 'user:default/mock',
} as Project;

const artifact = {
  id: 'a1',
  type: 'migration_plan',
  value: 'p/plan.md',
} as any;

describe('EditMigrationPlanButton', () => {
  beforeEach(() => {
    mockCanWrite = true;
    mockHostMap = new Map();
    mockNavigate.mockReset();
  });

  it('opens the project plan editor', async () => {
    await renderInTestApp(
      <EditMigrationPlanButton project={project} artifact={artifact} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit this document' }));

    expect(mockNavigate).toHaveBeenCalledWith('/x2a/projects/proj-1/plan/edit');
  });

  it('opens the module plan editor', async () => {
    await renderInTestApp(
      <EditMigrationPlanButton
        project={project}
        artifact={artifact}
        moduleId="mod-1"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit this document' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/x2a/projects/proj-1/modules/mod-1/plan/edit',
    );
  });

  it('renders nothing when the user may not write the project', async () => {
    mockCanWrite = false;
    await renderInTestApp(
      <EditMigrationPlanButton project={project} artifact={artifact} />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing without an artifact', async () => {
    await renderInTestApp(<EditMigrationPlanButton project={project} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each([
    ['bitbucket.org', 'https://bitbucket.org/ws/repo.git'],
    ['a configured Bitbucket host', 'https://bb.corp.example/ws/repo.git'],
  ])('is disabled with an explanation for %s', async (_name, targetRepoUrl) => {
    mockHostMap = new Map([['bb.corp.example', 'bitbucket']]);
    await renderInTestApp(
      <EditMigrationPlanButton
        project={{ ...project, targetRepoUrl }}
        artifact={artifact}
      />,
    );

    const button = screen.getByRole('button', {
      name: /isn't available for Bitbucket repositories yet/,
    });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('is enabled for GitLab', async () => {
    await renderInTestApp(
      <EditMigrationPlanButton
        project={{ ...project, targetRepoUrl: 'https://gitlab.com/g/r.git' }}
        artifact={artifact}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Edit this document' }),
    ).toBeEnabled();
  });
});
