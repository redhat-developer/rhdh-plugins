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
import { act } from 'react';

import { render } from '@testing-library/react';
import { DateRangeProvider, useDateRange } from '../DateRangeContext';

describe('DateRangeContext', () => {
  it('should provides the initial values correctly', () => {
    let contextValue: any;

    const TestComponent = () => {
      contextValue = useDateRange();
      return <div>Test Component</div>;
    };

    render(
      <DateRangeProvider>
        <TestComponent />
      </DateRangeProvider>,
    );

    expect(contextValue.startDateRange).toBeNull();
    expect(contextValue.endDateRange).toBeNull();
    expect(typeof contextValue.setStartDateRange).toBe('function');
    expect(typeof contextValue.setEndDateRange).toBe('function');
  });

  it('should update startDateRange correctly', () => {
    let contextValue: any;

    const TestComponent = () => {
      contextValue = useDateRange();
      return <div>Test Component</div>;
    };

    render(
      <DateRangeProvider>
        <TestComponent />
      </DateRangeProvider>,
    );

    act(() => {
      const newDate = new Date('2025-03-04');
      contextValue.setStartDateRange(newDate);
    });

    expect(contextValue.startDateRange).toEqual(new Date('2025-03-04'));
  });

  it('should update endDateRange correctly', () => {
    let contextValue: any;

    const TestComponent = () => {
      contextValue = useDateRange();
      return <div>Test Component</div>;
    };

    render(
      <DateRangeProvider>
        <TestComponent />
      </DateRangeProvider>,
    );

    act(() => {
      const newDate = new Date('2025-03-05');
      contextValue.setEndDateRange(newDate);
    });

    expect(contextValue.endDateRange).toEqual(new Date('2025-03-05'));
  });

  it('should throw an error if useDateRange is used outside the provider', () => {
    const TestComponent = () => {
      useDateRange();
      return <div>Test Component</div>;
    };

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useDateRange must be used within a DateRangeProvider',
    );

    consoleErrorSpy.mockRestore();
  });
});
