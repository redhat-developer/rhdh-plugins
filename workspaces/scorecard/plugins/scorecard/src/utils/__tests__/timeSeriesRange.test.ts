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

import { TIME_SERIES_DEFAULT_RANGE_DAYS } from '../constants';
import { getDefaultTimeSeriesRange } from '../timeSeriesRange';

describe('getDefaultTimeSeriesRange', () => {
  it('should return an inclusive ISO-8601 window of 30 days', () => {
    const now = new Date('2026-04-30T12:00:00.000Z');
    const { from, to } = getDefaultTimeSeriesRange(now);

    expect(to).toBe('2026-04-30T12:00:00.000Z');
    expect(from).toBe('2026-03-31T12:00:00.000Z');
    expect(new Date(to).getTime() - new Date(from).getTime()).toBe(
      TIME_SERIES_DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000,
    );
  });
});
