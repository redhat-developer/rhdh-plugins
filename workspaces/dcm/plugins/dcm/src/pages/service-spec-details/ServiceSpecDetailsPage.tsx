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

import { useEffect, useState } from 'react';
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
  INITIAL_SERVICE_SPECS,
  MOCK_SERVICE_SPEC_ENTITIES,
  MOCK_SERVICE_SPEC_REQUEST_HISTORY,
  type ServiceSpec,
} from '../../data/service-specs';
import { SpecEntitiesTab } from './components/SpecEntitiesTab';
import { SpecOverviewTab } from './components/SpecOverviewTab';
import { SpecRequestHistoryTab } from './components/SpecRequestHistoryTab';

export function ServiceSpecDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const rootPath = useRouteRef(rootRouteRef)?.() ?? '/dcm';
  const dataCenterHomePath = getDataCenterHomePath(
    rootPath,
    location.state as DcmLocationState,
    'service-specs',
  );
  const classes = useDcmStyles();

  const [spec, setSpec] = useState<ServiceSpec>();
  const [entityCount, setEntityCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    setSpec(INITIAL_SERVICE_SPECS.find(s => s.id === id));
    setEntityCount(
      MOCK_SERVICE_SPEC_ENTITIES.filter(e => e.specId === id).length,
    );
    setHistoryCount(
      MOCK_SERVICE_SPEC_REQUEST_HISTORY.filter(h => h.specId === id).length,
    );
  }, [id]);

  if (!spec) {
    return (
      <Page themeId="tool">
        <Header title="Service spec not found" />
        <Content>
          <Typography>No service spec found with id: {id}</Typography>
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Content>
        <DcmDetailsBreadcrumb
          homePath={dataCenterHomePath}
          currentLabel={spec.name}
          className={classes.breadcrumb}
        />
        <Typography variant="h4" className={classes.pageTitle}>
          {spec.name}
        </Typography>
        <TabbedLayout>
          <TabbedLayout.Route path={DCM_DETAILS_TABS.overview} title="Overview">
            <SpecOverviewTab spec={spec} />
          </TabbedLayout.Route>
          <TabbedLayout.Route
            path={DCM_DETAILS_TABS.entities}
            title={`Entities (${entityCount})`}
          >
            <SpecEntitiesTab spec={spec} />
          </TabbedLayout.Route>
          <TabbedLayout.Route
            path={DCM_DETAILS_TABS.requestHistory}
            title={`Request history (${historyCount})`}
          >
            <SpecRequestHistoryTab spec={spec} />
          </TabbedLayout.Route>
        </TabbedLayout>
      </Content>
    </Page>
  );
}
