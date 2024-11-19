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
import Moment from 'react-moment';

import { Tooltip, Typography } from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';

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
    case 'Error': {
      return (
        <Tooltip
          title={
            error?.message ??
            'Additional details about this error are not available'
          }
        >
          <ErrorIcon className={color} />
        </Tooltip>
      );
    }
    case 'Completed': {
      return (
        <Tooltip title="Completed">
          <CheckCircleIcon className={color} />
        </Tooltip>
      );
    }
    case 'Active': {
      return (
        <Tooltip title="Active">
          <HourglassTopIcon className={color} />
        </Tooltip>
      );
    }
    case 'Aborted': {
      return (
        <Tooltip title="Aborted">
          <CancelIcon className={color} />
        </Tooltip>
      );
    }
    case 'Suspended': {
      return (
        <Tooltip title="Suspended">
          <PauseCircleIcon className={color} />
        </Tooltip>
      );
    }
    case 'Pending': {
      return (
        <Tooltip title="Pending">
          <HourglassTopIcon className={color} />
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
