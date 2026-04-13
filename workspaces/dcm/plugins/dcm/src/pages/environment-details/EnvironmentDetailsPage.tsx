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

import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Content,
  Header,
  Page,
  TabbedLayout,
} from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import { Typography } from '@material-ui/core';
import {
  getDataCenterHomePath,
  type DcmLocationState,
} from '../../components/dataCenterNavigation';
import { useDcmStyles } from '../../components/dcmStyles';
import { DcmDetailsBreadcrumb } from '../../components/DcmDetailsBreadcrumb';
import { DCM_DETAILS_TABS, rootRouteRef } from '../../routes';
import {
  getMockEntityCountForEnvironment,
  MOCK_ENVIRONMENTS_DETAILS,
  MOCK_REQUEST_HISTORY,
} from '../../data/environments';
import { EntitiesTab } from './components/EntitiesTab';
import { OverviewTab } from './components/OverviewTab';
import { RequestHistoryTab } from './components/RequestHistoryTab';

export function EnvironmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const rootPath = useRouteRef(rootRouteRef)?.() ?? '/dcm';
  const dataCenterHomePath = getDataCenterHomePath(
    rootPath,
    location.state as DcmLocationState,
    'environments',
  );
  const classes = useDcmStyles();

  const env = useMemo(
    () => MOCK_ENVIRONMENTS_DETAILS.find(e => e.id === id),
    [id],
  );

  const entityTabCount = useMemo(
    () => (id ? getMockEntityCountForEnvironment(id) : 0),
    [id],
  );

  if (!env) {
    return (
      <Page themeId="tool">
        <Header title="Environment not found" />
        <Content>
          <Typography>No environment found with id: {id}</Typography>
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Content>
        <DcmDetailsBreadcrumb
          homePath={dataCenterHomePath}
          currentLabel={env.name}
          className={classes.breadcrumb}
        />
        <Typography variant="h4" className={classes.pageTitle}>
          {env.name}
        </Typography>
        <TabbedLayout>
          <TabbedLayout.Route path={DCM_DETAILS_TABS.overview} title="Overview">
            <OverviewTab env={env} />
          </TabbedLayout.Route>
          <TabbedLayout.Route
            path={DCM_DETAILS_TABS.entities}
            title={`Entities (${entityTabCount})`}
          >
            <EntitiesTab env={env} />
          </TabbedLayout.Route>
          <TabbedLayout.Route
            path={DCM_DETAILS_TABS.requestHistory}
            title={`Request history (${
              MOCK_REQUEST_HISTORY.filter(h => h.envId === env.id).length
            })`}
          >
            <RequestHistoryTab env={env} />
          </TabbedLayout.Route>
        </TabbedLayout>
      </Content>
    </Page>
  );
}
