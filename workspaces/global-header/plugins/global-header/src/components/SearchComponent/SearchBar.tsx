/*
 * Copyright 2024 The Backstage Authors
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
import Typography from '@mui/material/Typography';
import { Link } from '@backstage/core-components';
import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { createSearchLink, highlightMatch } from '../../utils/stringUtils';
import styles from './SearchBar.module.css';
import { useNavigate } from 'react-router-dom';

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
            ...results.slice(0, 5).map(result => result.document.title),
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
              <TextField
                {...params}
                placeholder="Search..."
                variant="standard"
                error={!!error}
                helperText={error ? 'Error fetching results' : ''}
                InputProps={{
                  ...params.InputProps,
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon style={{ color: '#fff' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  pt: '6px',
                  input: { color: '#fff' },
                  button: { color: '#fff' },
                }}
              />
            )}
            renderOption={(renderProps, option, { index }) => {
              if (option === query?.term && index === options.length - 1) {
                return (
                  <Box key="all-results" id="all-results">
                    <Divider sx={{ my: 0.5 }} />
                    <Link to={searchLink} underline="none">
                      <ListItem
                        {...renderProps}
                        sx={{ my: 0 }}
                        className={styles.allResultsOption}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ flexGrow: 1, mr: 1 }}>
                            All results
                          </Typography>
                          <ArrowForwardIcon fontSize="small" />
                        </Box>
                      </ListItem>
                    </Link>
                  </Box>
                );
              }

              const result = results.find(r => r.document.title === option);
              return (
                <Link
                  to={result?.document.location ?? '#'}
                  underline="none"
                  key={option}
                >
                  <ListItem {...renderProps} sx={{ cursor: 'pointer', py: 2 }}>
                    <Box sx={{ display: 'flex', width: '100%' }}>
                      <Typography
                        sx={{ color: 'text.primary', py: 0.5, flexGrow: 1 }}
                      >
                        {option === 'No results found'
                          ? option
                          : highlightMatch(option, query?.term ?? '')}
                      </Typography>
                    </Box>
                  </ListItem>
                </Link>
              );
            }}
            ListboxProps={{
              style: { maxHeight: 600 },
            }}
          />
        );
      }}
    </SearchResultState>
  );
};
