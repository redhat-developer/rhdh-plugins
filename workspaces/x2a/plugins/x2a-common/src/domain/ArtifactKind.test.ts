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

import { ArtifactKind } from './ArtifactKind';

describe('ArtifactKind', () => {
  describe('from', () => {
    it('returns ArtifactKind.MIGRATION_PLAN for "migration_plan"', () => {
      expect(ArtifactKind.from('migration_plan')).toBe(
        ArtifactKind.MIGRATION_PLAN,
      );
    });

    it('returns ArtifactKind.MODULE_MIGRATION_PLAN for "module_migration_plan"', () => {
      expect(ArtifactKind.from('module_migration_plan')).toBe(
        ArtifactKind.MODULE_MIGRATION_PLAN,
      );
    });

    it('returns ArtifactKind.MIGRATED_SOURCES for "migrated_sources"', () => {
      expect(ArtifactKind.from('migrated_sources')).toBe(
        ArtifactKind.MIGRATED_SOURCES,
      );
    });

    it('returns ArtifactKind.PROJECT_METADATA for "project_metadata"', () => {
      expect(ArtifactKind.from('project_metadata')).toBe(
        ArtifactKind.PROJECT_METADATA,
      );
    });

    it('returns ArtifactKind.ANSIBLE_PROJECT for "ansible_project"', () => {
      expect(ArtifactKind.from('ansible_project')).toBe(
        ArtifactKind.ANSIBLE_PROJECT,
      );
    });

    it('throws for an invalid type', () => {
      expect(() => ArtifactKind.from('invalid')).toThrow(
        'Invalid artifact type: "invalid". Valid: migration_plan, module_migration_plan, migrated_sources, project_metadata, ansible_project',
      );
    });
  });

  describe('all', () => {
    it('returns 5 kinds in defined order', () => {
      const all = ArtifactKind.all();
      expect(all).toHaveLength(5);
      expect(all).toEqual([
        ArtifactKind.MIGRATION_PLAN,
        ArtifactKind.MODULE_MIGRATION_PLAN,
        ArtifactKind.MIGRATED_SOURCES,
        ArtifactKind.PROJECT_METADATA,
        ArtifactKind.ANSIBLE_PROJECT,
      ]);
    });
  });

  describe('values', () => {
    it('returns raw string values for all kinds', () => {
      expect(ArtifactKind.values()).toEqual([
        'migration_plan',
        'module_migration_plan',
        'migrated_sources',
        'project_metadata',
        'ansible_project',
      ]);
    });
  });

  describe('predicates', () => {
    it('isMigrationPlan', () => {
      expect(ArtifactKind.MIGRATION_PLAN.isMigrationPlan()).toBe(true);
      expect(ArtifactKind.MIGRATED_SOURCES.isMigrationPlan()).toBe(false);
    });

    it('isModuleMigrationPlan', () => {
      expect(ArtifactKind.MODULE_MIGRATION_PLAN.isModuleMigrationPlan()).toBe(
        true,
      );
      expect(ArtifactKind.MIGRATION_PLAN.isModuleMigrationPlan()).toBe(false);
    });

    it('isMigratedSources', () => {
      expect(ArtifactKind.MIGRATED_SOURCES.isMigratedSources()).toBe(true);
      expect(ArtifactKind.PROJECT_METADATA.isMigratedSources()).toBe(false);
    });

    it('isProjectMetadata', () => {
      expect(ArtifactKind.PROJECT_METADATA.isProjectMetadata()).toBe(true);
      expect(ArtifactKind.ANSIBLE_PROJECT.isProjectMetadata()).toBe(false);
    });

    it('isAnsibleProject', () => {
      expect(ArtifactKind.ANSIBLE_PROJECT.isAnsibleProject()).toBe(true);
      expect(ArtifactKind.MIGRATION_PLAN.isAnsibleProject()).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns the raw string value', () => {
      expect(ArtifactKind.MIGRATION_PLAN.toString()).toBe('migration_plan');
      expect(ArtifactKind.MODULE_MIGRATION_PLAN.toString()).toBe(
        'module_migration_plan',
      );
      expect(ArtifactKind.MIGRATED_SOURCES.toString()).toBe('migrated_sources');
      expect(ArtifactKind.PROJECT_METADATA.toString()).toBe('project_metadata');
      expect(ArtifactKind.ANSIBLE_PROJECT.toString()).toBe('ansible_project');
    });
  });

  describe('equals', () => {
    it('returns true for same instance', () => {
      expect(
        ArtifactKind.MIGRATION_PLAN.equals(ArtifactKind.MIGRATION_PLAN),
      ).toBe(true);
    });

    it('returns true for from() result (flyweight identity)', () => {
      expect(
        ArtifactKind.MIGRATION_PLAN.equals(ArtifactKind.from('migration_plan')),
      ).toBe(true);
    });

    it('returns false for different kinds', () => {
      expect(
        ArtifactKind.MIGRATION_PLAN.equals(ArtifactKind.MIGRATED_SOURCES),
      ).toBe(false);
    });
  });

  describe('flyweight identity', () => {
    it('from() returns the exact same instance', () => {
      expect(ArtifactKind.from('migration_plan')).toBe(
        ArtifactKind.MIGRATION_PLAN,
      );
      expect(ArtifactKind.from('module_migration_plan')).toBe(
        ArtifactKind.MODULE_MIGRATION_PLAN,
      );
      expect(ArtifactKind.from('migrated_sources')).toBe(
        ArtifactKind.MIGRATED_SOURCES,
      );
      expect(ArtifactKind.from('project_metadata')).toBe(
        ArtifactKind.PROJECT_METADATA,
      );
      expect(ArtifactKind.from('ansible_project')).toBe(
        ArtifactKind.ANSIBLE_PROJECT,
      );
    });
  });
});
