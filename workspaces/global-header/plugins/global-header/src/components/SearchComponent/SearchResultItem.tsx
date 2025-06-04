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

import { Link } from '@backstage/core-components';
import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { highlightMatch } from '../../utils/stringUtils';
import { SearchResultProps } from '@backstage/plugin-search-react';
import { Result, SearchDocument } from '@backstage/plugin-search-common';
import { useAnalytics } from '@backstage/core-plugin-api';

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
}: SearchResultItemProps) => {
  const isNoResultsFound = option === 'No results found';
  const analytics = useAnalytics();

  return (
    <Box
      component={isNoResultsFound ? 'div' : Link}
      to={result?.document.location}
      underline="none"
      sx={{ width: '100%', ...(isNoResultsFound ? {} : { cursor: 'pointer' }) }}
    >
      <ListItem
        {...renderProps}
        sx={{ py: 1 }}
        onClick={e => {
          analytics.captureEvent('discover', result?.document.title ?? '', {
            attributes: { to: result?.document.location ?? '#' },
            value: result?.rank,
          });
          renderProps?.onClick?.(e);
        }}
      >
        <Typography sx={{ color: 'text.primary', flexGrow: 1 }}>
          {isNoResultsFound
            ? option
            : highlightMatch(option, query?.term ?? '')}
        </Typography>
      </ListItem>
    </Box>
  );
};
