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

import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import {
  getSparklineTooltipLabel,
  SparklineTooltip,
} from '../SparklineTooltip';
import type { SparklineChartPoint } from '../../../utils/timeSeriesChartData';

const point: SparklineChartPoint = {
  date: 'Aug 15',
  value: 2.1,
  plotValue: 2.1,
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('getSparklineTooltipLabel', () => {
  it('formats value and date with a middle dot', () => {
    expect(getSparklineTooltipLabel(point)).toBe('2.1 · Aug 15');
  });

  it('appends the metric unit to the value', () => {
    expect(getSparklineTooltipLabel(point, '/week')).toBe('2.1/week · Aug 15');
  });

  it('uses the error message when the point has no value', () => {
    expect(
      getSparklineTooltipLabel({
        date: 'Aug 15',
        value: null,
        plotValue: 0,
        error: 'No data',
      }),
    ).toBe('No data · Aug 15');
  });
});

describe('SparklineTooltip', () => {
  it('does not render when inactive', () => {
    const { container } = render(
      <SparklineTooltip
        active={false}
        payload={[{ payload: point }]}
        unit="/week"
      />,
      { wrapper: TestWrapper },
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the hovered point value and date', () => {
    render(
      <SparklineTooltip active payload={[{ payload: point }]} unit="/week" />,
      { wrapper: TestWrapper },
    );

    const tooltip = screen.getByTestId('sparkline-hover-tooltip');
    expect(tooltip).toHaveTextContent('2.1/week · Aug 15');
  });
});
