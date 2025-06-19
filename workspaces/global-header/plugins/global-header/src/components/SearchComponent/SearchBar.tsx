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

import { useEffect, useRef, useState } from 'react';
import {
  SearchResultState,
  SearchResultProps,
  useSearch,
} from '@backstage/plugin-search-react';
import Autocomplete from '@mui/material/Autocomplete';
import { createSearchLink } from '../../utils/stringUtils';
import { useNavigate } from 'react-router-dom';
import { SearchInput } from './SearchInput';
import { SearchOption } from './SearchOption';
import { useTheme } from '@mui/material/styles';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';

interface SearchBarProps {
  query: SearchResultProps['query'];
  setSearchTerm: (term: string) => void;
}
export const SearchBar = (props: SearchBarProps) => {
  const { query, setSearchTerm } = props;
  const navigate = useNavigate();
  const theme = useTheme();
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const highlightedIndexRef = useRef(highlightedIndex);
  const { setTerm } = useSearch();

  const onInputChange = useDebouncedCallback((_, inputValue) => {
    setSearchTerm(inputValue);
    setTerm(inputValue);
  }, 300);

  useEffect(() => {
    highlightedIndexRef.current = highlightedIndex;
  }, [highlightedIndex]);

  return (
    <SearchResultState {...props}>
      {({ loading, error, value }) => {
        const results = query?.term ? value?.results ?? [] : [];
        let options: string[] = [];
        if (query?.term && results.length === 0) {
          options = ['No results found'];
        }
        if (results.length > 0) {
          options = [
            ...results.map(result => result.document.title),
            `${query?.term}`,
          ];
        }
        const searchLink = createSearchLink(query?.term ?? '');

        return (
          <Autocomplete
            freeSolo
            options={options}
            loading={loading}
            value={query?.term ?? ''}
            getOptionLabel={option => option ?? ''}
            onInputChange={onInputChange}
            onHighlightChange={(_, option) =>
              setHighlightedIndex(options.indexOf(option ?? ''))
            }
            componentsProps={{
              paper: {
                sx: {
                  '&:empty': { visibility: 'hidden' }, // Removes underline-like effect
                  borderRadius: '4px',
                  outline: 'unset',
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? `0 2px 6px 2px rgba(0, 0, 0, 0.50), 0 1px 2px 0 rgba(0, 0, 0, 0.50)`
                      : '0 2px 6px 2px rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.30)',
                },
              },
            }}
            sx={{
              width: '100%',
              '& [class*="MuiAutocomplete-clearIndicator"]': {
                visibility: query?.term ? 'visible' : 'hidden',
              },
            }}
            filterOptions={x => x}
            onKeyDown={event => {
              const currentHighlight = highlightedIndexRef.current;
              if (event.key === 'Enter') {
                event.preventDefault();
                if (currentHighlight === -1 && query?.term) {
                  navigate(searchLink);
                } else if (currentHighlight !== -1) {
                  navigate(
                    results[highlightedIndex]?.document?.location ?? searchLink,
                  );
                }
                setHighlightedIndex(-1);
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
              sx: { maxHeight: '60vh' },
            }}
          />
        );
      }}
    </SearchResultState>
  );
};
