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
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ChangeEvent } from 'react';

import { ResponseErrorPanel } from '@backstage/core-components';
import Box from '@mui/material/Box';
import { SelectChangeEvent } from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import { entityRouteRef } from '@backstage/plugin-catalog-react';
import { useRouteRef } from '@backstage/core-plugin-api';

import CardWrapper from '../CardWrapper';
import { CATALOG_ENTITIES_TABLE_HEADERS } from '../../utils/constants';
import { useCatalogEntities } from '../../hooks/useCatalogEntities';
import TableFooterPagination from '../CardFooter';
import { getLastUsedDay, getUniqueCatalogEntityKinds } from '../../utils/utils';
import FilterDropdown from './FilterDropdown';
import EmptyChartState from '../Common/EmptyChartState';
import { useTranslation } from '../../hooks/useTranslation';

const CatalogEntities = () => {
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const [selectedOption, setSelectedOption] = useState('');
  const [uniqueCatalogEntityKinds, setUniqueCatalogEntityKinds] = useState<
    string[]
  >([]);
  const { t } = useTranslation();

  const entityLink = useRouteRef(entityRouteRef);

  const { catalogEntities, loading, error } = useCatalogEntities({
    limit,
    kind: selectedOption === 'All' ? '' : selectedOption.toLocaleLowerCase(),
  });

  useEffect(() => {
    if (
      catalogEntities?.data?.length > 0 &&
      uniqueCatalogEntityKinds?.length === 0
    ) {
      const uniqueKinds = getUniqueCatalogEntityKinds(catalogEntities.data);
      setUniqueCatalogEntityKinds(uniqueKinds);
    }
  }, [catalogEntities, uniqueCatalogEntityKinds]);

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

  const handleChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedOption(event.target.value);
  }, []);

  const visibleCatalogEntities = useMemo(() => {
    return catalogEntities.data
      ?.filter(entity => {
        if (selectedOption && selectedOption !== 'All') {
          return (
            entity.kind.toLocaleLowerCase() ===
            selectedOption.toLocaleLowerCase()
          );
        }
        return true;
      })
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [catalogEntities, page, rowsPerPage, selectedOption]);

  if (error) {
    return (
      <CardWrapper title={t('catalogEntities.title')}>
        <ResponseErrorPanel error={error} />
      </CardWrapper>
    );
  }

  if (
    (!visibleCatalogEntities || visibleCatalogEntities?.length === 0) &&
    !loading
  ) {
    return (
      <CardWrapper title={t('catalogEntities.title')}>
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
        rowsPerPage >= (catalogEntities.data?.length ?? 0)
          ? t('catalogEntities.allTitle' as any, {})
          : t('catalogEntities.topNTitle' as any, {
              count: rowsPerPage.toString(),
            })
      }
      filter={
        <FilterDropdown
          selectedOption={selectedOption}
          handleChange={handleChange}
          uniqueCatalogEntityKinds={uniqueCatalogEntityKinds}
        />
      }
    >
      <Table aria-labelledby="Catalog entities" sx={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            {CATALOG_ENTITIES_TABLE_HEADERS.map(header => (
              <TableCell
                key={header.id}
                align="left"
                sx={{
                  borderBottom: theme => `1px solid ${theme.palette.grey[300]}`,
                  width: '25%',
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
                colSpan={CATALOG_ENTITIES_TABLE_HEADERS.length}
                align="center"
              >
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : (
            visibleCatalogEntities?.map(entity => (
              <TableRow
                key={`${entity.kind}-${entity.name}`}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
                  borderBottom: theme => `1px solid ${theme.palette.grey[300]}`,
                }}
              >
                <TableCell sx={{ width: '25%' }}>
                  <Link
                    component="a"
                    href={entityLink({
                      kind: entity.kind,
                      namespace: entity.namespace,
                      name: entity.name,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'none',
                      },
                    }}
                  >
                    {entity.name ?? '--'}
                  </Link>
                </TableCell>
                <TableCell sx={{ width: '25%' }}>
                  {entity.kind?.charAt(0).toLocaleUpperCase('en-US') +
                    entity.kind?.slice(1) || '--'}
                </TableCell>
                <TableCell sx={{ width: '25%' }}>
                  {getLastUsedDay(entity.last_used, t) ?? '--'}
                </TableCell>
                <TableCell sx={{ width: '25%' }}>
                  {Number(entity.count).toLocaleString('en-US') ?? '--'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell
              colSpan={CATALOG_ENTITIES_TABLE_HEADERS.length}
              sx={{ padding: 0 }}
            >
              <TableFooterPagination
                count={catalogEntities.data?.length}
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

export default CatalogEntities;
