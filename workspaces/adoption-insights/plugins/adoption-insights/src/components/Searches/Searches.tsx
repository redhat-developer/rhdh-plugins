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
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
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
import { useSearches } from '../../hooks/useSearches';
import {
  getAverage,
  getTotal,
  getXAxisformat,
  getXAxisTickValues,
} from '../../utils/utils';
import CustomCursor from '../Common/CustomCursor';
import EmptyChartState from '../Common/EmptyChartState';
import ChartTooltip from '../Common/ChartTooltip';

const Searches = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const { searches, loading, error } = useSearches();
  const { data, grouping = 'daily' } = searches;

  if (error) {
    return (
      <CardWrapper title="Searches">
        <ResponseErrorPanel error={error} />
      </CardWrapper>
    );
  }

  if (!data || data?.length === 0 || (!data?.[0] && !loading)) {
    return (
      <CardWrapper title="Searches">
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
    <CardWrapper
      title={`${getTotal(data, 'count')?.toLocaleString('en-US')} searches`}
    >
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
            Average search count was{' '}
            <b>
              {`${Math.round(getAverage(data, 'count')).toLocaleString(
                'en-US',
              )} per ${grouping === 'hourly' ? 'hour' : 'day'}`}
            </b>{' '}
            for this period.
          </Typography>
          <Box sx={{ height: 310, mt: 4, mb: 4, ml: 0, mr: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 50, left: 20, bottom: 0 }}
              >
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
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: theme.palette.text.primary }}
                  tickFormatter={value => value.toLocaleString('en-US')}
                  tickMargin={20}
                />
                <Tooltip
                  cursor={<CustomCursor cursorHeight={280} />}
                  content={<ChartTooltip grouping={grouping} />}
                />
                <Line
                  type="linear"
                  dataKey="count"
                  stroke="#00838F"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </CardWrapper>
  );
};

export default Searches;
