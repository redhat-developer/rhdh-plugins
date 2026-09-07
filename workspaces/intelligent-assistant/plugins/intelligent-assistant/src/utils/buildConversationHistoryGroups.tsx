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
import { ReactNode } from 'react';

import Typography from '@mui/material/Typography';
import {
  Conversation,
  ConversationGroup,
} from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { Button } from '@patternfly/react-core';
import {
  CaretDownIcon,
  CaretUpIcon,
  CogIcon,
  OutlinedBookmarkIcon,
} from '@patternfly/react-icons';

import { SavedPrompt } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

export const SAVED_PROMPT_CONVERSATION_ID_PREFIX = 'saved-prompt:';
export const SAVED_PROMPTS_VISIBLE_COUNT = 5;

export const savedPromptConversationId = (promptId: string) =>
  `${SAVED_PROMPT_CONVERSATION_ID_PREFIX}${promptId}`;

export const isSavedPromptConversationId = (id: string | number) =>
  String(id).startsWith(SAVED_PROMPT_CONVERSATION_ID_PREFIX);

export type ConversationHistorySectionState = {
  savedPromptsExpanded: boolean;
  pinnedExpanded: boolean;
  chatsExpanded: boolean;
  savedPromptsShowAllExpanded: boolean;
};

export type FilteredCategorizedMessages = {
  pinnedChats: Conversation[];
  recentChats: Conversation[];
  isNoPinnedChatsSearchResults: boolean;
  isNoRecentChatsSearchResults: boolean;
};

const matchesFilter = (text: string, filterValue: string) =>
  text
    .toLocaleLowerCase('en-US')
    .includes(filterValue.toLocaleLowerCase('en-US'));

const disabledPlaceholderConversation = (
  id: string,
  text: string,
): Conversation => ({
  id,
  text,
  noIcon: true,
  additionalProps: {
    isDisabled: true,
    style: {
      fontStyle: 'italic',
      opacity: 0.6,
    },
  },
});

export const filterCategorizedMessages = (
  categorizedMessages: { [key: string]: Conversation[] },
  filterValue: string,
  isPinningChatsEnabled: boolean,
  t: (key: string, params?: any) => string,
): FilteredCategorizedMessages => {
  const pinnedChatsKey =
    t('conversation.category.pinnedChats') || 'Pinned chats';

  let isNoPinnedChatsSearchResults = false;
  let isNoRecentChatsSearchResults = false;
  let pinnedChats: Conversation[] = [];
  let recentChats: Conversation[] = [];

  Object.entries(categorizedMessages).forEach(([key, items]) => {
    const filteredItems = filterValue
      ? items.filter(item => matchesFilter(item.text ?? '', filterValue))
      : items;
    const isPinnedCategory = key === pinnedChatsKey;

    if (isPinnedCategory && isPinningChatsEnabled) {
      if (filteredItems.length > 0) {
        pinnedChats = filteredItems;
      } else {
        isNoPinnedChatsSearchResults =
          Boolean(filterValue) &&
          categorizedMessages[pinnedChatsKey].length > 0;
        pinnedChats = [
          disabledPlaceholderConversation(
            isNoPinnedChatsSearchResults
              ? 'no-pinned-chats-search-results'
              : 'no-pinned-chats',
            isNoPinnedChatsSearchResults
              ? t('common.noSearchResults')
              : t('chatbox.emptyState.noPinnedChats'),
          ),
        ];
      }
    } else if (!isPinnedCategory) {
      if (filteredItems.length > 0) {
        recentChats = filteredItems;
      } else {
        isNoRecentChatsSearchResults =
          Boolean(filterValue) && categorizedMessages[key].length > 0;
        recentChats = [
          disabledPlaceholderConversation(
            isNoRecentChatsSearchResults
              ? 'no-recent-chats-search-results'
              : 'no-recent-chats',
            isNoRecentChatsSearchResults
              ? t('common.noSearchResults')
              : t('chatbox.emptyState.noRecentChats'),
          ),
        ];
      }
    }
  });

  return {
    pinnedChats,
    recentChats,
    isNoPinnedChatsSearchResults,
    isNoRecentChatsSearchResults,
  };
};

export const filterSavedPrompts = (
  savedPrompts: SavedPrompt[],
  filterValue: string,
): { items: SavedPrompt[]; isNoSearchResults: boolean } => {
  if (!filterValue) {
    return { items: savedPrompts, isNoSearchResults: false };
  }

  const filtered = savedPrompts.filter(
    prompt =>
      matchesFilter(prompt.name, filterValue) ||
      matchesFilter(prompt.content, filterValue),
  );

  return {
    items: filtered,
    isNoSearchResults: filtered.length === 0 && savedPrompts.length > 0,
  };
};

export type BuildConversationHistoryGroupsOptions = {
  savedPrompts: SavedPrompt[];
  categorizedMessages: { [key: string]: Conversation[] };
  filterValue: string;
  isSavedPromptsEnabled: boolean;
  isPinningChatsEnabled: boolean;
  sectionState: ConversationHistorySectionState;
  onSavedPromptsExpandedChange: (expanded: boolean) => void;
  onPinnedExpandedChange: (expanded: boolean) => void;
  onChatsExpandedChange: (expanded: boolean) => void;
  onSavedPromptsShowAllChange: (expanded: boolean) => void;
  onOpenSavedPromptsSettings: () => void;
  getSavedPromptMenuItems: (prompt: SavedPrompt) => ReactNode;
  t: (key: string, params?: any) => string;
};

export type BuildConversationHistoryGroupsResult = {
  groups: ConversationGroup[];
  hasNoSearchResults: boolean;
};

const truncatedTitleProps = {
  style: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

const getSavedPromptsShowAllLabel = (
  isExpanded: boolean,
  t: (key: string, params?: any) => string,
) => (
  <Typography
    component="span"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
    }}
  >
    {isExpanded
      ? t('savedPrompts.sidebar.showLess')
      : t('savedPrompts.sidebar.showAll')}
    {isExpanded ? <CaretUpIcon aria-hidden /> : <CaretDownIcon aria-hidden />}
  </Typography>
);

export const buildConversationHistoryGroups = ({
  savedPrompts,
  categorizedMessages,
  filterValue,
  isSavedPromptsEnabled,
  isPinningChatsEnabled,
  sectionState,
  onSavedPromptsExpandedChange,
  onPinnedExpandedChange,
  onChatsExpandedChange,
  onSavedPromptsShowAllChange,
  onOpenSavedPromptsSettings,
  getSavedPromptMenuItems,
  t,
}: BuildConversationHistoryGroupsOptions): BuildConversationHistoryGroupsResult => {
  const groups: ConversationGroup[] = [];

  const {
    items: filteredSavedPrompts,
    isNoSearchResults: isNoSavedPromptsSearchResults,
  } = filterSavedPrompts(savedPrompts, filterValue);

  const {
    pinnedChats,
    recentChats,
    isNoPinnedChatsSearchResults,
    isNoRecentChatsSearchResults,
  } = filterCategorizedMessages(
    categorizedMessages,
    filterValue,
    isPinningChatsEnabled,
    t,
  );

  const hasNoSearchResults =
    Boolean(filterValue) &&
    isNoPinnedChatsSearchResults &&
    isNoRecentChatsSearchResults &&
    (!isSavedPromptsEnabled ||
      isNoSavedPromptsSearchResults ||
      savedPrompts.length === 0);

  if (hasNoSearchResults) {
    return { groups: [], hasNoSearchResults: true };
  }

  if (isSavedPromptsEnabled) {
    const savedPromptItems: Conversation[] =
      filteredSavedPrompts.length > 0
        ? filteredSavedPrompts.map(prompt => ({
            id: savedPromptConversationId(prompt.id),
            text: prompt.name,
            icon: <OutlinedBookmarkIcon />,
            label: t('savedPrompts.actions.menuAriaLabel' as any, {
              name: prompt.name,
            }),
            menuItems: getSavedPromptMenuItems(prompt),
            additionalProps: truncatedTitleProps,
          }))
        : [
            disabledPlaceholderConversation(
              isNoSavedPromptsSearchResults
                ? 'no-saved-prompts-search-results'
                : 'no-saved-prompts',
              isNoSavedPromptsSearchResults
                ? t('common.noSearchResults')
                : t('savedPrompts.sidebar.empty'),
            ),
          ];

    groups.push({
      id: 'saved-prompts',
      label: (
        <div
          className="lightspeed-saved-prompts-group-label"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '0.25rem',
          }}
        >
          <div>{t('conversation.category.savedPrompts')}</div>
          <Button
            className="lightspeed-saved-prompts-section-gear"
            variant="plain"
            aria-label={t('savedPrompts.sidebar.openSettings')}
            icon={<CogIcon />}
            onClick={event => {
              event.stopPropagation();
              onOpenSavedPromptsSettings();
            }}
          />
        </div>
      ),
      items: savedPromptItems,
      menuGroupProps: {
        className: 'lightspeed-saved-prompts-group',
      },
      expandable: {
        isExpanded: sectionState.savedPromptsExpanded,
        onToggle: onSavedPromptsExpandedChange,
      },
      showAll:
        filteredSavedPrompts.length > SAVED_PROMPTS_VISIBLE_COUNT
          ? {
              visibleCount: SAVED_PROMPTS_VISIBLE_COUNT,
              isExpanded: sectionState.savedPromptsShowAllExpanded,
              onToggle: onSavedPromptsShowAllChange,
              label: getSavedPromptsShowAllLabel(
                sectionState.savedPromptsShowAllExpanded,
                t,
              ),
            }
          : undefined,
    });
  }

  if (isPinningChatsEnabled) {
    groups.push({
      id: 'pinned-chats',
      label: t('conversation.category.pinnedChats'),
      items: pinnedChats,
      expandable: {
        isExpanded: sectionState.pinnedExpanded,
        onToggle: onPinnedExpandedChange,
      },
    });
  }

  groups.push({
    id: 'chats',
    label: t('conversation.category.recent'),
    items: recentChats,
    expandable: {
      isExpanded: sectionState.chatsExpanded,
      onToggle: onChatsExpandedChange,
    },
  });

  return { groups, hasNoSearchResults: false };
};
