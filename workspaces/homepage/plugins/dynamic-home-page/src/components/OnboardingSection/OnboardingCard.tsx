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
import { Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface OnboardingCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  target?: string;
  ariaLabel?: string;
}

const OnboardingCard: React.FC<OnboardingCardProps> = ({
  title,
  description,
  buttonText,
  buttonLink,
  target,
  ariaLabel,
}) => {
  return (
    <Box>
      <CardContent sx={{ backgroundColor: 'transparent' }}>
        <Typography
          sx={{
            fontSize: '1.75rem',
            fontWeight: 500,
            m: 0,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 500,
            p: '16px',
            pt: '8px',
            pl: '0px',
            display: '-webkit-box',
            webkitBoxOrient: 'vertical',
            width: '240px',
            webkitLineClamp: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {description}
        </Typography>
        <Button
          component={RouterLink}
          variant="outlined"
          color="primary"
          to={buttonLink}
          target={target}
          aria-label={ariaLabel}
          sx={{
            padding: theme => theme.spacing(1, 1.5),
            fontSize: '16px',
          }}
        >
          {buttonText} <ArrowForwardIcon style={{ paddingLeft: '0.5rem' }} />
        </Button>
      </CardContent>
    </Box>
  );
};

export default OnboardingCard;
