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

import { render, screen, fireEvent } from '@testing-library/react';
import { SearchComponent } from './SearchComponent';
import {
  searchApiRef,
  SearchContextProvider,
} from '@backstage/plugin-search-react';
import { mockApis, TestApiProvider } from '@backstage/test-utils';
import { configApiRef } from '@backstage/core-plugin-api';

jest.mock('./SearchBar', () => ({
  SearchBar: ({
    query,
    setSearchTerm,
  }: {
    query: { term: string };
    setSearchTerm: (term: string) => void;
  }) => (
    <input
      data-testid="search-bar"
      value={query.term}
      onChange={e => setSearchTerm(e.target.value)}
    />
  ),
}));

const mockSearchApi = {
  query: jest.fn().mockResolvedValue({
    results: [
      {
        type: 'software-catalog',
        document: {
          title: 'Example Result',
          location: '/catalog/default/component/example',
        },
      },
    ],
  }),
};

const mockConfig = mockApis.config({
  data: { app: { baseUrl: 'https://example.com' } },
});

describe('SearchComponent', () => {
  it('should render the SearchBar with initial state', () => {
    render(
      <TestApiProvider
        apis={[
          [searchApiRef, mockSearchApi],
          [configApiRef, mockConfig],
        ]}
      >
        <SearchContextProvider>
          <SearchComponent />
        </SearchContextProvider>
      </TestApiProvider>,
    );

    const searchBar = screen.getByTestId('search-bar');
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toHaveValue('');
  });

  it('should update the search term when typing in the SearchBar', () => {
    render(
      <TestApiProvider
        apis={[
          [searchApiRef, mockSearchApi],
          [configApiRef, mockConfig],
        ]}
      >
        <SearchContextProvider>
          <SearchComponent />
        </SearchContextProvider>
      </TestApiProvider>,
    );

    const searchBar = screen.getByTestId('search-bar');
    fireEvent.change(searchBar, { target: { value: 'example' } });

    expect(searchBar).toHaveValue('example');
  });
});
