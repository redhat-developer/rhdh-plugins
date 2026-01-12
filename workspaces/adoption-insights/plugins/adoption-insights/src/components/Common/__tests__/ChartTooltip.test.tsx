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
import { format } from 'date-fns';
import {
  MockTrans,
  mockUseTranslation,
  mockUseLanguage,
} from '../../../test-utils/mockTranslations';

import ChartTooltip from '../ChartTooltip';

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
import { DateRangeProvider } from '../../Header/DateRangeContext';

const mockPayload = [
  { dataKey: 'returning_users', value: 10 },
  { dataKey: 'new_users', value: 5 },
];

describe('ChartTooltip Component', () => {
  it('should render tooltip with correct data when active', () => {
    const label = '2025-03-09T00:00:00.000Z';
    const formattedDate = format(new Date(label), 'MMMM d, yyyy');

    render(
      <DateRangeProvider>
        <ChartTooltip active payload={mockPayload} label={label} />
      </DateRangeProvider>,
    );

    expect(screen.getByText(formattedDate)).toBeInTheDocument();
    expect(screen.getByText('Returning users')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('New users')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should return null when inactive', () => {
    const { container } = render(
      <DateRangeProvider>
        <ChartTooltip active={false} payload={mockPayload} label="" />,
      </DateRangeProvider>,
    );
    expect(container.firstElementChild).toBeNull();
  });

  it('should handle missing payload safely', () => {
    render(
      <DateRangeProvider>
        <ChartTooltip active payload={[]} label="" />
      </DateRangeProvider>,
    );
    expect(screen.queryByText('Returning users')).not.toBeInTheDocument();
    expect(screen.queryByText('New users')).not.toBeInTheDocument();
  });
});
