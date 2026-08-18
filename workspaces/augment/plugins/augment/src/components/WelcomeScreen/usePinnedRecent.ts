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

import { useCallback, useState, type MouseEvent } from 'react';
import {
  MAX_RECENT,
  PINNED_KEY,
  RECENT_KEY,
  readJsonArray,
  writeJsonArray,
} from './agentUtils';

export function usePinnedRecent() {
  const [pinnedIds, setPinnedIds] = useState<string[]>(() =>
    readJsonArray(PINNED_KEY),
  );
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    readJsonArray(RECENT_KEY),
  );

  const togglePin = useCallback((agentId: string, e: MouseEvent) => {
    e.stopPropagation();
    setPinnedIds(prev => {
      const next = prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId];
      writeJsonArray(PINNED_KEY, next);
      return next;
    });
  }, []);

  const addRecent = useCallback((agentId: string) => {
    setRecentIds(prev => {
      const updated = [agentId, ...prev.filter(id => id !== agentId)].slice(
        0,
        MAX_RECENT,
      );
      writeJsonArray(RECENT_KEY, updated);
      return updated;
    });
  }, []);

  return { pinnedIds, recentIds, togglePin, addRecent };
}
