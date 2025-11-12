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

import { TaskStatus } from '../types';

export const statusMapKeys = Object.values(TaskStatus);

export type StatusMapKey = TaskStatus;

export const createStatusMap = (t: (key: string) => string) =>
  ({
    [TaskStatus.Cancelled]: t('tasks.taskCancelled'),
    [TaskStatus.Completed]: t('tasks.taskCompleted'),
    [TaskStatus.Failed]: t('tasks.taskFailed'),
    [TaskStatus.Open]: t('tasks.taskOpen'),
    [TaskStatus.Processing]: t('tasks.taskProcessing'),
    [TaskStatus.Skipped]: t('tasks.taskSkipped'),
  }) as Record<StatusMapKey, string>;

export const statusIconMap: Record<StatusMapKey, JSX.Element> = {
  [TaskStatus.Cancelled]: <StatusAborted />,
  [TaskStatus.Completed]: <StatusOK />,
  [TaskStatus.Failed]: <StatusError />,
  [TaskStatus.Open]: <StatusPending />,
  [TaskStatus.Processing]: <StatusRunning />,
  [TaskStatus.Skipped]: <StatusAborted />,
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
