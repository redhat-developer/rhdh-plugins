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
import { Link } from '@backstage/core-components';
import { useLocation } from 'react-router-dom';

import { Query, QueryResult } from '@material-table/core';
import { useQuery } from '@tanstack/react-query';

import { dynamicPluginsInfoApiRef } from '../../api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { useMarketplaceApi } from '../../hooks/useMarketplaceApi';
import { getReadableName } from '../../utils/pluginProcessing';
import { useQueryFullTextSearch } from '../../hooks/useQueryFullTextSearch';
import { SearchTextField } from '../../shared-components/SearchTextField';

type InstalledPackageRow = {
  displayName: string;
  packageName: string;
  role?: string;
  version?: string;
  hasEntity: boolean;
  namespace?: string;
  name?: string;
};

export const InstalledPackagesTable = () => {
  const [error, setError] = useState<Error | undefined>(undefined);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const dynamicPluginInfo = useApi(dynamicPluginsInfoApiRef);
  const marketplaceApi = useMarketplaceApi();
  const fullTextSearch = useQueryFullTextSearch();
  const location = useLocation();

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
        render: (row: InstalledPackageRow) => {
          if (row.hasEntity && row.namespace && row.name) {
            const params = new URLSearchParams(location.search);
            params.set('package', `${row.namespace}/${row.name}`);
            const to = `${location.pathname}?${params.toString()}`;
            return (
              <Link to={to} onClick={e => e.stopPropagation()}>
                {row.displayName}
              </Link>
            );
          }
          return row.displayName;
        },
      },
      {
        title: 'npm package name',
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
        title: 'Role',
        field: 'role',
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
    [location.pathname, location.search],
  );
  const fetchData = async (
    query: Query<InstalledPackageRow>,
  ): Promise<QueryResult<InstalledPackageRow>> => {
    const { page = 0, pageSize = 5 } = query || {};

    try {
      // Ensure data available; avoid re-fetching on search or pagination
      const installed = installedQuery.data ?? [];
      const packagesResponse = packagesQuery.data ?? { items: [] as any[] };

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
        const rawName = entity
          ? (entity.metadata?.title as string) ||
            (entity.metadata?.name as string)
          : getReadableName(p.name);
        const cleanedName = rawName.replace(/\s+(frontend|backend)$/i, '');
        return {
          displayName: cleanedName,
          // Show the npm package name directly from dynamic-plugins-info record
          packageName: p.name,
          // Humanized role from dynamic-plugins-info
          role: (p as any).role
            ? (() => {
                const raw = ((p as any).role as string).replace(/-/g, ' ');
                return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
              })()
            : undefined,
          // Prefer dynamic-plugins-info version, then fallback to entity spec.version
          version:
            (p.version as string | undefined) ??
            (entity?.spec?.version as string | undefined) ??
            undefined,
          hasEntity: !!entity,
          namespace: entity?.metadata?.namespace ?? 'default',
          name: entity?.metadata?.name,
        } as InstalledPackageRow;
      });

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

      const totalCount = filteredRows.length;
      setFilteredCount(totalCount);
      const lastPage = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
      const effectivePage = Math.min(page, lastPage);
      const start = Math.max(0, effectivePage * pageSize);
      const end = Math.min(totalCount, start + pageSize);
      return {
        data: filteredRows.slice(start, end),
        page: effectivePage,
        totalCount,
      };
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
        title={`Installed packages (${filteredCount})`}
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
