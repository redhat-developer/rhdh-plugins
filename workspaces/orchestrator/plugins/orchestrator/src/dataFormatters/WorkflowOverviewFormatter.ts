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

import {
  WorkflowFormatDTO,
  WorkflowOverviewDTO,
} from '@redhat/backstage-plugin-orchestrator-common';

import { AVAILABLE, UNAVAILABLE, VALUE_UNAVAILABLE } from '../constants';
import DataFormatter from './DataFormatter';

export interface FormattedWorkflowOverview {
  readonly id: string;
  readonly name: string;
  readonly lastTriggered: string;
  readonly lastRunStatus: string;
  readonly lastRunId: string;
  readonly description: string;
  readonly format: WorkflowFormatDTO;
  readonly availability?: string;
}

const formatIsAvailable = (availability: boolean | undefined) => {
  if (availability === true) return AVAILABLE;
  else if (availability === false) return UNAVAILABLE;
  return VALUE_UNAVAILABLE;
};

const formatLastRunStatus = (lastRunStatus: string | undefined) => {
  if (lastRunStatus === 'ERROR') return 'FAILED';
  else if (lastRunStatus === 'ACTIVE') return 'RUNNING';
  else if (lastRunStatus) return lastRunStatus?.toString();
  return VALUE_UNAVAILABLE;
};

const WorkflowOverviewFormatter: DataFormatter<
  WorkflowOverviewDTO,
  FormattedWorkflowOverview
> = {
  format: (data: WorkflowOverviewDTO): FormattedWorkflowOverview => {
    return {
      id: data.workflowId,
      name: data.name ?? VALUE_UNAVAILABLE,
      lastTriggered: data.lastTriggeredMs
        ? moment(data.lastTriggeredMs).toDate().toLocaleString()
        : VALUE_UNAVAILABLE,
      lastRunStatus: formatLastRunStatus(data.lastRunStatus),
      lastRunId: data.lastRunId ?? VALUE_UNAVAILABLE,
      description: data.description ?? VALUE_UNAVAILABLE,
      format: data.format,
      availability: formatIsAvailable(data.isAvailable),
    };
  },
};

export default WorkflowOverviewFormatter;
