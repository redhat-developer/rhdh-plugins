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
  formatAggregatedTimeSeriesErrors,
  getSparklineYDomain,
  toAggregationSparklinePoints,
  toMetricSparklinePoints,
  toSparklineChartData,
} from '../timeSeriesChartData';

describe('toSparklineChartData', () => {
  const formatDateLabel = (timestamp: string) => timestamp.slice(5, 10);

  it('should map numeric points and interpolates error days onto the line', () => {
    const result = toSparklineChartData(
      [
        { value: 2, timestamp: '2026-04-27T00:00:00.000Z' },
        {
          value: null,
          timestamp: '2026-04-28T00:00:00.000Z',
          error: 'GitHub API 500',
        },
        { value: 8, timestamp: '2026-04-29T00:00:00.000Z' },
      ],
      formatDateLabel,
    );

    expect(result).toEqual([
      {
        date: '2026-04-27T00:00:00.000Z',
        dateLabel: '04-27',
        value: 2,
        error: undefined,
        plotValue: 2,
      },
      {
        date: '2026-04-28T00:00:00.000Z',
        dateLabel: '04-28',
        value: null,
        error: 'GitHub API 500',
        plotValue: 5,
      },
      {
        date: '2026-04-29T00:00:00.000Z',
        dateLabel: '04-29',
        value: 8,
        error: undefined,
        plotValue: 8,
      },
    ]);
  });

  it('should skip boolean values when building the series', () => {
    const result = toSparklineChartData(
      [{ value: true, timestamp: '2026-04-27T00:00:00.000Z' }],
      formatDateLabel,
    );

    expect(result[0].date).toBe('2026-04-27T00:00:00.000Z');
    expect(result[0].dateLabel).toBe('04-27');
    expect(result[0].value).toBeNull();
    expect(result[0].plotValue).toBe(0);
  });
});

describe('formatAggregatedTimeSeriesErrors', () => {
  it('should join unique error messages and append counts greater than one', () => {
    expect(
      formatAggregatedTimeSeriesErrors([
        { message: 'timeout', count: 1 },
        { message: 'GitHub API 500', count: 2 },
      ]),
    ).toBe('timeout; GitHub API 500 (2)');
  });

  it('should return undefined when there are no errors', () => {
    expect(formatAggregatedTimeSeriesErrors()).toBeUndefined();
    expect(formatAggregatedTimeSeriesErrors([])).toBeUndefined();
  });
});

describe('toMetricSparklinePoints', () => {
  it('should map successful points without an error tooltip', () => {
    expect(
      toMetricSparklinePoints(
        [{ value: 8, timestamp: '2026-04-27T00:00:00.000Z' }],
        'Unavailable',
      ),
    ).toEqual([
      {
        value: 8,
        timestamp: '2026-04-27T00:00:00.000Z',
        error: undefined,
      },
    ]);
  });

  it('should keep the calculation-failure message on error points', () => {
    expect(
      toMetricSparklinePoints(
        [
          {
            value: null,
            timestamp: '2026-04-28T00:00:00.000Z',
            error: 'GitHub API 500',
          },
        ],
        'Unavailable',
      ),
    ).toEqual([
      {
        value: null,
        timestamp: '2026-04-28T00:00:00.000Z',
        error: 'GitHub API 500',
      },
    ]);
  });

  it('should use the fallback label when value is null and no error is set', () => {
    expect(
      toMetricSparklinePoints(
        [{ value: null, timestamp: '2026-04-29T00:00:00.000Z' }],
        'Unavailable',
      ),
    ).toEqual([
      {
        value: null,
        timestamp: '2026-04-29T00:00:00.000Z',
        error: 'Unavailable',
      },
    ]);
  });
});

describe('toAggregationSparklinePoints', () => {
  it('should map successful points without an error tooltip', () => {
    expect(
      toAggregationSparklinePoints(
        [
          {
            value: 10,
            successCount: 5,
            errorCount: 0,
            total: 5,
            status: 'success',
            timestamp: '2026-08-23T00:00:00.000Z',
          },
        ],
        'Unavailable',
      ),
    ).toEqual([
      {
        value: 10,
        timestamp: '2026-08-23T00:00:00.000Z',
        error: undefined,
      },
    ]);
  });

  it('should use joined error messages or the fallback label on error days', () => {
    expect(
      toAggregationSparklinePoints(
        [
          {
            value: null,
            successCount: 0,
            errorCount: 2,
            total: 2,
            status: 'error',
            errors: [{ message: 'timeout', count: 2 }],
            timestamp: '2026-08-24T00:00:00.000Z',
          },
          {
            value: null,
            successCount: 0,
            errorCount: 1,
            total: 1,
            status: 'error',
            timestamp: '2026-08-25T00:00:00.000Z',
          },
        ],
        'Unavailable',
      ),
    ).toEqual([
      {
        value: null,
        timestamp: '2026-08-24T00:00:00.000Z',
        error: 'timeout (2)',
      },
      {
        value: null,
        timestamp: '2026-08-25T00:00:00.000Z',
        error: 'Unavailable',
      },
    ]);
  });
});

describe('getSparklineYDomain', () => {
  it('should pad a single-value series', () => {
    expect(
      getSparklineYDomain([
        { date: '2026-04-27', dateLabel: 'Apr 27', value: 5, plotValue: 5 },
      ]),
    ).toEqual([4.5, 5.5]);
  });

  it('should return a fallback domain for empty data', () => {
    expect(getSparklineYDomain([])).toEqual([0, 1]);
  });
});
