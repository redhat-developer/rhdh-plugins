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

import type { ArtifactType } from '../../client/src/schema/openapi';
import { X2A_ARTIFACT_TYPE_VALUES } from '../x2aArtifactTypeLiterals';

/** @public */
export class ArtifactKind {
  static readonly MIGRATION_PLAN = new ArtifactKind('migration_plan');
  static readonly MODULE_MIGRATION_PLAN = new ArtifactKind(
    'module_migration_plan',
  );
  static readonly MIGRATED_SOURCES = new ArtifactKind('migrated_sources');
  static readonly PROJECT_METADATA = new ArtifactKind('project_metadata');
  static readonly ANSIBLE_PROJECT = new ArtifactKind('ansible_project');

  private static readonly ALL = Object.freeze([
    ArtifactKind.MIGRATION_PLAN,
    ArtifactKind.MODULE_MIGRATION_PLAN,
    ArtifactKind.MIGRATED_SOURCES,
    ArtifactKind.PROJECT_METADATA,
    ArtifactKind.ANSIBLE_PROJECT,
  ]);

  private static readonly BY_VALUE = new Map<string, ArtifactKind>(
    ArtifactKind.ALL.map(k => [k.value, k]),
  );

  private constructor(readonly value: ArtifactType) {}

  static from(raw: string): ArtifactKind {
    const kind = ArtifactKind.BY_VALUE.get(raw);
    if (!kind) {
      throw new Error(
        `Invalid artifact type: "${raw}". Valid: ${ArtifactKind.values().join(', ')}`,
      );
    }
    return kind;
  }
  static all(): readonly ArtifactKind[] {
    return ArtifactKind.ALL;
  }

  static values(): readonly ArtifactType[] {
    return X2A_ARTIFACT_TYPE_VALUES;
  }

  isMigrationPlan(): boolean {
    return this === ArtifactKind.MIGRATION_PLAN;
  }

  isModuleMigrationPlan(): boolean {
    return this === ArtifactKind.MODULE_MIGRATION_PLAN;
  }

  isMigratedSources(): boolean {
    return this === ArtifactKind.MIGRATED_SOURCES;
  }

  isProjectMetadata(): boolean {
    return this === ArtifactKind.PROJECT_METADATA;
  }

  isAnsibleProject(): boolean {
    return this === ArtifactKind.ANSIBLE_PROJECT;
  }

  equals(other: ArtifactKind): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
