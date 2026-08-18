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

const KEY_PREFIX = 'dcm:pageSize:';

function readStored(key: string, defaultSize: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // localStorage may be unavailable (e.g. private-browsing restrictions)
  }
  return defaultSize;
}

/**
 * Behaves like `useState(defaultSize)` but persists the chosen page-size to
 * `localStorage` under `dcm:pageSize:<storageKey>` so the user's preference
 * survives page refreshes and navigation.
 *
 * When `storageKey` is an empty string no persistence is applied and the hook
 * falls back to a plain in-memory default.
 */
export function usePersistedPageSize(
  storageKey: string,
  defaultSize = 5,
): [number, React.Dispatch<React.SetStateAction<number>>] {
  const fullKey = storageKey ? `${KEY_PREFIX}${storageKey}` : '';

  const [pageSize, setPageSize] = useState<number>(() =>
    fullKey ? readStored(fullKey, defaultSize) : defaultSize,
  );

  useEffect(() => {
    if (fullKey) {
      try {
        localStorage.setItem(fullKey, String(pageSize));
      } catch {
        // Ignore write failures silently
      }
    }
  }, [fullKey, pageSize]);

  return [pageSize, setPageSize];
}
