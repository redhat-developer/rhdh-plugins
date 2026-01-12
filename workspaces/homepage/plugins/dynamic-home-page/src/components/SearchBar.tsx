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

import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SearchBarBase } from '@backstage/plugin-search-react';

import { makeStyles } from 'tss-react/mui';

import { useTranslation } from '../hooks/useTranslation';

const useStyles = makeStyles()(theme => ({
  searchBar: {
    '&&': {
      backgroundColor: theme.palette.mode === 'dark' ? '#36373A' : '#FFFFFF',
      boxShadow: 'none',
      border: `1px solid ${
        theme.palette.mode === 'dark' ? '#57585a' : '#E4E4E4'
      }`,
      borderRadius: '50px',
      margin: 0,
    },
  },
  notchedOutline: {
    '&&': {
      borderStyle: 'none',
    },
  },
}));

/**
 * @public
 */
export interface SearchBarProps {
  path?: string;
  queryParam?: string;
}

/**
 * @public
 */
export const SearchBar = ({ path, queryParam }: SearchBarProps) => {
  const { classes } = useStyles();
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // This handler is called when "enter" is pressed
  const handleSubmit = useCallback(() => {
    const query = ref.current?.value ?? '';

    const url = new URL(window.location.toString());
    url.pathname = path ?? '/search';
    url.searchParams.set(queryParam ?? 'query', query);
    const search = url.searchParams.toString();

    navigate(`${url.pathname}${search ? '?' : ''}${search}`);
  }, [navigate, path, queryParam]);

  return (
    <SearchBarBase
      placeholder={t('search.placeholder')}
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      inputProps={{ ref }}
      classes={{
        root: classes.searchBar,
      }}
      InputProps={{
        classes: {
          notchedOutline: classes.notchedOutline,
        },
      }}
    />
  );
};
