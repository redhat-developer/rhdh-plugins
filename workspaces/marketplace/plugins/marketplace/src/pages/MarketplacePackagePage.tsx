/*
 * Copyright The Backstage Authors
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
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import {
  Page,
  Header,
  InfoCard,
  TabbedLayout,
  LinkButton,
} from '@backstage/core-components';

import Grid from '@mui/material/Grid';

import {
  packageInstallRouteRef,
  packageRouteRef,
  packagesRouteRef,
} from '../routes';
import { ReactQueryProvider } from '../components/ReactQueryProvider';
import { usePackage } from '../hooks/usePackage';

const PackageHeader = () => {
  const params = useRouteRefParams(packageRouteRef);

  const pkg = usePackage(params.namespace, params.name);

  const displayName = pkg.data?.metadata.title ?? params.name;
  const packagesLink = useRouteRef(packagesRouteRef)();

  return <Header title={displayName} type="Packages" typeLink={packagesLink} />;
};

export const MarketplacePackagePage = () => {
  const params = useRouteRefParams(packageRouteRef);
  const getInstallPath = useRouteRef(packageInstallRouteRef);

  return (
    <ReactQueryProvider>
      <Page themeId="marketplace">
        <PackageHeader />
        <TabbedLayout>
          <TabbedLayout.Route path="/" title="Overview">
            <>
              <LinkButton
                disabled
                to={getInstallPath({
                  namespace: params.namespace,
                  name: params.name,
                })}
                color="primary"
                variant="contained"
              >
                Install
              </LinkButton>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InfoCard title="About">
                    <p>Entity name: Title || name</p>
                    <p>Package name</p>
                    <p>Version</p>
                    <p>Install status</p>
                    <p>Plugin role</p>
                    <p>Supported version</p>
                    <p>Author</p>
                    <p>Support</p>
                    <p>Lifecycle</p>
                  </InfoCard>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoCard title="Part of">
                    <p>Part of plugins</p>
                  </InfoCard>
                </Grid>
              </Grid>
            </>
          </TabbedLayout.Route>
        </TabbedLayout>
      </Page>
    </ReactQueryProvider>
  );
};
