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

import { Content, LinkButton } from '@backstage/core-components';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Launch from '@mui/icons-material/Launch';

import { SearchTextField } from '../shared-components/SearchTextField';

import { useCollections } from '../hooks/useCollections';
import { useFilteredPlugins } from '../hooks/useFilteredPlugins';
import { MarketplaceCatalogGrid } from './MarketplaceCatalogGrid';
import { MarketplacePluginFilter } from './MarketplacePluginFilter';
import { CollectionHorizontalScrollRow } from './CollectionHorizontalScrollRow';

import notFoundImag from '../assets/notfound.png';

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

  return (
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
  );
};
