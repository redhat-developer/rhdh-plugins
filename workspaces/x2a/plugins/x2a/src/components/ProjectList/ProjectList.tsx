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
import { useCallback, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';

import { Progress, ResponseErrorPanel } from '@backstage/core-components';

import {
  DEFAULT_PAGE_SIZE,
  ProjectsGet200Response,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { EmptyProjectList } from './EmptyProjectList';

import { mapOrderByToSort, ProjectTable } from './ProjectTable';
import { OrderDirection } from './types';

/**
 * Responsible for loading the project list and delegating view logic to the ProjectTable component.
 *
 */
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
    <ProjectTable
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
