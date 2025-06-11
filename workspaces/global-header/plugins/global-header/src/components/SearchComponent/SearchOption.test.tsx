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
import { SearchOption } from './SearchOption';
import { BrowserRouter as Router } from 'react-router-dom';
import { Result, SearchDocument } from '@backstage/plugin-search-common';

jest.mock('./SearchResultItem', () => ({
  SearchResultItem: jest.fn(({ option }) => <div>{option}</div>),
}));

describe('SearchOption', () => {
  const renderProps = {};
  const searchLink = '/search-link';
  const query = { term: 'test' };
  const results = [
    {
      document: { title: 'Result 1', location: '/result-1' },
    } as Result<SearchDocument>,
  ];

  it('renders "All results" option', () => {
    render(
      <Router>
        <SearchOption
          option="test"
          index={1}
          options={['Result 1', 'test']}
          query={query}
          results={results}
          renderProps={renderProps}
          searchLink={searchLink}
        />
      </Router>,
    );

    expect(screen.getByText('All results')).toBeInTheDocument();
  });

  it('renders search result item', () => {
    render(
      <Router>
        <SearchOption
          option="Result 1"
          index={0}
          options={['Result 1', 'test']}
          query={query}
          results={results}
          renderProps={renderProps}
          searchLink={searchLink}
        />
      </Router>,
    );

    expect(screen.getByText('Result 1')).toBeInTheDocument();
  });

  it('renders "No results found" option', () => {
    render(
      <Router>
        <SearchOption
          option="No results found"
          index={0}
          options={['No results found']}
          query={query}
          results={[]}
          renderProps={renderProps}
          searchLink={searchLink}
        />
      </Router>,
    );

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
