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

import type { ReactElement } from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  searchApiRef,
  SearchContextProvider,
} from '@backstage/plugin-search-react';
import { mockApis, TestApiProvider } from '@backstage/test-utils';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { configApiRef } from '@backstage/core-plugin-api';
import {
  MockTrans,
  mockUseTranslation,
} from '../../test-utils/mockTranslations';
import { SearchBar } from './SearchBar';

jest.mock('../../hooks/useDebouncedCallback', () => ({
  useDebouncedCallback: (fn: (...args: any[]) => void) => fn,
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../components/Trans', () => ({
  Trans: MockTrans,
}));

const createInitialState = ({
  term = 'term',
  filters = {},
  types = ['*'],
  pageCursor = '',
} = {}) => ({
  term,
  filters,
  types,
  pageCursor,
});

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
  data: {
    app: {
      url: 'https://example.com',
    },
  },
});

let searchTerm = '';

const mockSearchResultState = jest.fn(() => ({
  loading: false,
  error: undefined,
  value: {
    results:
      searchTerm === 'example'
        ? [{ document: { title: 'Example Result', location: '/example-path' } }]
        : [],
  },
}));

jest.mock('@backstage/plugin-search-react', () => ({
  ...jest.requireActual('@backstage/plugin-search-react'),
  SearchResultState: ({ children }: any) => children(mockSearchResultState()),
}));

jest.mock('../../utils/stringUtils', () => ({
  ...jest.requireActual('../../utils/stringUtils'),
  highlightMatch: jest.fn(text => text),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const renderSearchBar = (term = 'term', setSearchTerm = jest.fn()) => (
  <MemoryRouter initialEntries={['/']}>
    <TestApiProvider
      apis={[
        [searchApiRef, mockSearchApi],
        [configApiRef, mockConfig],
      ]}
    >
      <SearchContextProvider initialState={createInitialState()}>
        <SearchBar query={{ term }} setSearchTerm={setSearchTerm} />
      </SearchContextProvider>
    </TestApiProvider>
  </MemoryRouter>
);

describe('SearchBar', () => {
  const setup = () => {
    const setSearchTerm = jest.fn();
    const navigate = jest.fn();
    jest.mocked(useNavigate).mockReturnValue(navigate);

    const utils = render(renderSearchBar('term', setSearchTerm));
    return { ...utils, setSearchTerm, navigate };
  };

  const typeAndSearch = (
    value: string,
    rerender: (ui: ReactElement) => void,
  ) => {
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value },
    });

    searchTerm = value;

    mockSearchResultState.mockImplementation(() => ({
      loading: false,
      error: undefined,
      value: {
        results:
          searchTerm === 'example'
            ? [
                {
                  document: {
                    title: 'Example Result',
                    location: '/example-path',
                  },
                },
              ]
            : [],
      },
    }));

    rerender(renderSearchBar(searchTerm));
  };

  it('renders the search input', () => {
    setup();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('calls setSearchTerm on input change', () => {
    const { setSearchTerm, rerender } = setup();
    typeAndSearch('test', rerender);
    expect(setSearchTerm).toHaveBeenCalledWith('test');
  });

  it('displays "No results found" when there are no results', async () => {
    const { rerender } = setup();
    typeAndSearch('test string', rerender);

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('displays search results', async () => {
    const { rerender } = setup();
    typeAndSearch('example', rerender);
    await waitFor(() => {
      expect(screen.getByText('Example Result')).toBeInTheDocument();
    });
  });

  it('navigates to the search page on Enter key press', async () => {
    const { navigate, rerender } = setup();
    const input = screen.getByPlaceholderText('Search...');
    typeAndSearch('example', rerender);
    await waitFor(() => {
      expect(screen.getByText('Example Result')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, {
      key: 'Enter',
      code: 'Enter',
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/search?query=example');
    });
  });
});
