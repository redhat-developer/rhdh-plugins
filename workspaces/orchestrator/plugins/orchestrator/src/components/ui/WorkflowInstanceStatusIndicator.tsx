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

import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import {
  capitalize,
  ProcessInstanceStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { useWorkflowInstanceStateColors } from '../../hooks/useWorkflowInstanceStatusColors';

export const WorkflowInstanceStatusIndicator = ({
  status,
  instanceLink,
  compact = false,
}: {
  status?: ProcessInstanceStatusDTO;
  instanceLink?: string;
  compact?: boolean;
}) => {
  const { t } = useTranslation();
  const iconColor = useWorkflowInstanceStateColors(status);

  if (!status) {
    return VALUE_UNAVAILABLE;
  }

  const iconSizeProps = compact ? { fontSize: 'small' as const } : undefined;
  const progressSize = compact ? 20 : '1.15rem';

  let icon: React.ReactNode;
  let title: string = '';
  switch (status) {
    case ProcessInstanceStatusDTO.Active:
      icon = <CircularProgress size={progressSize} className={iconColor} />;
      title = t('table.status.running');
      break;
    case ProcessInstanceStatusDTO.Completed:
      icon = <CheckCircleOutlined className={iconColor} {...iconSizeProps} />;
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
      icon = <ErrorOutlineOutlined className={iconColor} {...iconSizeProps} />;
      title = t('table.status.failed');
      break;
    case ProcessInstanceStatusDTO.Pending:
      icon = (
        <HourglassEmptyOutlined className={iconColor} {...iconSizeProps} />
      );
      title = t('table.status.pending');
      break;
    default:
      return <>{VALUE_UNAVAILABLE}</>;
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
