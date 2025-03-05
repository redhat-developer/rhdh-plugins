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

import {
  Page,
  Header,
  TabbedLayout,
  ErrorBoundary,
} from '@backstage/core-components';

import { useScalprum } from '@scalprum/react-core';

import { themeId } from '../consts';

import { ReactQueryProvider } from '../components/ReactQueryProvider';

import { MarketplaceCatalogContent } from '../components/MarketplaceCatalogContent';

// import { MarketplaceCollectionsGrid } from '../components/MarketplaceCollectionsGrid';
import { MarketplaceCollectionPage } from './MarketplaceCollectionPage';

// import { MarketplacePluginsTable } from '../components/MarketplacePluginsTable';
import { MarketplacePluginDrawer } from '../components/MarketplacePluginDrawer';
import { MarketplacePluginInstallPage } from './MarketplacePluginInstallPage';

// import { MarketplacePackagesTable } from '../components/MarketplacePackagesTable';
import { MarketplacePackageDrawer } from '../components/MarketplacePackageDrawer';
import { MarketplacePackageInstallPage } from './MarketplacePackageInstallPage';

export interface PluginTab {
  Component: React.ComponentType;
  config: {
    path: string;
    title: string;
  };
}

export interface ScalprumState {
  api?: {
    dynamicRootConfig?: {
      mountPoints?: {
        'internal.plugins/tab': PluginTab[];
      };
    };
  };
}

const Tabs = () => {
  const scalprum = useScalprum<ScalprumState>();

  const tabs = scalprum.api?.dynamicRootConfig?.mountPoints?.[
    'internal.plugins/tab'
  ] ?? [
    {
      Component: MarketplaceCatalogContent,
      config: {
        path: '',
        title: 'Catalog',
      },
    },
  ];

  return (
    <>
      <Page themeId={themeId}>
        <Header title="Extenions" />
        <TabbedLayout>
          {/* <TabbedLayout.Route path="/catalog" title="Marketplace">
            <ErrorBoundary>
              <MarketplaceCatalogContent />
            </ErrorBoundary>
          </TabbedLayout.Route> */}

          {tabs.map(({ Component, config }) => (
            <TabbedLayout.Route
              key={config.path}
              path={config.path}
              title={config.title}
            >
              <ErrorBoundary>
                <Component />
              </ErrorBoundary>
            </TabbedLayout.Route>
          ))}

          {/*       
          <TabbedLayout.Route path="/collections" title="Collections">
            <ErrorBoundary>
              <MarketplaceCollectionsGrid />
            </ErrorBoundary>
          </TabbedLayout.Route>
          <TabbedLayout.Route path="/plugins" title="Plugins">
            <ErrorBoundary>
              <MarketplacePluginsTable />
            </ErrorBoundary>
          </TabbedLayout.Route>
          <TabbedLayout.Route path="/packages" title="Packages">
            <ErrorBoundary>
              <MarketplacePackagesTable />
            </ErrorBoundary>
          </TabbedLayout.Route>
          */}
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

export const DynamicMarketplacePluginRouter = () => (
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

export const DynamicMarketplacePluginContent = () => (
  <ReactQueryProvider>
    <MarketplaceCatalogContent />
  </ReactQueryProvider>
);
