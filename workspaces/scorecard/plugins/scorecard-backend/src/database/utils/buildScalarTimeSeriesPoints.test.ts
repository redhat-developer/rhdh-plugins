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

import { buildScalarTimeSeriesPoints } from './buildScalarTimeSeriesPoints';

describe('buildScalarTimeSeriesPoints', () => {
  it('groups error-message rows onto one point per UTC day', () => {
    expect(
      buildScalarTimeSeriesPoints([
        {
          utc_day: '2024-01-01',
          value: 10,
          success_count: 2,
          error_count: 3,
          total: 5,
          error_message: 'timeout',
          error_msg_count: 2,
        },
        {
          utc_day: '2024-01-01',
          value: 10,
          success_count: 2,
          error_count: 3,
          total: 5,
          error_message: 'failed to calculate',
          error_msg_count: 1,
        },
      ]),
    ).toEqual([
      {
        utcDay: '2024-01-01',
        value: 10,
        successCount: 2,
        errorCount: 3,
        total: 5,
        errors: [
          { message: 'timeout', count: 2 },
          { message: 'failed to calculate', count: 1 },
        ],
      },
    ]);
  });
});
