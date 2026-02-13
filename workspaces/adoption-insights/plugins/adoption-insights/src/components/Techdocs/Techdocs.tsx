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
import { useState, useMemo, useCallback } from 'react';
import type { ChangeEvent } from 'react';

import { stringifyEntityRef } from '@backstage/catalog-model';
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
import { TECHDOCS_TABLE_HEADERS } from '../../utils/constants';
import TableFooterPagination from '../CardFooter';
import { useTechdocs } from '../../hooks/useTechdocs';
import { useEntityMetadataMap } from '../../hooks/useEntityMetadataMap';
import { getLastUsedDay } from '../../utils/utils';
import EmptyChartState from '../Common/EmptyChartState';
import { useTranslation } from '../../hooks/useTranslation';

const Techdocs = () => {
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const { t } = useTranslation();

  const { techdocs, loading, error } = useTechdocs({ limit });

  const entityRefs = useMemo(
    () =>
      techdocs.data
        ?.filter(techdoc => Boolean(techdoc.name))
        .map(techdoc =>
          stringifyEntityRef({
            kind: techdoc.kind,
            namespace: techdoc.namespace,
            name: techdoc.name,
          }),
        ) ?? [],
    [techdocs],
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

  const visibleTechdocs = useMemo(() => {
    return techdocs.data?.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [techdocs, page, rowsPerPage]);

  if (error) {
    return (
      <CardWrapper title={t('techDocs.title')}>
        <ResponseErrorPanel error={error} />
      </CardWrapper>
    );
  }

  if (!visibleTechdocs || visibleTechdocs?.length === 0) {
    return (
      <CardWrapper title={t('techDocs.title')}>
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
        rowsPerPage >= (techdocs.data?.length ?? 0)
          ? t('techDocs.allTitle' as any, {})
          : t('techDocs.topNTitle' as any, { count: rowsPerPage.toString() })
      }
    >
      <Table
        aria-labelledby="TechDocs"
        sx={{ width: '100%', tableLayout: 'fixed' }}
      >
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
                {t(header.titleKey as any, {})}
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
              const entityRef = techdoc.name
                ? stringifyEntityRef({
                    kind: techdoc.kind,
                    namespace: techdoc.namespace,
                    name: techdoc.name,
                  })
                : '';
              const displayName =
                (entityRef && entityMetadataMap[entityRef]?.title) ??
                techdoc.name ??
                '--';
              const tooltipTitle = [
                entityRef,
                entityMetadataMap[entityRef]?.kind ?? techdoc.kind,
                entityMetadataMap[entityRef]?.description,
              ]
                .filter(Boolean)
                .join(' | ');

              return (
                <TableRow
                  key={techdoc.name ?? 'index-page'}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
                    borderBottom: theme =>
                      `1px solid ${theme.palette.grey[300]}`,
                  }}
                >
                  <TableCell sx={{ width: '25%' }}>
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
                  <TableCell sx={{ width: '25%', minWidth: 0 }}>
                    {techdoc?.name ? (
                      <Tooltip title={tooltipTitle}>
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
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              textDecoration: 'none',
                            },
                          }}
                        >
                          {displayName}
                        </Link>
                      </Tooltip>
                    ) : (
                      '--'
                    )}
                  </TableCell>
                  <TableCell sx={{ width: '25%' }}>
                    {getLastUsedDay(techdoc.last_used, t) ?? '--'}
                  </TableCell>
                  <TableCell sx={{ width: '25%' }}>
                    {Number(techdoc.count).toLocaleString('en-US') ?? '--'}
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
