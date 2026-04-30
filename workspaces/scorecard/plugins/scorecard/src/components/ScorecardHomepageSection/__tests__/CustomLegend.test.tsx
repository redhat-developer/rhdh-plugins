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

import { render, screen, fireEvent } from '@testing-library/react';

import CustomLegend from '../CustomLegend';

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('CustomLegend', () => {
  const pieData = [
    { name: 'success', value: 10, color: '#52c41a' },
    { name: 'warning', value: 20, color: '#F0AB00' },
    { name: 'error', value: 30, color: '#C9190B' },
  ];

  it('should render correct number of legend items', () => {
    render(
      <div data-chart-container>
        <CustomLegend
          pieData={pieData}
          activeIndex={null}
          setActiveIndex={jest.fn()}
          setTooltipPosition={jest.fn()}
        />
      </div>,
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should call setActiveIndex and setTooltipPosition on mouse enter', () => {
    const setActiveIndex = jest.fn();
    const setTooltipPosition = jest.fn();

    render(
      <div data-chart-container>
        <CustomLegend
          pieData={pieData}
          activeIndex={null}
          setActiveIndex={setActiveIndex}
          setTooltipPosition={setTooltipPosition}
        />
      </div>,
    );

    const successItem = screen.getByText('Success');

    fireEvent.mouseEnter(successItem);

    expect(setActiveIndex).toHaveBeenCalledWith(0);
    expect(setTooltipPosition).toHaveBeenCalledWith(
      expect.objectContaining({
        left: expect.any(Number),
        top: expect.any(Number),
      }),
    );
  });

  it('should clear active index and tooltip on mouse leave of legend container', () => {
    const setActiveIndex = jest.fn();
    const setTooltipPosition = jest.fn();

    const { getByText } = render(
      <div data-chart-container>
        <CustomLegend
          pieData={pieData}
          activeIndex={0}
          setActiveIndex={setActiveIndex}
          setTooltipPosition={setTooltipPosition}
        />
      </div>,
    );

    const legendItem = getByText('Success');

    const legendContainer = legendItem.parentElement?.parentElement;

    expect(legendContainer).toBeTruthy();

    fireEvent.mouseLeave(legendContainer as Element, {
      relatedTarget: null,
    });

    expect(setActiveIndex).toHaveBeenCalledWith(null);
    expect(setTooltipPosition).toHaveBeenCalledWith(null);
  });

  it('should return null when pieData is empty', () => {
    const { container } = render(
      <CustomLegend
        pieData={[]}
        activeIndex={null}
        setActiveIndex={jest.fn()}
        setTooltipPosition={jest.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display colors from pieData', () => {
    const { container } = render(
      <div data-chart-container>
        <CustomLegend
          pieData={pieData}
          activeIndex={null}
          setActiveIndex={jest.fn()}
          setTooltipPosition={jest.fn()}
        />
      </div>,
    );

    const colorBoxes = container.querySelectorAll(
      '[data-testid^="legend-colorbox-"]',
    );
    expect(colorBoxes).toHaveLength(3);

    expect(screen.getByTestId('legend-colorbox-success')).toHaveStyle(
      'background-color: #52c41a',
    );
    expect(screen.getByTestId('legend-colorbox-warning')).toHaveStyle(
      'background-color: #F0AB00',
    );
    expect(screen.getByTestId('legend-colorbox-error')).toHaveStyle(
      'background-color: #C9190B',
    );
  });

  it('should render two legend items for average donut segment names with translation key fallback', () => {
    const averagePieData = [
      { name: 'averageScoreFill', value: 75, color: '#F0AB00' },
      { name: 'averageScoreRemainder', value: 25, color: '#e0e0e0' },
    ];

    render(
      <div data-chart-container>
        <CustomLegend
          pieData={averagePieData}
          activeIndex={null}
          setActiveIndex={jest.fn()}
          setTooltipPosition={jest.fn()}
        />
      </div>,
    );

    expect(screen.getByText('AverageScoreFill')).toBeInTheDocument();
    expect(screen.getByText('AverageScoreRemainder')).toBeInTheDocument();
    expect(screen.getByTestId('legend-colorbox-averageScoreFill')).toHaveStyle(
      'background-color: #F0AB00',
    );
  });
});
