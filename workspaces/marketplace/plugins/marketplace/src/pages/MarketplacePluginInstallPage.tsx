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

import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import {
  Page,
  Header,
  Content,
  ErrorBoundary,
} from '@backstage/core-components';

import { themeId } from '../consts';
import { pluginInstallRouteRef, pluginRouteRef } from '../routes';
import { ReactQueryProvider } from '../components/ReactQueryProvider';
import { usePlugin } from '../hooks/usePlugin';
import { MarketplacePluginInstallContentLoader } from '../components/MarketplacePluginInstallContent';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { MarketplacePluginInstallStatus } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

const PluginInstallHeader = () => {
  const params = useRouteRefParams(pluginInstallRouteRef);
  const plugin = usePlugin(params.namespace, params.name);

  const displayName = plugin.data?.metadata?.title ?? params.name;
  const pluginInstallStatus = plugin.data?.spec?.installStatus;
  const isPluginInstalled =
    pluginInstallStatus === MarketplacePluginInstallStatus.Installed ||
    pluginInstallStatus === MarketplacePluginInstallStatus.UpdateAvailable ||
    pluginInstallStatus === MarketplacePluginInstallStatus.PartiallyInstalled ||
    pluginInstallStatus === MarketplacePluginInstallStatus.Disabled;
  const title = isPluginInstalled
    ? `Edit ${displayName} configurations`
    : `Install ${displayName}`;
  const pluginLink = useRouteRef(pluginRouteRef)({
    namespace: params.namespace,
    name: params.name,
  });

  const theme = useTheme();
  const headerBorderBottomColor =
    theme.palette.mode === 'dark' ? '#A3A3A3' : '#C7C7C7';

  return (
    // TODO: add header border color and Breadcrumbs styles in theme plugin
    <Box
      sx={{
        display: 'contents',
        width: '100%',
        '& > header': {
          borderBottom: `1px solid ${headerBorderBottomColor}`,
        },
        '& > header div[class*="BreadcrumbsCurrentPage-root"] > p': {
          fontStyle: 'italic',
        },
      }}
    >
      <Header title={title} type="Plugin" typeLink={pluginLink} />
    </Box>
  );
};

export const MarketplacePluginInstallPage = () => (
  <ReactQueryProvider>
    <Page themeId={themeId}>
      <PluginInstallHeader />
      <Content>
        <ErrorBoundary>
          <MarketplacePluginInstallContentLoader />
        </ErrorBoundary>
      </Content>
    </Page>
  </ReactQueryProvider>
);
