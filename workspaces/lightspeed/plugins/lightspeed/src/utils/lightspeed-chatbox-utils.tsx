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
import PushPinIcon from '@mui/icons-material/PushPin';
import { Conversation, SourcesCardProps } from '@patternfly/chatbot';
import { Spinner } from '@patternfly/react-core';

import {
  BaseMessage,
  ConversationList,
  ConversationSummary,
  LCSConversation,
  ReferencedDocument,
  ReferencedDocuments,
  ToolCall,
} from '../types';

export const getFootnoteProps = (
  t?: (key: string, params?: any) => string,
) => ({
  label:
    t?.('footer.accuracy.label') ||
    'Always review AI generated content prior to use.',
});

export const getTimestampVariablesString = (v: number) => {
  if (v < 10) {
    return `0${v}`;
  }
  return `${v}`;
};

const isBlankLine = (line: string) => !line.trim();

/** Ordered list item at line start (CommonMark), ignoring leading spaces. */
const isOrderedListLine = (line: string) => /^\s*\d+\.\s/.test(line);

const isBulletListLine = (line: string) => /^\s*[-*+]\s/.test(line);

const escapeOrderedListMarker = (line: string) =>
  line.replace(/^(\s*)(\d+)\.(\s)/, '$1$2\\.$3');

const escapeBulletListMarker = (line: string) =>
  line.replace(/^(\s*)([*+-])(\s)/, '$1\\$2$3');

/**
 * Paragraph + ordered list (even with a single newline) parses as two blocks; merge
 * intro + contiguous numbered lines into one paragraph using hard breaks (two spaces
 * + newline) and escaped `1.` markers so Markdown stays a single block.
 */
const foldOrderedListWithIntro = (s: string): string => {
  const lines = s.split('\n');
  let firstListIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isOrderedListLine(lines[i])) {
      firstListIdx = i;
      break;
    }
  }
  if (firstListIdx < 0) {
    return s;
  }

  const intro = lines.slice(0, firstListIdx);
  if (intro.some(isBlankLine)) {
    return s;
  }

  const rest = lines.slice(firstListIdx);
  const restItems = rest.filter(l => !isBlankLine(l));
  if (restItems.length === 0 || !restItems.every(isOrderedListLine)) {
    return s;
  }

  const escaped = restItems.map(escapeOrderedListMarker);
  if (intro.length === 0) {
    return escaped.join('  \n');
  }
  return `${intro.join('  \n')}  \n${escaped.join('  \n')}`;
};

/** Same idea as ordered lists for intro + bullet lines. */
const foldBulletListWithIntro = (s: string): string => {
  const lines = s.split('\n');
  let firstListIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isBulletListLine(lines[i])) {
      firstListIdx = i;
      break;
    }
  }
  if (firstListIdx < 0) {
    return s;
  }

  const intro = lines.slice(0, firstListIdx);
  if (intro.some(isBlankLine)) {
    return s;
  }

  const rest = lines.slice(firstListIdx);
  const restItems = rest.filter(l => !isBlankLine(l));
  if (restItems.length === 0 || !restItems.every(isBulletListLine)) {
    return s;
  }

  const escaped = restItems.map(escapeBulletListMarker);
  if (intro.length === 0) {
    return escaped.join('  \n');
  }
  return `${intro.join('  \n')}  \n${escaped.join('  \n')}`;
};

/**
 * Trims user chat input and reduces blank lines that split Markdown blocks
 * (e.g. paragraph + blank line + ordered list) so PatternFly renders one user bubble.
 */
export const normalizeChatUserInput = (input: string): string => {
  let s = input.replace(/\r\n/g, '\n').trim();
  if (!s) {
    return s;
  }
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.replace(/\n\n(?=\d+\.\s)/gm, '\n');
  s = s.replace(/\n\n(?=\s*[-*+]\s)/gm, '\n');
  s = foldOrderedListWithIntro(s);
  s = foldBulletListWithIntro(s);
  return s.trim();
};

export const getTimestamp = (unix_timestamp: number) => {
  if (typeof unix_timestamp !== 'number' || Number.isNaN(unix_timestamp)) {
    // eslint-disable-next-line no-console
    console.error('Invalid Unix timestamp provided');
    return '';
  }

  const a = new Date(unix_timestamp);
  const month = getTimestampVariablesString(a.getMonth() + 1);
  const year = a.getFullYear();
  const date = getTimestampVariablesString(a.getDate());
  const hour = getTimestampVariablesString(a.getHours());
  const min = getTimestampVariablesString(a.getMinutes());
  const sec = getTimestampVariablesString(a.getSeconds());
  const time = `${date}/${month}/${year}, ${hour}:${min}:${sec}`;
  return time;
};

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

type MessageProps = {
  content: string;
  timestamp: string;
  name?: string;
  avatar?: string | any;
  isLoading?: boolean;
  error?: {
    title: string;
  };
  sources?: SourcesCardProps;
  toolCalls?: ToolCall[];
};

export const createMessage = ({
  role,
  name,
  avatar,
  isLoading = false,
  content,
  timestamp,
  error,
  sources,
  toolCalls,
  defaultUserName = 'Guest',
}: MessageProps & { role: 'user' | 'bot'; defaultUserName?: string }) => ({
  role,
  name: name || defaultUserName,
  avatar,
  isLoading,
  content,
  timestamp,
  error,
  sources,
  toolCalls,
});

export const createUserMessage = (
  props: MessageProps & { defaultUserName?: string },
) =>
  createMessage({
    ...props,
    role: 'user',
    defaultUserName: props.defaultUserName,
  });

export const createBotMessage = (props: MessageProps) =>
  createMessage({
    ...props,
    role: 'bot',
  });

export const getConversationsData = (
  conversation: LCSConversation,
): [BaseMessage, BaseMessage] => {
  const [userMessage, botMessage] = conversation.messages || [];
  return [
    {
      ...userMessage,
      timestamp: getTimestamp(
        conversation.started_at
          ? new Date(conversation.started_at).getTime()
          : Date.now(),
      ),
    },
    {
      ...botMessage,
      timestamp: getTimestamp(
        conversation.completed_at
          ? new Date(conversation.completed_at).getTime()
          : Date.now(),
      ),
      referenced_documents: botMessage?.referenced_documents ?? [],
    },
  ];
};

export const transformDocumentsToSources = (
  referenced_documents: ReferencedDocuments,
): SourcesCardProps | undefined => {
  if (!referenced_documents || referenced_documents?.length === 0) {
    return undefined;
  }
  return {
    sources: referenced_documents.map((doc: ReferencedDocument) => ({
      body: doc.doc_description,
      title: doc.doc_title,
      link: doc?.doc_url,
      isExternal: !!doc?.doc_url,
    })),
  };
};

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'alphabeticalAsc'
  | 'alphabeticalDesc';

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
  const pinnedChatsKey = t?.('conversation.category.pinnedChats') || 'Pinned';
  const recentKey = t?.('conversation.category.recent') || 'Recent';
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
          <PushPinIcon
            sx={{
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
