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
import { act, renderHook } from '@testing-library/react';

import { useConversationHistoryGroups } from '../useConversationHistoryGroups';

jest.mock('../useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const categorizedMessages = {
  'conversation.category.pinnedChats': [
    { id: 'chat-1', text: 'Pinned' } as Conversation,
  ],
  'conversation.category.recent': [
    { id: 'chat-2', text: 'Recent' } as Conversation,
  ],
};

describe('useConversationHistoryGroups', () => {
  it('builds conversation groups with saved prompts first', () => {
    const openSettings = jest.fn();
    const { result } = renderHook(() =>
      useConversationHistoryGroups({
        savedPrompts: [
          {
            id: 'p1',
            name: 'Prompt',
            content: 'hello',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        categorizedMessages,
        filterValue: '',
        isSavedPromptsEnabled: true,
        isPinningChatsEnabled: true,
        isSettingsOpen: false,
        activeSettingsTab: 'mcp-servers',
        openSettings,
        getSavedPromptMenuItems: () => null,
      }),
    );

    expect(result.current.conversationGroups[0].id).toBe('saved-prompts');
  });

  it('opens saved prompts settings from gear handler', () => {
    const openSettings = jest.fn();
    const { result } = renderHook(() =>
      useConversationHistoryGroups({
        savedPrompts: [],
        categorizedMessages,
        filterValue: '',
        isSavedPromptsEnabled: true,
        isPinningChatsEnabled: true,
        isSettingsOpen: false,
        activeSettingsTab: 'mcp-servers',
        openSettings,
        getSavedPromptMenuItems: () => null,
      }),
    );

    act(() => {
      result.current.handleOpenSavedPromptsSettings();
    });

    expect(openSettings).toHaveBeenCalledWith('saved-prompts');
  });

  it('no-ops gear handler when saved prompts settings are already open', () => {
    const openSettings = jest.fn();
    const { result } = renderHook(() =>
      useConversationHistoryGroups({
        savedPrompts: [],
        categorizedMessages,
        filterValue: '',
        isSavedPromptsEnabled: true,
        isPinningChatsEnabled: true,
        isSettingsOpen: true,
        activeSettingsTab: 'saved-prompts',
        openSettings,
        getSavedPromptMenuItems: () => null,
      }),
    );

    act(() => {
      result.current.handleOpenSavedPromptsSettings();
    });

    expect(openSettings).not.toHaveBeenCalled();
  });
});
