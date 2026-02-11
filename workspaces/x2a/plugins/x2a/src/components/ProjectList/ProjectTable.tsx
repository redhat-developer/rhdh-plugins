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
import { useMemo, useState } from 'react';

import {
  Table,
  TableColumn,
  ResponseErrorPanel,
  LinkButton,
} from '@backstage/core-components';

import DeleteIcon from '@material-ui/icons/Delete';
import { Box, Grid } from '@material-ui/core';

import {
  CREATE_CHEF_PROJECT_TEMPLATE_PATH,
  Project,
  ProjectsGet,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { Repository } from './Repository';
import { OrderDirection } from './types';
import { DetailPanel } from './DetailPanel';

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
 *
 * @returns
 */
export const mapOrderByToSort = (
  orderBy: number,
): ProjectsGet['query']['sort'] => {
  // Index in this array corresponds to the index in the useColumns() hook.
  const mapping: ProjectsGet['query']['sort'][] = [
    'name',
    'status',
    undefined,
    undefined,
    'createdAt',
  ];

  if (orderBy < 0) {
    return mapping[0];
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
): TableColumn<Project>[] => {
  const { t } = useTranslation();
  return useMemo(() => {
    const getDefaultSort = (index: number): OrderDirection => {
      if (index === orderBy) {
        return orderDirection;
      }
      return undefined;
    };

    // Important: Keep the order in sync with the mapOrderByToSort() function.
    const columns: TableColumn<Project>[] = [
      {
        title: t('table.columns.name'),
        field: 'name',
        defaultSort: getDefaultSort(0),
      },
      {
        title: t('table.columns.status'),
        field: 'status',
        defaultSort: getDefaultSort(1),
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
        defaultSort: getDefaultSort(4),
      },
    ];
    return columns;
  }, [orderBy, orderDirection, t]);
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

  const [error, setError] = useState<Error | null>(null);

  const handleDelete = async (id: string) => {
    setError(null);

    try {
      await clientService.projectsProjectIdDelete({ path: { projectId: id } });
      forceRefresh();
    } catch (e) {
      setError(e as Error);
    }
  };

  const handleOrderChange = (sortBy: number, od: OrderDirection) => {
    setOrderBy(sortBy);
    setOrderDirection(od);
  };

  const columns = useColumns(orderBy, orderDirection);
  const data = projects;

  const { t } = useTranslation();

  const actions = [
    (rowData: Project) => ({
      icon: DeleteIcon,
      onClick: () => handleDelete(rowData.id),
      tooltip: t('table.actions.deleteProject'),
    }),
  ];

  const getDetailPanel = ({
    rowData,
  }: {
    rowData: Project;
  }): React.ReactNode => <DetailPanel project={rowData} />;

  return (
    <Grid container spacing={3} direction="column">
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
            count: projects.length.toString(),
          })}
          options={{
            search: false,
            paging: true,
            actionsColumnIndex: -1 /* to the row end */,
            padding: 'default',
            pageSize: pageSize,
            detailPanelColumnStyle: {},
          }}
          columns={columns}
          data={data}
          actions={actions}
          detailPanel={getDetailPanel}
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
