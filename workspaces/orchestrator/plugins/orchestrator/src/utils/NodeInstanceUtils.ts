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

import { DateTime } from 'luxon';

import { NodeInstanceDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { isNonNullable } from './TypeGuards';

export const compareNodes = (
  nodeA: NodeInstanceDTO,
  nodeB: NodeInstanceDTO,
) => {
  const aEnter = nodeA.enter
    ? DateTime.fromISO(nodeA.enter)
    : DateTime.invalid('missing');
  const bEnter = nodeB.enter
    ? DateTime.fromISO(nodeB.enter)
    : DateTime.invalid('missing');

  // Compare enter timestamps
  if (aEnter.toMillis() < bEnter.toMillis()) return -1;
  if (aEnter.toMillis() > bEnter.toMillis()) return 1;

  // Compare exit timestamps
  if (isNonNullable(nodeA.exit) && isNonNullable(nodeB.exit)) {
    const aExit = DateTime.fromISO(nodeA.exit);
    const bExit = DateTime.fromISO(nodeB.exit);

    if (aExit.toMillis() < bExit.toMillis()) return -1;
    if (aExit.toMillis() > bExit.toMillis()) return 1;
  } else {
    // nodeA exited, but nodeB didn't
    if (isNonNullable(nodeA.exit)) return -1;
    // nodeB exited, but nodeA didn't
    if (isNonNullable(nodeB.exit)) return 1;
  }

  // Fallback to id sorting
  if (nodeA.id < nodeB.id) return -1;
  if (nodeA.id > nodeB.id) return 1;

  return 0;
};
