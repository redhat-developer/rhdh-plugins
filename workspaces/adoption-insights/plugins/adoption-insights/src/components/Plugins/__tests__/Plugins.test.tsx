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

import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';

import { usePlugins } from '../../../hooks/usePlugins';
import {
  MockTrans,
  mockUseTranslation,
} from '../../../test-utils/mockTranslations';

import Plugins from '../Plugins';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));

// Mock the usePlugins hook
jest.mock('../../../hooks/usePlugins', () => ({
  usePlugins: jest.fn(),
}));

jest.mock('../../CardFooter', () => () => <div data-testid="pagination" />);

jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

describe('Plugins Component', () => {
  beforeAll(() => {
    global.ResizeObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const mockPluginsData = {
    data: [
      {
        plugin_id: 'plugin-1',
        trend: [{ count: 10 }, { count: 15 }],
        trend_percentage: '10',
        visit_count: 120,
      },
      {
        plugin_id: 'plugin-2',
        trend: [{ count: 5 }, { count: 7 }],
        trend_percentage: '-5',
        visit_count: 80,
      },
    ],
  };

  it('should render "No results for this date range." when there is no data', () => {
    (usePlugins as jest.Mock).mockReturnValue({
      plugins: { data: [] },
      loading: false,
    });

    render(<Plugins />);

    expect(
      screen.getByText('No results for this date range.'),
    ).toBeInTheDocument();
  });

  it('should render table with plugin data', async () => {
    (usePlugins as jest.Mock).mockReturnValue({
      plugins: mockPluginsData,
      loading: false,
    });

    render(<Plugins />);

    expect(screen.getByText('plugin-1')).toBeInTheDocument();
    expect(screen.getByText('plugin-2')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('should display pagination', () => {
    (usePlugins as jest.Mock).mockReturnValue({
      plugins: mockPluginsData,
      loading: false,
    });

    render(<Plugins />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('should handle pagination actions', async () => {
    (usePlugins as jest.Mock).mockReturnValue({
      plugins: mockPluginsData,
      loading: false,
    });

    render(<Plugins />);

    const pagination = screen.getByTestId('pagination');
    fireEvent.click(pagination);

    await waitFor(() => {
      expect(pagination).toBeInTheDocument();
    });
  });
});
