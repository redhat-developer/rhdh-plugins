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

import { ResponseErrorPanel } from '@backstage/core-components';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import CardWrapper from '../CardWrapper';
import { PLUGINS_TABLE_HEADERS } from '../../utils/constants';
import { usePlugins } from '../../hooks/usePlugins';
import TableFooterPagination from '../CardFooter';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import EmptyChartState from '../Common/EmptyChartState';
import { useDateRange } from '../Header/DateRangeContext';

const Plugins = () => {
  const [page, setPage] = React.useState(0);
  const [limit] = React.useState(20);
  const [rowsPerPage, setRowsPerPage] = React.useState(3);

  const { isDefaultDateRange } = useDateRange();
  const { plugins, loading, error } = usePlugins({ limit });

  const handleChangePage = React.useCallback(
    (_event: unknown, newPage: number) => {
      setPage(newPage);
    },
    [],
  );

  const handleChangeRowsPerPage = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setRowsPerPage(+event.target.value);
      setPage(0);
    },
    [],
  );

  const visiblePlugins = React.useMemo(() => {
    return plugins.data?.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [plugins, page, rowsPerPage]);

  if (error) {
    return (
      <CardWrapper title="Top plugins">
        <ResponseErrorPanel error={error} />
      </CardWrapper>
    );
  }

  if (!visiblePlugins || visiblePlugins?.length === 0) {
    return (
      <CardWrapper title="Top plugins">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={200}
        >
          <EmptyChartState />
        </Box>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title={`Top ${rowsPerPage} plugins`}>
      <Table aria-labelledby="Catalog entities" sx={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            {PLUGINS_TABLE_HEADERS.map(header => {
              if (isDefaultDateRange && header.id === 'percent') return null;
              return (
                <TableCell
                  key={header.id}
                  align="left"
                  sx={{
                    borderBottom: theme =>
                      `1px solid ${theme.palette.grey[300]}`,
                  }}
                >
                  {header.title}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={PLUGINS_TABLE_HEADERS.length} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : (
            visiblePlugins?.map(plugin => (
              <TableRow
                key={plugin.plugin_id}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
                  borderBottom: theme => `1px solid ${theme.palette.grey[300]}`,
                }}
              >
                <TableCell sx={isDefaultDateRange ? {} : { width: '20%' }}>
                  {plugin.plugin_id ?? '--'}
                </TableCell>
                <TableCell sx={{ width: '40%' }}>
                  {plugin.trend?.length > 0 ? (
                    <ResponsiveContainer width={250} height={50}>
                      <LineChart data={plugin.trend}>
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#9370DB"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    '--'
                  )}
                </TableCell>
                {!isDefaultDateRange && (
                  <TableCell sx={isDefaultDateRange ? {} : { width: '20%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {Math.round(Number(plugin.trend_percentage)) < 0 ? (
                        <TrendingDownIcon sx={{ color: 'red' }} />
                      ) : (
                        <TrendingUpIcon sx={{ color: 'green' }} />
                      )}
                      <Typography variant="body2">
                        {Math.abs(Math.round(Number(plugin.trend_percentage)))}%
                      </Typography>
                    </Box>
                  </TableCell>
                )}
                <TableCell sx={isDefaultDateRange ? {} : { width: '20%' }}>
                  {Number(plugin.visit_count).toLocaleString() ?? '--'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell
              colSpan={PLUGINS_TABLE_HEADERS.length}
              sx={{ padding: 0 }}
            >
              <TableFooterPagination
                count={plugins.data?.length}
                rowsPerPage={rowsPerPage}
                page={page}
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </CardWrapper>
  );
};

export default Plugins;
