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

import type { ProjectStatusState } from '../../client/src/schema/openapi';

/** @public */
export class ProjectState {
  static readonly CREATED = new ProjectState('created', 0);
  static readonly INITIALIZING = new ProjectState('initializing', 1);
  static readonly INITIALIZED = new ProjectState('initialized', 2);
  static readonly IN_PROGRESS = new ProjectState('inProgress', 3);
  static readonly FAILED = new ProjectState('failed', 4);
  static readonly COMPLETED = new ProjectState('completed', 5);

  private static readonly BY_VALUE = new Map<string, ProjectState>(
    [
      ProjectState.CREATED,
      ProjectState.INITIALIZING,
      ProjectState.INITIALIZED,
      ProjectState.IN_PROGRESS,
      ProjectState.FAILED,
      ProjectState.COMPLETED,
    ].map(s => [s.value, s]),
  );

  private constructor(
    readonly value: ProjectStatusState,
    readonly ordinal: number,
  ) {}

  static from(raw: string): ProjectState {
    const state = ProjectState.BY_VALUE.get(raw);
    if (!state) {
      throw new Error(
        `Invalid project state: "${raw}". Valid: ${ProjectState.values().join(', ')}`,
      );
    }
    return state;
  }

  static all(): readonly ProjectState[] {
    return [
      ProjectState.CREATED,
      ProjectState.INITIALIZING,
      ProjectState.INITIALIZED,
      ProjectState.IN_PROGRESS,
      ProjectState.FAILED,
      ProjectState.COMPLETED,
    ];
  }

  static values(): readonly ProjectStatusState[] {
    return ProjectState.all().map(s => s.value);
  }

  isCreated(): boolean {
    return this === ProjectState.CREATED;
  }

  isInitializing(): boolean {
    return this === ProjectState.INITIALIZING;
  }

  isInitialized(): boolean {
    return this === ProjectState.INITIALIZED;
  }

  isInProgress(): boolean {
    return this === ProjectState.IN_PROGRESS;
  }

  isFailed(): boolean {
    return this === ProjectState.FAILED;
  }

  isComplete(): boolean {
    return this === ProjectState.COMPLETED;
  }

  equals(other: ProjectState): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
