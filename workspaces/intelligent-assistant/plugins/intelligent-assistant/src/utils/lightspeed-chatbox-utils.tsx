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
import { ChatbotFootnote, Conversation } from '@patternfly/chatbot';
import { Spinner } from '@patternfly/react-core';
import { ThumbtackIcon } from '@patternfly/react-icons';
import { RhUiAiInfoIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-ai-info-icon';

import { ConversationList, ConversationSummary } from '../types';
import {
  createBotMessage,
  createMessage,
  createUserMessage,
  getConversationsData,
  getTimestamp,
  getTimestampVariablesString,
  normalizeChatUserInput,
  transformDocumentsToSources,
  type SourceWithRagId,
} from './lightspeed-chatbox-message-utils';

export {
  createBotMessage,
  createMessage,
  createUserMessage,
  getConversationsData,
  getTimestamp,
  getTimestampVariablesString,
  normalizeChatUserInput,
  transformDocumentsToSources,
};
export type { SourceWithRagId };

export const getFootnoteProps = (
  t?: (key: string, params?: any) => string,
) => ({
  label:
    t?.('footer.accuracy.label') ||
    'Always review AI generated content prior to use.',
});

export const ChatbotFootnoteWithIcon = ({ label }: { label: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
    }}
  >
    <RhUiAiInfoIcon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
    <ChatbotFootnote label={label} />
  </div>
);

export const splitJsonStrings = (jsonString: string): string[] => {
  const chunks = jsonString.split('}{');

  if (chunks.length <= 1) {
    return [jsonString];
  }

  return chunks.map((chunk, index, arr) => {
    if (index === 0) {
      return `${chunk}}`;
    } else if (index === arr.length - 1) {
      return `{${chunk}`;
    }
    return `{${chunk}}`;
  });
};

export type SortOption =
  'newest' | 'oldest' | 'alphabeticalAsc' | 'alphabeticalDesc';

const sortConversations = (
  messages: ConversationList,
  sortOption: SortOption,
): ConversationList => {
  return [...messages].sort((a, b) => {
    const aTopicSummary = a.topic_summary || '';
    const bTopicSummary = b.topic_summary || '';
    switch (sortOption) {
      case 'oldest':
        return a.last_message_timestamp - b.last_message_timestamp;
      case 'alphabeticalAsc':
        return aTopicSummary.localeCompare(bTopicSummary, undefined, {
          sensitivity: 'base',
        });
      case 'alphabeticalDesc':
        return bTopicSummary.localeCompare(aTopicSummary, undefined, {
          sensitivity: 'base',
        });
      case 'newest':
      default:
        return b.last_message_timestamp - a.last_message_timestamp;
    }
  });
};

export const getCategorizeMessages = (
  messages: ConversationList,
  pinnedChats: string[],
  addProps: (c: ConversationSummary) => { [k: string]: any },
  t?: (key: string, params?: any) => string,
  sortOption: SortOption = 'newest',
): { [k: string]: Conversation[] } => {
  const pinnedChatsKey =
    t?.('conversation.category.pinnedChats') || 'Pinned chats';
  const recentKey = t?.('conversation.category.recent') || 'Chats';
  const categorizedMessages: { [k: string]: Conversation[] } = {
    [pinnedChatsKey]: [],
    [recentKey]: [],
  };
  const sortedMessages = sortConversations(messages, sortOption);
  sortedMessages.forEach(c => {
    const message: Conversation = {
      id: c.conversation_id,
      text: c.topic_summary ?? '',
      icon: c.topic_summary ? undefined : <Spinner size="sm" />,
      label: t?.('message.options.label') || 'Options',
      additionalProps: {
        'aria-label': t?.('aria.options.label') || 'Options',
      },
      ...addProps(c),
    };

    if (pinnedChats.includes(c.conversation_id)) {
      categorizedMessages[pinnedChatsKey].push({
        ...message,
        icon: (
          <ThumbtackIcon
            style={{
              width: '1rem',
              height: '1rem',
              display: 'flex',
              alignItems: 'center',
            }}
          />
        ),
      });
    } else {
      categorizedMessages[recentKey].push(message);
    }
  });

  const filteredCategories = Object.keys(categorizedMessages).reduce(
    (result, category) => {
      result[category] = categorizedMessages[category];
      return result;
    },
    {} as any,
  );

  return filteredCategories;
};
