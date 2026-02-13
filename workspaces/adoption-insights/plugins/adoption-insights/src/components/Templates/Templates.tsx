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
import { useState, useCallback, useMemo } from 'react';
import type { ChangeEvent } from 'react';

import { parseEntityRef } from '@backstage/catalog-model';
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
import Tooltip from '@mui/material/Tooltip';

import CardWrapper from '../CardWrapper';
import { TEMPLATE_TABLE_HEADERS } from '../../utils/constants';

import TableFooterPagination from '../CardFooter';
import { useTemplates } from '../../hooks/useTemplates';
import { useEntityMetadataMap } from '../../hooks/useEntityMetadataMap';
import EmptyChartState from '../Common/EmptyChartState';
import { useTranslation } from '../../hooks/useTranslation';

const Templates = () => {
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const { t } = useTranslation();

  const { templates, loading, error } = useTemplates({ limit });

  const entityRefs = useMemo(
    () => templates.data?.map(template => template.entityref) ?? [],
    [templates],
  );
  const { entityMetadataMap } = useEntityMetadataMap(entityRefs);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setRowsPerPage(+event.target.value);
      setPage(0);
    },
    [],
  );

  const visibleTemplates = useMemo(() => {
    return templates.data?.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [templates, page, rowsPerPage]);

  if (error) {
    return (
      <CardWrapper title={t('templates.title')}>
        <ResponseErrorPanel error={error} />
      </CardWrapper>
    );
  }

  if (!visibleTemplates || visibleTemplates?.length === 0) {
    return (
      <CardWrapper title={t('templates.title')}>
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
      title={
        rowsPerPage >= (templates.data?.length ?? 0)
          ? t('templates.allTitle' as any, {})
          : t('templates.topNTitle' as any, { count: rowsPerPage.toString() })
      }
    >
      <Box sx={{ width: '100%' }}>
        <Table
          aria-labelledby="Templates"
          sx={{ width: '100%', tableLayout: 'fixed' }}
        >
          <TableHead>
            <TableRow>
              {TEMPLATE_TABLE_HEADERS.map(header => (
                <TableCell
                  key={header.id}
                  align="left"
                  sx={{
                    borderBottom: theme =>
                      `1px solid ${theme.palette.grey[300]}`,
                  }}
                >
                  {t(header.titleKey as any, {})}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={TEMPLATE_TABLE_HEADERS.length}
                  align="center"
                >
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
                const displayName =
                  entityMetadataMap[template.entityref]?.title ?? name ?? '--';

                const tooltipTitle = [
                  template.entityref,
                  entityMetadataMap[template.entityref]?.kind ?? 'Template',
                  entityMetadataMap[template.entityref]?.description,
                ]
                  .filter(Boolean)
                  .join(' | ');

                return (
                  <TableRow
                    key={template.entityref}
                    sx={{
                      '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
                      borderBottom: theme =>
                        `1px solid ${theme.palette.grey[300]}`,
                    }}
                  >
                    <TableCell
                      sx={{
                        width: '50%',
                        minWidth: 0,
                      }}
                    >
                      <Tooltip title={tooltipTitle}>
                        <Link
                          component="a"
                          href={entityHrefLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              textDecoration: 'none',
                            },
                          }}
                          title={name ?? ''}
                        >
                          {displayName}
                        </Link>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ width: '50%' }}>
                      {Number(template.count).toLocaleString('en-US') ?? '--'}
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
      </Box>
    </CardWrapper>
  );
};

export default Templates;
