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

import { useState, type ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { act, renderHook } from '@testing-library/react';

import { LIGHTSPEED_PATH } from '../../const';
import {
  parseSettingsTabParam,
  SETTINGS_TAB_PARAM,
  useSettingsPanelUrlState,
  type SettingsTab,
} from '../useSettingsPanelUrlState';

let currentSearch = '';

function LocationCapture() {
  const location = useLocation();
  currentSearch = location.search;
  return null;
}

function createWrapper(initialPath: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <LocationCapture />
        {children}
      </MemoryRouter>
    );
  };
}

function renderSettingsHook(
  isFullscreenMode: boolean,
  initialPath = LIGHTSPEED_PATH,
  initialPersistedTab: SettingsTab | null = null,
) {
  currentSearch = '';
  const persistedRef: { current: SettingsTab | null } = {
    current: initialPersistedTab,
  };

  const { result } = renderHook(
    () => {
      const [persistedSettingsTab, setPersistedSettingsTab] =
        useState<SettingsTab | null>(initialPersistedTab);
      persistedRef.current = persistedSettingsTab;
      return useSettingsPanelUrlState(
        isFullscreenMode,
        persistedSettingsTab,
        setPersistedSettingsTab,
      );
    },
    {
      wrapper: createWrapper(initialPath),
    },
  );

  return { result, persistedRef };
}

describe('parseSettingsTabParam', () => {
  it('returns null for missing or invalid values', () => {
    expect(parseSettingsTabParam(null)).toBeNull();
    expect(parseSettingsTabParam('')).toBeNull();
    expect(parseSettingsTabParam('unknown-tab')).toBeNull();
  });

  it('returns valid settings tab values', () => {
    expect(parseSettingsTabParam('mcp-servers')).toBe('mcp-servers');
    expect(parseSettingsTabParam('saved-prompts')).toBe('saved-prompts');
  });
});

describe('useSettingsPanelUrlState', () => {
  describe('fullscreen on intelligent-assistant routes', () => {
    it('opens settings and writes settingsTab to the URL', () => {
      const { result, persistedRef } = renderSettingsHook(true);

      act(() => {
        result.current.openSettings('saved-prompts');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.activeTab).toBe('saved-prompts');
      expect(currentSearch).toContain(`${SETTINGS_TAB_PARAM}=saved-prompts`);
      expect(persistedRef.current).toBe('saved-prompts');
    });

    it('updates the URL when the active tab changes', () => {
      const { result } = renderSettingsHook(
        true,
        `${LIGHTSPEED_PATH}?${SETTINGS_TAB_PARAM}=mcp-servers`,
      );

      act(() => {
        result.current.setActiveTab('saved-prompts');
      });

      expect(result.current.activeTab).toBe('saved-prompts');
      expect(currentSearch).toContain(`${SETTINGS_TAB_PARAM}=saved-prompts`);
    });

    it('removes settingsTab from the URL when settings are closed', () => {
      const { result, persistedRef } = renderSettingsHook(
        true,
        `${LIGHTSPEED_PATH}?${SETTINGS_TAB_PARAM}=saved-prompts`,
      );

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closeSettings();
      });

      expect(result.current.isOpen).toBe(false);
      expect(currentSearch).not.toContain(SETTINGS_TAB_PARAM);
      expect(persistedRef.current).toBeNull();
    });

    it('opens settings from an initial URL with settingsTab', () => {
      const { result, persistedRef } = renderSettingsHook(
        true,
        `${LIGHTSPEED_PATH}?${SETTINGS_TAB_PARAM}=saved-prompts`,
      );

      expect(result.current.isOpen).toBe(true);
      expect(result.current.activeTab).toBe('saved-prompts');
      expect(persistedRef.current).toBe('saved-prompts');
    });

    it('keeps settings closed when settingsTab is invalid', () => {
      const { result } = renderSettingsHook(
        true,
        `${LIGHTSPEED_PATH}?${SETTINGS_TAB_PARAM}=invalid`,
      );

      expect(result.current.isOpen).toBe(false);
      expect(result.current.activeTab).toBe('mcp-servers');
    });

    it('restores persisted settings tab to the URL when entering fullscreen', () => {
      const { result } = renderSettingsHook(
        true,
        LIGHTSPEED_PATH,
        'saved-prompts',
      );

      expect(result.current.isOpen).toBe(true);
      expect(result.current.activeTab).toBe('saved-prompts');
      expect(currentSearch).toContain(`${SETTINGS_TAB_PARAM}=saved-prompts`);
    });
  });

  describe('overlay/docked modes', () => {
    it('does not update the URL when opening settings or changing tabs', () => {
      const { result, persistedRef } = renderSettingsHook(false);

      act(() => {
        result.current.openSettings('saved-prompts');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.activeTab).toBe('saved-prompts');
      expect(currentSearch).toBe('');
      expect(persistedRef.current).toBe('saved-prompts');

      act(() => {
        result.current.setActiveTab('mcp-servers');
      });

      expect(result.current.activeTab).toBe('mcp-servers');
      expect(currentSearch).toBe('');
      expect(persistedRef.current).toBe('mcp-servers');
    });

    it('closes settings using persisted state without touching the URL', () => {
      const { result, persistedRef } = renderSettingsHook(
        false,
        LIGHTSPEED_PATH,
        'saved-prompts',
      );

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closeSettings();
      });

      expect(result.current.isOpen).toBe(false);
      expect(currentSearch).toBe('');
      expect(persistedRef.current).toBeNull();
    });

    it('keeps settings open from persisted state after leaving fullscreen', () => {
      const { result } = renderSettingsHook(false, '/catalog', 'saved-prompts');

      expect(result.current.isOpen).toBe(true);
      expect(result.current.activeTab).toBe('saved-prompts');
    });
  });
});
