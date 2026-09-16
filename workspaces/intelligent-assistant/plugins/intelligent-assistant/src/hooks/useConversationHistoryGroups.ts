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
import { ReactNode, useCallback, useMemo, useState } from 'react';

import { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';

import { SavedPrompt } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import { buildConversationHistoryGroups } from '../utils/buildConversationHistoryGroups';
import { SettingsTab } from './useSettingsPanelUrlState';
import { useTranslation } from './useTranslation';

type UseConversationHistoryGroupsOptions = {
  savedPrompts: SavedPrompt[];
  categorizedMessages: { [key: string]: Conversation[] };
  filterValue: string;
  isSavedPromptsEnabled: boolean;
  isPinningChatsEnabled: boolean;
  isSettingsOpen: boolean;
  activeSettingsTab: SettingsTab;
  openSettings: (tab: SettingsTab) => void;
  getSavedPromptMenuItems: (prompt: SavedPrompt) => ReactNode;
};

export const useConversationHistoryGroups = ({
  savedPrompts,
  categorizedMessages,
  filterValue,
  isSavedPromptsEnabled,
  isPinningChatsEnabled,
  isSettingsOpen,
  activeSettingsTab,
  openSettings,
  getSavedPromptMenuItems,
}: UseConversationHistoryGroupsOptions) => {
  const { t } = useTranslation();

  const [savedPromptsExpanded, setSavedPromptsExpanded] = useState(true);
  const [pinnedExpanded, setPinnedExpanded] = useState(true);
  const [chatsExpanded, setChatsExpanded] = useState(true);
  const [savedPromptsShowAllExpanded, setSavedPromptsShowAllExpanded] =
    useState(false);

  const handleOpenSavedPromptsSettings = useCallback(() => {
    if (isSettingsOpen && activeSettingsTab === 'saved-prompts') {
      return;
    }
    openSettings('saved-prompts');
  }, [activeSettingsTab, isSettingsOpen, openSettings]);

  const { groups: conversationGroups, hasNoSearchResults } = useMemo(
    () =>
      buildConversationHistoryGroups({
        savedPrompts,
        categorizedMessages,
        filterValue,
        isSavedPromptsEnabled,
        isPinningChatsEnabled,
        sectionState: {
          savedPromptsExpanded,
          pinnedExpanded,
          chatsExpanded,
          savedPromptsShowAllExpanded,
        },
        onSavedPromptsExpandedChange: setSavedPromptsExpanded,
        onPinnedExpandedChange: setPinnedExpanded,
        onChatsExpandedChange: setChatsExpanded,
        onSavedPromptsShowAllChange: setSavedPromptsShowAllExpanded,
        onOpenSavedPromptsSettings: handleOpenSavedPromptsSettings,
        getSavedPromptMenuItems,
        t,
      }),
    [
      savedPrompts,
      categorizedMessages,
      filterValue,
      isSavedPromptsEnabled,
      isPinningChatsEnabled,
      savedPromptsExpanded,
      pinnedExpanded,
      chatsExpanded,
      savedPromptsShowAllExpanded,
      handleOpenSavedPromptsSettings,
      getSavedPromptMenuItems,
      t,
    ],
  );

  return {
    conversationGroups,
    hasNoSearchResults,
    handleOpenSavedPromptsSettings,
  };
};
