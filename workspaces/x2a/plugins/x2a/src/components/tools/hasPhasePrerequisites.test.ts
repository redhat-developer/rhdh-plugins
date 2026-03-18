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
  ArtifactType,
  Job,
  Module,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { hasPhasePrerequisites } from './hasPhasePrerequisites';

const makeArtifact = (type: ArtifactType) => ({
  id: `art-${type}`,
  type,
  value: `${type}.json`,
});

const makeJob = (
  phase: Job['phase'],
  status: Job['status'],
  artifactTypes: ArtifactType[] = [],
): Job =>
  ({
    id: `job-${phase}`,
    projectId: 'p1',
    moduleId: 'm1',
    phase,
    status,
    k8sJobName: `k8s-${phase}`,
    startedAt: new Date(),
    artifacts: artifactTypes.map(makeArtifact),
  }) as Job;

const baseProject: Project = {
  id: 'p1',
  abbreviation: 'TST',
  name: 'Test Project',
  sourceRepoUrl: 'https://example.com/source',
  targetRepoUrl: 'https://example.com/target',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  createdAt: new Date('2024-01-01'),
  createdBy: 'user:default/tester',
  migrationPlan: makeArtifact('migration_plan'),
};

const baseModule: Module = {
  id: 'm1',
  name: 'mod',
  sourcePath: '/src',
  projectId: 'p1',
};

describe('hasPhasePrerequisites', () => {
  describe('analyze phase', () => {
    it('returns true when project has migration_plan', () => {
      expect(hasPhasePrerequisites(baseModule, 'analyze', baseProject)).toBe(
        true,
      );
    });

    it('returns false when project has no migrationPlan', () => {
      const project = { ...baseProject, migrationPlan: undefined };
      expect(hasPhasePrerequisites(baseModule, 'analyze', project)).toBe(false);
    });

    it('returns false when project migrationPlan has wrong type', () => {
      const project = {
        ...baseProject,
        migrationPlan: makeArtifact('migrated_sources'),
      };
      expect(hasPhasePrerequisites(baseModule, 'analyze', project)).toBe(false);
    });
  });

  describe('migrate phase', () => {
    it('returns true when analyze produced module_migration_plan and project has migration_plan', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success', ['module_migration_plan']),
      };
      expect(hasPhasePrerequisites(module, 'migrate', baseProject)).toBe(true);
    });

    it('returns false when analyze has no module_migration_plan artifact', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success', []),
      };
      expect(hasPhasePrerequisites(module, 'migrate', baseProject)).toBe(false);
    });

    it('returns false when project has no migration_plan (even if analyze has artifacts)', () => {
      const project = { ...baseProject, migrationPlan: undefined };
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success', ['module_migration_plan']),
      };
      expect(hasPhasePrerequisites(module, 'migrate', project)).toBe(false);
    });

    it('returns false when analyze phase is missing entirely', () => {
      expect(hasPhasePrerequisites(baseModule, 'migrate', baseProject)).toBe(
        false,
      );
    });
  });

  describe('publish phase', () => {
    it('returns true when all prerequisite artifacts exist', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success', ['module_migration_plan']),
        migrate: makeJob('migrate', 'success', ['migrated_sources']),
      };
      expect(hasPhasePrerequisites(module, 'publish', baseProject)).toBe(true);
    });

    it('returns false when migrate has no migrated_sources', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success', ['module_migration_plan']),
        migrate: makeJob('migrate', 'success', []),
      };
      expect(hasPhasePrerequisites(module, 'publish', baseProject)).toBe(false);
    });

    it('returns false when analyze artifact is missing (even if migrate has artifact)', () => {
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success', []),
        migrate: makeJob('migrate', 'success', ['migrated_sources']),
      };
      expect(hasPhasePrerequisites(module, 'publish', baseProject)).toBe(false);
    });

    it('returns false when project migration_plan is missing', () => {
      const project = { ...baseProject, migrationPlan: undefined };
      const module: Module = {
        ...baseModule,
        analyze: makeJob('analyze', 'success', ['module_migration_plan']),
        migrate: makeJob('migrate', 'success', ['migrated_sources']),
      };
      expect(hasPhasePrerequisites(module, 'publish', project)).toBe(false);
    });

    it('returns false when no phases have run', () => {
      expect(hasPhasePrerequisites(baseModule, 'publish', baseProject)).toBe(
        false,
      );
    });
  });
});
