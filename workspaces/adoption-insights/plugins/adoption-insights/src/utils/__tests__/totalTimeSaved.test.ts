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

import { mockT } from '../../test-utils/mockTranslations';
import {
  EMPTY_TIME_SAVED,
  formatTotalTimeSaved,
  readTotalMinutes,
} from '../totalTimeSaved';

const format = (minutes: unknown) =>
  formatTotalTimeSaved(minutes, (part, count) =>
    mockT(`table.timeSaved.${part}`, { count }),
  );

describe('readTotalMinutes', () => {
  it.each([
    undefined,
    null,
    '',
    '   ',
    'abc',
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
    0,
    '0',
    '-15',
    true,
    false,
    {},
    [],
  ])('should reject %p', value => {
    expect(readTotalMinutes(value)).toBeUndefined();
  });

  it.each([
    [15, 15],
    [135.5, 135.5],
    ['15', 15],
    [' 135.5 ', 135.5],
    ['0.4', 0.4],
  ])('should read %p as %p minutes', (value, expected) => {
    expect(readTotalMinutes(value)).toBe(expected);
  });
});

describe('formatTotalTimeSaved', () => {
  it('should return the empty marker when there is no usable total', () => {
    expect(format(undefined)).toBe(EMPTY_TIME_SAVED);
    expect(format(0)).toBe(EMPTY_TIME_SAVED);
    expect(format('')).toBe(EMPTY_TIME_SAVED);
  });

  it('should hide a positive total that rounds to less than a minute', () => {
    expect(format(0.4)).toBe(EMPTY_TIME_SAVED);
  });

  it('should round a half minute up to one minute', () => {
    expect(format(0.5)).toBe('1 minute');
  });

  it('should format minutes, hours, and days without empty units', () => {
    expect(format(1)).toBe('1 minute');
    expect(format(45)).toBe('45 minutes');
    expect(format(60)).toBe('1 hour');
    expect(format(61)).toBe('1 hour 1 minute');
    expect(format(90)).toBe('1 hour 30 minutes');
    expect(format(135.5)).toBe('2 hours 16 minutes');
    expect(format(1440)).toBe('1 day');
    expect(format(1500)).toBe('1 day 1 hour');
    expect(format(2940)).toBe('2 days 1 hour');
  });

  it('should not multiply a summed total by the run count', () => {
    expect(format(135.5)).toBe('2 hours 16 minutes');
    expect(format(135.5)).not.toBe(format(135.5 * 3));
  });

  it('should join Japanese units without a space', () => {
    const translate = (part: 'day' | 'hour' | 'minute', count: number) => {
      if (part === 'day') {
        return `${count}日`;
      }
      if (part === 'hour') {
        return `${count}時間`;
      }
      return `${count}分`;
    };

    expect(formatTotalTimeSaved(1501, translate, 'ja')).toBe('1日1時間1分');
    expect(formatTotalTimeSaved(1501, translate, 'en')).toBe('1日 1時間 1分');
  });
});
