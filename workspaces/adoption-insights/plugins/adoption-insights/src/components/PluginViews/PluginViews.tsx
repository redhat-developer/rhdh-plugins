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

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';

import CardWrapper from '../CardWrapper';
import { PLUGINS_TABLE_HEADERS } from '../../utils/constants';
import { usePluginViews } from '../../hooks/usePluginViews';
import TableFooterPagination from '../CardFooter';

const PluginViews = () => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(3);

  const { plugins, loading } = usePluginViews({
    start_date: '2021-01-01',
    end_date: '2021-12-31',
    limit: 5,
  });

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
    return plugins.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [plugins, page, rowsPerPage]);

  return (
    <CardWrapper title={`Top ${rowsPerPage} plugins`}>
      <Table aria-labelledby="Catalog entities" sx={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            {PLUGINS_TABLE_HEADERS.map(header => (
              <TableCell
                key={header.id}
                align="left"
                sx={{
                  borderBottom: theme => `1px solid ${theme.palette.grey[300]}`,
                }}
              >
                {header.title}
              </TableCell>
            ))}
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
            visiblePlugins.map(plugin => (
              <TableRow
                key={plugin.plugin_id}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
                  borderBottom: theme => `1px solid ${theme.palette.grey[300]}`,
                }}
              >
                <TableCell>{plugin.plugin_id}</TableCell>
                <TableCell>{plugin.plugin_id}</TableCell>
                <TableCell>{plugin.trend_percentage}</TableCell>
                <TableCell>{plugin.count}</TableCell>
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
                count={plugins.length}
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

export default PluginViews;
