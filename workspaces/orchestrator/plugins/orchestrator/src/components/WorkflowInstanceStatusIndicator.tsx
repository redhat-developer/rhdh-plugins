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
import React from 'react';

import { Link } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';

import DotIcon from '@material-ui/icons/FiberManualRecord';

import {
  capitalize,
  ProcessInstanceStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../constants';
import { useWorkflowInstanceStateColors } from '../hooks/useWorkflowInstanceStatusColors';
import { workflowInstanceRouteRef } from '../routes';

export const WorkflowInstanceStatusIndicator = ({
  status,
  lastRunId,
}: {
  status?: ProcessInstanceStatusDTO;
  lastRunId?: string;
}) => {
  const iconColor = useWorkflowInstanceStateColors(status);
  const workflowInstanceLink = useRouteRef(workflowInstanceRouteRef);

  if (!status) {
    return VALUE_UNAVAILABLE;
  }

  return (
    <>
      <DotIcon style={{ fontSize: '0.75rem' }} className={iconColor} />{' '}
      {lastRunId ? (
        <Link to={workflowInstanceLink({ instanceId: lastRunId })}>
          {capitalize(status)}
        </Link>
      ) : (
        <>{capitalize(status)}</>
      )}
    </>
  );
};
