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

import { useState } from 'react';

import {
  ResponseErrorPanel,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import { Query, QueryResult } from '@material-table/core';

import { dynamicPluginsInfoApiRef } from '../../api';
import { useInstalledPluginsCount } from '../../hooks/useInstalledPluginsCount';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { useMarketplaceApi } from '../../hooks/useMarketplaceApi';

type InstalledPackageRow = {
  displayName: string;
  packageName: string;
  version?: string;
};

export const InstalledPluginsTable = () => {
  const [error, setError] = useState<Error | undefined>(undefined);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('');
  const { count } = useInstalledPluginsCount();
  const dynamicPluginInfo = useApi(dynamicPluginsInfoApiRef);
  const marketplaceApi = useMarketplaceApi();
  let data: InstalledPackageRow[] = [];
  const columns: TableColumn<InstalledPackageRow>[] = [
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
      render: (_rowData: InstalledPackageRow) => {
        return (
          <Box display="flex" gap={1}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  // TODO: Implement edit functionality
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Uninstall">
              <IconButton
                size="small"
                onClick={() => {
                  // TODO: Implement delete functionality
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export configurations (YAML)">
              <IconButton
                size="small"
                onClick={() => {
                  // TODO: Implement download functionality
                }}
              >
                <FileDownloadOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
      sorting: false,
    },
  ];
  const fetchData = async (
    query: Query<InstalledPackageRow>,
  ): Promise<QueryResult<InstalledPackageRow>> => {
    const {
      orderBy = { field: 'displayName' },
      orderDirection = 'asc',
      page = 0,
      pageSize = 5,
      search = '',
    } = query || {};

    // Track current search term for conditional empty message
    setCurrentSearchTerm(search);

    try {
      // for now sorting/searching/pagination is handled client-side
      const installed = await dynamicPluginInfo.listLoadedPlugins();

      // Normalize installed names to entity names: replace @ and / with -
      const installedEntityNames = Array.from(
        new Set(installed.map(p => p.name.replace(/[@/]/g, '-').toLowerCase())),
      );

      // Fetch marketplace package entities
      const packagesResponse = await marketplaceApi.getPackages({});
      const entitiesByName = new Map(
        packagesResponse.items.map(entity => [
          (entity.metadata?.name ?? '').toLowerCase(),
          entity,
        ]),
      );

      // Map into rows for installed packages only
      const rows: InstalledPackageRow[] = installedEntityNames
        .map(name => entitiesByName.get(name))
        .filter(Boolean)
        .map(entity => ({
          displayName:
            (entity!.metadata as any)?.title ||
            (entity!.metadata?.name as string),
          packageName: (entity as any)!.spec?.packageName as string,
          version: ((entity as any)!.spec?.version as string) ?? undefined,
        }));

      data = [...rows]
        .sort((a: Record<string, any>, b: Record<string, any>) => {
          const field = Array.isArray(orderBy.field)
            ? orderBy.field[0]
            : orderBy.field;
          const orderMultiplier = orderDirection === 'desc' ? -1 : 1;

          if (!field || a[field] === null || b[field] === null) {
            return 0;
          }

          // Handle boolean values separately
          if (typeof a[field] === 'boolean' && typeof b[field] === 'boolean') {
            return (a[field] ? 1 : -1) * orderMultiplier;
          }

          return (
            (a[field] as string).localeCompare(b[field] as string) *
            orderMultiplier
          );
        })
        .filter(row =>
          row.displayName
            .toLowerCase()
            .trim()
            .includes(search.toLowerCase().trim()),
        );
      const totalCount = data.length;
      let start = 0;
      let end = totalCount;
      if (totalCount > pageSize) {
        start = page * pageSize;
        end = start + pageSize;
      }
      return { data: data.slice(start, end), page, totalCount };
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
  const emptyMessage = currentSearchTerm.trim()
    ? 'No results found. Try a different search term.'
    : 'No records to display';

  return (
    <Table
      title={`Installed packages (${count})`}
      options={{
        draggable: false,
        filtering: false,
        sorting: true,
        paging: true,
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
  );
};
