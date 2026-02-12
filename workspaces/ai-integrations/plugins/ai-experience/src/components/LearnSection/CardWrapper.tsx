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
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link } from '@backstage/core-components';
import { makeStyles, useTheme } from '@material-ui/core';
import { Theme } from '@mui/material/styles';

interface CardWrapperProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  target?: string;
}

const getStyles = makeStyles((theme: Theme) => ({
  link: {
    textTransform: 'none',
    minWidth: '200px',
    padding: theme.spacing(1),
    display: 'flex',
    fontSize: '16px',
    border: `1px solid ${
      theme.palette.mode === 'light' ? '#0066CC' : '#1FA7F8'
    }`,
  },
}));

const CardWrapper: FC<CardWrapperProps> = ({
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
      <CardContent sx={{ width: '220px', backgroundColor: 'transparent' }}>
        <Box>
          <Typography variant="h3" component="div" fontWeight="500">
            {title}
          </Typography>
        </Box>
        <Box sx={{ pt: 1, pb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: 16,
              fontWeight: '500',
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
              {buttonText} <ArrowForwardIcon sx={{ pl: 0.5 }} />
            </div>
          </Link>
        </Box>
      </CardContent>
    </Box>
  );
};

export default CardWrapper;
