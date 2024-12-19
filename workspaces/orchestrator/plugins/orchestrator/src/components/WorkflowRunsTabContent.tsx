/*
 * Copyright 2024 The Backstage Authors
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
import React, { useState } from 'react';

import {
  ErrorPanel,
  InfoCard,
  Link,
  SelectItem,
  TableColumn,
} from '@backstage/core-components';
import {
  useApi,
  useRouteRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';

import { Grid, TablePagination } from '@material-ui/core';

import {
  capitalize,
  FieldFilter,
  Filter,
  PaginationInfoDTO,
  PaginationInfoDTOOrderDirectionEnum,
  ProcessInstanceStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../api';
import { DEFAULT_TABLE_PAGE_SIZE, VALUE_UNAVAILABLE } from '../constants';
import usePolling from '../hooks/usePolling';
import { workflowInstanceRouteRef, workflowRouteRef } from '../routes';
import { Selector } from './Selector';
import OverrideBackstageTable from './ui/OverrideBackstageTable';
import { mapProcessInstanceToDetails } from './WorkflowInstancePageContent';
import { WorkflowInstanceStatusIndicator } from './WorkflowInstanceStatusIndicator';
import { WorkflowRunDetail } from './WorkflowRunDetail';

const makeSelectItemsFromProcessInstanceValues = () =>
  [
    ProcessInstanceStatusDTO.Active,
    ProcessInstanceStatusDTO.Error,
    ProcessInstanceStatusDTO.Completed,
    ProcessInstanceStatusDTO.Aborted,
    ProcessInstanceStatusDTO.Suspended,
  ].map(
    (status): SelectItem => ({
      label: capitalize(status),
      value: status,
    }),
  );

const statuses = makeSelectItemsFromProcessInstanceValues();

export const WorkflowRunsTabContent = () => {
  const { workflowId } = useRouteRefParams(workflowRouteRef);
  const orchestratorApi = useApi(orchestratorApiRef);
  const workflowInstanceLink = useRouteRef(workflowInstanceRouteRef);
  const [statusSelectorValue, setStatusSelectorValue] = useState<string>(
    Selector.AllItems,
  );

  const columns = React.useMemo(
    (): TableColumn<WorkflowRunDetail>[] => [
      {
        title: 'ID',
        field: 'id',
        render: data => (
          <Link to={workflowInstanceLink({ instanceId: data.id })}>
            {data.id}
          </Link>
        ),
        sorting: false,
      },
      ...(workflowId
        ? []
        : [
            {
              title: 'Workflow name',
              field: 'name',
            },
          ]),
      {
        title: 'Status',
        field: 'state',
        render: (data: WorkflowRunDetail) => (
          <WorkflowInstanceStatusIndicator
            status={data.state as ProcessInstanceStatusDTO}
          />
        ),
      },
      ...(workflowId
        ? []
        : [
            {
              title: 'Category',
              field: 'category',
              render: (data: WorkflowRunDetail) =>
                capitalize(data.category ?? VALUE_UNAVAILABLE),
            },
          ]),
      { title: 'Started', field: 'start', defaultSort: 'desc' },
      { title: 'Duration', field: 'duration' },
    ],
    [workflowInstanceLink, workflowId],
  );

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [orderBy, setOrderBy] = useState<number>(
    columns.findIndex(value => value.field === 'start'),
  );
  const [orderDirection, setOrderDirection] = useState('desc');

  const getFilter = React.useCallback((): Filter | undefined => {
    const statusFilter: FieldFilter | undefined =
      statusSelectorValue !== Selector.AllItems
        ? {
            operator: 'EQ',
            value: statusSelectorValue,
            field: 'state',
          }
        : undefined;
    const workflowIdFilter: FieldFilter | undefined = workflowId
      ? {
          operator: 'EQ',
          value: workflowId,
          field: 'processId',
        }
      : undefined;
    if (statusFilter && workflowIdFilter) {
      return {
        operator: 'AND',
        filters: [statusFilter, workflowIdFilter],
      };
    } else if (statusFilter) {
      return statusFilter;
    } else if (workflowIdFilter) {
      return workflowIdFilter;
    }
    return undefined;
  }, [statusSelectorValue, workflowId]);

  const fetchInstances = React.useCallback(async () => {
    const paginationInfo: PaginationInfoDTO = {
      pageSize: pageSize + 1, // add one more to know if this is the last page or there are more instances. If there are no more instances, next button is disabled.
      offset: page * pageSize,
      orderBy: columns[orderBy].field,
      orderDirection:
        orderDirection === 'asc'
          ? PaginationInfoDTOOrderDirectionEnum.Asc
          : PaginationInfoDTOOrderDirectionEnum.Desc,
    };
    const filter = getFilter();
    const instances = await orchestratorApi.listInstances(
      paginationInfo,
      filter,
    );
    const clonedData: WorkflowRunDetail[] =
      instances.data.items?.map(mapProcessInstanceToDetails) || [];
    return clonedData;
  }, [
    orchestratorApi,
    page,
    pageSize,
    orderBy,
    orderDirection,
    getFilter,
    columns,
  ]);

  const { loading, error, value } = usePolling(fetchInstances);

  const selectors = React.useMemo(
    () => (
      <Grid container alignItems="center">
        <Grid item>
          <Selector
            label="Status"
            items={statuses}
            onChange={value_ => {
              setStatusSelectorValue(value_);
              setPage(0);
            }}
            selected={statusSelectorValue}
          />
        </Grid>
      </Grid>
    ),
    [statusSelectorValue],
  );

  let data = value || [];
  let hasNextPage = false;
  if (data.length === pageSize + 1) {
    hasNextPage = true;
    data = data.slice(0, -1);
  }
  const enablePaging = page > 0 || hasNextPage;

  return error ? (
    <ErrorPanel error={error} />
  ) : (
    <InfoCard noPadding title={selectors}>
      <OverrideBackstageTable
        removeOutline
        isLoading={loading}
        columns={columns}
        data={data}
        options={{
          paging: false,
        }}
        onOrderChange={(orderBy_: number, orderDirection_: 'asc' | 'desc') => {
          setOrderBy(orderBy_);
          setOrderDirection(orderDirection_);
        }}
        components={{
          Toolbar: () => <></>, // this removes the search filter, which isn't applicable for most fields
        }}
      />
      {enablePaging && (
        <TablePagination
          component="div"
          count={-1}
          page={page}
          onPageChange={(_, page_) => setPage(page_)}
          onRowsPerPageChange={e => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPage={pageSize}
          labelDisplayedRows={({ from }) => {
            return `${from}-${from + data.length - 1}`;
          }}
          rowsPerPageOptions={[5, 10, 20]}
          nextIconButtonProps={{ disabled: !hasNextPage }}
        />
      )}
    </InfoCard>
  );
};
