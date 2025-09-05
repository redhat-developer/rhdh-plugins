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

import { DynamicPluginInfo, dynamicPluginsInfoApiRef } from '../../api';
import { useInstalledPluginsCount } from '../../hooks/useInstalledPluginsCount';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { processPluginsForDisplay } from '../../utils/pluginProcessing';

export const InstalledPluginsTable = () => {
  const [error, setError] = useState<Error | undefined>(undefined);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('');
  const { count } = useInstalledPluginsCount();
  const dynamicPluginInfo = useApi(dynamicPluginsInfoApiRef);
  let data: DynamicPluginInfo[] = [];
  const columns: TableColumn<DynamicPluginInfo>[] = [
    {
      title: 'Name',
      field: 'name',
      defaultSort: 'asc',
    },
    {
      title: 'Version',
      field: 'version',
      width: '15%',
    },
    {
      title: 'Actions',
      render: (_rowData: DynamicPluginInfo) => {
        return (
          <Box display="flex" gap={1}>
            <Tooltip title="Edit plugin">
              <IconButton
                size="small"
                onClick={() => {
                  // TODO: Implement edit functionality
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete plugin">
              <IconButton
                size="small"
                onClick={() => {
                  // TODO: Implement delete functionality
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download plugin">
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
    query: Query<DynamicPluginInfo>,
  ): Promise<QueryResult<DynamicPluginInfo>> => {
    const {
      orderBy = { field: 'name' },
      orderDirection = 'asc',
      page = 0,
      pageSize = 5,
      search = '',
    } = query || {};

    // Track current search term for conditional empty message
    setCurrentSearchTerm(search);

    try {
      // for now sorting/searching/pagination is handled client-side
      const installedPlugins = await dynamicPluginInfo.listLoadedPlugins();

      // Process plugins to create single rows with readable names
      const processedPlugins = processPluginsForDisplay(installedPlugins);

      data = [...processedPlugins]
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
        .filter(plugin =>
          plugin.name
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
      title={`Installed plugins (${count})`}
      options={{
        draggable: false,
        filtering: false,
        sorting: true,
        paging: true,
        thirdSortClick: false,
        debounceInterval: 500,
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
