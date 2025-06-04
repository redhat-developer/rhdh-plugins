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
import Moment from 'react-moment';

import Cancel from '@mui/icons-material/Cancel';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Error from '@mui/icons-material/Error';
import HourglassTop from '@mui/icons-material/HourglassTop';
import PauseCircle from '@mui/icons-material/PauseCircle';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { ProcessInstanceStatusDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../constants';
import { useWorkflowInstanceStateColors } from '../hooks/useWorkflowInstanceStatusColors';
import { Paragraph } from './Paragraph';
import { WorkflowProgressNodeModel } from './WorkflowProgressNodeModel';

const WorkflowProgressNodeIcon: React.FC<{
  status?: WorkflowProgressNodeModel['status'];
  error?: WorkflowProgressNodeModel['error'];
}> = ({ status, error }) => {
  const color = useWorkflowInstanceStateColors(status);
  switch (status) {
    case ProcessInstanceStatusDTO.Error: {
      return (
        <Tooltip
          title={
            error?.message ??
            'Additional details about this error are not available'
          }
        >
          <Error className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Completed: {
      return (
        <Tooltip title="Completed">
          <CheckCircle className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Active: {
      return (
        <Tooltip title="Active">
          <HourglassTop className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Aborted: {
      return (
        <Tooltip title="Aborted">
          <Cancel className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Suspended: {
      return (
        <Tooltip title="Suspended">
          <PauseCircle className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Pending: {
      return (
        <Tooltip title="Pending">
          <HourglassTop className={color} />
        </Tooltip>
      );
    }
    default:
      return null;
  }
};
WorkflowProgressNodeIcon.displayName = 'WorkflowProgressNodeIcon';

export const WorkflowProgressNode: React.FC<{
  model: WorkflowProgressNodeModel;
}> = ({ model }) => (
  <Paragraph>
    <Typography
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <WorkflowProgressNodeIcon status={model.status} error={model.error} />
      <Typography style={{ paddingLeft: '8px' }}>{model.name}</Typography>
    </Typography>
    <small style={{ paddingLeft: '32px', color: 'grey' }}>
      {!model.exit ? (
        VALUE_UNAVAILABLE
      ) : (
        <Moment fromNow>{new Date(`${model.exit}`)}</Moment>
      )}
    </small>
  </Paragraph>
);
WorkflowProgressNode.displayName = 'WorkflowProgressNode';
