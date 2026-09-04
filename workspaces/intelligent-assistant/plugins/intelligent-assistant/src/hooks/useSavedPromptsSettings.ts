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
const SAVED_PROMPTS_ENABLED_KEY = 'savedPromptsEnabled';

type UseSavedPromptsSettingsReturn = {
  isSavedPromptsEnabled: boolean;
  handleSavedPromptsToggle: (enabled: boolean) => void;
};

/**
 * Hook to manage the saved prompts enable/disable preference with persistence
 * using Backstage StorageApi. Follows the same pattern as usePinnedChatsSettings.
 *
 * @param user - The user entity ref (e.g., "user:default/john")
 */
export const useSavedPromptsSettings = (
  user: string | undefined,
): UseSavedPromptsSettingsReturn => {
  const storageApi = useApi(storageApiRef);
  const bucket = storageApi.forBucket(BUCKET_NAME);

  const [isSavedPromptsEnabled, setIsSavedPromptsEnabled] = useState(true);

  const shouldPersist = !isGuestUser(user);

  useEffect(() => {
    if (!user) {
      setIsSavedPromptsEnabled(true);
      return undefined;
    }

    if (isGuestUser(user)) {
      setIsSavedPromptsEnabled(true);
      return undefined;
    }

    try {
      const enabledSnapshot = bucket.snapshot<boolean>(
        SAVED_PROMPTS_ENABLED_KEY,
      );
      setIsSavedPromptsEnabled(enabledSnapshot.value ?? true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Error reading saved prompts settings from storage:',
        error,
      );
    }

    const enabledSubscription = bucket
      .observe$<boolean>(SAVED_PROMPTS_ENABLED_KEY)
      .subscribe({
        next: snapshot => {
          setIsSavedPromptsEnabled(snapshot.value ?? true);
        },
        error: error => {
          // eslint-disable-next-line no-console
          console.error('Error observing savedPromptsEnabled:', error);
        },
      });

    return () => {
      enabledSubscription.unsubscribe();
    };
  }, [bucket, user]);

  const handleSavedPromptsToggle = useCallback(
    (enabled: boolean) => {
      if (!user) return;

      setIsSavedPromptsEnabled(enabled);

      if (shouldPersist) {
        try {
          bucket.set(SAVED_PROMPTS_ENABLED_KEY, enabled);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error saving saved prompts toggle state:', error);
        }
      }
    },
    [bucket, user, shouldPersist],
  );

  return {
    isSavedPromptsEnabled,
    handleSavedPromptsToggle,
  };
};
