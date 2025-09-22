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

import { ExtensionsHomePage } from './ExtensionsHomePage';

import { ExtensionsPluginsPage } from './ExtensionsPluginsPage';
import { ExtensionsPluginPage } from './ExtensionsPluginPage';
import { ExtensionsPluginInstallPage } from './ExtensionsPluginInstallPage';

import { ExtensionsPackagesPage } from './ExtensionsPackagesPage';
import { ExtensionsPackagePage } from './ExtensionsPackagePage';
import { ExtensionsPackageInstallPage } from './ExtensionsPackageInstallPage';

import { ExtensionsCollectionsPage } from './ExtensionsCollectionsPage';
import { ExtensionsCollectionPage } from './ExtensionsCollectionPage';
import { InstallationContextProvider } from '../components/InstallationContext';

const NotFound = () => {
  const NotFoundErrorPage = useApp().getComponents().NotFoundErrorPage;
  return <NotFoundErrorPage />;
};

export const ExtensionsFullPageRouter = () => {
  return (
    <InstallationContextProvider>
      <Routes>
        <Route path="/" Component={ExtensionsHomePage} />

        <Route path="/plugins" Component={ExtensionsPluginsPage} />
        <Route
          path="/plugins/:namespace/:name"
          Component={ExtensionsPluginPage}
        />
        <Route
          path="/plugins/:namespace/:name/install"
          Component={ExtensionsPluginInstallPage}
        />

        <Route path="/packages" Component={ExtensionsPackagesPage} />
        <Route
          path="/packages/:namespace/:name"
          Component={ExtensionsPackagePage}
        />
        <Route
          path="/packages/:namespace/:name/install"
          Component={ExtensionsPackageInstallPage}
        />

        <Route path="/collections" Component={ExtensionsCollectionsPage} />
        <Route
          path="/collection/:namespace/:name"
          Component={ExtensionsCollectionPage}
        />
        <Route path="*" Component={NotFound} />
      </Routes>
    </InstallationContextProvider>
  );
};
