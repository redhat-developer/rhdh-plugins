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

import {
  ConversationList,
  ConversationSummary,
  ReferencedDocuments,
} from '../../types';
import {
  createBotMessage,
  createMessage,
  createUserMessage,
  getCategorizeMessages,
  getTimestamp,
  getTimestampVariablesString,
  splitJsonStrings,
  transformDocumentsToSources,
} from '../lightspeed-chatbox-utils';

const referenced_documents: ReferencedDocuments = [
  {
    doc_title: 'About Red Hat Developer Hub',
    doc_description: 'Document description test',
    doc_url:
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.6/html-single/about_red_hat_developer_hub/index',
  },
  {
    doc_description: undefined,
    doc_title: 'Adoption Insights in Red Hat Developer Hub',
    doc_url:
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.6/html-single/adoption_insights_in_red_hat_developer_hub/index',
  },
];

describe('getTimestampVariablesString', () => {
  it('should add a leading zero if the number is less than 10', () => {
    expect(getTimestampVariablesString(5)).toBe('05');
  });

  it('should return the number as a string if it is 10 or greater', () => {
    expect(getTimestampVariablesString(10)).toBe('10');
    expect(getTimestampVariablesString(23)).toBe('23');
  });
});

describe('getTimestamp', () => {
  it('should format a given timestamp correctly', () => {
    const unixTimestamp = 1609459200000; // 01 Jan 2021 00:00:00 UTC
    const result = getTimestamp(unixTimestamp);
    expect(result).toBe('01/01/2021, 00:00:00');
  });

  it('should handle single-digit day, month, hour, minute, and second', () => {
    const unixTimestamp = new Date(2024, 0, 5, 3, 7, 9).getTime(); // 05 Jan 2024 03:07:09
    const result = getTimestamp(unixTimestamp);
    expect(result).toBe('05/01/2024, 03:07:09');
  });

  it('should handle end-of-year timestamps correctly', () => {
    const unixTimestamp = new Date(2024, 11, 31, 23, 59, 59).getTime(); // 31 Dec 2024 23:59:59
    const result = getTimestamp(unixTimestamp);
    expect(result).toBe('31/12/2024, 23:59:59');
  });

  it('should handle the beginning of the epoch (0 timestamp)', () => {
    const unixTimestamp = 0; // 01 Jan 1970 00:00:00 UTC
    const result = getTimestamp(unixTimestamp);
    expect(result).toBe('01/01/1970, 00:00:00');
  });

  it('should handle timestamps with daylight saving time shifts', () => {
    const unixTimestamp = new Date(2024, 2, 14, 2, 30, 0).getTime(); // 14 Mar 2024 02:30:00 (DST transition for some regions)
    const result = getTimestamp(unixTimestamp);
    expect(result).toBe('14/03/2024, 02:30:00');
  });
});

describe('splitJsonStrings', () => {
  it('should return the entire string in an array if no `}{` pattern is found', () => {
    const jsonString = '{"key1":"value1","key2":"value2"}';
    const result = splitJsonStrings(jsonString);
    expect(result).toEqual([jsonString]);
  });

  it('should split a concatenated JSON string into individual JSON strings', () => {
    const jsonString = '{"key1":"value1"}{"key2":"value2"}{"key3":"value3"}';
    const result = splitJsonStrings(jsonString);
    expect(result).toEqual([
      '{"key1":"value1"}',
      '{"key2":"value2"}',
      '{"key3":"value3"}',
    ]);
  });

  it('should handle a JSON string with multiple concatenated objects correctly', () => {
    const jsonString =
      '{"key1":"value1"}{"key2":"value2"}{"key3":"value3"}{"key4":"value4"}';
    const result = splitJsonStrings(jsonString);
    expect(result).toEqual([
      '{"key1":"value1"}',
      '{"key2":"value2"}',
      '{"key3":"value3"}',
      '{"key4":"value4"}',
    ]);
  });

  it('should handle a JSON string with edge case of empty objects', () => {
    const jsonString = '{}{}';
    const result = splitJsonStrings(jsonString);
    expect(result).toEqual(['{}', '{}']);
  });

  it('should handle a JSON string with nested braces correctly', () => {
    const jsonString = '{"key1":{"subKey":"subValue"}}{"key2":"value2"}';
    const result = splitJsonStrings(jsonString);
    expect(result).toEqual([
      '{"key1":{"subKey":"subValue"}}',
      '{"key2":"value2"}',
    ]);
  });
});

describe('createMessage', () => {
  it('should create a user message with default values', () => {
    const message = createMessage({
      role: 'user',
      content: 'Hello',
      timestamp: '2024-10-30T10:00:00Z',
    });
    expect(message).toEqual({
      role: 'user',
      name: 'Guest',
      avatar: undefined,
      isLoading: false,
      content: 'Hello',
      timestamp: '2024-10-30T10:00:00Z',
    });
  });

  it('should create a bot message with custom values', () => {
    const message = createMessage({
      role: 'bot',
      name: 'Bot',
      avatar: 'bot-avatar.png',
      isLoading: true,
      content: 'Hello from bot',
      timestamp: '2024-10-30T11:00:00Z',
    });
    expect(message).toEqual({
      role: 'bot',
      name: 'Bot',
      avatar: 'bot-avatar.png',
      isLoading: true,
      content: 'Hello from bot',
      timestamp: '2024-10-30T11:00:00Z',
    });
  });
});

describe('createUserMessage', () => {
  it('should create a user message with default name if name is not provided', () => {
    const message = createUserMessage({
      content: 'User message',
      timestamp: '2024-10-30T12:00:00Z',
    });
    expect(message).toEqual({
      role: 'user',
      name: 'Guest',
      avatar: undefined,
      isLoading: false,
      content: 'User message',
      timestamp: '2024-10-30T12:00:00Z',
    });
  });

  it('should create a user message with provided name', () => {
    const message = createUserMessage({
      name: 'John',
      avatar: 'alice-avatar.png',
      content: 'Hello, this is John',
      timestamp: '2024-10-30T13:00:00Z',
    });
    expect(message).toEqual({
      role: 'user',
      name: 'John',
      avatar: 'alice-avatar.png',
      isLoading: false,
      content: 'Hello, this is John',
      timestamp: '2024-10-30T13:00:00Z',
    });
  });
});

describe('createBotMessage', () => {
  it('should create a bot message with provided properties', () => {
    const message = createBotMessage({
      name: 'BotMaster',
      avatar: 'bot-avatar.png',
      content: 'Bot message content',
      timestamp: '2024-10-30T14:00:00Z',
      isLoading: true,
    });
    expect(message).toEqual({
      role: 'bot',
      name: 'BotMaster',
      avatar: 'bot-avatar.png',
      isLoading: true,
      content: 'Bot message content',
      timestamp: '2024-10-30T14:00:00Z',
    });
  });

  it('should create a bot message with source links', () => {
    const message = createBotMessage({
      name: 'BotMaster',
      avatar: 'bot-avatar.png',
      content: 'Bot message content',
      timestamp: '2024-10-30T14:00:00Z',
      isLoading: true,
      sources: transformDocumentsToSources(referenced_documents),
    });

    expect(message?.sources?.sources).toHaveLength(2);
    expect(message).toEqual(
      expect.objectContaining({
        role: 'bot',
        name: 'BotMaster',
        avatar: 'bot-avatar.png',
        isLoading: true,
        content: 'Bot message content',
        timestamp: '2024-10-30T14:00:00Z',
        sources: {
          sources: expect.arrayContaining([
            expect.objectContaining({
              isExternal: true,
              link: expect.anything(),
              title: expect.anything(),
            }),
          ]),
        },
      }),
    );
  });
});

describe('transformDocumentsToSources', () => {
  it('should return undefined if invalid values are passed to referenced_documents', () => {
    expect(
      transformDocumentsToSources(undefined as unknown as any),
    ).toBeUndefined();
    expect(transformDocumentsToSources(null as unknown as any)).toBeUndefined();
    expect(transformDocumentsToSources([] as unknown as any)).toBeUndefined();
  });

  it('should transform referenced documents into message sources', () => {
    const sources = transformDocumentsToSources(referenced_documents);
    expect(sources?.sources).toHaveLength(2);
    expect(sources).toEqual(
      expect.objectContaining({
        sources: expect.arrayContaining([
          expect.objectContaining({
            isExternal: true,
            link: expect.anything(),
            title: expect.anything(),
          }),
        ]),
      }),
    );
  });

  it('should add document description in referenced documents into message sources', () => {
    const sources = transformDocumentsToSources(
      referenced_documents.map(rd => ({
        ...rd,
        doc_description: 'Document description test',
      })),
    );
    expect(sources?.sources).toHaveLength(2);
    expect(sources).toEqual(
      expect.objectContaining({
        sources: expect.arrayContaining([
          expect.objectContaining({
            isExternal: true,
            link: expect.anything(),
            title: expect.anything(),
            body: 'Document description test',
          }),
        ]),
      }),
    );
  });
});
describe('getCategorizeMessages', () => {
  const addProps = (c: ConversationSummary) => ({
    customProp: `prop-${c.conversation_id}`,
  });

  const messages: ConversationList = [
    {
      conversation_id: '1',
      last_message_timestamp: Date.now() / 1000,
      topic_summary: 'Today message',
    },
    {
      conversation_id: '2',
      last_message_timestamp: (Date.now() - 24 * 60 * 60 * 1000) / 1000,
      topic_summary: 'Yesterday message',
    },
    {
      conversation_id: '3',
      last_message_timestamp: (Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000,
      topic_summary: '5 days ago',
    },
    {
      conversation_id: '4',
      last_message_timestamp: (Date.now() - 15 * 24 * 60 * 60 * 1000) / 1000,
      topic_summary: '15 days ago',
    },
    {
      conversation_id: '5',
      last_message_timestamp: (Date.now() - 45 * 24 * 60 * 60 * 1000) / 1000,
      topic_summary: '45 days ago',
    },
  ];

  it('categorizes messages correctly', () => {
    const result = getCategorizeMessages(messages, addProps);

    expect(result.Today).toHaveLength(1);
    expect(result.Today[0].text).toBe('Today message');

    expect(result.Yesterday).toHaveLength(1);
    expect(result.Yesterday[0].text).toBe('Yesterday message');

    expect(result['Previous 7 Days']).toHaveLength(1);
    expect(result['Previous 7 Days'][0].text).toBe('5 days ago');

    expect(result['Previous 30 Days']).toHaveLength(1);
    expect(result['Previous 30 Days'][0].text).toBe('15 days ago');

    const monthYearKey = new Date(
      messages[4].last_message_timestamp * 1000,
    ).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
    expect(result[monthYearKey]).toHaveLength(1);
    expect(result[monthYearKey][0].text).toBe('45 days ago');
  });
});
