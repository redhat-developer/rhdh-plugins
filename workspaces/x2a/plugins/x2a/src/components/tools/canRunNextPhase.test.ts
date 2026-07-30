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

import {
  Artifact,
  Module,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { canRunNextPhase } from './canRunNextPhase';

const migrationPlanArtifact: Artifact = {
  id: 'artifact-1',
  type: 'migration_plan',
  value: 'https://repo.example.com/plan.md',
};

const baseProject: Project = {
  id: '123',
  name: 'Test Project',
  sourceRepoUrl: 'https://example.com/source',
  targetRepoUrl: 'https://example.com/target',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  createdAt: new Date('2024-01-01'),
  ownedBy: 'user:default/tester',
  migrationPlan: migrationPlanArtifact,
};

const baseModule: Module = {
  id: 'mod-1',
  name: 'test-module',
  sourcePath: '/cookbooks/test',
  projectId: '123',
};

describe('canRunNextPhase', () => {
  it('returns false when module has removedAt set', () => {
    const removed: Module = {
      ...baseModule,
      removedAt: new Date('2026-01-15T00:00:00Z'),
    };
    expect(canRunNextPhase(removed, baseProject)).toBe(false);
  });

  it('returns false when module has removedAt set even with a valid next phase', () => {
    const removed: Module = {
      ...baseModule,
      removedAt: new Date('2026-01-15T00:00:00Z'),
      analyze: {
        id: 'job-analyze',
        status: 'success',
        phase: 'analyze',
        projectId: '123',
        moduleId: 'mod-1',
        startedAt: new Date(),
        k8sJobName: 'k8s-analyze-1',
      },
    };
    expect(canRunNextPhase(removed, baseProject)).toBe(false);
  });

  it('returns true for an active module that can proceed to the next phase', () => {
    expect(canRunNextPhase(baseModule, baseProject)).toBe(true);
  });
});
