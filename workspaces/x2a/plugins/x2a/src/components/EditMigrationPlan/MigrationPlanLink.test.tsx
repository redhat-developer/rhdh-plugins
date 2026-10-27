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
import { MigrationPlanLink } from './MigrationPlanLink';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: () => () => '/x2a/edit',
}));

jest.mock('../../hooks/useProjectWriteAccess', () => ({
  useProjectWriteAccess: () => ({
    loading: false,
    hasAnyWriteAccess: true,
    canWriteProject: () => true,
  }),
}));

jest.mock('../../hooks/useScmHostMap', () => ({
  useScmHostMap: () => new Map(),
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

describe('MigrationPlanLink', () => {
  it('keeps the link and the pencil in one non-wrapping row', async () => {
    await renderInTestApp(
      <MigrationPlanLink
        artifact={artifact}
        targetRepoUrl={project.targetRepoUrl}
        targetRepoBranch={project.targetRepoBranch}
        project={project}
      />,
    );

    const link = screen.getByRole('link');
    const pencil = screen.getByRole('button', {
      name: 'Edit this document',
    });
    const row = link.parentElement!;
    expect(row).toContainElement(pencil);
    expect(window.getComputedStyle(row).flexWrap).toBe('nowrap');
  });

  it('renders only the link when the project is not known', async () => {
    await renderInTestApp(
      <MigrationPlanLink
        artifact={artifact}
        targetRepoUrl={project.targetRepoUrl}
        targetRepoBranch={project.targetRepoBranch}
      />,
    );

    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
