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
  MarkdownContent,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import { Query, QueryResult } from '@material-table/core';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import {
  ExtensionsPackage,
  ExtensionsPackageInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { useExtensionsApi } from '../../hooks/useExtensionsApi';
import { getReadableName } from '../../utils/pluginProcessing';
import { useQueryFullTextSearch } from '../../hooks/useQueryFullTextSearch';
import { SearchTextField } from '../../shared-components/SearchTextField';
import { useTranslation } from '../../hooks/useTranslation';
import { DynamicPluginInfo, dynamicPluginsInfoApiRef } from '../../api';
import {
  DownloadPackageYaml,
  EditPackage,
  InstalledPackageRow,
  PackageName,
  TogglePackage,
  UninstallPackage,
} from './RowActions';
import { useInstallationContext } from '../InstallationContext';
import { useNodeEnvironment } from '../../hooks/useNodeEnvironment';
import { InstalledPluginsDialog } from '../InstalledPluginsDialog';
import { useExtensionsConfiguration } from '../../hooks/useExtensionsConfiguration';
import {
  ProductionEnvironmentAlert,
  ExtensionsConfigurationAlert,
  BackendRestartAlert,
} from '../SharedAlerts';

export const InstalledPackagesTable = () => {
  const { t } = useTranslation();
  const extensionsConfig = useExtensionsConfiguration();
  const { installedPackages } = useInstallationContext();
  const nodeEnvironment = useNodeEnvironment();
  const [error, setError] = useState<Error | undefined>(undefined);
  const [openInstalledPackagesDialog, setOpenInstalledPackagesDialog] =
    useState(false);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const dynamicPluginInfo = useApi(dynamicPluginsInfoApiRef);
  const extensionsApi = useExtensionsApi();
  const fullTextSearch = useQueryFullTextSearch();

  const showUninstall = false;
  const isProductionEnvironment =
    nodeEnvironment?.data?.nodeEnv === 'production';
  const installedPackagesCount = Object.entries(installedPackages)?.length ?? 0;

  const getPackageAlertMessage = (count: number, packageName?: string) => {
    if (count > 1) {
      return (
        <MarkdownContent
          content={t('alert.multiplePackageRestart' as any, {
            count: count.toString(),
          })}
        />
      );
    }

    return (
      <MarkdownContent
        content={t('alert.singlePackageRestart' as any, {
          packageName: packageName || '',
        })}
      />
    );
  };

  const packageInfo = () => {
    const packageName = Object.keys(installedPackages)[0];
    return <>{getPackageAlertMessage(installedPackagesCount, packageName)}</>;
  };

  // Fetch once and cache
  const installedQuery = useQuery({
    queryKey: ['dynamic-plugins-info', 'installed'],
    queryFn: () => dynamicPluginInfo.listLoadedPlugins(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const packagesQuery = useQuery({
    queryKey: ['extensions', 'packages'],
    queryFn: () => extensionsApi.getPackages({}),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const columns: TableColumn<InstalledPackageRow>[] = [
    {
      title: t('installedPackages.table.columns.name'),
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
      render: (row: InstalledPackageRow) => <PackageName pkg={row} />,
    },
    {
      title: t('installedPackages.table.columns.packageName'),
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
      title: t('installedPackages.table.columns.role'),
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
      title: t('installedPackages.table.columns.version'),
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
      title: t('installedPackages.table.columns.actions'),
      align: 'right',
      width: '78px',
      headerStyle: {
        textAlign: 'left',
      },
      cellStyle: {
        textAlign: 'left',
      },
      render: (row: InstalledPackageRow) => {
        return (
          <Box display="flex" gap={1}>
            <EditPackage
              pkg={row}
              isProductionEnv={isProductionEnvironment}
              isInstallationEnabled={extensionsConfig.data?.enabled ?? false}
            />
            {/* Show it when uninstall functionality is implemented */}
            {showUninstall && <UninstallPackage pkg={row} />}
            <DownloadPackageYaml
              pkg={row}
              isProductionEnv={isProductionEnvironment}
            />
            <TogglePackage
              pkg={row}
              isProductionEnv={isProductionEnvironment}
              isInstallationEnabled={extensionsConfig.data?.enabled ?? false}
            />
          </Box>
        );
      },
      sorting: false,
    },
  ];
  const fetchData = async (
    query: Query<InstalledPackageRow>,
  ): Promise<QueryResult<InstalledPackageRow>> => {
    const { page = 0, pageSize = 5 } = query || {};

    try {
      // Ensure data available; avoid re-fetching on search or pagination
      const installed = installedQuery.data ?? [];
      const packagesResponse = packagesQuery.data ?? { items: [] as any[] };

      const entitiesByName = new Map(
        (packagesResponse.items ?? []).map((entity: ExtensionsPackage) => [
          (entity.metadata?.name ?? '').toLowerCase(),
          entity,
        ]),
      );

      // Build rows for ALL installed items; if no matching entity, mark missing
      const rows: InstalledPackageRow[] = installed.map(
        (p: DynamicPluginInfo) => {
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
            parentPlugin: entity?.spec?.partOf?.[0] ?? '',
            // If entity exists, use its installStatus; otherwise, since the package is installed,
            // set installStatus to Installed (matching the Catalog tab behavior)
            installStatus:
              entity?.spec?.installStatus ??
              ExtensionsPackageInstallStatus.Installed,
            // Humanized role from dynamic-plugins-info
            role: (p as any).role
              ? (() => {
                  const raw = ((p as any).role as string).replace(/-/g, ' ');
                  return (
                    raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
                  );
                })()
              : undefined,
            // Prefer dynamic-plugins-info version, then fallback to entity spec.version
            version:
              (p.version as string | undefined) ??
              (entity?.spec?.version as string | undefined) ??
              undefined,
            hasEntity: !!entity,
            missingDynamicArtifact: !entity?.spec?.dynamicArtifact,
            namespace: entity?.metadata?.namespace ?? 'default',
            name: entity?.metadata?.name,
          } as InstalledPackageRow;
        },
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
    ? t('installedPackages.table.emptyMessages.noResults')
    : t('installedPackages.table.emptyMessages.noRecords');

  const showExtensionsConfigurationAlert =
    !isProductionEnvironment && !extensionsConfig.data?.enabled;

  return (
    <>
      {isProductionEnvironment && <ProductionEnvironmentAlert />}
      {showExtensionsConfigurationAlert && <ExtensionsConfigurationAlert />}
      <BackendRestartAlert
        count={installedPackagesCount}
        itemInfo={packageInfo()}
        viewItemsLabel={t('alert.viewPackages')}
        onViewItems={() => setOpenInstalledPackagesDialog(true)}
      />

      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}
      >
        <SearchTextField variant="search" />
      </div>
      <Table
        key={`${installedQuery.data?.length ?? 0}-${packagesQuery.data?.items?.length ?? 0}-${fullTextSearch.current || ''}`}
        title={t('installedPackages.table.title' as any, {
          count: filteredCount.toString(),
        })}
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
            searchPlaceholder: t('installedPackages.table.searchPlaceholder'),
          },
        }}
      />
      <InstalledPluginsDialog
        open={openInstalledPackagesDialog}
        onClose={setOpenInstalledPackagesDialog}
        showPackages
      />
    </>
  );
};
