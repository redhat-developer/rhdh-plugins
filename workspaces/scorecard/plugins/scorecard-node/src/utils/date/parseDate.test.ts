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
import { parseDate } from './parseDate';

describe('parseDate', () => {
  const dateString = '2026-06-01T00:00:00.000Z';

  it('returns the same Date instance when given a Date', () => {
    const value = new Date(dateString);
    expect(parseDate(value)).toBe(value);
  });

  it('parses ISO strings into Date', () => {
    expect(parseDate(dateString).toISOString()).toBe(dateString);
  });

  it('parses numeric epoch into Date', () => {
    const epoch = Date.parse(dateString);
    expect(parseDate(epoch)).toEqual(new Date(dateString));
  });

  it('throws for empty strings', () => {
    expect(() => parseDate('')).toThrow(/Invalid timestamp/);
  });

  it('throws for invalid date strings', () => {
    expect(() => parseDate('not-a-date')).toThrow(/Invalid timestamp/);
  });

  it('throws for invalid Date instances', () => {
    expect(() => parseDate(new Date(Number.NaN))).toThrow(/Invalid timestamp/);
  });
});
