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
 * Valid lifecycle transitions for Kagenti tools.
 *
 * Draft → Pending (promote)
 * Pending → Published (approve/publish)
 * Published → Archived (unpublish)
 * Pending → Draft (demote/withdraw)
 * Published → Pending (demote)
 *
 * @internal
 */
const VALID_TRANSITIONS: ReadonlyMap<
  LifecycleStage,
  readonly LifecycleStage[]
> = new Map([
  ['draft', ['pending']],
  ['pending', ['published', 'draft']],
  ['published', ['archived', 'pending']],
  ['archived', []],
]);

/**
 * Check whether a tool lifecycle transition is valid.
 *
 * @param from - The current lifecycle stage.
 * @param to - The target lifecycle stage.
 * @returns `true` if the transition is allowed.
 *
 * @public
 */
export function isValidToolTransition(
  from: LifecycleStage,
  to: LifecycleStage,
): boolean {
  const allowed = VALID_TRANSITIONS.get(from);
  return allowed !== undefined && allowed.includes(to);
}
