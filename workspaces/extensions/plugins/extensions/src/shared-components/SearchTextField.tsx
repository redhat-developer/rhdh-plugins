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

import { useCallback, useEffect, useRef, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import SearchIcon from '@mui/icons-material/Search';
import FilterIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import { useQueryFullTextSearch } from '../hooks/useQueryFullTextSearch';
import { useTranslation } from '../hooks/useTranslation';

export interface SearchTextFieldProps {
  variant: 'search' | 'filter';
}

export const SearchTextField = (props: SearchTextFieldProps) => {
  const { t } = useTranslation();
  const fullTextSearch = useQueryFullTextSearch();
  const timerRef = useRef<number | undefined>(undefined);
  const [inputValue, setInputValue] = useState<string>(
    fullTextSearch.current || '',
  );

  // Keep local input in sync if URL param changes externally (e.g., back/forward)
  useEffect(() => {
    setInputValue(fullTextSearch.current || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullTextSearch]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const options =
    props.variant === 'search'
      ? {
          placeholder: t('search.placeholder'),
          Icon: SearchIcon,
          clear: t('search.clear'),
        }
      : {
          placeholder: t('search.filter'),
          Icon: FilterIcon,
          clear: t('search.clearFilter'),
        };

  return (
    <FormControl>
      <TextField
        variant="standard"
        hiddenLabel
        placeholder={options.placeholder}
        value={inputValue}
        onChange={useCallback(
          (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setInputValue(value);
            if (timerRef.current) {
              window.clearTimeout(timerRef.current);
            }
            timerRef.current = window.setTimeout(() => {
              fullTextSearch.onChange({ target: { value } } as any);
            }, 300) as unknown as number;
          },
          [fullTextSearch],
        )}
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
                onClick={() => {
                  if (timerRef.current) {
                    window.clearTimeout(timerRef.current);
                  }
                  setInputValue('');
                  fullTextSearch.clear();
                }}
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
