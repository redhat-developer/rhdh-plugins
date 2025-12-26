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

import { WorkflowStatus } from '../types';

export const statusMapKeys = Object.values(WorkflowStatus);

export type StatusMapKey = WorkflowStatus;

export const createStatusMap = (t: (key: string) => string) =>
  ({
    [WorkflowStatus.Pending]: t('workflows.workflowPending'),
    [WorkflowStatus.Active]: t('workflows.workflowActive'),
    [WorkflowStatus.Completed]: t('workflows.workflowCompleted'),
    [WorkflowStatus.Aborted]: t('workflows.workflowAborted'),
    [WorkflowStatus.Suspended]: t('workflows.workflowSuspended'),
    [WorkflowStatus.FetchError]: t('workflows.workflowError'),
    [WorkflowStatus.Error]: t('workflows.workflowFetchError'),
  }) as Record<StatusMapKey, string>;

export const statusIconMap: Record<StatusMapKey, JSX.Element> = {
  [WorkflowStatus.Pending]: <StatusPending />,
  [WorkflowStatus.Active]: <StatusRunning />,
  [WorkflowStatus.Completed]: <StatusOK />,
  [WorkflowStatus.Aborted]: <StatusAborted />,
  [WorkflowStatus.Suspended]: <StatusPending />,
  [WorkflowStatus.FetchError]: <StatusError />,
  [WorkflowStatus.Error]: <StatusError />,
};

export const getWorkflowStatusInfo = (
  status: string,
  t: (key: string) => string,
): { workflowLabelText: string; workflowIcon: React.ReactNode | null } => {
  const map = createStatusMap(t);
  if (statusMapKeys.includes(status as StatusMapKey)) {
    const key = status as StatusMapKey;
    return {
      workflowLabelText: map[key],
      workflowIcon: statusIconMap[key],
    };
  }
  return { workflowLabelText: status, workflowIcon: null };
};
