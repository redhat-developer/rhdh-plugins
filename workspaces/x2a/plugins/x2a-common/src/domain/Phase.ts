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

import type {
  MigrationPhase,
  ModulePhase,
} from '../../client/src/schema/openapi';

/** @public */
export class Phase {
  static readonly INIT = new Phase('init', 0);
  static readonly ANALYZE = new Phase('analyze', 1);
  static readonly MIGRATE = new Phase('migrate', 2);
  static readonly PUBLISH = new Phase('publish', 3);

  private static readonly BY_VALUE = new Map<string, Phase>(
    [Phase.INIT, Phase.ANALYZE, Phase.MIGRATE, Phase.PUBLISH].map(p => [
      p.value,
      p,
    ]),
  );

  private constructor(
    readonly value: MigrationPhase,
    readonly ordinal: number,
  ) {}

  static from(raw: string): Phase {
    const phase = Phase.BY_VALUE.get(raw);
    if (!phase) {
      throw new Error(
        `Invalid migration phase: "${raw}". Valid: ${Phase.values().join(', ')}`,
      );
    }
    return phase;
  }

  static all(): readonly Phase[] {
    return [Phase.INIT, Phase.ANALYZE, Phase.MIGRATE, Phase.PUBLISH];
  }

  static modulePhases(): readonly Phase[] {
    return [Phase.ANALYZE, Phase.MIGRATE, Phase.PUBLISH];
  }

  static values(): readonly MigrationPhase[] {
    return Phase.all().map(p => p.value);
  }

  static modulePhaseValues(): readonly ModulePhase[] {
    return Phase.modulePhases().map(p => p.value as ModulePhase);
  }

  isModulePhase(): boolean {
    return this !== Phase.INIT;
  }

  isProjectPhase(): boolean {
    return this === Phase.INIT;
  }

  equals(other: Phase): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
