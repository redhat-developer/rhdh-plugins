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
import type { ReactNode, HTMLProps, FC } from 'react';

import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

interface CardWrapperProps extends HTMLProps<HTMLDivElement> {
  children: ReactNode;
  title: string;
  filter?: ReactNode;
}

const CardWrapper: FC<CardWrapperProps> = ({
  children,
  title,
  filter,
}: CardWrapperProps) => {
  return (
    <Paper elevation={1}>
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
      <Divider />
      <Box>{children}</Box>
    </Paper>
  );
};

export default CardWrapper;
