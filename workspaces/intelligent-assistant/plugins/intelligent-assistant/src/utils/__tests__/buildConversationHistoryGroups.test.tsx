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
import { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { render, screen } from '@testing-library/react';

import { SavedPrompt } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import {
  buildConversationHistoryGroups,
  filterCategorizedMessages,
  filterSavedPrompts,
  isSavedPromptConversationId,
  SAVED_PROMPTS_VISIBLE_COUNT,
  savedPromptConversationId,
} from '../buildConversationHistoryGroups';

const t = (key: string) => {
  const messages: Record<string, string> = {
    'conversation.category.pinnedChats': 'Pinned chats',
    'conversation.category.recent': 'Chats',
    'conversation.category.savedPrompts': 'Saved prompts',
    'common.noSearchResults': 'No search results',
    'chatbox.emptyState.noPinnedChats': 'No pinned chats',
    'chatbox.emptyState.noRecentChats': 'No recent chats',
    'savedPrompts.sidebar.showAll': 'Show all',
    'savedPrompts.sidebar.showLess': 'Show less',
    'savedPrompts.sidebar.openSettings': 'Open saved prompts settings',
    'savedPrompts.sidebar.empty': 'No saved prompts yet',
    'savedPrompts.actions.menuAriaLabel': 'Actions for {{name}}',
  };
  return messages[key] ?? key;
};

const baseSectionState = {
  savedPromptsExpanded: true,
  pinnedExpanded: true,
  chatsExpanded: true,
  savedPromptsShowAllExpanded: false,
};

const noop = () => {};

const samplePrompt = (id: string, name: string): SavedPrompt => ({
  id,
  name,
  content: `content for ${name}`,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
});

const categorizedMessages = {
  'Pinned chats': [{ id: 'chat-1', text: 'Pinned chat' } as Conversation],
  Chats: [{ id: 'chat-2', text: 'Recent chat' } as Conversation],
};

describe('buildConversationHistoryGroups', () => {
  it('orders saved prompts before pinned and recent chats', () => {
    const { groups } = buildConversationHistoryGroups({
      savedPrompts: [samplePrompt('1', 'My prompt')],
      categorizedMessages,
      filterValue: '',
      isSavedPromptsEnabled: true,
      isPinningChatsEnabled: true,
      sectionState: baseSectionState,
      onSavedPromptsExpandedChange: noop,
      onPinnedExpandedChange: noop,
      onChatsExpandedChange: noop,
      onSavedPromptsShowAllChange: noop,
      onOpenSavedPromptsSettings: noop,
      getSavedPromptMenuItems: () => null,
      t,
    });

    expect(groups.map(group => group.id)).toEqual([
      'saved-prompts',
      'pinned-chats',
      'chats',
    ]);
  });

  it('omits saved prompts group when feature is disabled', () => {
    const { groups } = buildConversationHistoryGroups({
      savedPrompts: [samplePrompt('1', 'My prompt')],
      categorizedMessages,
      filterValue: '',
      isSavedPromptsEnabled: false,
      isPinningChatsEnabled: true,
      sectionState: baseSectionState,
      onSavedPromptsExpandedChange: noop,
      onPinnedExpandedChange: noop,
      onChatsExpandedChange: noop,
      onSavedPromptsShowAllChange: noop,
      onOpenSavedPromptsSettings: noop,
      getSavedPromptMenuItems: () => null,
      t,
    });

    expect(groups.map(group => group.id)).toEqual(['pinned-chats', 'chats']);
  });

  it('adds showAll when more than five saved prompts exist', () => {
    const savedPrompts = Array.from({ length: 6 }, (_, index) =>
      samplePrompt(String(index + 1), `Prompt ${index + 1}`),
    );

    const { groups } = buildConversationHistoryGroups({
      savedPrompts,
      categorizedMessages,
      filterValue: '',
      isSavedPromptsEnabled: true,
      isPinningChatsEnabled: true,
      sectionState: baseSectionState,
      onSavedPromptsExpandedChange: noop,
      onPinnedExpandedChange: noop,
      onChatsExpandedChange: noop,
      onSavedPromptsShowAllChange: noop,
      onOpenSavedPromptsSettings: noop,
      getSavedPromptMenuItems: () => null,
      t,
    });

    const savedPromptsGroup = groups[0];
    expect(savedPromptsGroup.showAll?.visibleCount).toBe(
      SAVED_PROMPTS_VISIBLE_COUNT,
    );
    render(<>{savedPromptsGroup.showAll?.label}</>);
    expect(screen.getByText('Show all')).toBeInTheDocument();
  });

  it('sets bookmark icon on saved prompt items', () => {
    const { groups } = buildConversationHistoryGroups({
      savedPrompts: [samplePrompt('1', 'My prompt')],
      categorizedMessages,
      filterValue: '',
      isSavedPromptsEnabled: true,
      isPinningChatsEnabled: true,
      sectionState: baseSectionState,
      onSavedPromptsExpandedChange: noop,
      onPinnedExpandedChange: noop,
      onChatsExpandedChange: noop,
      onSavedPromptsShowAllChange: noop,
      onOpenSavedPromptsSettings: noop,
      getSavedPromptMenuItems: () => null,
      t,
    });

    const savedPromptItem = groups[0].items[0] as Conversation;
    expect(savedPromptItem.icon).toBeDefined();
  });

  it('returns hasNoSearchResults when all sections are filtered out', () => {
    const { hasNoSearchResults } = buildConversationHistoryGroups({
      savedPrompts: [samplePrompt('1', 'Saved only')],
      categorizedMessages,
      filterValue: 'missing',
      isSavedPromptsEnabled: true,
      isPinningChatsEnabled: true,
      sectionState: baseSectionState,
      onSavedPromptsExpandedChange: noop,
      onPinnedExpandedChange: noop,
      onChatsExpandedChange: noop,
      onSavedPromptsShowAllChange: noop,
      onOpenSavedPromptsSettings: noop,
      getSavedPromptMenuItems: () => null,
      t,
    });

    expect(hasNoSearchResults).toBe(true);
  });

  it('marks expandable sections for all groups', () => {
    const { groups } = buildConversationHistoryGroups({
      savedPrompts: [samplePrompt('1', 'Prompt')],
      categorizedMessages,
      filterValue: '',
      isSavedPromptsEnabled: true,
      isPinningChatsEnabled: true,
      sectionState: baseSectionState,
      onSavedPromptsExpandedChange: noop,
      onPinnedExpandedChange: noop,
      onChatsExpandedChange: noop,
      onSavedPromptsShowAllChange: noop,
      onOpenSavedPromptsSettings: noop,
      getSavedPromptMenuItems: () => null,
      t,
    });

    expect(groups.every(group => group.expandable?.isExpanded)).toBe(true);
  });
});

describe('filterSavedPrompts', () => {
  it('filters by name and content', () => {
    const prompts = [
      samplePrompt('1', 'Deploy app'),
      samplePrompt('2', 'Other'),
    ];
    prompts[1].content = 'rollback instructions';

    const { items } = filterSavedPrompts(prompts, 'rollback');
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('2');
  });
});

describe('filterCategorizedMessages', () => {
  it('returns placeholder rows when pinned chats are empty', () => {
    const result = filterCategorizedMessages(
      { 'Pinned chats': [], Chats: [] },
      '',
      true,
      t,
    );

    expect(result.pinnedChats[0].id).toBe('no-pinned-chats');
    expect(result.recentChats[0].id).toBe('no-recent-chats');
  });
});

describe('saved prompt conversation ids', () => {
  it('prefixes saved prompt ids', () => {
    expect(savedPromptConversationId('abc')).toBe('saved-prompt:abc');
    expect(isSavedPromptConversationId('saved-prompt:abc')).toBe(true);
    expect(isSavedPromptConversationId('chat-1')).toBe(false);
  });
});
