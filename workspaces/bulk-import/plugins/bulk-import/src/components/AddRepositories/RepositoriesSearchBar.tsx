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

import Clear from '@mui/icons-material/Clear';
import Search from '@mui/icons-material/Search';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslation } from '../../hooks/useTranslation';

export const RepositoriesSearchBar = ({
  value,
  onChange,
  activeOrganization,
}: {
  value: string;
  onChange: (filter: string) => void;
  activeOrganization?: boolean;
}) => {
  const { t } = useTranslation();
  const ariaLabel = activeOrganization ? 'search-in-organization' : 'search';

  return (
    <FormControl
      sx={{
        alignItems: 'flex-end',
        flexGrow: 1,
        paddingLeft: '21px',
      }}
    >
      <Input
        data-testid={ariaLabel}
        placeholder={t('addRepositories.searchPlaceholder')}
        inputProps={{ 'aria-label': ariaLabel }}
        autoComplete="off"
        onChange={event => onChange(event.target.value)}
        value={value}
        startAdornment={
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        }
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label={t('addRepositories.clearSearch')}
              onClick={() => onChange('')}
              edge="end"
              disabled={!value}
              data-testid="clear-search"
              size="large"
            >
              <Clear />
            </IconButton>
          </InputAdornment>
        }
      />
    </FormControl>
  );
};
