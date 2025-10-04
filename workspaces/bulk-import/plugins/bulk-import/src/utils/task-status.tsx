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
  StatusAborted,
  StatusError,
  StatusOK,
  StatusPending,
  StatusRunning,
} from '@backstage/core-components';

export const statusMapKeys = [
  'TASK_CANCELLED',
  'TASK_COMPLETED',
  'TASK_FAILED',
  'TASK_OPEN',
  'TASK_PROCESSING',
  'TASK_SKIPPED',
] as const;

export type StatusMapKey = (typeof statusMapKeys)[number];

export const createStatusMap = (t: (key: string) => string) =>
  ({
    TASK_CANCELLED: t('tasks.taskCancelled'),
    TASK_COMPLETED: t('tasks.taskCompleted'),
    TASK_FAILED: t('tasks.taskFailed'),
    TASK_OPEN: t('tasks.taskOpen'),
    TASK_PROCESSING: t('tasks.taskProcessing'),
    TASK_SKIPPED: t('tasks.taskSkipped'),
  }) as Record<StatusMapKey, string>;

export const statusIconMap: Record<StatusMapKey, JSX.Element> = {
  TASK_CANCELLED: <StatusAborted />,
  TASK_COMPLETED: <StatusOK />,
  TASK_FAILED: <StatusError />,
  TASK_OPEN: <StatusPending />,
  TASK_PROCESSING: <StatusRunning />,
  TASK_SKIPPED: <StatusAborted />,
};

export const getTaskStatusInfo = (
  status: string,
  t: (key: string) => string,
): { taskLabelText: string; taskIcon: React.ReactNode | null } => {
  const map = createStatusMap(t);
  if (statusMapKeys.includes(status as StatusMapKey)) {
    const key = status as StatusMapKey;
    return {
      taskLabelText: map[key],
      taskIcon: statusIconMap[key],
    };
  }
  return { taskLabelText: status, taskIcon: null };
};
