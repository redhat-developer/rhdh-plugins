/*
 * Copyright Red Hat, Inc.
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
import { useCallback, useEffect, useState } from 'react';

import { storageApiRef, useApi } from '@backstage/core-plugin-api';

import { SortOption } from '../utils/lightspeed-chatbox-utils';
import { isGuestUser } from '../utils/user-utils';

const BUCKET_NAME = 'lightspeed';
const SORT_ORDER_KEY = 'sortOrder';

type UseSortSettingsReturn = {
  selectedSort: SortOption;
  handleSortChange: (sortOption: SortOption) => void;
};

/**
 * Hook to manage sort order settings with persistence using Backstage StorageApi.
 * Settings are automatically scoped per-user by the StorageApi backend when using
 * database persistence. For guest users, settings are only kept in local state
 * and not persisted.
 *
 * @param user - The user entity ref (e.g., "user:default/john")
 * @returns Object containing sort state and management function
 */
export const useSortSettings = (
  user: string | undefined,
): UseSortSettingsReturn => {
  const storageApi = useApi(storageApiRef);
  const bucket = storageApi.forBucket(BUCKET_NAME);

  const [selectedSort, setSelectedSort] = useState<SortOption>('newest');

  // Determine if we should persist settings (not for guest users)
  const shouldPersist = !isGuestUser(user);

  // Initialize from storage and subscribe to changes
  useEffect(() => {
    if (!user) {
      setSelectedSort('newest');
      return undefined;
    }

    // For guest users, use default values without loading from storage
    if (isGuestUser(user)) {
      setSelectedSort('newest');
      return undefined;
    }

    // Load initial value from snapshot (works for browser mode)
    try {
      const sortSnapshot = bucket.snapshot<SortOption>(SORT_ORDER_KEY);
      setSelectedSort(sortSnapshot.value ?? 'newest');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reading sort order from storage:', error);
    }

    // Subscribe to changes (needed for database mode cross-tab sync)
    const sortSubscription = bucket
      .observe$<SortOption>(SORT_ORDER_KEY)
      .subscribe({
        next: snapshot => {
          setSelectedSort(snapshot.value ?? 'newest');
        },
        error: error => {
          // eslint-disable-next-line no-console
          console.error('Error observing sortOrder:', error);
        },
      });

    return () => {
      sortSubscription.unsubscribe();
    };
  }, [bucket, user]);

  // Change sort order
  const handleSortChange = useCallback(
    (sortOption: SortOption) => {
      if (!user) return;

      setSelectedSort(sortOption);

      // Only persist for non-guest users
      if (shouldPersist) {
        try {
          bucket.set(SORT_ORDER_KEY, sortOption);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error saving sort order:', error);
        }
      }
    },
    [bucket, user, shouldPersist],
  );

  return {
    selectedSort,
    handleSortChange,
  };
};
