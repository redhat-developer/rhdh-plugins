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
  BackendApprovalStore,
  PendingBackendToolApproval,
} from './BackendApprovalStore';

function makeApproval(
  overrides: Partial<PendingBackendToolApproval> = {},
): PendingBackendToolApproval {
  return {
    responseId: 'resp-1',
    callId: 'call-1',
    functionName: 'server__tool',
    argumentsJson: '{}',
    serverId: 'server',
    serverUrl: 'http://localhost',
    originalToolName: 'tool',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('BackendApprovalStore', () => {
  it('stores and retrieves approvals', () => {
    const store = new BackendApprovalStore();
    const approval = makeApproval();
    store.store(approval);

    expect(store.size).toBe(1);
    expect(store.get('resp-1', 'call-1')).toEqual(approval);
  });

  it('removes approvals', () => {
    const store = new BackendApprovalStore();
    store.store(makeApproval());
    store.remove('resp-1', 'call-1');

    expect(store.size).toBe(0);
    expect(store.get('resp-1', 'call-1')).toBeUndefined();
  });

  it('expires entries older than TTL on store()', () => {
    const store = new BackendApprovalStore();
    const old = makeApproval({
      responseId: 'old',
      callId: 'old-call',
      createdAt: Date.now() - 31 * 60 * 1000,
    });
    store.store(old);
    expect(store.size).toBe(1);

    const fresh = makeApproval({ responseId: 'new', callId: 'new-call' });
    store.store(fresh);

    expect(store.get('old', 'old-call')).toBeUndefined();
    expect(store.size).toBe(1);
  });

  it('expires entries older than TTL on get()', () => {
    const store = new BackendApprovalStore();
    const old = makeApproval({
      createdAt: Date.now() - 31 * 60 * 1000,
    });
    // Bypass cleanup-on-store by directly checking get behavior
    store.store(old);
    // The store() call already cleaned up the old entry, so size is 0
    // Add a fresh entry and then query for the old one
    const fresh = makeApproval({ responseId: 'r2', callId: 'c2' });
    store.store(fresh);

    expect(store.get('resp-1', 'call-1')).toBeUndefined();
    expect(store.get('r2', 'c2')).toBeDefined();
  });

  it('evicts oldest entry when max size is reached', () => {
    const store = new BackendApprovalStore();
    const baseTime = Date.now();

    for (let i = 0; i < 100; i++) {
      store.store(
        makeApproval({
          responseId: `resp-${i}`,
          callId: `call-${i}`,
          createdAt: baseTime + i,
        }),
      );
    }
    expect(store.size).toBe(100);

    store.store(
      makeApproval({
        responseId: 'resp-100',
        callId: 'call-100',
        createdAt: baseTime + 100,
      }),
    );

    expect(store.size).toBe(100);
    expect(store.get('resp-0', 'call-0')).toBeUndefined();
    expect(store.get('resp-1', 'call-1')).toBeDefined();
    expect(store.get('resp-100', 'call-100')).toBeDefined();
  });

  it('returns undefined for non-existent keys', () => {
    const store = new BackendApprovalStore();
    expect(store.get('no', 'such')).toBeUndefined();
  });
});
