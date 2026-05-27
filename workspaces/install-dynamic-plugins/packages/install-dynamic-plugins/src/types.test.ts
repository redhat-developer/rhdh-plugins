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
import { parseMaxEntrySize } from './types';

describe('parseMaxEntrySize', () => {
  const DEFAULT = 40_000_000;

  it('returns the default when unset', () => {
    expect(parseMaxEntrySize()).toBe(DEFAULT);
  });

  it('returns the default when empty', () => {
    expect(parseMaxEntrySize('')).toBe(DEFAULT);
  });

  it('returns the parsed value for a positive integer', () => {
    expect(parseMaxEntrySize('1000')).toBe(1000);
  });

  it('falls back to the default for a non-numeric value (no silent NaN)', () => {
    expect(parseMaxEntrySize('abc')).toBe(DEFAULT);
  });

  it('falls back to the default for zero', () => {
    expect(parseMaxEntrySize('0')).toBe(DEFAULT);
  });

  it('falls back to the default for a negative value', () => {
    expect(parseMaxEntrySize('-100')).toBe(DEFAULT);
  });

  it('falls back to the default for NaN', () => {
    expect(parseMaxEntrySize('NaN')).toBe(DEFAULT);
  });
});
