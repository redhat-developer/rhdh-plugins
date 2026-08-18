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

import { isGuestUser } from '../utils/user-utils';

const BUCKET_NAME = 'lightspeed';
const PINNED_ENABLED_KEY = 'pinnedChatsEnabled';
const PINNED_CHATS_KEY = 'pinnedChats';

type UsePinnedChatsSettingsReturn = {
  isPinningChatsEnabled: boolean;
  pinnedChats: string[];
  handlePinningChatsToggle: (enabled: boolean) => void;
  pinChat: (convId: string) => void;
  unpinChat: (convId: string) => void;
};

/**
 * Hook to manage pinned chats settings with persistence using Backstage StorageApi.
 * Settings are automatically scoped per-user by the StorageApi backend when using
 * database persistence. For guest users, settings are only kept in local state
 * and not persisted.
 *
 * @param user - The user entity ref (e.g., "user:default/john")
 * @returns Object containing pinned chats state and management functions
 */
export const usePinnedChatsSettings = (
  user: string | undefined,
): UsePinnedChatsSettingsReturn => {
  const storageApi = useApi(storageApiRef);
  const bucket = storageApi.forBucket(BUCKET_NAME);

  const [isPinningChatsEnabled, setIsPinningChatsEnabled] = useState(true);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  // Determine if we should persist settings (not for guest users)
  const shouldPersist = !isGuestUser(user);

  // Initialize from storage and subscribe to changes
  useEffect(() => {
    if (!user) {
      setIsPinningChatsEnabled(true);
      setPinnedChats([]);
      return undefined;
    }

    // For guest users, use default values without loading from storage
    if (isGuestUser(user)) {
      setIsPinningChatsEnabled(true);
      setPinnedChats([]);
      return undefined;
    }

    // Load initial values from snapshot (works for browser mode)
    try {
      const enabledSnapshot = bucket.snapshot<boolean>(PINNED_ENABLED_KEY);
      const chatsSnapshot = bucket.snapshot<string[]>(PINNED_CHATS_KEY);

      setIsPinningChatsEnabled(enabledSnapshot.value ?? true);
      setPinnedChats(chatsSnapshot.value ?? []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reading pinned chats settings from storage:', error);
    }

    // Subscribe to changes (needed for database mode cross-tab sync)
    const enabledSubscription = bucket
      .observe$<boolean>(PINNED_ENABLED_KEY)
      .subscribe({
        next: snapshot => {
          setIsPinningChatsEnabled(snapshot.value ?? true);
        },
        error: error => {
          // eslint-disable-next-line no-console
          console.error('Error observing pinnedChatsEnabled:', error);
        },
      });

    const chatsSubscription = bucket
      .observe$<string[]>(PINNED_CHATS_KEY)
      .subscribe({
        next: snapshot => {
          setPinnedChats(snapshot.value ?? []);
        },
        error: error => {
          // eslint-disable-next-line no-console
          console.error('Error observing pinnedChats:', error);
        },
      });

    return () => {
      enabledSubscription.unsubscribe();
      chatsSubscription.unsubscribe();
    };
  }, [bucket, user]);

  // Toggle pinning feature on/off
  const handlePinningChatsToggle = useCallback(
    (enabled: boolean) => {
      if (!user) return;

      setIsPinningChatsEnabled(enabled);

      // Clear pinned chats when disabling
      if (!enabled) {
        setPinnedChats([]);
      }

      // Only persist for non-guest users
      if (shouldPersist) {
        try {
          bucket.set(PINNED_ENABLED_KEY, enabled);

          // Clear pinned chats in storage when disabling
          if (!enabled) {
            bucket.set(PINNED_CHATS_KEY, []);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error saving pinning toggle state:', error);
        }
      }
    },
    [bucket, user, shouldPersist],
  );

  // Pin a chat
  const pinChat = useCallback(
    (convId: string) => {
      if (!user) return;

      setPinnedChats(prev => {
        const updated = [...prev, convId];

        // Only persist for non-guest users
        if (shouldPersist) {
          try {
            bucket.set(PINNED_CHATS_KEY, updated);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error saving pinned chat:', error);
          }
        }

        return updated;
      });
    },
    [bucket, user, shouldPersist],
  );

  // Unpin a chat
  const unpinChat = useCallback(
    (convId: string) => {
      if (!user) return;

      setPinnedChats(prev => {
        const updated = prev.filter(id => id !== convId);

        // Only persist for non-guest users
        if (shouldPersist) {
          try {
            bucket.set(PINNED_CHATS_KEY, updated);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error saving unpinned chat:', error);
          }
        }

        return updated;
      });
    },
    [bucket, user, shouldPersist],
  );

  return {
    isPinningChatsEnabled,
    pinnedChats,
    handlePinningChatsToggle,
    pinChat,
    unpinChat,
  };
};
