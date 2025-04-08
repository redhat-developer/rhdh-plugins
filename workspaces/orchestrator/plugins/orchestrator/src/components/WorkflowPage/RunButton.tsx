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

import { Button, Grid, Tooltip } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';

import {
  orchestratorWorkflowUsePermission,
  orchestratorWorkflowUseSpecificPermission,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { usePermissionArrayDecision } from '../../hooks/usePermissionArray';
import { executeWorkflowRouteRef, workflowRouteRef } from '../../routes';

export const RunButton = () => {
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

  return (
    <Grid item container justifyContent="flex-end" xs={12} spacing={2}>
      <Grid item>
        {loadingPermission ? (
          <Skeleton variant="text" width="5rem" />
        ) : (
          <Tooltip
            title="user not authorized to execute workflow"
            disableHoverListener={canRun}
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
