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
const SHARING_ENABLED_KEY = 'screenContextSharingEnabled';
const PAUSED_KEY = 'screenContextPaused';

type UseScreenContextSettingsReturn = {
  isScreenContextSharingEnabled: boolean;
  isScreenContextPaused: boolean;
  handleScreenContextSharingToggle: (enabled: boolean) => void;
  toggleScreenContextPaused: () => void;
  setScreenContextPaused: (paused: boolean) => void;
};

/**
 * Persists screen context user preference (opt-in sharing + pause state).
 */
export const useScreenContextSettings = (
  user: string | undefined,
): UseScreenContextSettingsReturn => {
  const storageApi = useApi(storageApiRef);
  const bucket = storageApi.forBucket(BUCKET_NAME);

  const [isScreenContextSharingEnabled, setIsScreenContextSharingEnabled] =
    useState(false);
  const [isScreenContextPaused, setIsScreenContextPaused] = useState(false);

  const shouldPersist = Boolean(user) && !isGuestUser(user);

  useEffect(() => {
    if (!user) {
      setIsScreenContextSharingEnabled(false);
      setIsScreenContextPaused(false);
      return undefined;
    }

    if (isGuestUser(user)) {
      setIsScreenContextSharingEnabled(false);
      setIsScreenContextPaused(false);
      return undefined;
    }

    try {
      const sharingSnapshot = bucket.snapshot<boolean>(SHARING_ENABLED_KEY);
      const pausedSnapshot = bucket.snapshot<boolean>(PAUSED_KEY);
      setIsScreenContextSharingEnabled(sharingSnapshot.value ?? false);
      setIsScreenContextPaused(pausedSnapshot.value ?? false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Error reading screen context settings from storage:',
        error,
      );
    }

    const sharingSubscription = bucket
      .observe$<boolean>(SHARING_ENABLED_KEY)
      .subscribe({
        next: snapshot => {
          setIsScreenContextSharingEnabled(snapshot.value ?? false);
        },
        error: error => {
          // eslint-disable-next-line no-console
          console.error('Error observing screenContextSharingEnabled:', error);
        },
      });

    const pausedSubscription = bucket.observe$<boolean>(PAUSED_KEY).subscribe({
      next: snapshot => {
        setIsScreenContextPaused(snapshot.value ?? false);
      },
      error: error => {
        // eslint-disable-next-line no-console
        console.error('Error observing screenContextPaused:', error);
      },
    });

    return () => {
      sharingSubscription.unsubscribe();
      pausedSubscription.unsubscribe();
    };
  }, [bucket, user]);

  const persistSharing = useCallback(
    (enabled: boolean) => {
      if (!shouldPersist) return;
      try {
        bucket.set(SHARING_ENABLED_KEY, enabled);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error saving screen context sharing state:', error);
      }
    },
    [bucket, shouldPersist],
  );

  const persistPaused = useCallback(
    (paused: boolean) => {
      if (!shouldPersist) return;
      try {
        bucket.set(PAUSED_KEY, paused);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error saving screen context paused state:', error);
      }
    },
    [bucket, shouldPersist],
  );

  const handleScreenContextSharingToggle = useCallback(
    (enabled: boolean) => {
      if (!user) return;

      setIsScreenContextSharingEnabled(enabled);
      setIsScreenContextPaused(false);
      persistPaused(false);
      persistSharing(enabled);
    },
    [user, persistSharing, persistPaused],
  );

  const setScreenContextPaused = useCallback(
    (paused: boolean) => {
      if (!user) return;
      setIsScreenContextPaused(paused);
      persistPaused(paused);
    },
    [user, persistPaused],
  );

  const toggleScreenContextPaused = useCallback(() => {
    setScreenContextPaused(!isScreenContextPaused);
  }, [isScreenContextPaused, setScreenContextPaused]);

  return {
    isScreenContextSharingEnabled,
    isScreenContextPaused,
    handleScreenContextSharingToggle,
    toggleScreenContextPaused,
    setScreenContextPaused,
  };
};
