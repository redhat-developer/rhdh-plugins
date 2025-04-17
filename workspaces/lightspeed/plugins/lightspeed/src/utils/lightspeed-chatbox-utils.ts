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
import { Conversation } from '@patternfly/chatbot';

import { BaseMessage, ConversationList, ConversationSummary } from '../types';

export const getFootnoteProps = () => ({
  label: 'Lightspeed uses AI. Check for mistakes.',
  popover: {
    title: 'Verify accuracy',
    description: `While Lightspeed strives for accuracy, there's always a possibility of errors. It's a good practice to verify critical information from reliable sources, especially if it's crucial for decision-making or actions.`,
    bannerImage: {
      src: 'https://cdn.dribbble.com/userupload/10651749/file/original-8a07b8e39d9e8bf002358c66fce1223e.gif',
      alt: 'Example image for footnote popover',
    },
    cta: {
      label: 'Got it',
      onClick: () => {},
    },
    link: {
      label: 'Learn more',
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
  if (typeof unix_timestamp !== 'number' || isNaN(unix_timestamp)) {
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
};

export const createMessage = ({
  role,
  name = 'Guest',
  avatar,
  isLoading = false,
  content,
  timestamp,
  error,
}: MessageProps & { role: 'user' | 'bot' }) => ({
  role,
  name,
  avatar,
  isLoading,
  content,
  timestamp,
  error,
});

export const createUserMessage = (props: MessageProps) =>
  createMessage({
    ...props,
    role: 'user',
    name: props.name ?? 'Guest',
  });

export const createBotMessage = (props: MessageProps) =>
  createMessage({
    ...props,
    role: 'bot',
  });

export const getMessageData = (message: BaseMessage) => {
  return {
    model: message?.response_metadata?.model,
    content: message?.content || '',
    timestamp: getTimestamp(message?.response_metadata?.created_at * 1000),
  };
};

export const getDayDifference = (sourceTime: number, targetTime: number) => {
  const sourceDate = new Date(sourceTime);
  const targetDate = new Date(targetTime);

  sourceDate.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const timeDifference = sourceDate.getTime() - targetDate.getTime();

  return Math.floor(timeDifference / (1000 * 60 * 60 * 24));
};

export const getCategorizeMessages = (
  messages: ConversationList,
  addProps: (c: ConversationSummary) => { [k: string]: any },
): { [k: string]: Conversation[] } => {
  const now: any = new Date();
  const today = now.toDateString();

  const categorizedMessages: { [k: string]: Conversation[] } = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
  };
  messages
    .sort((a, b) => b.last_message_timestamp - a.last_message_timestamp)
    .forEach(c => {
      const messageDate = new Date(c.last_message_timestamp * 1000);
      const messageDayString = messageDate.toDateString();
      const dayDifference = getDayDifference(
        now,
        c.last_message_timestamp * 1000,
      );
      const message: Conversation = {
        id: c.conversation_id,
        text: c.topic_summary,
        label: 'Options',
        ...addProps(c),
      };

      if (messageDayString === today) {
        categorizedMessages.Today.push(message);
      } else if (dayDifference === 1) {
        categorizedMessages.Yesterday.push(message);
      } else if (dayDifference <= 7) {
        categorizedMessages['Previous 7 Days'].push(message);
      } else if (dayDifference <= 30) {
        categorizedMessages['Previous 30 Days'].push(message);
      } else {
        // handle month-wise grouping
        const monthYear = messageDate.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        });
        if (!categorizedMessages[monthYear]) {
          categorizedMessages[monthYear] = [];
        }
        categorizedMessages[monthYear].push(message);
      }
    });

  const filteredCategories = Object.keys(categorizedMessages).reduce(
    (result, category) => {
      if (categorizedMessages[category].length > 0) {
        result[category] = categorizedMessages[category];
      }
      return result;
    },
    {} as any,
  );

  return filteredCategories;
};
