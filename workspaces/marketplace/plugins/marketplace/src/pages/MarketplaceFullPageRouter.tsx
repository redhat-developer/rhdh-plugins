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

import { Route, Routes } from 'react-router-dom';

import { useApp } from '@backstage/core-plugin-api';

import { MarketplaceHomePage } from './MarketplaceHomePage';

import { MarketplacePluginsPage } from './MarketplacePluginsPage';
import { MarketplacePluginPage } from './MarketplacePluginPage';
import { MarketplacePluginInstallPage } from './MarketplacePluginInstallPage';

import { MarketplacePackagesPage } from './MarketplacePackagesPage';
import { MarketplacePackagePage } from './MarketplacePackagePage';
import { MarketplacePackageInstallPage } from './MarketplacePackageInstallPage';

import { MarketplaceCollectionsPage } from './MarketplaceCollectionsPage';
import { MarketplaceCollectionPage } from './MarketplaceCollectionPage';
import { InstallationContextProvider } from '../components/InstallationContext';

const NotFound = () => {
  const NotFoundErrorPage = useApp().getComponents().NotFoundErrorPage;
  return <NotFoundErrorPage />;
};

export const MarketplaceFullPageRouter = () => {
  return (
    <InstallationContextProvider>
      <Routes>
        <Route path="/" Component={MarketplaceHomePage} />

        <Route path="/plugins" Component={MarketplacePluginsPage} />
        <Route
          path="/plugins/:namespace/:name"
          Component={MarketplacePluginPage}
        />
        <Route
          path="/plugins/:namespace/:name/install"
          Component={MarketplacePluginInstallPage}
        />

        <Route path="/packages" Component={MarketplacePackagesPage} />
        <Route
          path="/packages/:namespace/:name"
          Component={MarketplacePackagePage}
        />
        <Route
          path="/packages/:namespace/:name/install"
          Component={MarketplacePackageInstallPage}
        />

        <Route path="/collections" Component={MarketplaceCollectionsPage} />
        <Route
          path="/collection/:namespace/:name"
          Component={MarketplaceCollectionPage}
        />
        <Route path="*" Component={NotFound} />
      </Routes>
    </InstallationContextProvider>
  );
};
