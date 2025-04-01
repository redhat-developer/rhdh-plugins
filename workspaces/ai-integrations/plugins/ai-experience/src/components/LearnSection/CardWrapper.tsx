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
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface CardWrapperProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

const CardWrapper: React.FC<CardWrapperProps> = ({
  title,
  description,
  buttonText,
  buttonLink,
}) => {
  return (
    <Box>
      <CardContent sx={{ width: '220px' }}>
        <Box>
          <Typography variant="h5" component="div" fontWeight="500">
            {title}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: 16,
              fontWeight: '500',
              pt: 1,
              pb: 2,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {description}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            href={buttonLink}
            target="_blank"
            sx={{
              textTransform: 'none',
              minWidth: '200px',
              p: 1,
              justifyContent: 'flex-start',
              fontSize: '16px',
              fontWeight: '400',
            }}
          >
            {buttonText} <ArrowForwardIcon sx={{ pl: 0.5 }} />
          </Button>
        </Box>
      </CardContent>
    </Box>
  );
};

export default CardWrapper;
