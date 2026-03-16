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

import { cosine, SessionCache, DEFAULT_SESSION_CONFIG } from '../session';

describe('cosine', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1.0, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1.0, 5);
  });

  it('handles non-unit vectors', () => {
    expect(cosine([3, 0], [3, 0])).toBeCloseTo(1.0, 5);
  });
});

describe('SessionCache', () => {
  it('stores and retrieves session state', () => {
    const cache = new SessionCache({
      ...DEFAULT_SESSION_CONFIG,
      enabled: true,
    });

    cache.put('s1', [1, 0], ['fp1', 'fp2']);
    const state = cache.get('s1');
    expect(state).toBeDefined();
    expect(state!.lastQueryVec).toEqual([1, 0]);
    expect(state!.lastSelectedIds).toEqual(['fp1', 'fp2']);
  });

  it('returns undefined for unknown session', () => {
    const cache = new SessionCache({
      ...DEFAULT_SESSION_CONFIG,
      enabled: true,
    });
    expect(cache.get('unknown')).toBeUndefined();
  });

  it('expires sessions after TTL', () => {
    const cache = new SessionCache({
      ...DEFAULT_SESSION_CONFIG,
      enabled: true,
      ttlSeconds: 0.001,
    });

    cache.put('s1', [1, 0], ['fp1']);

    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 10_000);
    expect(cache.get('s1')).toBeUndefined();
    jest.restoreAllMocks();
  });

  it('evicts oldest sessions when maxSessions exceeded', () => {
    const cache = new SessionCache({
      ...DEFAULT_SESSION_CONFIG,
      enabled: true,
      maxSessions: 3,
    });

    cache.put('s1', [1], ['a']);
    cache.put('s2', [2], ['b']);
    cache.put('s3', [3], ['c']);
    cache.put('s4', [4], ['d']);

    expect(cache.size).toBeLessThanOrEqual(3);
  });

  it('updates existing session', () => {
    const cache = new SessionCache({
      ...DEFAULT_SESSION_CONFIG,
      enabled: true,
    });

    cache.put('s1', [1, 0], ['fp1']);
    cache.put('s1', [0, 1], ['fp2']);
    const state = cache.get('s1');
    expect(state!.lastQueryVec).toEqual([0, 1]);
    expect(state!.lastSelectedIds).toEqual(['fp2']);
    expect(cache.size).toBe(1);
  });
});
