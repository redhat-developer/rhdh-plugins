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

import { Routes, Route } from 'react-router-dom';

import { Page, Header, TabbedLayout } from '@backstage/core-components';

import { useTranslation } from '../hooks/useTranslation';

import { themeId } from '../consts';

import { ReactQueryProvider } from '../components/ReactQueryProvider';

import { ExtensionsCatalogContent } from '../components/ExtensionsCatalogContent';

import { ExtensionsCollectionsGrid } from '../components/ExtensionsCollectionsGrid';
import { ExtensionsCollectionPage } from './ExtensionsCollectionPage';

import { ExtensionsPluginsTable } from '../components/ExtensionsPluginsTable';
import { ExtensionsPluginDrawer } from '../components/ExtensionsPluginDrawer';
import { ExtensionsPluginInstallPage } from './ExtensionsPluginInstallPage';

import { ExtensionsPackagesTable } from '../components/ExtensionsPackagesTable';
import { ExtensionsPackageDrawer } from '../components/ExtensionsPackageDrawer';
import { InstallationContextProvider } from '../components/InstallationContext';

import { useCollections } from '../hooks/useCollections';

import { ExtensionsPackageInstallPage } from './ExtensionsPackageInstallPage';

const Tabs = () => {
  const { t } = useTranslation();
  const showCollections = !!useCollections({}).data?.items?.length;

  return (
    <>
      <Page themeId={themeId}>
        <Header title={t('header.title')} />
        <TabbedLayout>
          <TabbedLayout.Route path="/catalog" title={t('header.pluginsPage')}>
            <ExtensionsCatalogContent />
          </TabbedLayout.Route>
          {showCollections && (
            <TabbedLayout.Route
              path="/collections"
              title={t('header.collectionsPage')}
            >
              <ExtensionsCollectionsGrid />
            </TabbedLayout.Route>
          )}
          <TabbedLayout.Route path="/plugins" title={t('header.pluginsPage')}>
            <ExtensionsPluginsTable />
          </TabbedLayout.Route>
          <TabbedLayout.Route path="/packages" title={t('header.packagesPage')}>
            <ExtensionsPackagesTable />
          </TabbedLayout.Route>
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

export const ExtensionsTabbedPageRouter = () => (
  <ReactQueryProvider>
    <InstallationContextProvider>
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
    </InstallationContextProvider>
  </ReactQueryProvider>
);
