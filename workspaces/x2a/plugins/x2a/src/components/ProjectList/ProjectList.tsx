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
import { useCallback, useMemo, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';

import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
  LinkButton,
} from '@backstage/core-components';

import DeleteIcon from '@material-ui/icons/Delete';
import { Box, Grid } from '@material-ui/core';

import {
  CREATE_CHEF_PROJECT_TEMPLATE_PATH,
  DEFAULT_PAGE_SIZE,
  Project,
  ProjectsGet,
  ProjectsGet200Response,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { EmptyProjectList } from './EmptyProjectList';
import { Repository } from './Repository';

type OrderDirection = ProjectsGet['query']['order'];

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

    const columns: TableColumn<Project>[] = [
      {
        title: t('table.columns.name'),
        field: 'name',
        defaultSort: getDefaultSort(0),
      },
      {
        title: t('table.columns.abbreviation'),
        field: 'abbreviation',
        defaultSort: getDefaultSort(1),
      },
      {
        title: t('table.columns.status'),
        field: 'status',
        defaultSort: getDefaultSort(2),
      },
      {
        title: t('table.columns.description'),
        field: 'description',
        defaultSort: getDefaultSort(3),
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
              url={rowData.sourceRepoUrl}
              branch={rowData.sourceRepoBranch}
            />
          );
        },
        sorting: false,
      },
      {
        title: t('table.columns.createdAt'),
        render: (rowData: Project) => {
          // TODO: Show human-readable duration instead, make sure sorting still works
          return <div>{rowData.createdAt.toLocaleString()}</div>;
        },
        defaultSort: getDefaultSort(6),
      },
    ];
    return columns;
  }, [orderBy, orderDirection, t]);
};

const mapOrderByToSort = (orderBy: number): ProjectsGet['query']['sort'] => {
  const mapping: ProjectsGet['query']['sort'][] = [
    'name',
    'abbreviation',
    'status',
    'description',
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

type DenseTableProps = {
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

export const DenseTable = ({
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
}: DenseTableProps) => {
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

  const getDetailPanel = ({ rowData }: { rowData: Project }) => (
    <div>{t('table.detailPanel' as any, { name: rowData.name })}</div>
  );

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

export const ProjectList = () => {
  const clientService = useClientService();

  const [refresh, setRefresh] = useState(0);

  const [orderBy, setOrderBy] = useState<number>(0);
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('asc');
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const forceRefresh = useCallback(() => {
    setRefresh(refresh + 1);
  }, [refresh]);

  const { value, loading, error } =
    useAsync(async (): Promise<ProjectsGet200Response> => {
      const response = await clientService.projectsGet({
        query: {
          order: orderDirection || 'asc',
          sort: mapOrderByToSort(orderBy),
          page,
          pageSize,
        },
      });
      return await response.json();
    }, [refresh, clientService, orderBy, orderDirection, page, pageSize]);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (!value?.items || value.items.length === 0) {
    return <EmptyProjectList />;
  }

  return (
    <DenseTable
      projects={value.items}
      totalCount={value?.totalCount || 0}
      forceRefresh={forceRefresh}
      orderBy={orderBy}
      orderDirection={orderDirection}
      setOrderBy={setOrderBy}
      setOrderDirection={setOrderDirection}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onRowsPerPageChange={setPageSize}
    />
  );
};
