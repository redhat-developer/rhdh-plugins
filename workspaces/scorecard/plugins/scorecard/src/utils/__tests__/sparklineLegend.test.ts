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
  formatThresholdLegendLabel,
  getSparklineLineStyle,
  SPARKLINE_DASHED_STROKE,
  SPARKLINE_DOTTED_STROKE,
} from '../sparklineLegend';
import { mockT } from '../../test-utils/mockTranslations';

const t = mockT as Parameters<typeof formatThresholdLegendLabel>[1];

describe('formatThresholdLegendLabel', () => {
  it('should append the unit to a numeric expression', () => {
    expect(
      formatThresholdLegendLabel(
        { key: 'elite', expression: '>=7' },
        t,
        '/week',
      ),
    ).toBe('Elite (>=7/week)');
  });

  it('should omit boolean expressions', () => {
    expect(
      formatThresholdLegendLabel({ key: 'success', expression: '==true' }, t),
    ).toBe('Success');
  });
});

describe('getSparklineLineStyle', () => {
  it('should dash elite and success, dot medium and warning, and leave low/error solid', () => {
    expect(getSparklineLineStyle('elite')).toEqual({
      strokeDasharray: SPARKLINE_DASHED_STROKE,
    });
    expect(getSparklineLineStyle('success')).toEqual({
      strokeDasharray: SPARKLINE_DASHED_STROKE,
    });
    expect(getSparklineLineStyle('medium')).toEqual({
      strokeDasharray: SPARKLINE_DOTTED_STROKE,
    });
    expect(getSparklineLineStyle('warning')).toEqual({
      strokeDasharray: SPARKLINE_DOTTED_STROKE,
    });
    expect(getSparklineLineStyle('low')).toEqual({});
    expect(getSparklineLineStyle('error')).toEqual({});
  });

  it('should fall back to index for unknown keys', () => {
    expect(getSparklineLineStyle('custom', 0)).toEqual({
      strokeDasharray: SPARKLINE_DASHED_STROKE,
    });
    expect(getSparklineLineStyle('custom', 1)).toEqual({
      strokeDasharray: SPARKLINE_DOTTED_STROKE,
    });
    expect(getSparklineLineStyle('custom', 2)).toEqual({});
  });
});
