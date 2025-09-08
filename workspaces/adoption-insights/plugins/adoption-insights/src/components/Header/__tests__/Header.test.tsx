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
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import {
  MockTrans,
  mockUseTranslation,
  mockUseLanguage,
} from '../../../test-utils/mockTranslations';

import InsightsHeader from '../Header';
import { DateRangeProvider } from '../DateRangeContext';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: mockUseLanguage,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));

jest.mock('@backstage/core-components', () => ({
  Header: ({ children, title }: { children: ReactNode; title: ReactNode }) => (
    <div data-testid="backstage-header">
      {title}
      {children}
    </div>
  ),
}));

jest.mock('../DateRangePicker', () => ({
  __esModule: true,
  default: () => <div data-testid="date-range-picker">DateRangePicker</div>,
}));

jest.mock('../../../utils/constants', () => ({
  DATE_RANGE_OPTIONS: [
    { value: 'today', labelKey: 'header.dateRange.today' },
    { value: 'last-week', labelKey: 'header.dateRange.lastWeek' },
    { value: 'last-28-days', labelKey: 'header.dateRange.last28Days' },
    { value: 'last-month', labelKey: 'header.dateRange.lastMonth' },
    { value: 'last-year', labelKey: 'header.dateRange.lastYear' },
  ],
}));

jest.mock('../../../utils/utils', () => ({
  getDateRange: (_value: string) => ({
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  }),
}));

const mockSetStartDateRange = jest.fn();
const mockSetEndDateRange = jest.fn();
const mockSetIsDefaultDateRange = jest.fn();

jest.mock('../DateRangeContext', () => ({
  useDateRange: () => ({
    startDateRange: new Date('2025-01-01'),
    endDateRange: new Date('2025-01-31'),
    isDefaultDateRange: false,
    setStartDateRange: mockSetStartDateRange,
    setEndDateRange: mockSetEndDateRange,
    setIsDefaultDateRange: mockSetIsDefaultDateRange,
  }),
  DateRangeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('InsightsHeader', () => {
  const theme = createTheme();
  const user = userEvent.setup();

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <DateRangeProvider>
          <InsightsHeader title="Test Insights" />
        </DateRangeProvider>
      </ThemeProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the header with correct title', () => {
    renderComponent();
    expect(screen.getByText('Adoption Insights')).toBeInTheDocument();
  });

  it('should initialize with default date range', () => {
    renderComponent();
    expect(mockSetStartDateRange).toHaveBeenCalled();
    expect(mockSetEndDateRange).toHaveBeenCalled();
  });

  it('should display date range options in select', async () => {
    renderComponent();
    const select = screen.getByRole('combobox');
    await user.click(select);

    const options = screen.getAllByRole('option');
    const optionTexts = options.map(option => option.textContent);

    expect(optionTexts).toContain('Today');
    expect(optionTexts).toContain('Last week');
    expect(optionTexts).toContain('Last 28 days');
    expect(optionTexts).toContain('Last month');
    expect(optionTexts).toContain('Last year');
    expect(optionTexts).toContain('Date range...');
  });

  it('should open date range picker when "Date range..." is clicked', async () => {
    renderComponent();
    const select = screen.getByRole('combobox');
    await user.click(select);

    const dateRangeOption = screen.getByText('Date range...');
    await user.click(dateRangeOption);

    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });

  it('should update date range when a preset option is selected', async () => {
    renderComponent();
    const select = screen.getByRole('combobox');
    await user.click(select);

    const lastWeekOption = screen.getByText('Last week');
    await user.click(lastWeekOption);

    expect(mockSetStartDateRange).toHaveBeenCalled();
    expect(mockSetEndDateRange).toHaveBeenCalled();
  });

  it('should handle custom date range selection', async () => {
    renderComponent();

    const select = screen.getByRole('combobox');
    await user.click(select);
    await user.click(screen.getByText('Date range...'));

    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();

    // Close the popover
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByTestId('date-range-picker')).not.toBeInTheDocument();
  });

  it('should display formatted date range when custom range is selected', async () => {
    renderComponent();

    const select = screen.getByRole('combobox');
    await user.click(select);
    await user.click(screen.getByText('Date range...'));

    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });
});
