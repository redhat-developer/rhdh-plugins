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
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { themeId } from '../consts';
import { pluginInstallRouteRef, pluginRouteRef } from '../routes';
import { ReactQueryProvider } from '../components/ReactQueryProvider';
import { usePlugin } from '../hooks/usePlugin';
import { useNodeEnvironment } from '../hooks/useNodeEnvironment';
import { ExtensionsPluginInstallContentLoader } from '../components/ExtensionsPluginInstallContent';
import { useTranslation } from '../hooks/useTranslation';

import { isPluginInstalled } from '../utils';
import { useExtensionsConfiguration } from '../hooks/useExtensionsConfiguration';

const PluginInstallHeader = () => {
  const { t } = useTranslation();
  const nodeEnvironment = useNodeEnvironment();
  const extensionsConfig = useExtensionsConfiguration();
  const params = useRouteRefParams(pluginInstallRouteRef);
  const plugin = usePlugin(params.namespace, params.name);
  const isInstallationEnabled = extensionsConfig.data?.enabled ?? false;
  const isProductionEnvironment =
    nodeEnvironment?.data?.nodeEnv === 'production';

  const displayName = plugin.data?.metadata?.title ?? params.name;
  const getTitle = () => {
    if (isProductionEnvironment || !isInstallationEnabled) {
      return displayName;
    }
    if (isPluginInstalled(plugin.data?.spec?.installStatus)) {
      return t('actions.editTitle' as any, { displayName });
    }
    return t('actions.installTitle' as any, { displayName });
  };

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
      <Header title={getTitle()} type="Plugins" typeLink={pluginLink} />
    </Box>
  );
};

export const ExtensionsPluginInstallPage = () => (
  <ReactQueryProvider>
    <Page themeId={themeId}>
      <PluginInstallHeader />
      <Content>
        <ErrorBoundary>
          <ExtensionsPluginInstallContentLoader />
        </ErrorBoundary>
      </Content>
    </Page>
  </ReactQueryProvider>
);
