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
import { Link } from '@backstage/core-components';
import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { highlightMatch } from '../../utils/stringUtils';
import { SearchResultProps } from '@backstage/plugin-search-react';
import { Result, SearchDocument } from '@backstage/plugin-search-common';

interface SearchResultItemProps {
  option: string;
  query: SearchResultProps['query'];
  result: Result<SearchDocument> | undefined;
  renderProps: any;
}

export const SearchResultItem = ({
  option,
  query,
  result,
  renderProps,
}: SearchResultItemProps) => (
  <Link to={result?.document.location ?? '#'} underline="none">
    <ListItem key={option} {...renderProps} sx={{ cursor: 'pointer', py: 2 }}>
      <Box sx={{ display: 'flex', width: '100%' }}>
        <Typography sx={{ color: 'text.primary', py: 0.5, flexGrow: 1 }}>
          {option === 'No results found'
            ? option
            : highlightMatch(option, query?.term ?? '')}
        </Typography>
      </Box>
    </ListItem>
  </Link>
);
