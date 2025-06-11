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

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

interface SearchInputProps {
  params: any;
  error: boolean;
  helperText: string;
}

export const SearchInput = ({
  params,
  error,
  helperText,
}: SearchInputProps) => (
  <TextField
    {...params}
    placeholder="Search..."
    variant="standard"
    error={error}
    helperText={helperText}
    InputProps={{
      ...params.InputProps,
      disableUnderline: true,
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon style={{ color: 'inherit' }} />
        </InputAdornment>
      ),
    }}
    sx={{
      input: { color: 'inherit' },
      button: { color: 'inherit' },
      '& fieldset': { border: 'none' },
    }}
  />
);
