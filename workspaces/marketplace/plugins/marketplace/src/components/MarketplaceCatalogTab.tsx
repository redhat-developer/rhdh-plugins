/*
 * Copyright 2024 The Backstage Authors
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

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { usePlugins } from '../hooks/usePlugins';
import { MarketplaceCatalogGrid } from './MarketplaceCatalogGrid';
import { SearchTextField } from './SearchTextField';

export const MarketplaceCatalogTab = () => {
  const plugins = usePlugins();

  return (
    <Card>
      <Stack gap={3} sx={{ p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5">
            All plugins
            {plugins.data ? ` (${plugins.data.length})` : null}
          </Typography>
          <SearchTextField variant="filter" />
        </Stack>
        <MarketplaceCatalogGrid />
      </Stack>
    </Card>
  );
};
