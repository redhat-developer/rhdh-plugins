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

import { Link } from '@backstage/core-components';

import { Box } from '@material-ui/core';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import CircularProgress from '@mui/material/CircularProgress';

import {
  capitalize,
  ProcessInstanceStatusDTO,
} from '@redhat/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { useWorkflowInstanceStateColors } from '../../hooks/useWorkflowInstanceStatusColors';

export const WorkflowInstanceStatusIndicator = ({
  status,
  instanceLink,
}: {
  status?: ProcessInstanceStatusDTO;
  instanceLink?: string;
}) => {
  const { t } = useTranslation();
  const iconColor = useWorkflowInstanceStateColors(status);

  if (!status) {
    return VALUE_UNAVAILABLE;
  }

  let icon: React.ReactNode;
  let title: string = '';
  switch (status) {
    case ProcessInstanceStatusDTO.Active:
      icon = <CircularProgress size="1.15rem" className={iconColor} />;
      title = t('table.status.running');
      break;
    case ProcessInstanceStatusDTO.Completed:
      icon = <CheckCircleOutlined className={iconColor} />;
      title = t('table.status.completed');
      break;
    case ProcessInstanceStatusDTO.Suspended:
      icon = <b className={iconColor}>--</b>;
      title = t('tooltips.suspended');
      break;
    case ProcessInstanceStatusDTO.Aborted:
      icon = <b className={iconColor}>--</b>;
      title = t('table.status.aborted');
      break;
    case ProcessInstanceStatusDTO.Error:
      icon = <ErrorOutlineOutlined className={iconColor} />;
      title = t('table.status.failed');
      break;
    case ProcessInstanceStatusDTO.Pending:
      icon = <HourglassEmptyOutlined className={iconColor} />;
      title = t('table.status.pending');
      break;
    default:
      icon = VALUE_UNAVAILABLE;
      break;
  }

  return (
    <Box display="flex" alignItems="center">
      {icon}
      &nbsp;{' '}
      {instanceLink ? (
        <Link to={instanceLink}>{capitalize(title)}</Link>
      ) : (
        <>{capitalize(title)}</>
      )}
    </Box>
  );
};
