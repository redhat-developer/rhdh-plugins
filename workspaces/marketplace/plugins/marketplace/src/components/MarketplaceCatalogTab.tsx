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

import { useQueryParamState } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { MarketplaceCatalogGrid } from './MarketplaceCatalogGrid';
import { usePlugins } from '../hooks/usePlugins';

export const MarketplaceCatalogTab = () => {
  const [search, setSearch] = useQueryParamState<string | undefined>('q');

  const plugins = usePlugins();

  return (
    <Card>
      <Box sx={{ p: 2 }}>
        <Stack direction="row">
          <Typography variant="h2" sx={{ pb: 2 }}>
            All plugins
            {plugins.data ? ` (${plugins.data.length})` : null}
          </Typography>

          {/* TODO: Align with Backstage UI */}
          <TextField
            value={search || ''}
            onChange={event =>
              setSearch(event.target.value ? event.target.value : undefined)
            }
          />
        </Stack>
        <MarketplaceCatalogGrid />
      </Box>
    </Card>
  );
};
