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
import { SearchResultItem } from './SearchResultItem';
import { BrowserRouter as Router } from 'react-router-dom';
import { Result, SearchDocument } from '@backstage/plugin-search-common';

jest.mock('../../utils/stringUtils', () => ({
  highlightMatch: jest.fn((text, _) => text),
}));

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
});
