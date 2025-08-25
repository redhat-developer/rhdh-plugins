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
import { render, screen, cleanup } from '@testing-library/react';

import Searches from '../Searches';
import { useSearches } from '../../../hooks/useSearches';

jest.mock('../../../hooks/useSearches', () => ({
  useSearches: jest.fn(),
}));

describe('Searches Component', () => {
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

  it('should render no results message when data is empty', () => {
    (useSearches as jest.Mock).mockReturnValue({
      searches: { data: [], grouping: 'daily' },
      loading: false,
    });
    render(<Searches />);
    expect(
      screen.getByText('No results for this date range.'),
    ).toBeInTheDocument();
  });

  it('should render searches count and average correctly', () => {
    (useSearches as jest.Mock).mockReturnValue({
      searches: {
        data: [
          { date: '2025-03-01', count: 100 },
          { date: '2025-03-02', count: 200 },
        ],
        grouping: 'daily',
      },
      loading: false,
    });

    render(<Searches />);
    expect(screen.getByText(/300 searches/i)).toBeInTheDocument();
    expect(screen.getByText(/Average search count was/i)).toBeInTheDocument();
    expect(screen.getByText(/150 per day/i)).toBeInTheDocument();
  });
});
