/*
 * Copyright The Backstage Authors
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

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import SearchIcon from '@mui/icons-material/Search';
import FilterIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import { useQueryFullTextSearch } from '../hooks/useQueryFullTextSearch';

export interface SearchTextFieldProps {
  variant: 'search' | 'filter';
}

export const SearchTextField = (props: SearchTextFieldProps) => {
  const fullTextSearch = useQueryFullTextSearch();

  const options =
    props.variant === 'search'
      ? {
          placeholder: 'Search',
          Icon: SearchIcon,
          clear: 'Clear Search',
        }
      : {
          placeholder: 'Filter',
          Icon: FilterIcon,
          clear: 'Clear Filter',
        };

  return (
    <FormControl>
      <TextField
        variant="standard"
        hiddenLabel
        placeholder={options.placeholder}
        value={fullTextSearch.current}
        onChange={fullTextSearch.onChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip title={options.placeholder}>
                <options.Icon fontSize="small" />
              </Tooltip>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                disabled={!fullTextSearch.current}
                onClick={fullTextSearch.clear}
                aria-label={options.clear}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        inputProps={{
          'aria-label': options.placeholder,
        }}
      />
    </FormControl>
  );
};
