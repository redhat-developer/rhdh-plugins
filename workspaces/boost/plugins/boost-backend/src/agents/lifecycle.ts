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

import type { LifecycleStage } from '@red-hat-developer-hub/backstage-plugin-boost-common';

/**
 * Valid lifecycle transitions.
 *
 * Draft → Pending (promote)
 * Pending → Published (approve)
 * Published → Archived (request-unpublish)
 * Pending → Draft (withdraw)
 *
 * @internal
 */
const VALID_TRANSITIONS: ReadonlyMap<
  LifecycleStage,
  readonly LifecycleStage[]
> = new Map([
  ['draft', ['pending']],
  ['pending', ['published', 'draft']],
  ['published', ['archived']],
  ['archived', []],
]);

/**
 * Lifecycle stages from which an agent may be deleted.
 *
 * @internal
 */
const DELETABLE_STAGES: readonly LifecycleStage[] = ['draft', 'archived'];

/**
 * Check whether a lifecycle transition is valid.
 *
 * @param from - The current lifecycle stage.
 * @param to - The target lifecycle stage.
 * @returns `true` if the transition is allowed.
 *
 * @public
 */
export function isValidTransition(
  from: LifecycleStage,
  to: LifecycleStage,
): boolean {
  const allowed = VALID_TRANSITIONS.get(from);
  return allowed !== undefined && allowed.includes(to);
}

/**
 * Check whether an agent may be deleted in its current stage.
 *
 * @param stage - The agent's current lifecycle stage.
 * @returns `true` if deletion is allowed.
 *
 * @public
 */
export function isDeletableStage(stage: LifecycleStage): boolean {
  return DELETABLE_STAGES.includes(stage);
}
