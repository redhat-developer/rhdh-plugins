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
  partitionTimeSaved,
  readTimeSavedMinutes,
  TIME_SAVED_ANNOTATION,
  TIME_SAVED_ANNOTATION_SNIPPET,
} from './timeSaved';

const templateWith = (value: string) => ({
  metadata: {
    annotations: {
      [TIME_SAVED_ANNOTATION]: value,
    },
  },
});

describe('time saved annotation', () => {
  it('should copy a quoted YAML duration', () => {
    expect(TIME_SAVED_ANNOTATION_SNIPPET).toBe(
      "backstage.io/time-saved: 'PT15M'",
    );
  });

  it.each([
    ['PT15M', 15],
    ['PT1H30M', 90],
    ['PT10H', 600],
    ['PT4H', 240],
    ['P1D', 1440],
    ['P1DT4H', 1680],
    ['P1DT4H30M', 1710],
    ['P1W', 7 * 24 * 60],
    ['P1M', 30 * 24 * 60],
    ['P1Y', 365 * 24 * 60],
    ['PT30S', 0.5],
    ['PT0M', 0],
    ['P', 0],
    ['PT', 0],
  ])('should read %s as %s minutes', (value, minutes) => {
    expect(readTimeSavedMinutes(templateWith(value))).toBe(minutes);
  });

  it.each(['180', 'pt15m', ' PT15M ', '-PT15M', 'PT15', ''])(
    'should treat %j as no estimate',
    value => {
      expect(readTimeSavedMinutes(templateWith(value))).toBeUndefined();
    },
  );

  it('should treat a missing annotation as no estimate', () => {
    expect(readTimeSavedMinutes({})).toBeUndefined();
  });

  it('should roll 28 hours and 30 minutes into days, hours, and minutes', () => {
    expect(partitionTimeSaved(1710)).toEqual({
      days: 1,
      hours: 4,
      minutes: 30,
    });
  });

  it('should keep a zero estimate as zero minutes', () => {
    expect(partitionTimeSaved(0)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });

  it('should show a week as seven days', () => {
    expect(partitionTimeSaved(7 * 24 * 60)).toEqual({
      days: 7,
      hours: 0,
      minutes: 0,
    });
  });

  it('should round leftover seconds to the nearest minute', () => {
    expect(partitionTimeSaved(0.5)).toEqual({ days: 0, hours: 0, minutes: 1 });
  });
});
