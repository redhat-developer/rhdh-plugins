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

import { renderHook, act } from '@testing-library/react';
import { usePinnedRecent } from './usePinnedRecent';
import { PINNED_KEY, RECENT_KEY, MAX_RECENT } from './agentUtils';

describe('usePinnedRecent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty arrays when localStorage is empty', () => {
    const { result } = renderHook(() => usePinnedRecent());
    expect(result.current.pinnedIds).toEqual([]);
    expect(result.current.recentIds).toEqual([]);
  });

  it('initializes from localStorage when data exists', () => {
    localStorage.setItem(PINNED_KEY, JSON.stringify(['agent-1']));
    localStorage.setItem(RECENT_KEY, JSON.stringify(['agent-2', 'agent-3']));

    const { result } = renderHook(() => usePinnedRecent());
    expect(result.current.pinnedIds).toEqual(['agent-1']);
    expect(result.current.recentIds).toEqual(['agent-2', 'agent-3']);
  });

  describe('togglePin', () => {
    it('pins an agent', () => {
      const { result } = renderHook(() => usePinnedRecent());
      const mockEvent = { stopPropagation: jest.fn() } as any;

      act(() => {
        result.current.togglePin('agent-1', mockEvent);
      });

      expect(result.current.pinnedIds).toEqual(['agent-1']);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(JSON.parse(localStorage.getItem(PINNED_KEY) ?? '[]')).toEqual([
        'agent-1',
      ]);
    });

    it('unpins an already-pinned agent', () => {
      localStorage.setItem(PINNED_KEY, JSON.stringify(['agent-1', 'agent-2']));
      const { result } = renderHook(() => usePinnedRecent());
      const mockEvent = { stopPropagation: jest.fn() } as any;

      act(() => {
        result.current.togglePin('agent-1', mockEvent);
      });

      expect(result.current.pinnedIds).toEqual(['agent-2']);
      expect(JSON.parse(localStorage.getItem(PINNED_KEY) ?? '[]')).toEqual([
        'agent-2',
      ]);
    });
  });

  describe('addRecent', () => {
    it('adds an agent to the front of recent list', () => {
      const { result } = renderHook(() => usePinnedRecent());

      act(() => {
        result.current.addRecent('agent-1');
      });

      expect(result.current.recentIds).toEqual(['agent-1']);
      expect(JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')).toEqual([
        'agent-1',
      ]);
    });

    it('moves duplicate to front instead of creating a duplicate entry', () => {
      localStorage.setItem(
        RECENT_KEY,
        JSON.stringify(['agent-1', 'agent-2', 'agent-3']),
      );
      const { result } = renderHook(() => usePinnedRecent());

      act(() => {
        result.current.addRecent('agent-3');
      });

      expect(result.current.recentIds).toEqual([
        'agent-3',
        'agent-1',
        'agent-2',
      ]);
    });

    it('caps the recent list at MAX_RECENT', () => {
      const initial = Array.from(
        { length: MAX_RECENT },
        (_, i) => `agent-${i}`,
      );
      localStorage.setItem(RECENT_KEY, JSON.stringify(initial));
      const { result } = renderHook(() => usePinnedRecent());

      act(() => {
        result.current.addRecent('new-agent');
      });

      expect(result.current.recentIds).toHaveLength(MAX_RECENT);
      expect(result.current.recentIds[0]).toBe('new-agent');
      expect(result.current.recentIds).not.toContain(`agent-${MAX_RECENT - 1}`);
    });
  });
});
