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
  JobStatus,
  Module,
  ProjectState,
  ProjectStatus,
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
      state: ProjectState.CREATED.value,
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

  const modulesWithStatus = projectModules.map(module => ({
    module,
    status: module.status ? JobStatus.from(module.status) : undefined,
    publishStatus: module.publish?.status
      ? JobStatus.from(module.publish.status)
      : undefined,
  }));

  const error = modulesWithStatus.filter(m => m.status?.isError()).length;
  const finished = modulesWithStatus.filter(
    m => m.status?.isSuccess() && m.publishStatus?.isSuccess(),
  ).length;
  const waiting = modulesWithStatus.filter(
    m =>
      m.status?.isSuccess() &&
      (!m.module.publish || m.publishStatus?.isCancelled()),
  ).length;
  const pending = modulesWithStatus.filter(m => m.status?.isPending()).length;
  const running = modulesWithStatus.filter(m => m.status?.isRunning()).length;
  const cancelled = modulesWithStatus.filter(m =>
    m.status?.isCancelled(),
  ).length;

  const initStatus = initJob?.status
    ? JobStatus.from(initJob.status)
    : undefined;

  const state = determineState({
    total,
    error,
    finished,
    pending,
    cancelled,
    initStatus,
  });

  return {
    state: state.value,
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

function determineState(counts: {
  total: number;
  error: number;
  finished: number;
  pending: number;
  cancelled: number;
  initStatus?: JobStatus;
}): ProjectState {
  const { total, error, finished, pending, cancelled, initStatus } = counts;

  if (error > 0) return ProjectState.FAILED;
  if (initStatus?.isActive()) return ProjectState.INITIALIZING;
  if (!initStatus?.isSuccess()) return ProjectState.FAILED;
  if (total > 0 && finished === total) return ProjectState.COMPLETED;
  if (total === 0 || pending + cancelled === total)
    return ProjectState.INITIALIZED;

  return ProjectState.IN_PROGRESS;
}
