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
  SortOption,
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
      topic_summary: 'First message',
    },
    {
      conversation_id: '2',
      last_message_timestamp: (Date.now() - 24 * 60 * 60 * 1000) / 1000,
      topic_summary: 'Second message',
    },
    {
      conversation_id: '3',
      last_message_timestamp: (Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000,
      topic_summary: 'Third message',
    },
    {
      conversation_id: '4',
      last_message_timestamp: (Date.now() - 15 * 24 * 60 * 60 * 1000) / 1000,
      topic_summary: 'Fourth message',
    },
    {
      conversation_id: '5',
      last_message_timestamp: (Date.now() - 45 * 24 * 60 * 60 * 1000) / 1000,
      topic_summary: 'Fifth message',
    },
  ];

  it('categorizes messages into Pinned and Recent correctly', () => {
    const pinnedChats: string[] = ['1', '3'];
    const result = getCategorizeMessages(messages, pinnedChats, addProps);

    expect(result.Pinned).toHaveLength(2);
    expect(result.Pinned[0].text).toBe('First message');
    expect(result.Pinned[0].id).toBe('1');
    expect(result.Pinned[1].text).toBe('Third message');
    expect(result.Pinned[1].id).toBe('3');

    expect(result.Recent).toHaveLength(3);
    expect(result.Recent[0].text).toBe('Second message');
    expect(result.Recent[0].id).toBe('2');
    expect(result.Recent[1].text).toBe('Fourth message');
    expect(result.Recent[1].id).toBe('4');
    expect(result.Recent[2].text).toBe('Fifth message');
    expect(result.Recent[2].id).toBe('5');
  });

  it('categorizes all messages as Recent when no pinned chats', () => {
    const pinnedChats: string[] = [];
    const result = getCategorizeMessages(messages, pinnedChats, addProps);

    expect(result.Pinned).toHaveLength(0);
    expect(result.Recent).toHaveLength(5);
    expect(result.Recent[0].text).toBe('First message');
    expect(result.Recent[4].text).toBe('Fifth message');
  });

  it('categorizes all messages as Pinned when all are pinned', () => {
    const pinnedChats: string[] = ['1', '2', '3', '4', '5'];
    const result = getCategorizeMessages(messages, pinnedChats, addProps);

    expect(result.Pinned).toHaveLength(5);
    expect(result.Recent).toHaveLength(0);
    expect(result.Pinned[0].text).toBe('First message');
    expect(result.Pinned[4].text).toBe('Fifth message');
  });

  it('sorts messages by last_message_timestamp in descending order', () => {
    const pinnedChats: string[] = [];
    const result = getCategorizeMessages(messages, pinnedChats, addProps);

    // Messages should be sorted by timestamp descending (newest first)
    expect(result.Recent[0].id).toBe('1'); // Most recent
    expect(result.Recent[1].id).toBe('2');
    expect(result.Recent[2].id).toBe('3');
    expect(result.Recent[3].id).toBe('4');
    expect(result.Recent[4].id).toBe('5'); // Oldest
  });

  it('uses translation function when provided', () => {
    const pinnedChats: string[] = [];
    const mockT = jest.fn((key: string) => {
      if (key === 'conversation.category.pinnedChats') return 'Fijados';
      if (key === 'conversation.category.recent') return 'Recientes';
      if (key === 'message.options.label') return 'Opciones';
      return key;
    });

    const result = getCategorizeMessages(
      messages,
      pinnedChats,
      addProps,
      mockT,
    );

    expect(mockT).toHaveBeenCalledWith('conversation.category.pinnedChats');
    expect(mockT).toHaveBeenCalledWith('conversation.category.recent');
    expect(mockT).toHaveBeenCalledWith('message.options.label');
    expect(result.Fijados).toBeDefined();
    expect(result.Recientes).toBeDefined();
    expect(result.Recientes[0].label).toBe('Opciones');
  });

  describe('sorting functionality', () => {
    const sortTestMessages: ConversationList = [
      {
        conversation_id: 'a',
        last_message_timestamp: 1000,
        topic_summary: 'Zeta Chat',
      },
      {
        conversation_id: 'b',
        last_message_timestamp: 3000,
        topic_summary: 'Alpha Chat',
      },
      {
        conversation_id: 'c',
        last_message_timestamp: 2000,
        topic_summary: 'Beta Chat',
      },
    ];

    it('sorts messages by newest first (default)', () => {
      const result = getCategorizeMessages(
        sortTestMessages,
        [],
        addProps,
        undefined,
        'newest',
      );

      expect(result.Recent[0].id).toBe('b'); // timestamp 3000
      expect(result.Recent[1].id).toBe('c'); // timestamp 2000
      expect(result.Recent[2].id).toBe('a'); // timestamp 1000
    });

    it('sorts messages by oldest first', () => {
      const result = getCategorizeMessages(
        sortTestMessages,
        [],
        addProps,
        undefined,
        'oldest',
      );

      expect(result.Recent[0].id).toBe('a'); // timestamp 1000
      expect(result.Recent[1].id).toBe('c'); // timestamp 2000
      expect(result.Recent[2].id).toBe('b'); // timestamp 3000
    });

    it('sorts messages alphabetically ascending (A-Z)', () => {
      const result = getCategorizeMessages(
        sortTestMessages,
        [],
        addProps,
        undefined,
        'alphabeticalAsc',
      );

      expect(result.Recent[0].text).toBe('Alpha Chat');
      expect(result.Recent[1].text).toBe('Beta Chat');
      expect(result.Recent[2].text).toBe('Zeta Chat');
    });

    it('sorts messages alphabetically descending (Z-A)', () => {
      const result = getCategorizeMessages(
        sortTestMessages,
        [],
        addProps,
        undefined,
        'alphabeticalDesc',
      );

      expect(result.Recent[0].text).toBe('Zeta Chat');
      expect(result.Recent[1].text).toBe('Beta Chat');
      expect(result.Recent[2].text).toBe('Alpha Chat');
    });

    it('applies sorting to both pinned and recent sections', () => {
      const result = getCategorizeMessages(
        sortTestMessages,
        ['a', 'c'],
        addProps,
        undefined,
        'alphabeticalAsc',
      );

      // Pinned section should be sorted alphabetically
      expect(result.Pinned[0].text).toBe('Beta Chat'); // 'c'
      expect(result.Pinned[1].text).toBe('Zeta Chat'); // 'a'

      // Recent section should also be sorted
      expect(result.Recent[0].text).toBe('Alpha Chat'); // 'b'
    });

    it('uses newest as default when sort option is not provided', () => {
      const result = getCategorizeMessages(sortTestMessages, [], addProps);

      expect(result.Recent[0].id).toBe('b'); // timestamp 3000 (newest)
      expect(result.Recent[2].id).toBe('a'); // timestamp 1000 (oldest)
    });

    it('handles case-insensitive alphabetical sorting', () => {
      const mixedCaseMessages: ConversationList = [
        {
          conversation_id: '1',
          last_message_timestamp: 1000,
          topic_summary: 'apple',
        },
        {
          conversation_id: '2',
          last_message_timestamp: 2000,
          topic_summary: 'Banana',
        },
        {
          conversation_id: '3',
          last_message_timestamp: 3000,
          topic_summary: 'CHERRY',
        },
      ];

      const result = getCategorizeMessages(
        mixedCaseMessages,
        [],
        addProps,
        undefined,
        'alphabeticalAsc',
      );

      expect(result.Recent[0].text).toBe('apple');
      expect(result.Recent[1].text).toBe('Banana');
      expect(result.Recent[2].text).toBe('CHERRY');
    });

    it('handles empty messages array', () => {
      const result = getCategorizeMessages(
        [],
        [],
        addProps,
        undefined,
        'newest',
      );

      expect(result.Pinned).toEqual([]);
      expect(result.Recent).toEqual([]);
    });

    it('handles single message', () => {
      const singleMessage: ConversationList = [
        {
          conversation_id: '1',
          last_message_timestamp: 1000,
          topic_summary: 'Single Chat',
        },
      ];

      const result = getCategorizeMessages(
        singleMessage,
        [],
        addProps,
        undefined,
        'newest',
      );

      expect(result.Recent).toHaveLength(1);
      expect(result.Recent[0].text).toBe('Single Chat');
    });

    it('maintains sort order with same timestamps', () => {
      const sameTimestampMessages: ConversationList = [
        {
          conversation_id: '1',
          last_message_timestamp: 1000,
          topic_summary: 'First Chat',
        },
        {
          conversation_id: '2',
          last_message_timestamp: 1000,
          topic_summary: 'Second Chat',
        },
      ];

      const result = getCategorizeMessages(
        sameTimestampMessages,
        [],
        addProps,
        undefined,
        'alphabeticalAsc',
      );

      expect(result.Recent[0].text).toBe('First Chat');
      expect(result.Recent[1].text).toBe('Second Chat');
    });
  });
});

describe('SortOption type', () => {
  it('should accept valid sort options', () => {
    const validOptions: SortOption[] = [
      'newest',
      'oldest',
      'alphabeticalAsc',
      'alphabeticalDesc',
    ];

    validOptions.forEach(option => {
      expect(
        ['newest', 'oldest', 'alphabeticalAsc', 'alphabeticalDesc'].includes(
          option,
        ),
      ).toBe(true);
    });
  });
});
