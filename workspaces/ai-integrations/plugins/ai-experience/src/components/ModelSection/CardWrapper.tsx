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

import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';

interface CardWrapperProps {
  link: string;
  title: string;
  version?: string;
  description: string;
  tags: string[];
}

const CardWrapper: React.FC<CardWrapperProps> = ({
  link,
  title,
  description,
  tags,
}) => {
  return (
    <Box
      sx={{
        border: theme => `1px solid ${theme.palette.grey[400]}`,
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <CardContent
        sx={{
          pb: 2,
          '&:last-child': {
            pb: 2,
          },
        }}
      >
        <Box sx={{ overflow: 'hidden' }}>
          <Link
            href={link}
            underline="always"
            sx={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </Link>
        </Box>

        {/* // Todo: Add version to the model card once it is available
        <Box sx={{ display: 'flex', alignItems: 'center', pt: 1 }}>
          <LocalOfferOutlinedIcon sx={{ width: '16px' }} />
          <Typography variant="body2">{version}</Typography>
        </Box> */}
        <Box sx={{ pt: 2, height: '175px', overflow: 'hidden' }}>
          <Typography
            variant="body2"
            paragraph
            sx={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {description}
          </Typography>
        </Box>
        <Box
          sx={{
            height: '72px',
            display: 'flex',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          {tags.slice(0, 3).map(tag => (
            <Chip
              variant="outlined"
              label={
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 400 }}>
                  {tag}
                </Typography>
              }
              key={tag}
            />
          ))}
        </Box>
      </CardContent>
    </Box>
  );
};

export default CardWrapper;
