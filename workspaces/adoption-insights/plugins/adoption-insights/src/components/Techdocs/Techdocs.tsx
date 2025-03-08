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
import { TECHDOCS_TABLE_HEADERS } from '../../utils/constants';
import TableFooterPagination from '../CardFooter';
import { useTechdocs } from '../../hooks/useTechdocs';

const Techdocs = () => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(3);

  const { techdocs, loading } = useTechdocs({ limit: rowsPerPage });

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

  const visibleTechdocs = React.useMemo(() => {
    return techdocs.data?.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [techdocs, page, rowsPerPage]);

  return (
    <CardWrapper title={`Top ${rowsPerPage} techdocs`}>
      <Table aria-labelledby="Catalog entities" sx={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            {TECHDOCS_TABLE_HEADERS.map(header => (
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
              <TableCell colSpan={TECHDOCS_TABLE_HEADERS.length} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : (
            visibleTechdocs?.map(techdoc => (
              <TableRow
                key={techdoc.entityref}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
                  borderBottom: theme => `1px solid ${theme.palette.grey[300]}`,
                }}
              >
                <TableCell>{techdoc.entityref}</TableCell>
                <TableCell>{techdoc.entityref}</TableCell>
                <TableCell>{Number(techdoc.count).toLocaleString()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell
              colSpan={TECHDOCS_TABLE_HEADERS.length}
              sx={{ padding: 0 }}
            >
              <TableFooterPagination
                count={techdocs.data?.length}
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

export default Techdocs;
