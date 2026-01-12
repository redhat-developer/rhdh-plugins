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

const STORAGE_KEY = 'bulk-import-instructions-expanded';

/**
 * Hook to manage user preference for instructions section expanded state
 * Persists the state in localStorage
 */
export function useInstructionsPreference(
  defaultExpanded: boolean,
): [boolean, (expanded: boolean) => void] {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : defaultExpanded;
    } catch {
      // If there's an error reading from localStorage, use the default
      return defaultExpanded;
    }
  });

  const setExpanded = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
    } catch {
      // Silently fail if localStorage is not available
      // The state will still work for the current session
    }
  }, []);

  // Update state if defaultExpanded changes and no user preference is stored
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        setIsExpanded(defaultExpanded);
      }
    } catch {
      // If localStorage is not available, just use the default
      setIsExpanded(defaultExpanded);
    }
  }, [defaultExpanded]);

  return [isExpanded, setExpanded];
}
