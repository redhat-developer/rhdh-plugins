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

import moment from 'moment';

import { NodeInstanceDTO } from '@redhat/backstage-plugin-orchestrator-common';

import { isNonNullable } from './TypeGuards';

export const compareNodes = (
  nodeA: NodeInstanceDTO,
  nodeB: NodeInstanceDTO,
) => {
  const aEnter = moment(nodeA.enter);
  const bEnter = moment(nodeB.enter);
  if (aEnter.isBefore(bEnter)) {
    return -1;
  } else if (aEnter.isAfter(bEnter)) {
    return 1;
  }

  if (isNonNullable(nodeA.exit) && isNonNullable(nodeB.exit)) {
    const aExit = moment(nodeA.exit);
    const bExit = moment(nodeB.exit);
    if (aExit.isBefore(bExit)) {
      return -1;
    } else if (aExit.isAfter(bExit)) {
      return 1;
    }
  } else {
    // nodeA exited, but nodeB didn't
    if (isNonNullable(nodeA.exit)) return -1;
    // nodeB exited, but nodeA didn't
    if (isNonNullable(nodeB.exit)) return 1;
  }

  if (nodeA.id < nodeB.id) {
    return -1;
  } else if (nodeA.id > nodeB.id) {
    return 1;
  }

  return 0;
};
