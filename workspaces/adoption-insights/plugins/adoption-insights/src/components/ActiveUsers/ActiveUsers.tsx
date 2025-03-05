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
import { useTheme } from '@mui/material/styles';
import {
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Legend,
} from 'recharts';

import CardWrapper from '../CardWrapper';
import CustomTooltip from './CustomTooltip';
import CustomCursor from './CustomCursor';
import CustomLegend from './CustomLegend';
import {
  dummyData,
  getXAxisformat,
  getXAxisTickValues,
} from '../../utils/utils';

const ActiveUsers = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <CardWrapper title="Active Users">
      <Box sx={{ height: 310, mt: 4, mb: 4, ml: 2, mr: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dummyData}
            margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="newUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1976d2" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="returningUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B8BBBE" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#B8BBBE" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={isDarkMode ? '#666' : '#E5E7EB'}
              strokeDasharray={0}
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tickFormatter={getXAxisformat}
              ticks={getXAxisTickValues(dummyData)}
              tick={{ fill: theme.palette.text.primary }}
              axisLine={false}
              tickLine={false}
              padding={{ left: 30, right: 30 }}
            />
            <YAxis
              tick={{ fill: theme.palette.text.primary }}
              tickLine={false}
              axisLine={false}
              tickFormatter={value => value.toLocaleString()}
            />
            <Tooltip cursor={<CustomCursor />} content={<CustomTooltip />} />
            <Area
              type="linear"
              dataKey="newUsers"
              stroke="#1976d2"
              fill="url(#newUsers)"
              strokeWidth={1}
            />
            <Area
              type="linear"
              dataKey="returningUsers"
              stroke="#555"
              fill="url(#returningUsers)"
              strokeWidth={1}
            />
            <Legend content={<CustomLegend />} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </CardWrapper>
  );
};

export default ActiveUsers;
