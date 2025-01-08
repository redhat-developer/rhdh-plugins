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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from './SearchBar';
import {
  searchApiRef,
  SearchContextProvider,
} from '@backstage/plugin-search-react';
import { mockApis, TestApiProvider } from '@backstage/test-utils';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { configApiRef } from '@backstage/core-plugin-api';

const createInitialState = ({
  term = '',
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

jest.mock('../../utils/stringUtils', () => ({
  ...jest.requireActual('../../utils/stringUtils'),
  highlightMatch: jest.fn(text => text),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('SearchBar', () => {
  const setup = (term = '') => {
    const setSearchTerm = jest.fn();
    const navigate = jest.fn();
    jest.mocked(useNavigate).mockReturnValue(navigate);

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestApiProvider
          apis={[
            [searchApiRef, mockSearchApi],
            [configApiRef, mockConfig],
          ]}
        >
          <SearchContextProvider initialState={createInitialState({ term })}>
            <SearchBar query={{ term }} setSearchTerm={setSearchTerm} />
          </SearchContextProvider>
        </TestApiProvider>
      </MemoryRouter>,
    );
    return { setSearchTerm, navigate };
  };

  it('renders the search input', () => {
    setup();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('calls setSearchTerm on input change', () => {
    const { setSearchTerm } = setup();
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'test' },
    });
    expect(setSearchTerm).toHaveBeenCalledWith('test');
  });

  it('displays "No results found" when there are no results', async () => {
    mockSearchApi.query.mockResolvedValueOnce({ results: [] });
    setup('test');
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'test' },
    });
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('displays search results', async () => {
    setup('example');
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'example' },
    });
    await waitFor(() => {
      expect(screen.getByText('Example Result')).toBeInTheDocument();
    });
  });

  it('navigates to the search page on Enter key press', async () => {
    const { navigate } = setup('example');
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'example' },
    });
    await waitFor(() => {
      expect(screen.getByText('Example Result')).toBeInTheDocument();
    });

    fireEvent.keyDown(screen.getByPlaceholderText('Search...'), {
      key: 'Enter',
      code: 'Enter',
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/search?query=example');
    });
  });
});
