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

// import { HorizontalScrollGrid } from '@backstage/core-components';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { FilterLayout } from '../shared-components/FilterLayout';
import { SearchTextField } from '../shared-components/SearchTextField';

import { usePlugins } from '../hooks/usePlugins';
import { MarketplaceCatalogGrid } from './MarketplaceCatalogGrid';
import { MarketplacePluginFilter } from './MarketplacePluginFilter';
// import { PluginCardSkeleton } from './PluginCard';

export const MarketplaceCatalogContent = () => {
  const plugins = usePlugins({});

  return (
    <FilterLayout>
      <FilterLayout.Filter>
        <MarketplacePluginFilter />
      </FilterLayout.Filter>
      <FilterLayout.Content>
        {/* <h1>Featured</h1>

        <HorizontalScrollGrid>
          <Stack direction="row" gap={2} sx={{ px: 1, pt: 1, pb: 3 }}>
            <PluginCardSkeleton />
            <PluginCardSkeleton />
            <PluginCardSkeleton />
            <PluginCardSkeleton />
            <PluginCardSkeleton />
            <PluginCardSkeleton />
            <PluginCardSkeleton />
            <PluginCardSkeleton />
          </Stack>
        </HorizontalScrollGrid> */}

        <Card>
          <Stack gap={3} sx={{ p: 2 }}>
            {/* <Typography variant="h5">Featured</Typography>
            <HorizontalScrollGrid>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 300,
                  margin: 16,
                  backgroundColor: 'green',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 200,
                  margin: 16,
                  backgroundColor: 'red',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 300,
                  margin: 16,
                  backgroundColor: 'red',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 200,
                  margin: 16,
                  backgroundColor: 'red',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 300,
                  margin: 16,
                  backgroundColor: 'red',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 200,
                  margin: 16,
                  backgroundColor: 'red',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 300,
                  margin: 16,
                  backgroundColor: 'red',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 200,
                  margin: 16,
                  backgroundColor: 'red',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 300,
                  margin: 16,
                  backgroundColor: 'red',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 200,
                  margin: 16,
                  backgroundColor: 'red',
                }}
              >
                a
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 320,
                  height: 300,
                  margin: 16,
                  backgroundColor: 'green',
                }}
              >
                a
              </div>
            </HorizontalScrollGrid> */}

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h5">
                Plugins
                {plugins.data ? ` (${plugins.data?.items?.length})` : null}
              </Typography>
              <SearchTextField variant="search" />
            </Stack>

            <MarketplaceCatalogGrid />
          </Stack>
        </Card>
      </FilterLayout.Content>
    </FilterLayout>
  );
};
