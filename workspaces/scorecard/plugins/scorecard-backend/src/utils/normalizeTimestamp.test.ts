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

import { normalizeTimestamp } from './normalizeTimestamp';

describe('normalizeTimestamp', () => {
  const dateString = '2023-01-01T00:00:00.000Z';

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(dateString));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the same Date instance when input is a Date', () => {
    const timestamp = new Date();
    expect(normalizeTimestamp(timestamp)).toBe(timestamp);
  });

  it('should parse ISO string timestamps', () => {
    expect(normalizeTimestamp(dateString)).toEqual(new Date(dateString));
  });

  it('should parse numeric epoch timestamps', () => {
    const epoch = Date.parse('2023-01-01T00:00:00.000Z');

    expect(normalizeTimestamp(epoch)).toEqual(
      new Date('2023-01-01T00:00:00.000Z'),
    );
  });

  it('should return current time when input is undefined', () => {
    expect(normalizeTimestamp(undefined)).toEqual(new Date(dateString));
  });
});
