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

import { useCallback, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { LIGHTSPEED_PATH } from '../const';

export type SettingsTab = 'mcp-servers' | 'saved-prompts';

export const SETTINGS_TAB_PARAM = 'settingsTab';

const VALID_SETTINGS_TABS: SettingsTab[] = ['mcp-servers', 'saved-prompts'];

export const parseSettingsTabParam = (
  value: string | null,
): SettingsTab | null => {
  if (!value) {
    return null;
  }
  return VALID_SETTINGS_TABS.includes(value as SettingsTab)
    ? (value as SettingsTab)
    : null;
};

export const useSettingsPanelUrlState = (
  isFullscreenMode: boolean,
  persistedSettingsTab: SettingsTab | null,
  setPersistedSettingsTab: (tab: SettingsTab | null) => void,
) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const shouldSyncUrl =
    isFullscreenMode && location.pathname.startsWith(LIGHTSPEED_PATH);

  const settingsTabFromUrl = parseSettingsTabParam(
    searchParams.get(SETTINGS_TAB_PARAM),
  );

  const isOpen = shouldSyncUrl
    ? settingsTabFromUrl !== null
    : persistedSettingsTab !== null;
  const activeTab = shouldSyncUrl
    ? (settingsTabFromUrl ?? 'mcp-servers')
    : (persistedSettingsTab ?? 'mcp-servers');

  const updateSearchParam = useCallback(
    (tab: SettingsTab | null) => {
      const nextParams = new URLSearchParams(searchParams);
      if (tab) {
        nextParams.set(SETTINGS_TAB_PARAM, tab);
      } else {
        nextParams.delete(SETTINGS_TAB_PARAM);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (!shouldSyncUrl) {
      return;
    }
    if (settingsTabFromUrl !== persistedSettingsTab) {
      setPersistedSettingsTab(settingsTabFromUrl);
    }
  }, [
    shouldSyncUrl,
    settingsTabFromUrl,
    persistedSettingsTab,
    setPersistedSettingsTab,
  ]);

  useEffect(() => {
    if (!shouldSyncUrl || !persistedSettingsTab || settingsTabFromUrl) {
      return;
    }
    updateSearchParam(persistedSettingsTab);
  }, [
    shouldSyncUrl,
    persistedSettingsTab,
    settingsTabFromUrl,
    updateSearchParam,
  ]);

  const openSettings = useCallback(
    (tab: SettingsTab) => {
      setPersistedSettingsTab(tab);
      if (shouldSyncUrl) {
        updateSearchParam(tab);
      }
    },
    [shouldSyncUrl, setPersistedSettingsTab, updateSearchParam],
  );

  const closeSettings = useCallback(() => {
    setPersistedSettingsTab(null);
    if (shouldSyncUrl) {
      updateSearchParam(null);
    }
  }, [shouldSyncUrl, setPersistedSettingsTab, updateSearchParam]);

  const setActiveTab = useCallback(
    (tab: SettingsTab) => {
      setPersistedSettingsTab(tab);
      if (shouldSyncUrl) {
        updateSearchParam(tab);
      }
    },
    [shouldSyncUrl, setPersistedSettingsTab, updateSearchParam],
  );

  return {
    isOpen,
    activeTab,
    openSettings,
    closeSettings,
    setActiveTab,
  };
};
