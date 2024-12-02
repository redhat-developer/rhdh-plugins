/*
 * Copyright 2024 The Backstage Authors
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
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../constants';
import DataFormatter from './DataFormatter';

export interface FormattedWorkflowOverview {
  readonly id: string;
  readonly name: string;
  readonly lastTriggered: string;
  readonly lastRunStatus: string;
  readonly lastRunId: string;
  readonly category: string;
  readonly description: string;
  readonly format: WorkflowFormatDTO;
}

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
      lastRunStatus: data.lastRunStatus?.toString() ?? VALUE_UNAVAILABLE,
      lastRunId: data.lastRunId ?? VALUE_UNAVAILABLE,
      category: data.category ?? VALUE_UNAVAILABLE,
      description: data.description ?? VALUE_UNAVAILABLE,
      format: data.format,
    };
  },
};

export default WorkflowOverviewFormatter;
