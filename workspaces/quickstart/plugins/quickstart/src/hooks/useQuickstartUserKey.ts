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

import { useEffect, useState } from 'react';
import { identityApiRef, useApi } from '@backstage/core-plugin-api';

/**
 * Resolves the current user's entity ref for per-user localStorage keys.
 * Falls back to `guest` when identity is unavailable.
 */
export const useQuickstartUserKey = () => {
  const [userKey, setUserKey] = useState('');
  const identityApi = useApi(identityApiRef);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const identity = await identityApi.getBackstageIdentity();
        const ref = identity?.userEntityRef?.toLowerCase() || 'guest';
        if (!cancelled) {
          setUserKey(ref);
        }
      } catch {
        if (!cancelled) {
          setUserKey('guest');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [identityApi]);

  return userKey;
};
