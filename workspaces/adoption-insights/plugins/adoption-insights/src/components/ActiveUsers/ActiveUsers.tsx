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
import { ResponseErrorPanel } from '@backstage/core-components';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
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
import CustomCursor from '../Common/CustomCursor';
import CustomLegend from './CustomLegend';
import {
  getAverage,
  getXAxisformat,
  getXAxisTickValues,
  getGroupingLabel,
} from '../../utils/utils';
import { useActiveUsers } from '../../hooks/useActiveUsers';
import { Typography } from '@material-ui/core';
import ExportCSVButton from './ExportCSVButton';
import EmptyChartState from '../Common/EmptyChartState';
import ChartTooltip from '../Common/ChartTooltip';

const ActiveUsers = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const { activeUsers, loading, error } = useActiveUsers();
  const { data, grouping = 'daily' } = activeUsers;
  if (error) {
    return (
      <CardWrapper title="Active users">
        <ResponseErrorPanel error={error} />
      </CardWrapper>
    );
  }

  if (!data || data?.length === 0 || (!data?.[0] && !loading)) {
    return (
      <CardWrapper title="Active users">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={80}
        >
          <EmptyChartState />
        </Box>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title="Active users" filter={<ExportCSVButton />}>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={200}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography style={{ margin: '20px 36px' }}>
            Average peak active user count was{' '}
            <b>
              {`${Math.round(getAverage(data, 'total_users')).toLocaleString(
                'en-Us',
              )} per ${getGroupingLabel(grouping)}`}
            </b>{' '}
            for this period.
          </Typography>
          <Box sx={{ height: 310, mt: 4, mb: 4, ml: 0, mr: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 50, left: 20, bottom: 0 }}
                key={JSON.stringify(data.map(d => d))}
              >
                <defs>
                  <linearGradient id="new_users" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient
                    id="returning_users"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                  tickFormatter={date => getXAxisformat(date, grouping)}
                  ticks={getXAxisTickValues(data, grouping)}
                  tick={{ fill: theme.palette.text.primary }}
                  axisLine={false}
                  tickLine={false}
                  padding={{ left: 30, right: 30 }}
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fill: theme.palette.text.primary }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={value => value.toLocaleString('en-Us')}
                  tickMargin={20}
                />
                <Tooltip
                  cursor={<CustomCursor cursorHeight={250} />}
                  content={<ChartTooltip grouping={grouping} />}
                />
                <Area
                  type="linear"
                  dataKey="returning_users"
                  stroke="#555"
                  fill="url(#returning_users)"
                  strokeWidth={1}
                />
                <Area
                  type="linear"
                  dataKey="new_users"
                  stroke="#1976d2"
                  fill="url(#new_users)"
                  strokeWidth={1}
                />
                <Legend content={<CustomLegend />} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </CardWrapper>
  );
};

export default ActiveUsers;
