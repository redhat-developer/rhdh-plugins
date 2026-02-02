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

import { ChatbotDisplayMode } from '@patternfly/chatbot';

import { isGuestUser } from '../utils/user-utils';

const BUCKET_NAME = 'lightspeed';
const DISPLAY_MODE_KEY = 'displayMode';

type UseDisplayModeSettingsReturn = {
  displayMode: ChatbotDisplayMode;
  setDisplayMode: (mode: ChatbotDisplayMode) => void;
};

/**
 * Hook to manage display mode settings with persistence using Backstage StorageApi.
 *
 * @param user - The user entity ref (e.g., "user:default/john")
 * @param defaultMode - The default display mode to use if no preference is stored
 * @returns Object containing display mode state and management function
 */
export const useDisplayModeSettings = (
  user: string | undefined,
  defaultMode: ChatbotDisplayMode = ChatbotDisplayMode.default,
): UseDisplayModeSettingsReturn => {
  const storageApi = useApi(storageApiRef);
  const bucket = storageApi.forBucket(BUCKET_NAME);

  const [displayModeState, setDisplayModeState] =
    useState<ChatbotDisplayMode>(defaultMode);

  const shouldPersist = !isGuestUser(user);

  useEffect(() => {
    if (!user || isGuestUser(user)) {
      setDisplayModeState(defaultMode);
      return undefined;
    }

    try {
      const modeSnapshot =
        bucket.snapshot<ChatbotDisplayMode>(DISPLAY_MODE_KEY);
      setDisplayModeState(modeSnapshot.value ?? defaultMode);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reading display mode from storage:', error);
    }

    const modeSubscription = bucket
      .observe$<ChatbotDisplayMode>(DISPLAY_MODE_KEY)
      .subscribe({
        next: snapshot => {
          setDisplayModeState(snapshot.value ?? defaultMode);
        },
        error: error => {
          // eslint-disable-next-line no-console
          console.error('Error observing displayMode:', error);
        },
      });

    return () => {
      modeSubscription.unsubscribe();
    };
  }, [bucket, user, defaultMode]);

  const setDisplayMode = useCallback(
    (mode: ChatbotDisplayMode) => {
      if (!user) return;

      setDisplayModeState(mode);

      if (shouldPersist) {
        try {
          bucket.set(DISPLAY_MODE_KEY, mode);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error saving display mode:', error);
        }
      }
    },
    [bucket, user, shouldPersist],
  );

  return {
    displayMode: displayModeState,
    setDisplayMode,
  };
};
