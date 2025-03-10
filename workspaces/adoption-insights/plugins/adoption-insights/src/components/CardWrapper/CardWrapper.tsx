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

import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

interface CardWrapperProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
  filter?: React.ReactNode;
}

const CardWrapper: React.FC<CardWrapperProps> = ({
  children,
  title,
  filter,
}: CardWrapperProps) => {
  return (
    <Box
      component={Paper}
      sx={{ border: theme => `1px solid ${theme.palette.grey[300]}` }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          variant="h5"
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold',
          }}
        >
          {title}
        </Typography>

        {filter && <Box>{filter}</Box>}
      </Box>
      <Divider
        sx={{ border: theme => `1px solid ${theme.palette.grey[300]}` }}
      />
      <Box>{children}</Box>
    </Box>
  );
};

export default CardWrapper;
