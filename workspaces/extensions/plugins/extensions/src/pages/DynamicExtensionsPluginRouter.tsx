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

import type { ComponentType } from 'react';
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

import { ExtensionsCatalogContent } from '../components/ExtensionsCatalogContent';

// import { ExtensionsCollectionsGrid } from '../components/ExtensionsCollectionsGrid';
import { ExtensionsCollectionPage } from './ExtensionsCollectionPage';

// import { ExtensionsPluginsTable } from '../components/ExtensionsPluginsTable';
import { ExtensionsPluginDrawer } from '../components/ExtensionsPluginDrawer';
import { ExtensionsPluginInstallPage } from './ExtensionsPluginInstallPage';

// import { ExtensionsPackagesTable } from '../components/ExtensionsPackagesTable';
import { ExtensionsPackageDrawer } from '../components/ExtensionsPackageDrawer';
import { ExtensionsPackageInstallPage } from './ExtensionsPackageInstallPage';

export interface PluginTab {
  Component: ComponentType;
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
      Component: ExtensionsCatalogContent,
      config: {
        path: '',
        title: 'Catalog',
      },
    },
  ];

  return (
    <>
      <Page themeId={themeId}>
        <Header title="Extensions" />
        <TabbedLayout>
          {/* <TabbedLayout.Route path="/catalog" title="Extensions">
            <ErrorBoundary>
              <ExtensionsCatalogContent />
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
              <ExtensionsCollectionsGrid />
            </ErrorBoundary>
          </TabbedLayout.Route>
          <TabbedLayout.Route path="/plugins" title="Plugins">
            <ErrorBoundary>
              <ExtensionsPluginsTable />
            </ErrorBoundary>
          </TabbedLayout.Route>
          <TabbedLayout.Route path="/packages" title="Packages">
            <ErrorBoundary>
              <ExtensionsPackagesTable />
            </ErrorBoundary>
          </TabbedLayout.Route>
          */}
        </TabbedLayout>
      </Page>
      <Routes>
        <Route
          path="/plugins/:namespace/:name"
          Component={ExtensionsPluginDrawer}
        />
        <Route
          path="/packages/:namespace/:name"
          Component={ExtensionsPackageDrawer}
        />
      </Routes>
    </>
  );
};

export const DynamicExtensionsPluginRouter = () => (
  <ReactQueryProvider>
    <Routes>
      <Route
        path="/collections/:namespace/:name"
        Component={ExtensionsCollectionPage}
      />
      <Route
        path="/plugins/:namespace/:name/install"
        Component={ExtensionsPluginInstallPage}
      />
      <Route
        path="/packages/:namespace/:name/install"
        Component={ExtensionsPackageInstallPage}
      />
      <Route path="/*" Component={Tabs} />
    </Routes>
  </ReactQueryProvider>
);

export const DynamicExtensionsPluginContent = () => (
  <ReactQueryProvider>
    <ExtensionsCatalogContent />
  </ReactQueryProvider>
);
