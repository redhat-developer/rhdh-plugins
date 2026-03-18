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

import { JobStatusEnum } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { Box } from '@material-ui/core';
import { useTranslation } from '../hooks/useTranslation';
import {
  StatusAborted,
  StatusError,
  StatusOK,
  StatusPending,
  StatusRunning,
} from '@backstage/core-components';

export const PhaseStatusIcon = ({
  status,
  children,
}: {
  status?: JobStatusEnum;
  children?: React.ReactNode;
}) => {
  switch (status) {
    case 'success':
      return <StatusOK>{children}</StatusOK>;
    case 'error':
      return <StatusError>{children}</StatusError>;
    case 'running':
      return <StatusRunning>{children}</StatusRunning>;
    case 'pending':
      return <StatusPending>{children}</StatusPending>;
    case 'cancelled':
      return <StatusAborted>{children}</StatusAborted>;
    default:
      // to work nicely in the tab titles
      return null;
  }
};

export const PhaseStatus = ({ status }: { status?: JobStatusEnum }) => {
  const { t } = useTranslation();

  if (!status) {
    return t('modulePage.phases.statuses.notStarted');
  }

  return (
    <Box display="flex" flexWrap="wrap" alignItems="center">
      <Box whiteSpace="nowrap">
        <PhaseStatusIcon status={status}>
          {t(`modulePage.phases.statuses.${status}`)}
        </PhaseStatusIcon>
      </Box>
    </Box>
  );
};
