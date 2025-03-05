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
      <Box
        sx={{
          backgroundColor: 'white',
          p: 2,
          boxShadow: 3,
          borderRadius: 2,
          border: '1px solid #ddd',
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {format(date, 'MMMM yyyy')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Returning users: {payload[0]?.value}
        </Typography>
        <Typography variant="body2" color="primary">
          New users: {payload[1]?.value}
        </Typography>
        <Typography variant="subtitle2" fontWeight="bold">
          Total: {payload[0]?.value + payload[1]?.value}
        </Typography>
      </Box>
    );
  }
  return null;
};

export default CustomTooltip;
