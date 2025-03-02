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

import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// import { FilterLayout } from '../shared-components/FilterLayout';
import { SearchTextField } from '../shared-components/SearchTextField';

import { useCollections } from '../hooks/useCollections';
import { usePlugins } from '../hooks/usePlugins';
import { MarketplaceCatalogGrid } from './MarketplaceCatalogGrid';
import { MarketplacePluginFilter } from './MarketplacePluginFilter';
import { CollectionHorizontalScrollRow } from './CollectionHorizontalScrollRow';

export const MarketplaceCatalogContent = () => {
  const featuredCollections = useCollections({
    filter: {
      'metadata.name': 'featured',
    },
  });

  const plugins = usePlugins({});

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
                <Typography variant="h4">
                  Plugins
                  {plugins.data ? ` (${plugins.data?.items?.length})` : null}
                </Typography>
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
