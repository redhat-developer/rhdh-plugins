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
import {
  SearchResultState,
  SearchResultProps,
} from '@backstage/plugin-search-react';
import Autocomplete from '@mui/material/Autocomplete';
import { createSearchLink } from '../../utils/stringUtils';
import { useNavigate } from 'react-router-dom';
import { SearchInput } from './SearchInput';
import { SearchOption } from './SearchOption';

interface SearchBarProps {
  query: SearchResultProps['query'];
  setSearchTerm: (term: string) => void;
}
export const SearchBar = (props: SearchBarProps) => {
  const { query, setSearchTerm } = props;
  const navigate = useNavigate();

  return (
    <SearchResultState {...props}>
      {({ loading, error, value }) => {
        const results = query?.term ? value?.results ?? [] : [];
        let options: string[] = [];
        if (results.length > 0) {
          options = [
            ...results.map(result => result.document.title),
            `${query?.term}`,
          ];
        } else if (query?.term) {
          options = ['No results found'];
        }
        const searchLink = createSearchLink(query?.term ?? '');

        return (
          <Autocomplete
            freeSolo
            options={options}
            loading={loading}
            getOptionLabel={option => option ?? ''}
            onInputChange={(_, inputValue) => setSearchTerm(inputValue)}
            sx={{ width: '100%' }}
            filterOptions={x => x}
            getOptionDisabled={option => option === 'No results found'}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (query?.term) {
                  navigate(searchLink);
                }
              }
            }}
            renderInput={params => (
              <SearchInput
                params={params}
                error={!!error}
                helperText={error ? 'Error fetching results' : ''}
              />
            )}
            renderOption={(renderProps, option, { index }) => (
              <SearchOption
                option={option}
                index={index}
                options={options}
                query={query}
                results={results}
                renderProps={renderProps}
                searchLink={searchLink}
              />
            )}
            ListboxProps={{
              style: { maxHeight: 600 },
            }}
          />
        );
      }}
    </SearchResultState>
  );
};
