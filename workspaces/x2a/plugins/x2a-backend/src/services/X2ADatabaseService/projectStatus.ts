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
  Job,
  Module,
  ProjectStatus,
  ProjectStatusState,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export { calculateModuleStatus } from '@red-hat-developer-hub/backstage-plugin-x2a-node';

/**
 * Project status is calculated from its modules.
 *
 * Its "state" is accompanied by summary of its modules statuses.
 */
export function calculateProjectStatus(
  projectModules: Module[],
  initJob?: Job,
): ProjectStatus {
  const total = projectModules.length;
  if (!initJob && total === 0) {
    return {
      state: 'created',
      modulesSummary: {
        total: 0,
        finished: 0,
        waiting: 0,
        pending: 0,
        running: 0,
        error: 0,
        cancelled: 0,
      },
    };
  }

  const error = projectModules.filter(
    module => module.status === 'error',
  ).length;
  const finished = projectModules.filter(
    module =>
      module.status === 'success' && module.publish?.status === 'success',
  ).length;
  const waiting = projectModules.filter(
    module =>
      module.status === 'success' &&
      (!module.publish || module.publish.status === 'cancelled'),
  ).length;
  const pending = projectModules.filter(
    module => module.status === 'pending',
  ).length;
  const running = projectModules.filter(
    module => module.status === 'running',
  ).length;
  const cancelled = projectModules.filter(
    module => module.status === 'cancelled',
  ).length;

  let state: ProjectStatusState;
  if (error > 0) {
    state = 'failed'; // At least one module is in error state
  } else if (['pending', 'running'].includes(initJob?.status ?? '')) {
    state = 'initializing'; // Project's init job is running or scheduling
  } else if (initJob?.status === 'success') {
    if (total > 0 && finished === total) {
      state = 'completed'; // All modules are in success state
    } else if (total === 0 || pending + cancelled === total) {
      state = 'initialized'; // Module list is empty or all modules are in pending/cancelled state
    } else {
      state = 'inProgress'; // At least one module is beyond the pending state
    }
  } else {
    state = 'failed';
  }

  return {
    state,
    modulesSummary: {
      total,
      finished,
      waiting,
      pending,
      running,
      error,
      cancelled,
    },
  };
}
