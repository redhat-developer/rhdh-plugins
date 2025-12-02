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
import { CustomTooltip } from '../CustomTooltip';

describe('CustomLegend Component', () => {
  it('should render with the correct number of legend items', () => {
    const pieData = [
      { name: 'test1', value: 10, color: 'red' },
      { name: 'test2', value: 20, color: 'blue' },
      { name: 'test3', value: 30, color: 'green' },
    ];

    render(
      <CustomLegend
        pieData={pieData}
        activeIndex={null}
        setActiveIndex={jest.fn()}
        setTooltipPosition={jest.fn()}
      />,
    );

    const legendItems = screen.getAllByText(/Test[1-3]/i);
    expect(legendItems).toHaveLength(3);
  });

  it('should show correct value in tooltip on hover', () => {
    const setActiveIndex = jest.fn();
    const setTooltipPosition = jest.fn();
    const pieData = [{ name: 'Test', value: 10, color: 'red' }];

    const { rerender } = render(
      <div data-chart-container>
        <CustomLegend
          pieData={pieData}
          activeIndex={null}
          setActiveIndex={setActiveIndex}
          setTooltipPosition={setTooltipPosition}
        />
      </div>,
    );

    const legendItem = screen.getByText('Test');
    fireEvent.mouseEnter(legendItem);

    expect(setActiveIndex).toHaveBeenCalledWith(0);

    rerender(
      <CustomTooltip
        payload={[
          {
            name: pieData[0].name,
            value: pieData[0].value,
            payload: pieData[0],
          },
        ]}
        pieData={pieData}
      />,
    );

    expect(screen.getByText('10 entities')).toBeInTheDocument();
  });
});
