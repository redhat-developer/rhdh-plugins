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

import { useRouteRefParams } from '@backstage/core-plugin-api';

import { useCollection } from '../hooks/useCollection';
import { useCollectionPlugins } from '../hooks/useCollectionPlugins';

import { collectionRouteRef } from '../routes';
import { PluginCard, PluginCardGrid, PluginCardSkeleton } from './PluginCard';
import { Markdown } from './Markdown';

export const MarketplaceCollectionGridLoader = () => {
  const params = useRouteRefParams(collectionRouteRef);
  const collection = useCollection(params.namespace, params.name);
  const plugins = useCollectionPlugins(params.namespace, params.name);

  return (
    <div>
      {collection.data?.metadata?.description ? (
        <Markdown content={collection.data.metadata.description} />
      ) : null}

      <PluginCardGrid>
        {plugins.isLoading ? (
          <>
            <PluginCardSkeleton />
            <PluginCardSkeleton />
            <PluginCardSkeleton />
            <PluginCardSkeleton />
          </>
        ) : null}
        {plugins.data?.map(plugin => (
          <PluginCard
            key={`${plugin.metadata.namespace}/${plugin.metadata.name}`}
            plugin={plugin}
          />
        ))}
      </PluginCardGrid>
    </div>
  );
};
