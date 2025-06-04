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
import { useNavigate } from 'react-router-dom';

import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';

import {
  orchestratorWorkflowUsePermission,
  orchestratorWorkflowUseSpecificPermission,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { usePermissionArrayDecision } from '../../hooks/usePermissionArray';
import { executeWorkflowRouteRef, workflowRouteRef } from '../../routes';

export const RunButton = ({ isAvailable }: { isAvailable?: boolean }) => {
  const { workflowId } = useRouteRefParams(workflowRouteRef);
  const navigate = useNavigate();
  const executeWorkflowLink = useRouteRef(executeWorkflowRouteRef);
  const handleExecute = () => {
    navigate(executeWorkflowLink({ workflowId }));
  };

  const { loading: loadingPermission, allowed: canRun } =
    usePermissionArrayDecision([
      orchestratorWorkflowUsePermission,
      orchestratorWorkflowUseSpecificPermission(workflowId),
    ]);

  let tooltipText = '';
  if (!canRun) {
    tooltipText = 'User not authorized to execute workflow.';
  } else if (!isAvailable) {
    tooltipText =
      'The workflow is currently down or in an error state. Running it now may fail or produce unexpected results.';
  }

  return (
    <Grid item container justifyContent="flex-end" xs={12} spacing={2}>
      <Grid item>
        {loadingPermission ? (
          <Skeleton variant="text" width="5rem" />
        ) : (
          <Tooltip
            title={tooltipText}
            disableHoverListener={tooltipText === ''}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleExecute}
              disabled={!canRun}
            >
              Run
            </Button>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
};
