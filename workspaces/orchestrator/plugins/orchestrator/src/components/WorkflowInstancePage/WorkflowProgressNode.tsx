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

import { FC } from 'react';

import Cancel from '@mui/icons-material/Cancel';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Error from '@mui/icons-material/Error';
import HourglassTop from '@mui/icons-material/HourglassTop';
import PauseCircle from '@mui/icons-material/PauseCircle';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DateTime } from 'luxon';

import { ProcessInstanceStatusDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { useWorkflowInstanceStateColors } from '../../hooks/useWorkflowInstanceStatusColors';
import { Paragraph } from './Paragraph';
import { WorkflowProgressNodeModel } from './WorkflowProgressNodeModel';

const WorkflowProgressNodeIcon: FC<{
  status?: WorkflowProgressNodeModel['status'];
  error?: WorkflowProgressNodeModel['error'];
}> = ({ status, error }) => {
  const { t } = useTranslation();
  const color = useWorkflowInstanceStateColors(status);
  switch (status) {
    case ProcessInstanceStatusDTO.Error: {
      return (
        <Tooltip
          title={
            error?.message ??
            t('messages.additionalDetailsAboutThisErrorAreNotAvailable')
          }
        >
          <Error className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Completed: {
      return (
        <Tooltip title={t('tooltips.completed')}>
          <CheckCircle className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Active: {
      return (
        <Tooltip title={t('tooltips.active')}>
          <HourglassTop className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Aborted: {
      return (
        <Tooltip title={t('tooltips.aborted')}>
          <Cancel className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Suspended: {
      return (
        <Tooltip title={t('tooltips.suspended')}>
          <PauseCircle className={color} />
        </Tooltip>
      );
    }
    case ProcessInstanceStatusDTO.Pending: {
      return (
        <Tooltip title={t('tooltips.pending')}>
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
}> = ({ model }) => {
  const relativeTime = model.exit
    ? (DateTime.fromISO(model.exit).toRelative() ?? VALUE_UNAVAILABLE)
    : VALUE_UNAVAILABLE;

  return (
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
        {relativeTime}
      </small>
    </Paragraph>
  );
};
WorkflowProgressNode.displayName = 'WorkflowProgressNode';
