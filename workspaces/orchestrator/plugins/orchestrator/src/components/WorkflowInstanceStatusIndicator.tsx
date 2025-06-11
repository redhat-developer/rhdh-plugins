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
import React from 'react';

import { Link } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';

import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import CircularProgress from '@mui/material/CircularProgress';

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

  let icon: React.ReactNode;
  let title: string = '';
  switch (status) {
    case ProcessInstanceStatusDTO.Active:
      icon = <CircularProgress size="1.15rem" className={iconColor} />;
      title = 'Running';
      break;
    case ProcessInstanceStatusDTO.Completed:
      icon = <CheckCircleOutlined className={iconColor} />;
      title = 'Completed';
      break;
    case ProcessInstanceStatusDTO.Suspended:
      icon = <b className={iconColor}>--</b>;
      title = 'Suspended';
      break;
    case ProcessInstanceStatusDTO.Aborted:
      icon = <b className={iconColor}>--</b>;
      title = 'Aborted';
      break;
    case ProcessInstanceStatusDTO.Error:
      icon = <ErrorOutlineOutlined className={iconColor} />;
      title = 'Failed';
      break;
    case ProcessInstanceStatusDTO.Pending:
      icon = <HourglassEmptyOutlined className={iconColor} />;
      title = 'Pending';
      break;
    default:
      icon = VALUE_UNAVAILABLE;
      break;
  }

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
    >
      {icon}
      {lastRunId ? (
        <Link to={workflowInstanceLink({ instanceId: lastRunId })}>
          {capitalize(title)}
        </Link>
      ) : (
        <>{capitalize(title)}</>
      )}
    </div>
  );
};
