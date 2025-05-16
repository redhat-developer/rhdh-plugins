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
import { Routes, Route } from 'react-router-dom';

import { Page, Header, TabbedLayout } from '@backstage/core-components';

import { themeId } from '../consts';

import { ReactQueryProvider } from '../components/ReactQueryProvider';

import { MarketplaceCatalogContent } from '../components/MarketplaceCatalogContent';

import { MarketplaceCollectionsGrid } from '../components/MarketplaceCollectionsGrid';
import { MarketplaceCollectionPage } from './MarketplaceCollectionPage';

import { MarketplacePluginsTable } from '../components/MarketplacePluginsTable';
import { MarketplacePluginDrawer } from '../components/MarketplacePluginDrawer';
import { MarketplacePluginInstallPage } from './MarketplacePluginInstallPage';

import { MarketplacePackagesTable } from '../components/MarketplacePackagesTable';
import { MarketplacePackageDrawer } from '../components/MarketplacePackageDrawer';

import { useCollections } from '../hooks/useCollections';

import { MarketplacePackageInstallPage } from './MarketplacePackageInstallPage';

const Tabs = () => {
  const showCollections = !!useCollections({}).data?.items?.length;

  return (
    <>
      <Page themeId={themeId}>
        <Header title="Extensions" />
        <TabbedLayout>
          <TabbedLayout.Route path="/catalog" title="Catalog">
            <MarketplaceCatalogContent />
          </TabbedLayout.Route>
          {showCollections && (
            <TabbedLayout.Route path="/collections" title="Collections">
              <MarketplaceCollectionsGrid />
            </TabbedLayout.Route>
          )}
          <TabbedLayout.Route path="/plugins" title="Plugins">
            <MarketplacePluginsTable />
          </TabbedLayout.Route>
          <TabbedLayout.Route path="/packages" title="Packages">
            <MarketplacePackagesTable />
          </TabbedLayout.Route>
        </TabbedLayout>
      </Page>
      <Routes>
        <Route
          path="/plugins/:namespace/:name"
          Component={MarketplacePluginDrawer}
        />
        <Route
          path="/packages/:namespace/:name"
          Component={MarketplacePackageDrawer}
        />
      </Routes>
    </>
  );
};

export const MarketplaceTabbedPageRouter = () => (
  <ReactQueryProvider>
    <Routes>
      <Route
        path="/collections/:namespace/:name"
        Component={MarketplaceCollectionPage}
      />
      <Route
        path="/plugins/:namespace/:name/install"
        Component={MarketplacePluginInstallPage}
      />
      <Route
        path="/packages/:namespace/:name/install"
        Component={MarketplacePackageInstallPage}
      />
      <Route path="/*" Component={Tabs} />
    </Routes>
  </ReactQueryProvider>
);
