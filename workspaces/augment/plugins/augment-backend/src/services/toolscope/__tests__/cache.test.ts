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

import { EmbeddingCache } from '../cache';

describe('EmbeddingCache', () => {
  let cache: EmbeddingCache;

  beforeEach(() => {
    cache = new EmbeddingCache();
  });

  it('starts empty', () => {
    expect(cache.size).toBe(0);
  });

  it('stores and retrieves vectors by fingerprint', () => {
    cache.put({ value: 'fp1' }, [1, 2, 3]);
    expect(cache.get({ value: 'fp1' })).toEqual([1, 2, 3]);
  });

  it('returns undefined for unknown fingerprint', () => {
    expect(cache.get({ value: 'unknown' })).toBeUndefined();
  });

  it('overwrites existing vector', () => {
    cache.put({ value: 'fp1' }, [1, 0]);
    cache.put({ value: 'fp1' }, [0, 1]);
    expect(cache.get({ value: 'fp1' })).toEqual([0, 1]);
    expect(cache.size).toBe(1);
  });

  it('tracks size correctly', () => {
    cache.put({ value: 'a' }, [1]);
    cache.put({ value: 'b' }, [2]);
    expect(cache.size).toBe(2);
  });

  it('clears all entries', () => {
    cache.put({ value: 'a' }, [1]);
    cache.put({ value: 'b' }, [2]);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get({ value: 'a' })).toBeUndefined();
  });
});
