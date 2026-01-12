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

import { HorizontalScrollGrid, Link } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';

import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { ExtensionsCollection } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { useCollectionPlugins } from '../hooks/useCollectionPlugins';
import { PluginCard, PluginCardSkeleton } from './PluginCard';
import { collectionRouteRef } from '../routes';
import { useTranslation } from '../hooks/useTranslation';
import { getTranslatedText } from '../translations/utils';

export const CollectionHorizontalScrollRowSkeleton = () => {
  return (
    <div>
      <Skeleton>
        <Typography variant="h4">Entry name</Typography>
      </Skeleton>
      <Stack
        direction="row"
        alignItems="stretch"
        gap={2}
        style={{ overflow: 'hidden' }}
      >
        <div style={{ flexShrink: 0, width: 340 }}>
          <PluginCardSkeleton />
        </div>
        <div style={{ flexShrink: 0, width: 340 }}>
          <PluginCardSkeleton />
        </div>
        <div style={{ flexShrink: 0, width: 340 }}>
          <PluginCardSkeleton />
        </div>
        <div style={{ flexShrink: 0, width: 340 }}>
          <PluginCardSkeleton />
        </div>
      </Stack>
    </div>
  );
};

export const CollectionHorizontalScrollRow = ({
  collection,
}: {
  collection: ExtensionsCollection;
}) => {
  const { t } = useTranslation();

  const title = getTranslatedText(
    collection.metadata.title ?? collection.metadata.name,
    (collection.metadata as any).titleKey,
    t,
  );
  const plugins = useCollectionPlugins(
    collection.metadata.namespace!,
    collection.metadata.name,
  );

  const getDetailsPath = useRouteRef(collectionRouteRef);
  const detailsPath = getDetailsPath({
    namespace: collection.metadata.namespace!,
    name: collection.metadata.name,
  });

  if (plugins.isLoading) {
    return <CollectionHorizontalScrollRowSkeleton />;
  }

  if (!plugins.data || plugins.data.length === 0) {
    return null;
  }

  return (
    <div>
      <Typography variant="h4" sx={{ pb: 1 }}>
        <Link to={detailsPath} style={{ color: 'inherit' }}>
          {title}
        </Link>
      </Typography>
      <HorizontalScrollGrid>
        <Stack direction="row" alignItems="stretch" gap={2} sx={{ p: 1 }}>
          {plugins.data?.map(plugin => (
            <div
              key={`${plugin.metadata.namespace}/${plugin.metadata.name}`}
              style={{ display: 'flex', width: 340 }}
            >
              <PluginCard plugin={plugin} />
            </div>
          ))}
        </Stack>
      </HorizontalScrollGrid>
    </div>
  );
};
