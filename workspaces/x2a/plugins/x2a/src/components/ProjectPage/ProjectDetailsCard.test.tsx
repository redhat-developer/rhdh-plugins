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

import { screen } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { ProjectDetailsCard } from './ProjectDetailsCard';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));
jest.mock('../../hooks/useScmHostMap', () => ({
  useScmHostMap: () => new Map(),
}));
jest.mock('../../hooks/useProjectWriteAccess', () => ({
  useProjectWriteAccess: () => ({
    loading: false,
    hasAnyWriteAccess: true,
    canWriteProject: () => true,
  }),
}));
jest.mock('./EditProjectDialog', () => ({ EditProjectDialog: () => null }));
jest.mock('../EditMigrationPlan/EditMigrationPlanButton', () => ({
  EditMigrationPlanButton: ({
    artifact,
    moduleId,
  }: {
    artifact?: { value: string };
    moduleId?: string;
  }) => (
    <div
      data-testid="edit-plan"
      data-artifact={artifact?.value}
      data-module-id={moduleId ?? ''}
    />
  ),
}));

const project = {
  id: 'proj-1',
  name: 'Project',
  description: 'desc',
  dirName: 'project-proj-1',
  sourceRepoUrl: 'https://github.com/org/source',
  sourceRepoBranch: 'main',
  targetRepoUrl: 'https://github.com/org/target',
  targetRepoBranch: 'main',
  ownedBy: 'user:default/mock',
  createdAt: new Date('2024-01-01T00:00:00Z'),
} as Project;

describe('ProjectDetailsCard', () => {
  it('offers editing of the project migration plan next to its link', async () => {
    const migrationPlan = {
      id: 'a1',
      type: 'migration_plan' as const,
      value: 'project-proj-1/migration-plan.md',
    };

    await renderInTestApp(
      <ProjectDetailsCard
        project={{ ...project, migrationPlan }}
        onUpdated={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('link', { name: /Project Migration Plan/ }),
    ).toBeInTheDocument();
    const edit = screen.getByTestId('edit-plan');
    expect(edit).toHaveAttribute('data-artifact', migrationPlan.value);
    expect(edit).toHaveAttribute('data-module-id', '');
  });

  it('offers nothing while there is no migration plan', async () => {
    await renderInTestApp(
      <ProjectDetailsCard project={project} onUpdated={jest.fn()} />,
    );

    expect(screen.queryByTestId('edit-plan')).not.toBeInTheDocument();
  });
});
