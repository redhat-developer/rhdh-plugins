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
import { FC } from 'react';

import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { Link } from '@backstage/core-components';

interface CardWrapperProps {
  link: string;
  title: string;
  description: string;
  kind: string;
}

const CardWrapper: FC<CardWrapperProps> = ({
  link,
  title,
  description,
  kind,
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
          backgroundColor: 'transparent',
        }}
      >
        <Box sx={{ padding: '8px 0' }}>
          <Chip
            label={
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 400 }}>
                {kind}
              </Typography>
            }
            key={kind}
          />
        </Box>
        <Box sx={{ margin: '8px 0', height: '21px', overflow: 'hidden' }}>
          <Link
            to={link}
            underline="always"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}
          >
            {title}
          </Link>
        </Box>
        <Box sx={{ padding: '8px 0', height: '90px', overflow: 'hidden' }}>
          <Typography
            variant="body2"
            paragraph
            sx={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {description}
          </Typography>
        </Box>
      </CardContent>
    </Box>
  );
};

export default CardWrapper;
