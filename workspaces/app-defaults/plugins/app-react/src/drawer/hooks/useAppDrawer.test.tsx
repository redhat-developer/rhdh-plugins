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

import { useAppDrawer } from './useAppDrawer';
import { drawerStore } from '../utils/drawerStore';

function renderDrawerHook() {
  return renderHook(() => useAppDrawer());
}

describe('useAppDrawer', () => {
  beforeEach(() => drawerStore.reset());

  describe('without provider', () => {
    it('works without a wrapping provider (global store)', () => {
      const { result } = renderHook(() => useAppDrawer());

      expect(result.current.activeDrawerId).toBeNull();
      expect(result.current.isOpen('any')).toBe(false);
      expect(result.current.getWidth('any')).toBe(500);

      act(() => result.current.openDrawer('test'));
      expect(result.current.activeDrawerId).toBe('test');
    });
  });

  describe('openDrawer / closeDrawer', () => {
    it('opens a drawer and sets it as active', () => {
      const { result } = renderDrawerHook();

      act(() => result.current.openDrawer('drawer-a'));

      expect(result.current.activeDrawerId).toBe('drawer-a');
      expect(result.current.isOpen('drawer-a')).toBe(true);
    });

    it('closes the active drawer', () => {
      const { result } = renderDrawerHook();

      act(() => result.current.openDrawer('drawer-a'));
      act(() => result.current.closeDrawer('drawer-a'));

      expect(result.current.activeDrawerId).toBeNull();
      expect(result.current.isOpen('drawer-a')).toBe(false);
    });

    it('does not close a non-active drawer', () => {
      const { result } = renderDrawerHook();

      act(() => result.current.openDrawer('drawer-a'));
      act(() => result.current.closeDrawer('drawer-b'));

      expect(result.current.activeDrawerId).toBe('drawer-a');
    });

    it('enforces single-active-drawer: opening B replaces A', () => {
      const { result } = renderDrawerHook();

      act(() => result.current.openDrawer('drawer-a'));
      act(() => result.current.openDrawer('drawer-b'));

      expect(result.current.activeDrawerId).toBe('drawer-b');
      expect(result.current.isOpen('drawer-a')).toBe(false);
      expect(result.current.isOpen('drawer-b')).toBe(true);
    });
  });

  describe('toggleDrawer', () => {
    it('opens a closed drawer', () => {
      const { result } = renderDrawerHook();

      act(() => result.current.toggleDrawer('drawer-a'));

      expect(result.current.activeDrawerId).toBe('drawer-a');
    });

    it('closes an open drawer', () => {
      const { result } = renderDrawerHook();

      act(() => result.current.openDrawer('drawer-a'));
      act(() => result.current.toggleDrawer('drawer-a'));

      expect(result.current.activeDrawerId).toBeNull();
    });
  });

  describe('width management', () => {
    it('returns default width (500) for unknown drawer', () => {
      const { result } = renderDrawerHook();

      expect(result.current.getWidth('unknown')).toBe(500);
    });

    it('stores and retrieves per-drawer width', () => {
      const { result } = renderDrawerHook();

      act(() => result.current.setWidth('drawer-a', 600));

      expect(result.current.getWidth('drawer-a')).toBe(600);
    });

    it('maintains independent widths per drawer', () => {
      const { result } = renderDrawerHook();

      act(() => {
        result.current.setWidth('drawer-a', 600);
        result.current.setWidth('drawer-b', 700);
      });

      expect(result.current.getWidth('drawer-a')).toBe(600);
      expect(result.current.getWidth('drawer-b')).toBe(700);
    });
  });
});
