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

import { Link as BackstageLink } from '@backstage/core-components';

import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { styled } from '@mui/material/styles';

interface OnboardingCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  target?: string;
}

const StyledLink = styled(BackstageLink)(({ theme }) => ({
  testDecoration: 'none',
  padding: theme.spacing(1, 1.5),
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '16px',
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: 4,
}));

const OnboardingCard: React.FC<OnboardingCardProps> = ({
  title,
  description,
  buttonText,
  buttonLink,
  target,
}) => {
  return (
    <Box>
      <CardContent sx={{ backgroundColor: 'transparent' }}>
        <Box
          component="div"
          sx={{
            fontSize: '1.75rem',
            fontWeight: 500,
            margin: 0,
          }}
        >
          {title}
        </Box>
        <Box
          component="div"
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
        </Box>
        <StyledLink to={buttonLink} underline="none" target={target}>
          {buttonText} <ArrowForwardIcon style={{ paddingLeft: '0.5rem' }} />
        </StyledLink>
      </CardContent>
    </Box>
  );
};

export default OnboardingCard;
