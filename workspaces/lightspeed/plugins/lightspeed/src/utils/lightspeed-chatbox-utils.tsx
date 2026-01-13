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
import { PopoverProps } from '@patternfly/react-core';

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
  additionalClassName: string,
  t?: (key: string, params?: any) => string,
) => ({
  label:
    t?.('footer.accuracy.label') ||
    'Always review AI generated content prior to use.',
  popover: {
    popoverProps: {
      className: additionalClassName ?? '',
    } as PopoverProps,
    title: t?.('footer.accuracy.popover.title') || 'Verify accuracy',
    description:
      t?.('footer.accuracy.popover.description') ||
      `While Developer Lightspeed strives for accuracy, there's always a possibility of errors. It's a good practice to verify critical information from reliable sources, especially if it's crucial for decision-making or actions.`,
    bannerImage: {
      src: 'https://cdn.dribbble.com/userupload/10651749/file/original-8a07b8e39d9e8bf002358c66fce1223e.gif',
      alt:
        t?.('footer.accuracy.popover.image.alt') ||
        'Example image for footnote popover',
    },
    cta: {
      label: t?.('footer.accuracy.popover.cta.label') || 'Got it',
      onClick: () => {},
    },
    link: {
      label: t?.('footer.accuracy.popover.link.label') || 'Learn more',
      url: 'https://www.redhat.com/',
    },
  },
});

export const getTimestampVariablesString = (v: number) => {
  if (v < 10) {
    return `0${v}`;
  }
  return `${v}`;
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
      isExternal: true,
    })),
  };
};

export const getCategorizeMessages = (
  messages: ConversationList,
  pinnedChats: string[],
  addProps: (c: ConversationSummary) => { [k: string]: any },
  t?: (key: string, params?: any) => string,
): { [k: string]: Conversation[] } => {
  const pinnedChatsKey = t?.('conversation.category.pinnedChats') || 'Pinned';
  const recentKey = t?.('conversation.category.recent') || 'Recent';
  const categorizedMessages: { [k: string]: Conversation[] } = {
    [pinnedChatsKey]: [],
    [recentKey]: [],
  };
  const sortedMessages = [...messages].sort(
    (a, b) => b.last_message_timestamp - a.last_message_timestamp,
  );
  sortedMessages.forEach(c => {
    const message: Conversation = {
      id: c.conversation_id,
      text: c.topic_summary,
      label: t?.('message.options.label') || 'Options',
      additionalProps: {
        'aria-label': t?.('aria.options.label') || 'Options',
      },
      ...addProps(c),
    };

    if (pinnedChats.includes(c.conversation_id)) {
      categorizedMessages[pinnedChatsKey].push({
        ...message,
        icon: <PushPinIcon />,
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
