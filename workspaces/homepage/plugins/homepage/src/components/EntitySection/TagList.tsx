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
import type { FC } from 'react';

import { Link } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { KINDS } from '../../utils/constants';

type KindKeys = keyof typeof KINDS;

interface TagListProps {
  tags: string[];
  kind: string;
}

const TagList: FC<TagListProps> = ({ tags, kind }) => {
  const hiddenCount = tags.length - 3;

  const params = new URLSearchParams({
    'filters[kind]': kind,
    'filters[user]': 'all',
  });
  const catalogKindLink = `/catalog?${params.toString()}`;

  return (
    <Box
      sx={{
        height: '77px',
        pt: 2,
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        rowGap: 0.5,
        columnGap: 0.5,
      }}
    >
      <Link to={catalogKindLink}>
        <Chip
          key={kind}
          label={
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 400 }}>
              {kind}
            </Typography>
          }
          sx={{
            backgroundColor: KINDS[kind.toLocaleUpperCase() as KindKeys]?.fill,
            color: 'black',
            m: 0,
            border: '1px solid transparent',
            '&:hover': {
              borderColor:
                KINDS[kind.toLocaleUpperCase() as KindKeys]?.borderColor,
            },
          }}
          variant="filled"
          size="small"
        />
      </Link>
      {tags.slice(0, 2).map(tag => {
        const tagParams = new URLSearchParams({
          'filters[kind]': kind,
          'filters[tags]': tag,
          'filters[user]': 'all',
        });
        const catalogLink = `/catalog?${tagParams.toString()}`;

        return (
          <Link key={tag} to={catalogLink}>
            <Chip
              key={tag}
              label={
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 400 }}>
                  {tag}
                </Typography>
              }
              sx={{
                m: 0,
                '&:hover': {
                  borderColor: '#9e9e9e',
                },
              }}
              variant="outlined"
              size="small"
            />
          </Link>
        );
      })}

      {hiddenCount > 0 && (
        <Chip
          label={
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 400,
                color: theme => theme.palette.text.secondary,
              }}
            >
              {`${hiddenCount} more`}
            </Typography>
          }
          variant="outlined"
          size="small"
          sx={{
            border: 'none',
            m: 0,
          }}
        />
      )}
    </Box>
  );
};

export default TagList;
