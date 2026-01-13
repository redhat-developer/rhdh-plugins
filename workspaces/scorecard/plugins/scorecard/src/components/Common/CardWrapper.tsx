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

import type { ReactNode, HTMLProps } from 'react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface CardWrapperProps extends HTMLProps<HTMLDivElement> {
  children: ReactNode;
  title: string;
  subheader?: ReactNode;
  description?: string;
  width?: string;
  childrenWidth?: string | number;
  childrenHeight?: string | number;
  role?: string;
}

export const CardWrapper = ({
  children,
  title,
  subheader,
  description,
  width,
  childrenWidth = '100%',
  childrenHeight = '100%',
  role = 'article',
}: CardWrapperProps) => {
  return (
    <Card
      elevation={0}
      sx={{
        width: width ?? '100%',
        border: muiTheme => `1px solid ${muiTheme.palette.grey[300]}`,
        overflow: 'auto',
      }}
      role={role}
    >
      <CardHeader
        title={title}
        subheader={subheader ?? undefined}
        sx={{
          '& .v5-MuiCardHeader-title, & .v5-MuiCardHeader-subheader': {
            fontSize: '1.25rem',
            fontWeight: 500,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        }}
      />
      <Divider />
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {description && (
          <Box sx={{ pb: 2, width: '100%', minWidth: 316 }}>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                fontSize: '1rem',
                fontWeight: 400,
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
        )}

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: childrenWidth,
              height: childrenHeight,
              flexShrink: 0,
            }}
          >
            {children}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
