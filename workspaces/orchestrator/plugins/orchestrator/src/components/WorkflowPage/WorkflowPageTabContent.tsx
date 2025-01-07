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
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { ResponseErrorPanel } from '@backstage/core-components';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';

import { Button, Grid, Tooltip } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';

import { executeWorkflowRouteRef, workflowRouteRef } from '../../routes';

interface Props {
  error: Error | undefined;
  loadingPermission: boolean;
  loading: boolean;
  canRun: boolean;
  children: ReactNode;
}

export const WorkflowPageTabContent = ({
  error,
  loadingPermission,
  loading,
  canRun,
  children,
}: Props) => {
  const { workflowId } = useRouteRefParams(workflowRouteRef);
  const navigate = useNavigate();
  const executeWorkflowLink = useRouteRef(executeWorkflowRouteRef);
  const handleExecute = () => {
    navigate(executeWorkflowLink({ workflowId }));
  };

  return (
    <Grid container spacing={2} direction="column" wrap="nowrap">
      {error && (
        <Grid item>
          <ResponseErrorPanel error={error} />
        </Grid>
      )}
      <Grid container item justifyContent="flex-end" spacing={1}>
        <Grid item>
          {loading || loadingPermission ? (
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
      <Grid item>{children}</Grid>
    </Grid>
  );
};
