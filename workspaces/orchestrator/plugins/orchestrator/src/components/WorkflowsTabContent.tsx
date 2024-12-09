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
import React, { useCallback } from 'react';

import {
  Content,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import Grid from '@material-ui/core/Grid/Grid';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../api';
import usePolling from '../hooks/usePolling';
import { WorkflowsTable } from './WorkflowsTable';

export const WorkflowsTabContent = () => {
  const orchestratorApi = useApi(orchestratorApiRef);

  const fetchWorkflowOverviews = useCallback(async () => {
    // TODO: pass pagination details only if the user is granted the generic orchestratorWorkflowPermission
    // FE pagination will be used otherwise
    const overviewsResp = await orchestratorApi.listWorkflowOverviews();
    return overviewsResp.data.overviews;
  }, [orchestratorApi]);

  const { loading, error, value } = usePolling<
    WorkflowOverviewDTO[] | undefined
  >(fetchWorkflowOverviews);

  const isReady = React.useMemo(() => !loading && !error, [loading, error]);

  return (
    <Content noPadding>
      {loading ? <Progress /> : null}
      {error ? <ResponseErrorPanel error={error} /> : null}
      {isReady ? (
        <Grid container direction="column">
          <Grid item>
            <WorkflowsTable items={value ?? []} />
          </Grid>
        </Grid>
      ) : null}
    </Content>
  );
};
