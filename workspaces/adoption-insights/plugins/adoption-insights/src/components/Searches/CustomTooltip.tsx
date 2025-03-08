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
import Typography from '@mui/material/Typography';
import { format } from 'date-fns';

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (active && payload?.length) {
    const date = label ? new Date(label) : new Date();
    return (
      <Paper
        elevation={1}
        sx={{
          padding: '8px',
          boxShadow: 3,
          borderRadius: 2,
          border: theme => `1px solid ${theme.palette.grey[300]}`,
        }}
      >
        <Typography style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>
          {format(date, 'MMMM yyyy')}
        </Typography>
        <Typography
          style={{ fontSize: '14px', fontWeight: '500', marginTop: '8px' }}
        >
          Searches:
        </Typography>
        <Typography
          style={{ fontSize: '32px', fontWeight: '500', color: '#009596' }}
        >
          {payload[0]?.value}
        </Typography>
      </Paper>
    );
  }
  return null;
};

export default CustomTooltip;
