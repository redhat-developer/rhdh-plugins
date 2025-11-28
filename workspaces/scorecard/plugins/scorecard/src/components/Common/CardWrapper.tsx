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

interface CardWrapperProps extends HTMLProps<HTMLDivElement> {
  children: ReactNode;
  title: string;
  subtitle?: ReactNode;
  width?: string;
}

export const CardWrapper = ({
  children,
  title,
  subtitle,
  width = '371px',
}: CardWrapperProps) => {
  return (
    <Card sx={{ width }}>
      <CardHeader
        title={title}
        subheader={subtitle ?? undefined}
        sx={{
          '& .v5-MuiCardHeader-title, & .v5-MuiCardHeader-subheader': {
            fontSize: '1.25rem',
            fontWeight: 500,
          },
        }}
      />
      <Divider />
      <CardContent>{children}</CardContent>
    </Card>
  );
};
