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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Table,
  TableColumn,
  ResponseErrorPanel,
  LinkButton,
  Link,
} from '@backstage/core-components';

import DeleteIcon from '@material-ui/icons/Delete';
import ChevronRight from '@material-ui/icons/ChevronRight';
import { Box, Grid, IconButton, Tooltip } from '@material-ui/core';

import {
  CREATE_CHEF_PROJECT_TEMPLATE_PATH,
  Project,
  ProjectsGet,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { Repository } from '../Repository';
import { OrderDirection } from './types';
import { DetailPanel } from './DetailPanel';
import { ProjectStatusCell } from '../ProjectStatusCell';
import { DeleteProjectDialog } from '../DeleteProjectDialog';
import { extractResponseError } from '../tools';
import { useRouteRef } from '@backstage/core-plugin-api';
import { projectRouteRef } from '../../routes';

type ProjectTableProps = {
  forceRefresh: () => void;
  projects: Project[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (pageSize: number) => void;
  orderBy: number;
  orderDirection: OrderDirection;
  setOrderBy: (orderBy: number) => void;
  setOrderDirection: (orderDirection: ProjectsGet['query']['order']) => void;
};

/**
 * Important: Keep in sync with useColumns() hook.
 * Index 0 is the expand/collapse toggle column (not sortable).
 *
 * @returns
 */
export const mapOrderByToSort = (
  orderBy: number,
): ProjectsGet['query']['sort'] => {
  // Index in this array corresponds to the index in the useColumns() hook.
  const mapping: ProjectsGet['query']['sort'][] = [
    undefined,
    'name',
    'status',
    undefined,
    undefined,
    'createdAt',
  ];

  if (orderBy < 0) {
    return mapping[1];
  }

  const result = mapping[orderBy];
  if (!result) {
    throw new Error(`Invalid orderBy: ${orderBy}`);
  }
  return result;
};

const useColumns = (
  orderBy: number,
  orderDirection: OrderDirection,
  allExpanded: boolean,
  onToggleAll: () => void,
  onToggleRow: (rowData: any) => void,
): TableColumn<Project>[] => {
  const { t } = useTranslation();
  const projectPath = useRouteRef(projectRouteRef);

  const nameCell = useCallback(
    (rowData: Project) => {
      return (
        <Link
          to={projectPath({
            projectId: rowData.id,
          })}
        >
          {rowData.name}
        </Link>
      );
    },
    [projectPath],
  );

  const getDefaultSort = useCallback(
    (index: number): OrderDirection => {
      if (index === orderBy) {
        return orderDirection;
      }
      return undefined;
    },
    [orderBy, orderDirection],
  );

  return useMemo(() => {
    // Important: Keep the order in sync with the mapOrderByToSort() function.
    const columns: TableColumn<Project>[] = [
      {
        title: (
          <Tooltip
            title={
              allExpanded
                ? t('table.actions.collapseAll')
                : t('table.actions.expandAll')
            }
          >
            <IconButton
              aria-label={
                allExpanded
                  ? t('table.actions.collapseAll')
                  : t('table.actions.expandAll')
              }
              size="small"
              onClick={e => {
                e.stopPropagation();
                onToggleAll();
              }}
            >
              <ChevronRight
                style={{
                  transition: 'transform 200ms ease',
                  transform: allExpanded ? 'rotate(90deg)' : 'none',
                }}
              />
            </IconButton>
          </Tooltip>
        ),
        render: (rowData: any) => (
          <IconButton
            aria-label={
              rowData.tableData?.showDetailPanel
                ? t('table.actions.collapseRow')
                : t('table.actions.expandRow')
            }
            size="small"
            onClick={e => {
              e.stopPropagation();
              onToggleRow(rowData);
            }}
          >
            <ChevronRight
              style={{
                transition: 'transform 200ms ease',
                transform: rowData.tableData?.showDetailPanel
                  ? 'rotate(90deg)'
                  : 'none',
              }}
            />
          </IconButton>
        ),
        sorting: false,
        width: '2rem',
        cellStyle: { padding: 0, textAlign: 'center' },
        headerStyle: { padding: 0, textAlign: 'center' },
      },
      {
        title: t('table.columns.name'),
        render: nameCell,
        defaultSort: getDefaultSort(1),
      },
      {
        title: t('table.columns.status'),
        field: 'status',
        render: (rowData: Project) => (
          <ProjectStatusCell projectStatus={rowData.status} />
        ),
        defaultSort: getDefaultSort(2),
      },
      {
        title: t('table.columns.sourceRepo'),
        render: (rowData: Project) => {
          return (
            <Repository
              url={rowData.sourceRepoUrl}
              branch={rowData.sourceRepoBranch}
            />
          );
        },
        sorting: false,
      },
      {
        title: t('table.columns.targetRepo'),
        render: (rowData: Project) => {
          return (
            <Repository
              url={rowData.targetRepoUrl}
              branch={rowData.targetRepoBranch}
            />
          );
        },
        sorting: false,
      },
      {
        title: t('table.columns.createdAt'),
        field: 'createdAt',
        type: 'datetime',
        defaultSort: getDefaultSort(5),
      },
    ];

    return columns;
  }, [t, getDefaultSort, nameCell, allExpanded, onToggleAll, onToggleRow]);
};

export const ProjectTable = ({
  projects,
  forceRefresh,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onRowsPerPageChange,
  orderBy,
  orderDirection,
  setOrderBy,
  setOrderDirection,
}: ProjectTableProps) => {
  const clientService = useClientService();
  const { t } = useTranslation();

  const [error, setError] = useState<Error | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const tableRef = useRef<any>(null);

  useEffect(() => {
    setAllExpanded(false);
  }, [projects]);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setError(null);
    setIsDeleting(true);

    try {
      const response = await clientService.projectsProjectIdDelete({
        path: { projectId: deleteTarget.id },
      });

      if (!response.ok) {
        const message = await extractResponseError(
          response,
          t('projectTable.deleteError'),
        );
        setError(new Error(message));
        return;
      }

      forceRefresh();
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleOrderChange = (sortBy: number, od: OrderDirection) => {
    setOrderBy(sortBy);
    setOrderDirection(od);
  };

  const getDetailPanel = useCallback(
    ({ rowData }: { rowData: Project }): React.ReactNode => (
      <DetailPanel project={rowData} />
    ),
    [],
  );

  const handleToggleRow = useCallback(
    (rowData: any) => {
      const tableInstance = tableRef.current;
      if (!tableInstance) return;

      const { dataManager } = tableInstance;
      const index = dataManager.sortedData.findIndex(
        (row: any) => row === rowData || row.id === rowData.id,
      );
      if (index < 0) return;

      tableInstance.onToggleDetailPanel([index], getDetailPanel);

      const allNowExpanded =
        dataManager.data.length > 0 &&
        dataManager.data.every((row: any) => !!row.tableData.showDetailPanel);
      setAllExpanded(allNowExpanded);
    },
    [getDetailPanel],
  );

  const handleToggleAllDetailPanels = useCallback(() => {
    const tableInstance = tableRef.current;
    if (!tableInstance) return;

    const { dataManager } = tableInstance;
    const allCurrentlyExpanded =
      dataManager.data.length > 0 &&
      dataManager.data.every((row: any) => !!row.tableData.showDetailPanel);

    const newExpanded = !allCurrentlyExpanded;
    setAllExpanded(newExpanded);

    dataManager.data.forEach((row: any) => {
      row.tableData.showDetailPanel = newExpanded ? getDetailPanel : undefined;
    });

    tableInstance.setState(dataManager.getRenderState());
  }, [getDetailPanel]);

  const columns = useColumns(
    orderBy,
    orderDirection,
    allExpanded,
    handleToggleAllDetailPanels,
    handleToggleRow,
  );
  const data = projects;

  const actions = [
    (rowData: Project) => ({
      icon: DeleteIcon,
      onClick: () => setDeleteTarget(rowData),
      tooltip: t('table.actions.deleteProject'),
    }),
  ];

  return (
    <Grid container spacing={3} direction="column">
      <DeleteProjectDialog
        open={!!deleteTarget}
        projectName={deleteTarget?.name ?? ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      {error && (
        <Grid item>
          <ResponseErrorPanel error={error} />
        </Grid>
      )}

      <Grid item>
        <Box display="flex" justifyContent="flex-end">
          <LinkButton
            variant="contained"
            color="primary"
            to={CREATE_CHEF_PROJECT_TEMPLATE_PATH}
          >
            {t('common.newProject')}
          </LinkButton>
        </Box>
      </Grid>

      <Grid item>
        <Table<Project>
          title={t('table.projectsCount' as any, {
            count: totalCount.toString(),
          })}
          options={{
            search: false,
            paging: true,
            actionsColumnIndex: -1 /* to the row end */,
            padding: 'default',
            pageSize: pageSize,
            showDetailPanelIcon: false,
          }}
          columns={columns}
          data={data}
          actions={actions}
          detailPanel={getDetailPanel}
          tableRef={tableRef}
          onOrderChange={handleOrderChange}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          totalCount={totalCount}
        />
      </Grid>
    </Grid>
  );
};
