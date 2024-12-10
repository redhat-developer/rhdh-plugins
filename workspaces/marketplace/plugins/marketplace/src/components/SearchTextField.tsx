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

import { useQueryParamState } from '@backstage/core-components';

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import SearchIcon from '@mui/icons-material/Search';
import FilterIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

export interface SearchTextFieldProps {
  variant: 'search' | 'filter';
  filterValue?: string;
  onFilterChanged?: (value: string | undefined) => void;
}

// TODO: extract this later into a shared package
export const SearchTextField = (props: SearchTextFieldProps) => {
  const [queryParam, setQueryParam] = useQueryParamState<string | undefined>(
    'q',
  );

  const labels =
    props.variant === 'search'
      ? {
          placeholder: 'Search',
          clear: 'Clear Search',
        }
      : {
          placeholder: 'Filter',
          clear: 'Clear Filter',
        };
  const Icon = props.variant === 'search' ? SearchIcon : FilterIcon;

  const value = props.filterValue || queryParam;
  const onChange = (newValue: string | undefined) => {
    if (props.onFilterChanged) {
      props.onFilterChanged(newValue);
    } else {
      setQueryParam(newValue);
    }
  };

  return (
    <FormControl>
      <TextField
        variant="standard"
        hiddenLabel
        placeholder={labels.placeholder}
        value={value}
        onChange={event =>
          onChange(event.target.value ? event.target.value : undefined)
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip title={labels.placeholder}>
                <Icon fontSize="small" />
              </Tooltip>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                disabled={!value}
                onClick={() => onChange(undefined)}
                aria-label={labels.clear}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        inputProps={{
          'aria-label': labels.placeholder,
        }}
      />
    </FormControl>
  );
};
