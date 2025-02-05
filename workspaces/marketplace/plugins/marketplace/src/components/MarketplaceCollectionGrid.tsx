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

import { useQueryParamState, ItemCardGrid } from '@backstage/core-components';

import { usePluginLists } from '../hooks/usePluginLists';

import { PluginCard, PluginCardGrid, PluginCardSkeleton } from './PluginCard';

export const MarketplaceCollectionGrid = () => {
  const collections = usePluginLists();
  const collection = collections.data?.[0];

  const [search] = useQueryParamState<string | undefined>('q');

  return (
    <PluginCardGrid>
      {collections.isLoading ? (
        <>
          <PluginCardSkeleton />
          <PluginCardSkeleton />
          <PluginCardSkeleton />
          <PluginCardSkeleton />
        </>
      ) : null}
      {collection?.map(plugin => (
        <PluginCard key={plugin.metadata.name} plugin={plugin} />
      ))}
    </PluginCardGrid>
  );
};
