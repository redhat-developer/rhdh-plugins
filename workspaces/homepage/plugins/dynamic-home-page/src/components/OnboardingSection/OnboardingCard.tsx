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
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link } from '@backstage/core-components';
import { makeStyles, useTheme } from '@material-ui/core';
import { Theme } from '@mui/material/styles';

interface OnboardingCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  target?: string;
}

const getStyles = makeStyles((theme: Theme) => ({
  title: {
    fontSize: '1.75rem',
    fontWeight: 500,
    margin: 0,
  },
  description: {
    fontSize: '1rem',
    fontWeight: 500,
    paddingTop: '8px',
    paddingBottom: '16px',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  link: {
    textTransform: 'none',
    padding: theme.spacing(1, 1.5),
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '16px',
    border: `1px solid ${
      theme.palette.mode === 'light' ? '#0066CC' : '#1FA7F8'
    }`,
    borderRadius: '3px',
  },
}));

const OnboardingCard: React.FC<OnboardingCardProps> = ({
  title,
  description,
  buttonText,
  buttonLink,
  target,
}) => {
  const theme = useTheme();
  const classes = getStyles(theme);
  return (
    <Box>
      <CardContent sx={{ width: '240px', backgroundColor: 'transparent' }}>
        <Box>
          <div className={classes.title}>{title}</div>
        </Box>
        <Box>
          <div className={classes.description}>{description}</div>
        </Box>
        <Box>
          <Link
            to={buttonLink}
            target={target}
            underline="none"
            className={classes.link}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {buttonText}{' '}
              <ArrowForwardIcon style={{ paddingLeft: '0.5rem' }} />
            </div>
          </Link>
        </Box>
      </CardContent>
    </Box>
  );
};

export default OnboardingCard;
