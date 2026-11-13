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
import { BarChart } from '@mui/x-charts/BarChart';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { emptyPortfolio } from '../../test-utils/projectListTestUtils';
import {
  MODULE_STATUS_COLORS,
  PROJECT_STATE_COLORS,
} from '../moduleStatusColors';
import { integerCountTicks, PortfolioStrip } from './PortfolioStrip';

jest.mock('@mui/x-charts/BarChart', () => ({
  BarChart: jest.fn(() => null),
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

describe('integerCountTicks', () => {
  it('uses whole numbers for small counts', () => {
    expect(integerCountTicks(1)).toEqual([0, 1]);
    expect(integerCountTicks(4)).toEqual([0, 1, 2, 3, 4]);
    expect(integerCountTicks(7)).toEqual([0, 2, 4, 6]);
  });

  it('keeps a wider count on a whole-number step', () => {
    expect(integerCountTicks(100)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(integerCountTicks(3.5)).toEqual([0, 1, 2, 3]);
  });

  it('never emits a fractional tick', () => {
    for (const max of [0, 1, 2, 3, 5, 8, 13, 21, 50, 250, 1000]) {
      expect(integerCountTicks(max).every(Number.isInteger)).toBe(true);
    }
  });
});

function renderExpanded(
  portfolio: typeof emptyPortfolio = {
    ...emptyPortfolio,
    modules: { ...emptyPortfolio.modules, total: 7, finished: 7 },
  },
) {
  window.localStorage.setItem(
    'x2a.conversionHub.portfolioStrip.expanded',
    'true',
  );
  return render(<PortfolioStrip portfolio={portfolio} />);
}

describe('PortfolioStrip bars', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.mocked(BarChart).mockClear();
  });

  it('places whole-number ticks on the module count axis', () => {
    renderExpanded();

    const props = jest.mocked(BarChart).mock.calls[0][0];
    const xAxis = props.xAxis?.[0];
    expect(props.leftAxis).toBeNull();
    expect(props.slotProps?.legend?.hidden).toBe(true);
    expect(props.series?.map(series => series.label)).toEqual(['Finished']);
    expect(xAxis?.tickInterval).toEqual([0, 2, 4, 6]);
    expect(xAxis?.min).toBe(0);
    expect(xAxis?.max).toBe(7);
    expect(xAxis?.valueFormatter?.(2, { location: 'tick' })).toBe('2');
    expect(screen.getByTestId('portfolio-modules')).toHaveTextContent(
      '7 Finished',
    );
    expect(screen.getByTestId('portfolio-modules')).toHaveTextContent(
      '0 Waiting',
    );
  });

  it('draws a project bar for the states that have a count', () => {
    renderExpanded({
      ...emptyPortfolio,
      modules: { ...emptyPortfolio.modules, total: 6, error: 1, pending: 5 },
      projectCounts: {
        ...emptyPortfolio.projectCounts,
        initialized: 1,
        failed: 2,
      },
    });

    const projectBar = jest.mocked(BarChart).mock.calls[1][0];
    expect(projectBar.xAxis?.[0]?.max).toBe(3);
    expect(projectBar.xAxis?.[0]?.tickInterval).toEqual([0, 1, 2, 3]);
    expect(projectBar.series?.map(series => series.label)).toEqual([
      'Initialized',
      'Failed',
    ]);
    expect(projectBar.series?.[1]?.color).toBe(MODULE_STATUS_COLORS.error);
    expect(PROJECT_STATE_COLORS.failed).toBe(MODULE_STATUS_COLORS.error);
    expect(PROJECT_STATE_COLORS.completed).toBe(MODULE_STATUS_COLORS.finished);
    expect(PROJECT_STATE_COLORS.inProgress).toBe(MODULE_STATUS_COLORS.running);
    expect(screen.getByTestId('portfolio-projects')).toHaveTextContent(
      '0 Created',
    );
    expect(screen.getByTestId('portfolio-projects')).toHaveTextContent(
      '2 Failed',
    );
  });

  it('hides the module group when there are no active modules', () => {
    renderExpanded(emptyPortfolio);

    expect(screen.queryByTestId('portfolio-modules')).not.toBeInTheDocument();
    expect(screen.getByTestId('portfolio-projects')).toHaveTextContent(
      '0 Created',
    );
    expect(jest.mocked(BarChart)).not.toHaveBeenCalled();
  });
});
