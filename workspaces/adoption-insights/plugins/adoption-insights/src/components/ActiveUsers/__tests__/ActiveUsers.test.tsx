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
import React from 'react';

import { render, screen } from '@testing-library/react';

import ActiveUsers from '../ActiveUsers';
import { useActiveUsers } from '../../../hooks/useActiveUsers';

jest.mock('../../../hooks/useActiveUsers', () => ({
  useActiveUsers: jest.fn(),
}));

jest.mock(
  '../../CardWrapper',
  () =>
    ({ title, children }: { title: string; children: React.ReactNode }) =>
      (
        <div data-testid="card-wrapper">
          <h1>{title}</h1>
          {children}
        </div>
      ),
);

jest.mock('../../Common/EmptyChartState', () => () => (
  <div data-testid="empty-state">No Data</div>
));
jest.mock('@mui/material/CircularProgress', () => () => (
  <div data-testid="loading-spinner">Loading</div>
));
jest.mock('../ExportCSVButton', () => () => <button>Export</button>);

jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

describe('ActiveUsers Component', () => {
  beforeAll(() => {
    global.ResizeObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  const renderActiveUsers = (mockData: any) => {
    (useActiveUsers as jest.Mock).mockReturnValue(mockData);
    render(<ActiveUsers />);
  };

  test('should render empty state when no data is available', () => {
    renderActiveUsers({ activeUsers: { data: [] }, loading: false });
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  test('should render chart when data is available', () => {
    renderActiveUsers({
      activeUsers: {
        data: [
          { date: '2023-03-10', new_users: 10, returning_users: 5 },
          { date: '2023-03-11', new_users: 20, returning_users: 10 },
        ],
        grouping: 'daily',
      },
      loading: false,
    });

    expect(screen.getByText(/active users per day/i)).toBeInTheDocument();
  });
});
