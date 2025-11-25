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
import { useState } from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import DateRangePicker from '../DateRangePicker';

// Mock translation hooks - define the mock inline to avoid hoisting issues
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Mock the specific translation keys we need for this test
      const translations: Record<string, string> = {
        'header.dateRange.title': 'Date range',
        'header.dateRange.startDate': 'Start date',
        'header.dateRange.endDate': 'End date',
      };
      return translations[key] || key;
    },
  }),
}));

const renderWithState = () => {
  const Wrapper = () => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateRangePicker
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      </LocalizationProvider>
    );
  };
  return render(<Wrapper />);
};

describe('DateRangePicker Component', () => {
  test('should render DateRangePicker with inputs', () => {
    renderWithState();
    expect(screen.getByLabelText(/Start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End date/i)).toBeInTheDocument();
  });

  test('should update start date when a valid date is selected', () => {
    renderWithState();
    const startDateInput = screen.getByLabelText(/Start date/i);

    fireEvent.change(startDateInput, { target: { value: '03/01/2024' } });
    expect(startDateInput).toHaveValue('03/01/2024');
  });

  test('should update end date when a valid date is selected', () => {
    renderWithState();
    const endDateInput = screen.getByLabelText(/End date/i);

    fireEvent.change(endDateInput, { target: { value: '03/05/2024' } });
    expect(endDateInput).toHaveValue('03/05/2024');
  });
});
