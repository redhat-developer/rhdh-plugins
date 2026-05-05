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

import type { ToolCall } from '../../types';
import {
  clearSharedToolCallsCacheForConversation,
  clearSharedToolCallsCacheSessionPrefix,
  getSharedToolCallsCache,
  migrateSharedToolCallsCacheSessionPrefixToConversation,
  resetSharedToolCallsCacheStoreForTests,
  setSharedToolCallsCache,
} from '../toolCallsCacheStore';

const dummyToolCall = (id: string | number): ToolCall => ({
  id,
  toolName: 't',
  arguments: {},
  startTime: 0,
  isLoading: false,
});

describe('toolCallsCacheStore', () => {
  beforeEach(() => {
    resetSharedToolCallsCacheStoreForTests();
  });

  afterEach(() => {
    resetSharedToolCallsCacheStoreForTests();
  });

  it('clears all keys for a conversation id prefix', () => {
    setSharedToolCallsCache('conv-a-0', [dummyToolCall(1)]);
    setSharedToolCallsCache('conv-a-1', [dummyToolCall(2)]);
    setSharedToolCallsCache('conv-b-0', [dummyToolCall(3)]);

    clearSharedToolCallsCacheForConversation('conv-a');

    expect(getSharedToolCallsCache('conv-a-0')).toBeUndefined();
    expect(getSharedToolCallsCache('conv-a-1')).toBeUndefined();
    expect(getSharedToolCallsCache('conv-b-0')?.[0]?.id).toBe(3);
  });

  it('migrates only keys for the given session prefix to the real conversation id', () => {
    const sessionA = 'lightspeed-temp:session-a';
    const sessionB = 'lightspeed-temp:session-b';
    setSharedToolCallsCache(`${sessionA}-0`, [dummyToolCall(9)]);
    setSharedToolCallsCache(`${sessionB}-0`, [dummyToolCall(99)]);

    migrateSharedToolCallsCacheSessionPrefixToConversation(sessionA, 'real-id');

    expect(getSharedToolCallsCache(`${sessionA}-0`)).toBeUndefined();
    expect(getSharedToolCallsCache('real-id-0')?.[0]?.id).toBe(9);
    expect(getSharedToolCallsCache(`${sessionB}-0`)?.[0]?.id).toBe(99);
  });

  it('clears keys for a session prefix', () => {
    const session = 'lightspeed-temp:orphan';
    setSharedToolCallsCache(`${session}-0`, [dummyToolCall(1)]);
    clearSharedToolCallsCacheSessionPrefix(session);
    expect(getSharedToolCallsCache(`${session}-0`)).toBeUndefined();
  });

  it('evicts oldest entries when exceeding the key cap', () => {
    for (let i = 0; i < 257; i++) {
      setSharedToolCallsCache(`cap-${i}`, [dummyToolCall(i)]);
    }
    expect(getSharedToolCallsCache('cap-0')).toBeUndefined();
    expect(getSharedToolCallsCache('cap-1')?.[0]?.id).toBe(1);
    expect(getSharedToolCallsCache('cap-256')?.[0]?.id).toBe(256);
  });
});
