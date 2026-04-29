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

import {
  Page,
  Header,
  Content,
  TabbedLayout,
} from '@backstage/core-components';
import { Box, Divider, makeStyles, Typography } from '@material-ui/core';

import { ProvidersTabContent } from '../providers/ProvidersTabContent';
import { PoliciesTabContent } from '../policies/PoliciesTabContent';
import { ServiceTypesTabContent } from '../service-types/ServiceTypesTabContent';
import { CatalogItemsTabContent } from '../catalog-items/CatalogItemsTabContent';
import { CatalogItemInstancesTabContent } from '../catalog-item-instances/CatalogItemInstancesTabContent';
import {
  policiesRouteRef,
  serviceTypesRouteRef,
  catalogItemsRouteRef,
  catalogItemInstancesRouteRef,
} from '../../routes';
import { isDarkMode } from '../../components/dcmTheme';

const useStyles = makeStyles(theme => {
  const isDark = isDarkMode(theme);
  return {
    pageTitle: {
      fontWeight: 700 as const,
    },
    tabbedLayout: {
      '& .MuiTab-root': {
        color: `${
          isDark ? 'rgba(255, 255, 255, 0.7)' : theme.palette.text.secondary
        } !important`,
      },
      '& .MuiTab-root.Mui-selected': {
        color: `${
          isDark ? theme.palette.common.white : theme.palette.text.primary
        } !important`,
      },
      '& .MuiTabs-indicator': {
        backgroundColor: theme.palette.primary.main,
      },
    },
  };
});

export const DataCenterPage = () => {
  const classes = useStyles();
  return (
    <Page themeId="tool">
      <Header
        pageTitleOverride="Data Center"
        title={
          <Typography variant="h3" className={classes.pageTitle}>
            Data Center
          </Typography>
        }
      />
      <Divider />
      <Content>
        <Box className={classes.tabbedLayout}>
          <TabbedLayout>
            <TabbedLayout.Route path="/" title="Providers">
              <ProvidersTabContent />
            </TabbedLayout.Route>
            <TabbedLayout.Route path={policiesRouteRef.path} title="Policies">
              <PoliciesTabContent />
            </TabbedLayout.Route>
            <TabbedLayout.Route
              path={serviceTypesRouteRef.path}
              title="Service types"
            >
              <ServiceTypesTabContent />
            </TabbedLayout.Route>
            <TabbedLayout.Route
              path={catalogItemsRouteRef.path}
              title="Catalog items"
            >
              <CatalogItemsTabContent />
            </TabbedLayout.Route>
            <TabbedLayout.Route
              path={catalogItemInstancesRouteRef.path}
              title="Instances"
            >
              <CatalogItemInstancesTabContent />
            </TabbedLayout.Route>
          </TabbedLayout>
        </Box>
      </Content>
    </Page>
  );
};
