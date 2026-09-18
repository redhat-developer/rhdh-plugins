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

import { createTheme } from '@mui/material/styles';

import { toSparklineChartModel } from '../sparklineChartModel';
import { SPARKLINE_DASHED_STROKE } from '../sparklineLegend';
import { mockT } from '../../test-utils/mockTranslations';

const t = mockT as Parameters<typeof toSparklineChartModel>[0]['t'];
const theme = createTheme({
  palette: {
    success: { main: '#2e7d32' },
    warning: { main: '#F0AB00' },
    error: { main: '#C9190B' },
  },
});

describe('toSparklineChartModel', () => {
  it('should map chart data, line style, and all-rule legend items', () => {
    const model = toSparklineChartModel({
      inputPoints: [
        { value: 10, timestamp: '2026-08-23T00:00:00.000Z' },
        { value: 8, timestamp: '2026-08-24T00:00:00.000Z' },
      ],
      formatDateLabel: timestamp => timestamp.slice(5, 10),
      matchingThresholdKey: 'elite',
      chartColor: '#2e7d32',
      unit: '/week',
      theme,
      t,
      legendRules: [
        { key: 'elite', expression: '>=7', color: 'success.main' },
        { key: 'medium', expression: '1-7', color: 'warning.main' },
      ],
    });

    expect(model.chartColor).toBe('#2e7d32');
    expect(model.strokeDasharray).toBe(SPARKLINE_DASHED_STROKE);
    expect(model.chartData).toHaveLength(2);
    expect(model.legendItems.map(item => item.key)).toEqual([
      'elite',
      'medium',
    ]);
  });

  it('should limit the legend to the matched rule when only that rule is passed', () => {
    const model = toSparklineChartModel({
      inputPoints: [{ value: 22, timestamp: '2026-08-23T00:00:00.000Z' }],
      formatDateLabel: timestamp => timestamp.slice(5, 10),
      matchingThresholdKey: 'low',
      chartColor: '#C9190B',
      unit: '%',
      theme,
      t,
      legendRules: [{ key: 'low', expression: '>15', color: 'error.main' }],
    });

    expect(model.legendItems).toHaveLength(1);
    expect(model.legendItems[0].key).toBe('low');
    expect(model.strokeDasharray).toBeUndefined();
  });
});
