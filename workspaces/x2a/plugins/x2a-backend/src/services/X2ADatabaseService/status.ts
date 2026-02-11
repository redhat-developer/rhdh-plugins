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
  ModuleStatus,
  ProjectStatus,
  ProjectStatusState,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Module's status is the status of the last job of its last phase.
 *
 * If a later retrigger for an earlier phase fails (e.g. when retrigger on analyze
 * fails but a former migrate already passed), the modules status should not change.
 */
export function calculateModuleStatus({
  analyze,
  migrate,
  publish,
}: {
  analyze?: Job;
  migrate?: Job;
  publish?: Job;
}): { status: ModuleStatus; errorDetails?: string } {
  if (publish) {
    return { status: publish.status, errorDetails: publish.errorDetails };
  }
  if (migrate) {
    return { status: migrate.status, errorDetails: migrate.errorDetails };
  }
  if (analyze) {
    return { status: analyze.status, errorDetails: analyze.errorDetails };
  }

  return { status: 'pending', errorDetails: undefined };
}

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
    module => module.status === 'success' && !module.publish,
  ).length;
  const pending = projectModules.filter(
    module => module.status === 'pending',
  ).length;
  const running = projectModules.filter(
    module => module.status === 'running',
  ).length;

  let state: ProjectStatusState;
  if (error > 0) {
    state = 'failed';
  } else if (['pending', 'running'].includes(initJob?.status ?? '')) {
    state = 'initializing';
  } else if (initJob?.status === 'success') {
    if (finished === total) {
      state = 'completed';
    } else if (pending || waiting || running) {
      state = 'inProgress';
    } else {
      state = 'initialized';
    }
  } else {
    state = 'failed';
  }

  return {
    state: state,
    modulesSummary: {
      total,
      finished,
      waiting,
      pending,
      running,
      error,
    },
  };
}
