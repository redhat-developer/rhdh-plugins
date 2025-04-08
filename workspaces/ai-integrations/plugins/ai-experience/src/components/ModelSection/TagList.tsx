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

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

interface TagListProps {
  tags: string[];
}

const TagList: React.FC<TagListProps> = ({ tags }) => {
  const hiddenCount = tags.length - 3;
  return (
    <Box
      sx={{
        height: '72px',
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: 0.5,
      }}
    >
      {tags.slice(0, 3).map(tag => (
        <Chip
          key={tag}
          label={
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 400 }}>
              {tag}
            </Typography>
          }
          variant="outlined"
          size="small"
        />
      ))}

      {hiddenCount > 0 && (
        <Chip
          label={
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 400,
                color: theme =>
                  `${theme.palette.mode === 'light' ? '#0066CC' : '#1FA7F8'}`,
              }}
            >
              {`${hiddenCount} more`}
            </Typography>
          }
          variant="outlined"
          size="small"
          sx={{
            border: 'none',
          }}
        />
      )}
    </Box>
  );
};

export default TagList;
