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

import { fireEvent, render, screen } from '@testing-library/react';
import { SearchResultItem } from './SearchResultItem';
import { BrowserRouter as Router } from 'react-router-dom';
import { Result, SearchDocument } from '@backstage/plugin-search-common';
import { useAnalytics } from '@backstage/core-plugin-api';

jest.mock('../../utils/stringUtils', () => ({
  highlightMatch: jest.fn((text, _) => text),
}));

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useAnalytics: jest.fn(),
  };
});

describe('SearchResultItem', () => {
  const renderProps = {};
  const query = { term: 'test' };

  it('renders "No results found" option', () => {
    render(
      <Router>
        <SearchResultItem
          option="No results found"
          query={query}
          result={undefined}
          renderProps={renderProps}
        />
      </Router>,
    );

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders search result item with highlighted match', () => {
    const result = {
      document: { title: 'Result 1', location: '/result-1' },
    } as Result<SearchDocument>;
    render(
      <Router>
        <SearchResultItem
          option="Result 1"
          query={query}
          result={result}
          renderProps={renderProps}
        />
      </Router>,
    );

    expect(screen.getByText('Result 1')).toBeInTheDocument();
  });

  it('links to the correct location', () => {
    const result = {
      document: { title: 'Result 1', location: '/result-1' },
    } as Result<SearchDocument>;
    render(
      <Router>
        <SearchResultItem
          option="Result 1"
          query={query}
          result={result}
          renderProps={renderProps}
        />
      </Router>,
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/result-1');
  });

  it('links to "#" when location is undefined', () => {
    render(
      <Router>
        <SearchResultItem
          option="Result 1"
          query={query}
          result={undefined}
          renderProps={renderProps}
        />
      </Router>,
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('should trigger the analytics discover event', () => {
    const result = {
      rank: 1,
      document: { title: 'Result 1', location: '/result-1' },
    } as Result<SearchDocument>;

    const captureEventMock = jest.fn();
    (useAnalytics as jest.Mock).mockReturnValue({
      captureEvent: captureEventMock,
    });

    render(
      <Router>
        <SearchResultItem
          option="Result 1"
          query={query}
          result={result}
          renderProps={renderProps}
        />
      </Router>,
    );
    const resultItem = screen.getByText('Result 1');

    fireEvent.click(resultItem);

    expect(useAnalytics).toHaveBeenCalled();
    expect(captureEventMock).toHaveBeenCalled();
    expect(captureEventMock).toHaveBeenCalledWith('discover', 'Result 1', {
      attributes: { to: '/result-1' },
      value: 1,
    });
  });
});
