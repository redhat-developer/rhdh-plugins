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

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { Link } from '@backstage/core-components';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { SearchResultItem } from './SearchResultItem';
import { Result, SearchDocument } from '@backstage/plugin-search-common';
import { SearchResultProps } from '@backstage/plugin-search-react';

interface SearchOptionProps {
  option: string;
  index: number;
  options: string[];
  query: SearchResultProps['query'];
  results: Result<SearchDocument>[];
  renderProps: any;
  searchLink: string;
}

export const SearchOption = ({
  option,
  index,
  options,
  query,
  results,
  renderProps,
  searchLink,
}: SearchOptionProps) => {
  if (option === query?.term && index === options.length - 1) {
    return (
      <Box key="all-results" id="all-results">
        <Divider sx={{ my: 0.5 }} />
        <Link to={searchLink} underline="none">
          <ListItem
            {...renderProps}
            sx={{ my: 0 }}
            className="allResultsOption"
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ flexGrow: 1 }}>All results</Typography>
              <ArrowForwardIcon fontSize="small" />
            </Box>
          </ListItem>
        </Link>
      </Box>
    );
  }

  const result = results.find(r => r.document.title === option);
  return (
    <SearchResultItem
      key={index}
      option={option}
      query={query}
      result={result}
      renderProps={renderProps}
    />
  );
};
