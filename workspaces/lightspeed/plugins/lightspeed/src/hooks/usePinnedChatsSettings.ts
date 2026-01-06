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

const BUCKET_NAME = 'lightspeed';
const PINNED_ENABLED_KEY = 'pinnedChatsEnabled';
const PINNED_CHATS_KEY = 'pinnedChats';
const SORT_ORDER_KEY = 'sortOrder';

type UserSettings = {
  [userId: string]: boolean | string[] | SortOption;
};

type UsePinnedChatsSettingsReturn = {
  isPinningChatsEnabled: boolean;
  pinnedChats: string[];
  selectedSort: SortOption;
  handlePinningChatsToggle: (enabled: boolean) => void;
  pinChat: (convId: string) => void;
  unpinChat: (convId: string) => void;
  handleSortChange: (sortOption: SortOption) => void;
};

/**
 * Hook to manage pinned chats settings with persistence using Backstage StorageApi.
 * Settings are scoped per-user to support multi-user environments.
 *
 * @param user - The user entity ref (e.g., "user:default/guest")
 * @returns Object containing pinned chats state and management functions
 */
export const usePinnedChatsSettings = (
  user: string | undefined,
): UsePinnedChatsSettingsReturn => {
  const storageApi = useApi(storageApiRef);
  const bucket = storageApi.forBucket(BUCKET_NAME);

  const [isPinningChatsEnabled, setIsPinningChatsEnabled] = useState(true);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<SortOption>('newest');

  // Initialize from storage on mount or when user changes
  useEffect(() => {
    if (!user) {
      setIsPinningChatsEnabled(true);
      setPinnedChats([]);
      setSelectedSort('newest');
      return;
    }

    try {
      const enabledSnapshot = bucket.snapshot<UserSettings>(PINNED_ENABLED_KEY);
      const chatsSnapshot = bucket.snapshot<UserSettings>(PINNED_CHATS_KEY);
      const sortSnapshot = bucket.snapshot<UserSettings>(SORT_ORDER_KEY);

      const enabledData = enabledSnapshot.value ?? {};
      const chatsData = chatsSnapshot.value ?? {};
      const sortData = sortSnapshot.value ?? {};

      setIsPinningChatsEnabled(
        (enabledData[user] as boolean | undefined) ?? true,
      );
      setPinnedChats((chatsData[user] as string[] | undefined) ?? []);
      setSelectedSort((sortData[user] as SortOption | undefined) ?? 'newest');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reading pinned chats settings from storage:', error);
    }
  }, [bucket, user]);

  // Toggle pinning feature on/off
  const handlePinningChatsToggle = useCallback(
    (enabled: boolean) => {
      if (!user) return;

      setIsPinningChatsEnabled(enabled);

      try {
        const enabledSnapshot =
          bucket.snapshot<UserSettings>(PINNED_ENABLED_KEY);
        // Create a copy to avoid mutating the read-only snapshot
        const enabledData = { ...enabledSnapshot.value };
        enabledData[user] = enabled;
        bucket.set(PINNED_ENABLED_KEY, enabledData);

        // Clear pinned chats when disabling
        if (!enabled) {
          setPinnedChats([]);
          const chatsSnapshot = bucket.snapshot<UserSettings>(PINNED_CHATS_KEY);
          // Create a copy to avoid mutating the read-only snapshot
          const chatsData = { ...chatsSnapshot.value };
          chatsData[user] = [];
          bucket.set(PINNED_CHATS_KEY, chatsData);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error saving pinning toggle state:', error);
      }
    },
    [bucket, user],
  );

  // Pin a chat
  const pinChat = useCallback(
    (convId: string) => {
      if (!user) return;

      setPinnedChats(prev => {
        const updated = [...prev, convId];

        try {
          const chatsSnapshot = bucket.snapshot<UserSettings>(PINNED_CHATS_KEY);
          // Create a copy to avoid mutating the read-only snapshot
          const chatsData = { ...chatsSnapshot.value };
          chatsData[user] = updated;
          bucket.set(PINNED_CHATS_KEY, chatsData);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error saving pinned chat:', error);
        }

        return updated;
      });
    },
    [bucket, user],
  );

  // Unpin a chat
  const unpinChat = useCallback(
    (convId: string) => {
      if (!user) return;

      setPinnedChats(prev => {
        const updated = prev.filter(id => id !== convId);

        try {
          const chatsSnapshot = bucket.snapshot<UserSettings>(PINNED_CHATS_KEY);
          // Create a copy to avoid mutating the read-only snapshot
          const chatsData = { ...chatsSnapshot.value };
          chatsData[user] = updated;
          bucket.set(PINNED_CHATS_KEY, chatsData);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error saving unpinned chat:', error);
        }

        return updated;
      });
    },
    [bucket, user],
  );

  // Change sort order
  const handleSortChange = useCallback(
    (sortOption: SortOption) => {
      if (!user) return;

      setSelectedSort(sortOption);

      try {
        const sortSnapshot = bucket.snapshot<UserSettings>(SORT_ORDER_KEY);
        // Create a copy to avoid mutating the read-only snapshot
        const sortData = { ...sortSnapshot.value };
        sortData[user] = sortOption;
        bucket.set(SORT_ORDER_KEY, sortData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error saving sort order:', error);
      }
    },
    [bucket, user],
  );

  return {
    isPinningChatsEnabled,
    pinnedChats,
    selectedSort,
    handlePinningChatsToggle,
    pinChat,
    unpinChat,
    handleSortChange,
  };
};
