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

import {
  Routes,
  Route,
  useParams,
  useLocation,
  Navigate,
} from 'react-router-dom';
import {
  Page,
  Header,
  ErrorBoundary,
  TabbedLayout,
} from '@backstage/core-components';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import Typography from '@mui/material/Typography';

import { themeId } from '../consts';
import { ReactQueryProvider } from '../components/ReactQueryProvider';
import { MarketplaceCatalogContent } from '../components/MarketplaceCatalogContent';
import { InstalledPackagesTable } from '../components/InstalledPackages/InstalledPackagesTable';
import { useInstalledPackagesCount } from '../hooks/useInstalledPackagesCount';
import { MarketplaceCollectionPage } from './MarketplaceCollectionPage';
import { MarketplacePluginDrawer } from '../components/MarketplacePluginDrawer';
import { MarketplacePluginInstallPage } from './MarketplacePluginInstallPage';
import { MarketplacePackageDrawer } from '../components/MarketplacePackageDrawer';
import { MarketplacePackageInstallPage } from './MarketplacePackageInstallPage';
import { InstallationContextProvider } from '../components/InstallationContext';
import { useTranslation } from '../hooks/useTranslation';

// Constants for consistent styling
const TAB_ICON_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '14px',
} as const;

const ICON_PROPS = {
  fontSize: 'small' as const,
  sx: { pr: '2px' },
};

// Helper component for tab labels with icons
const TabLabel = ({
  icon,
  children,
}: {
  icon: React.ReactElement;
  children: React.ReactNode;
}) => (
  <Typography component="span" style={TAB_ICON_STYLE}>
    {icon} {children}
  </Typography>
);

const PackageDeepLinkRedirect = () => {
  const { namespace, name } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return (
    <Navigate
      to={`../installed-packages/${namespace}/${name}?${params.toString()}`}
      replace
    />
  );
};

const MarketplacePage = () => {
  const { t } = useTranslation();

  const installedPackages = useInstalledPackagesCount();
  const installedPluginsTitle = installedPackages?.isLoading
    ? t('header.installedPackages')
    : t('header.installedPackagesWithCount' as any, {
        count: (installedPackages?.data ?? 0).toString(),
      });

  return (
    <>
      <Page themeId={themeId}>
        <Header title={t('header.extensions')} />
        <TabbedLayout>
          <TabbedLayout.Route
            path="/catalog"
            title=""
            tabProps={{
              icon: (
                <TabLabel icon={<CategoryOutlinedIcon {...ICON_PROPS} />}>
                  {t('header.catalog')}
                </TabLabel>
              ),
            }}
          >
            <ErrorBoundary>
              <MarketplaceCatalogContent />
            </ErrorBoundary>
          </TabbedLayout.Route>

          <TabbedLayout.Route
            path="/installed-packages"
            title=""
            tabProps={{
              icon: (
                <TabLabel icon={<FactCheckOutlinedIcon {...ICON_PROPS} />}>
                  {installedPluginsTitle}
                </TabLabel>
              ),
            }}
          >
            <ErrorBoundary>
              <InstalledPackagesTable />
            </ErrorBoundary>
          </TabbedLayout.Route>
        </TabbedLayout>
      </Page>

      <Routes>
        <Route
          path="/plugins/:namespace/:name"
          Component={MarketplacePluginDrawer}
        />
        <Route
          path="/installed-packages/:namespace/:name"
          Component={MarketplacePackageDrawer}
        />
      </Routes>
    </>
  );
};

export const DynamicMarketplacePluginRouter = () => (
  <InstallationContextProvider>
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
        {/* Use existing install route as the edit page */}
        <Route
          path="/packages/:namespace/:name/install"
          Component={MarketplacePackageInstallPage}
        />
        {/* Redirect package routes to show installed-packages tab */}
        <Route
          path="/packages/:namespace/:name"
          Component={PackageDeepLinkRedirect}
        />
        <Route path="/*" Component={MarketplacePage} />
      </Routes>
    </ReactQueryProvider>
  </InstallationContextProvider>
);

export const DynamicMarketplacePluginContent = () => (
  <ReactQueryProvider>
    <MarketplaceCatalogContent />
  </ReactQueryProvider>
);
