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
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

import CardWrapper from '../CardWrapper';
import { TECHDOCS_TABLE_HEADERS } from '../../utils/constants';
import TableFooterPagination from '../CardFooter';
import { useTechdocs } from '../../hooks/useTechdocs';
import { getLastUsedDay } from '../../utils/utils';
import EmptyChartState from '../Common/EmptyChartState';

const Techdocs = () => {
  const [page, setPage] = React.useState(0);
  const [limit] = React.useState(20);
  const [rowsPerPage, setRowsPerPage] = React.useState(3);

  const { techdocs, loading, error } = useTechdocs({ limit });

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

  if (error) {
    return (
      <CardWrapper title="Top techdocs">
        <ResponseErrorPanel error={error} />
      </CardWrapper>
    );
  }

  if (!visibleTechdocs || visibleTechdocs?.length === 0) {
    return (
      <CardWrapper title="Top techdocs">
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
            visibleTechdocs?.map(techdoc => {
              return (
                <TableRow
                  key={techdoc.name ?? 'index-page'}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
                    borderBottom: theme =>
                      `1px solid ${theme.palette.grey[300]}`,
                  }}
                >
                  <TableCell>
                    <Link
                      component="a"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={
                        !techdoc?.name
                          ? '/docs'
                          : `/docs/${techdoc?.namespace}/${techdoc?.kind}/${techdoc?.name}`
                      }
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'none',
                        },
                      }}
                    >
                      {!techdoc?.site_name
                        ? 'docs'
                        : techdoc?.site_name || '--'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {techdoc?.name ? (
                      <Link
                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={
                          !techdoc?.name
                            ? '/docs'
                            : `/catalog/${techdoc?.namespace}/${techdoc?.kind}/${techdoc?.name}`
                        }
                        sx={{
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'none',
                          },
                        }}
                      >
                        {techdoc?.name ?? '--'}
                      </Link>
                    ) : (
                      '--'
                    )}
                  </TableCell>
                  <TableCell>
                    {getLastUsedDay(techdoc.last_used) ?? '--'}
                  </TableCell>
                  <TableCell>
                    {Number(techdoc.count).toLocaleString() ?? '--'}
                  </TableCell>
                </TableRow>
              );
            })
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
