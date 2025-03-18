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

import { parseEntityRef } from '@backstage/catalog-model';
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
import { TEMPLATE_TABLE_HEADERS } from '../../utils/constants';
import TableFooterPagination from '../CardFooter';
import { useTemplates } from '../../hooks/useTemplates';
import EmptyChartState from '../Common/EmptyChartState';

const Templates = () => {
  const [page, setPage] = React.useState(0);
  const [limit] = React.useState(20);
  const [rowsPerPage, setRowsPerPage] = React.useState(3);

  const { templates, loading } = useTemplates({ limit });

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

  const visibleTemplates = React.useMemo(() => {
    return templates.data?.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [templates, page, rowsPerPage]);

  if (!visibleTemplates || visibleTemplates?.length === 0) {
    return (
      <CardWrapper title="Top templates">
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
    <CardWrapper title={`Top ${rowsPerPage} templates`}>
      <Table aria-labelledby="Catalog entities" sx={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            {TEMPLATE_TABLE_HEADERS.map(header => (
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
              <TableCell colSpan={TEMPLATE_TABLE_HEADERS.length} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : (
            visibleTemplates?.map(template => {
              if (
                !template.entityref ||
                Object.keys(template.entityref).length === 0
              )
                return null;

              const { name, namespace = 'default' } = parseEntityRef(
                template?.entityref,
              );
              const entityHrefLink = `/create/templates/${namespace}/${name}`;

              return (
                <TableRow
                  key={template.entityref}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
                    borderBottom: theme =>
                      `1px solid ${theme.palette.grey[300]}`,
                  }}
                >
                  <TableCell sx={{ width: '50%' }}>
                    <Link
                      component="a"
                      href={entityHrefLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'none',
                        },
                      }}
                    >
                      {name ?? '--'}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ width: '50%' }}>
                    {Number(template.count).toLocaleString() ?? '--'}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell
              colSpan={TEMPLATE_TABLE_HEADERS.length}
              sx={{ padding: 0 }}
            >
              <TableFooterPagination
                count={templates.data?.length}
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

export default Templates;
