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

import { useState } from 'react';
import {
  CodeSnippet,
  Content,
  LinkButton,
  WarningPanel,
} from '@backstage/core-components';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Launch from '@mui/icons-material/Launch';
import AlertTitle from '@mui/material/AlertTitle';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';

import { SearchTextField } from '../shared-components/SearchTextField';

import { useCollections } from '../hooks/useCollections';
import { useExtensionsConfiguration } from '../hooks/useExtensionsConfiguration';
import { useFilteredPlugins } from '../hooks/useFilteredPlugins';
import { useNodeEnvironment } from '../hooks/useNodeEnvironment';
import { MarketplaceCatalogGrid } from './MarketplaceCatalogGrid';
import { MarketplacePluginFilter } from './MarketplacePluginFilter';
import { CollectionHorizontalScrollRow } from './CollectionHorizontalScrollRow';
import { useInstallationContext } from './InstallationContext';
import { InstalledPluginsDialog } from './InstalledPluginsDialog';
import notFoundImag from '../assets/notfound.png';
import {
  EXTENSIONS_CONFIG_YAML,
  generateExtensionsEnableLineNumbers,
} from '../utils';

const EmptyState = ({ isError }: { isError?: boolean }) => (
  <Content>
    <Grid
      container
      alignItems="center"
      style={{ maxWidth: 1000, margin: 'auto' }}
    >
      <Grid item xs={6}>
        <Stack gap={3} justifyContent="center">
          <Typography variant="h1">
            {isError
              ? 'Must enable the Extensions backend plugin'
              : 'No plugins found'}
          </Typography>
          <Typography variant="body1">
            {isError
              ? "Configure the '@red-hat-developer-hub/backstage-plugin-marketplace-backend' plugin."
              : 'There was an error with loading plugins. Check your configuration or review plugin documentation to resolve. You can also explore other available plugins.'}
          </Typography>
          <Grid container spacing={2}>
            {!isError && (
              <Grid item>
                <LinkButton
                  variant="contained"
                  color="primary"
                  to="https://developers.redhat.com/products/rhdh/plugins#communitypreinstalled"
                  endIcon={<Launch />}
                >
                  View all plugins
                </LinkButton>
              </Grid>
            )}
            <Grid item>
              <LinkButton
                variant="outlined"
                color="primary"
                to="https://docs.redhat.com/en/documentation/red_hat_developer_hub/"
                endIcon={<Launch />}
              >
                View documentation
              </LinkButton>
            </Grid>
          </Grid>
        </Stack>
      </Grid>
      <Grid item xs={6}>
        <img src={notFoundImag} alt="" style={{ width: '100%' }} />
      </Grid>
    </Grid>
  </Content>
);

export const MarketplaceCatalogContent = () => {
  const [openInstalledPluginsDialog, setOpenInstalledPluginsDialog] =
    useState(false);
  const extensionsConfig = useExtensionsConfiguration();
  const { installedPlugins } = useInstallationContext();
  const nodeEnvironment = useNodeEnvironment();
  const featuredCollections = useCollections({
    filter: {
      'metadata.name': 'featured',
    },
  });
  const filteredPlugins = useFilteredPlugins();

  let title = 'Plugins';
  if (filteredPlugins.data && filteredPlugins.data.totalItems > 0) {
    // const { filteredItems, totalItems } = filteredPlugins.data;
    // if (filteredItems !== totalItems) {
    //   title += ` (${filteredItems} of ${totalItems})`;
    // } else {
    //   title += ` (${totalItems})`;
    // }
    title += ` (${filteredPlugins.data.filteredItems})`;
  }

  if (filteredPlugins.error?.message.includes('404')) {
    return <EmptyState isError />;
  }

  if (filteredPlugins.data?.totalItems === 0) {
    return <EmptyState />;
  }

  const isProductionEnvironment =
    nodeEnvironment?.data?.nodeEnv === 'production';

  const showExtensionsConfigurationAlert =
    !isProductionEnvironment && !extensionsConfig.data?.enabled;

  const installedPluginsCount = Object.entries(installedPlugins)?.length ?? 0;

  const alertMessages = {
    multiplePlugins: (count: number) =>
      `You have ${count} plugins that require a restart of your backend system to either finish installing or updating.`,
    singlePlugin: (name: string) => (
      <>
        The <b>{name}</b> plugin requires a restart of the backend system to
        finish installing or updating.
      </>
    ),
  };

  const pluginInfo = () => {
    if (installedPluginsCount > 1) {
      return <>{alertMessages.multiplePlugins(installedPluginsCount)}</>;
    }

    const pluginName = Object.keys(installedPlugins)[0];
    return <>{alertMessages.singlePlugin(pluginName)}</>;
  };

  return (
    <>
      {isProductionEnvironment && (
        <Alert severity="info" sx={{ mb: '1rem' }}>
          <AlertTitle>
            Plugin installation is disabled in the production environment.
          </AlertTitle>
        </Alert>
      )}
      {showExtensionsConfigurationAlert && (
        <>
          <WarningPanel
            title="Plugin installation is disabled."
            defaultExpanded
            severity="info"
            message={
              <>
                Example how to enable extensions plugin installation
                <CodeSnippet
                  language="yaml"
                  showLineNumbers
                  highlightedNumbers={generateExtensionsEnableLineNumbers()}
                  text={EXTENSIONS_CONFIG_YAML}
                />
              </>
            }
          />
          <br />
        </>
      )}
      {installedPluginsCount > 0 && (
        <Alert severity="info" sx={{ mb: '1rem' }}>
          <AlertTitle>Backend restart required</AlertTitle>
          {pluginInfo()}
          {installedPluginsCount > 1 && (
            <Typography component="div" sx={{ pt: '8px' }}>
              <Link
                component="button"
                underline="none"
                onClick={() => {
                  setOpenInstalledPluginsDialog(true);
                }}
              >
                View plugins
              </Link>
            </Typography>
          )}
        </Alert>
      )}
      <CatalogFilterLayout>
        <CatalogFilterLayout.Filters>
          <MarketplacePluginFilter />
        </CatalogFilterLayout.Filters>
        <CatalogFilterLayout.Content>
          <Stack direction="column" gap={3}>
            {featuredCollections.data?.items?.map(collection => (
              <CollectionHorizontalScrollRow
                key={`${collection.metadata.namespace}/${collection.metadata.name}`}
                collection={collection}
              />
            ))}

            <Card>
              <Stack gap={3} sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h4">{title}</Typography>
                  <SearchTextField variant="search" />
                </Stack>

                <MarketplaceCatalogGrid />
              </Stack>
            </Card>
          </Stack>
        </CatalogFilterLayout.Content>
      </CatalogFilterLayout>
      <InstalledPluginsDialog
        open={openInstalledPluginsDialog}
        onClose={setOpenInstalledPluginsDialog}
      />
    </>
  );
};
