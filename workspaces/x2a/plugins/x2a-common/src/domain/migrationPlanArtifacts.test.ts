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
  findMigrationPlanArtifact,
  findModuleMigrationPlanArtifact,
} from './migrationPlanArtifacts';

describe('findMigrationPlanArtifact', () => {
  it('returns the migration plan artifact', () => {
    const migrationPlan = {
      id: '1',
      type: 'migration_plan' as const,
      value: 'dir/migration-plan.md',
    };
    expect(findMigrationPlanArtifact({ migrationPlan })).toBe(migrationPlan);
  });

  it('returns undefined when the project has no plan', () => {
    expect(findMigrationPlanArtifact({})).toBeUndefined();
  });

  it('returns undefined when the artifact is of another kind', () => {
    expect(
      findMigrationPlanArtifact({
        migrationPlan: { id: '1', type: 'project_metadata', value: '{}' },
      }),
    ).toBeUndefined();
  });
});

describe('findModuleMigrationPlanArtifact', () => {
  const plan = {
    id: '2',
    type: 'module_migration_plan' as const,
    value: 'dir/modules/m/migration-plan-m.md',
  };

  it('finds the module plan among the analyze artifacts', () => {
    expect(
      findModuleMigrationPlanArtifact({
        analyze: {
          artifacts: [{ id: '3', type: 'migration_plan', value: 'x.md' }, plan],
        },
      }),
    ).toBe(plan);
  });

  it('returns undefined without an analyze job', () => {
    expect(findModuleMigrationPlanArtifact({})).toBeUndefined();
  });

  it('returns undefined without artifacts', () => {
    expect(findModuleMigrationPlanArtifact({ analyze: {} })).toBeUndefined();
  });

  it('returns undefined when no module plan is present', () => {
    expect(
      findModuleMigrationPlanArtifact({
        analyze: {
          artifacts: [{ id: '3', type: 'migration_plan', value: 'x.md' }],
        },
      }),
    ).toBeUndefined();
  });
});
