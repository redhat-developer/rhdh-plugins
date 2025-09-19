/*
 * Copyright The Backstage Authors
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

import { useMemo, useState } from 'react';

import {
  ResponseErrorPanel,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import { Query, QueryResult } from '@material-table/core';
import { useQuery } from '@tanstack/react-query';

import { dynamicPluginsInfoApiRef } from '../../api';
import { useInstalledPluginsCount } from '../../hooks/useInstalledPluginsCount';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { useMarketplaceApi } from '../../hooks/useMarketplaceApi';
import { useQueryFullTextSearch } from '../../hooks/useQueryFullTextSearch';
import { SearchTextField } from '../../shared-components/SearchTextField';

type InstalledPackageRow = {
  displayName: string;
  packageName: string;
  version?: string;
  hasEntity: boolean;
};

export const InstalledPackagesTable = () => {
  const [error, setError] = useState<Error | undefined>(undefined);
  const { count } = useInstalledPluginsCount();
  const dynamicPluginInfo = useApi(dynamicPluginsInfoApiRef);
  const marketplaceApi = useMarketplaceApi();
  const fullTextSearch = useQueryFullTextSearch();

  // Fetch once and cache
  const installedQuery = useQuery({
    queryKey: ['dynamic-plugins-info', 'installed'],
    queryFn: () => dynamicPluginInfo.listLoadedPlugins(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const packagesQuery = useQuery({
    queryKey: ['marketplace', 'packages'],
    queryFn: () => marketplaceApi.getPackages({}),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const columns: TableColumn<InstalledPackageRow>[] = useMemo(
    () => [
      {
        title: 'Name',
        field: 'displayName',
        align: 'left',
        width: '30ch',
        defaultSort: 'asc',
        headerStyle: {
          textAlign: 'left',
        },
        cellStyle: {
          textAlign: 'left',
        },
      },
      {
        title: 'Package',
        field: 'packageName',
        width: '54ch',
        align: 'left',
        headerStyle: {
          textAlign: 'left',
        },
        cellStyle: {
          textAlign: 'left',
        },
      },
      {
        title: 'Version',
        field: 'version',
        width: '24ch',
        align: 'left',
        headerStyle: {
          textAlign: 'left',
        },
        cellStyle: {
          textAlign: 'left',
        },
      },
      {
        title: 'Actions',
        align: 'right',
        width: '78px',
        headerStyle: {
          textAlign: 'left',
        },
        cellStyle: {
          textAlign: 'left',
        },
        render: (row: InstalledPackageRow) => {
          const disabled = !row.hasEntity;
          const tooltipTitle =
            'To enable actions, add a catalog entity for this package';
          return (
            <Box display="flex" gap={1}>
              {disabled ? (
                <Tooltip title={tooltipTitle}>
                  <Box component="span" display="inline-flex">
                    <IconButton
                      size="small"
                      disabled
                      sx={{ color: theme => theme.palette.action.disabled }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Box>
                </Tooltip>
              ) : (
                <IconButton
                  size="small"
                  sx={{ color: theme => theme.palette.text.primary }}
                  onClick={() => {
                    // TODO: Implement edit functionality
                  }}
                >
                  <EditIcon />
                </IconButton>
              )}
              {disabled ? (
                <Tooltip title={tooltipTitle}>
                  <Box component="span" display="inline-flex">
                    <IconButton
                      size="small"
                      disabled
                      sx={{ color: theme => theme.palette.action.disabled }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Tooltip>
              ) : (
                <IconButton
                  size="small"
                  sx={{ color: theme => theme.palette.text.primary }}
                  onClick={() => {
                    // TODO: Implement delete functionality
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
              {disabled ? (
                <Tooltip title={tooltipTitle}>
                  <Box component="span" display="inline-flex">
                    <IconButton
                      size="small"
                      disabled
                      sx={{ color: theme => theme.palette.action.disabled }}
                    >
                      <FileDownloadOutlinedIcon />
                    </IconButton>
                  </Box>
                </Tooltip>
              ) : (
                <IconButton
                  size="small"
                  sx={{ color: theme => theme.palette.text.primary }}
                  onClick={() => {
                    // TODO: Implement download functionality
                  }}
                >
                  <FileDownloadOutlinedIcon />
                </IconButton>
              )}
            </Box>
          );
        },
        sorting: false,
      },
    ],
    [],
  );
  const fetchData = async (
    query: Query<InstalledPackageRow>,
  ): Promise<QueryResult<InstalledPackageRow>> => {
    const { page = 0, pageSize = 5 } = query || {};

    try {
      // Ensure data available; avoid re-fetching on search or pagination
      const installed = installedQuery.data ?? [];
      const packagesResponse = packagesQuery.data ?? { items: [] as any[] };

      // Debug: sizes
      // eslint-disable-next-line no-console
      console.log(
        '[InstalledPackagesTable] dynamic-plugins-info count',
        installed.length,
      );
      // eslint-disable-next-line no-console
      console.log(
        '[InstalledPackagesTable] catalog packages count',
        packagesResponse.items?.length ?? 0,
      );

      const entitiesByName = new Map(
        (packagesResponse.items ?? []).map(entity => [
          (entity.metadata?.name ?? '').toLowerCase(),
          entity,
        ]),
      );

      // Build rows for ALL installed items; if no matching entity, mark missing
      const rows: InstalledPackageRow[] = installed.map(p => {
        const normalized = p.name
          .replace(/[@/]/g, '-')
          .replace(/-dynamic$/, '')
          .replace(/^-+/, '')
          .toLowerCase();
        const entity = entitiesByName.get(normalized) as any | undefined;
        return {
          displayName: entity
            ? (entity.metadata?.title as string) ||
              (entity.metadata?.name as string)
            : 'Missing catalog entity',
          // Show the npm package name directly from dynamic-plugins-info record
          packageName: p.name,
          // Prefer dynamic-plugins-info version, then fallback to entity spec.version
          version:
            (p.version as string | undefined) ??
            (entity?.spec?.version as string | undefined) ??
            undefined,
          hasEntity: !!entity,
        } as InstalledPackageRow;
      });
      // Debug: rows and missing entity stats
      // eslint-disable-next-line no-console
      console.log('[InstalledPackagesTable] rows count', rows.length);
      // eslint-disable-next-line no-console
      console.log(
        '[InstalledPackagesTable] missing entity rows',
        rows.filter(r => r.displayName === 'Missing catalog entity').length,
      );

      const sortField =
        ((query as any)?.orderBy?.field as string) || 'displayName';
      const sortDirection = (((query as any)?.orderDirection as
        | 'asc'
        | 'desc') || 'asc') as 'asc' | 'desc';

      const filteredRows = [...rows]
        .filter(row => {
          const term = fullTextSearch.current?.toLowerCase().trim() ?? '';
          return row.displayName.toLowerCase().trim().includes(term);
        })
        .sort((a, b) => {
          const aVal = ((a as any)[sortField] ?? '').toString();
          const bVal = ((b as any)[sortField] ?? '').toString();
          const cmp = aVal.localeCompare(bVal);
          return sortDirection === 'desc' ? -cmp : cmp;
        });
      // Debug: filtered rows count
      // eslint-disable-next-line no-console
      console.log(
        '[InstalledPackagesTable] filtered rows count',
        filteredRows.length,
      );
      const totalCount = filteredRows.length;
      const start = Math.max(0, page * pageSize);
      const end = Math.min(totalCount, start + pageSize);
      return { data: filteredRows.slice(start, end), page, totalCount };
    } catch (loadingError) {
      // eslint-disable-next-line no-console
      console.error('Failed to load plugins', loadingError);
      setError(loadingError as Error);
      return { data: [], totalCount: 0, page: 0 };
    }
  };
  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  // Conditional empty message based on search state
  const emptyMessage = (fullTextSearch.current || '').trim()
    ? 'No results found. Try a different search term.'
    : 'No records to display';

  return (
    <>
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}
      >
        <SearchTextField variant="search" />
      </div>
      <Table
        key={`${installedQuery.data?.length ?? 0}-${packagesQuery.data?.items?.length ?? 0}-${fullTextSearch.current || ''}`}
        title={`Installed packages (${count})`}
        options={{
          search: false,
          draggable: false,
          filtering: false,
          sorting: true,
          paging: true,
          pageSize: 5,
          pageSizeOptions: [5, 10, 20, 50, 100],
          thirdSortClick: false,
          debounceInterval: 500,
          emptyRowsWhenPaging: false,
        }}
        columns={columns}
        data={fetchData as any}
        localization={{
          body: {
            emptyDataSourceMessage: emptyMessage,
          },
          toolbar: {
            searchPlaceholder: 'Search',
          },
        }}
      />
    </>
  );
};
