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
import { useTheme } from '@mui/material/styles';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import CardWrapper from '../CardWrapper';

const data = [
  { date: 'January 24', searches: 500 },
  { date: 'June 24', searches: 450 },
  { date: 'December 24', searches: 700 },
  { date: 'January 24', searches: 600 },
  { date: 'June 24', searches: 550 },
  { date: 'December 24', searches: 800 },
  { date: 'January 24', searches: 500 },
  { date: 'June 24', searches: 650 },
  { date: 'December 24', searches: 900 },
  { date: 'January 24', searches: 400 },
  { date: 'June 24', searches: 620 },
  { date: 'December 24', searches: 500 },
];

const Searches = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <CardWrapper title="0 searches">
      <Typography variant="body1" sx={{ mb: 2, textAlign: 'left' }}>
        An average of <b>621 searches per day</b> were conducted during this
        period.
      </Typography>
      <Box sx={{ height: 310, mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              stroke={isDarkMode ? '#666' : '#E5E7EB'}
              strokeDasharray={0}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: theme.palette.text.primary }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.palette.text.primary }}
            />
            <Tooltip />
            <Line
              type="linear"
              dataKey="searches"
              stroke="#00838F"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </CardWrapper>
  );
};

export default Searches;
