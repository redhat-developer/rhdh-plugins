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

import Stack from '@mui/material/Stack';

import { useCollections } from '../hooks/useCollections';
import {
  CollectionHorizontalScrollRow,
  CollectionHorizontalScrollRowSkeleton,
} from './CollectionHorizontalScrollRow';

export const MarketplaceCollectionsGrid = () => {
  const collections = useCollections({});

  return (
    <Stack direction="column" gap={2}>
      {collections.isLoading ? (
        <>
          <CollectionHorizontalScrollRowSkeleton />
          <CollectionHorizontalScrollRowSkeleton />
        </>
      ) : null}

      {collections.data?.items?.map(collection => (
        <CollectionHorizontalScrollRow
          key={`${collection.metadata.namespace}/${collection.metadata.name}`}
          collection={collection}
        />
      ))}
    </Stack>
  );
};
