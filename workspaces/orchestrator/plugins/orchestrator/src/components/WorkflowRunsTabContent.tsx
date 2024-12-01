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
import { useApi, useRouteRef } from '@backstage/core-plugin-api';

import { Grid } from '@material-ui/core';

import {
  capitalize,
  ellipsis,
  PaginationInfoDTO,
  PaginationInfoDTOOrderDirectionEnum,
  ProcessInstanceState,
  ProcessInstanceStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../api';
import { DEFAULT_TABLE_PAGE_SIZE, VALUE_UNAVAILABLE } from '../constants';
import usePolling from '../hooks/usePolling';
import { workflowInstanceRouteRef } from '../routes';
import { Selector } from './Selector';
import OverrideBackstageTable from './ui/OverrideBackstageTable';
import { mapProcessInstanceToDetails } from './WorkflowInstancePageContent';
import { WorkflowInstanceStatusIndicator } from './WorkflowInstanceStatusIndicator';
import { WorkflowRunDetail } from './WorkflowRunDetail';
import { Pagination } from '@material-ui/lab';


const makeSelectItemsFromProcessInstanceValues = () =>
  [
    ProcessInstanceState.Active,
    ProcessInstanceState.Error,
    ProcessInstanceState.Completed,
    ProcessInstanceState.Aborted,
    ProcessInstanceState.Suspended,
  ].map(
    (status): SelectItem => ({
      label: capitalize(status),
      value: status,
    }),
  );

export const WorkflowRunsTabContent = () => {
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
            {ellipsis(data.id)}
          </Link>
        ),
        sorting: false
      },
      {
        title: 'Name',
        field: 'processName',
      },
      {
        title: 'Status',
        field: 'status',
        render: data => (
          <WorkflowInstanceStatusIndicator
            status={data.status as ProcessInstanceStatusDTO}
          />
        ),
      },
      {
        title: 'Category',
        field: 'category',
        render: data => capitalize(data.category ?? VALUE_UNAVAILABLE),
        sorting: false,
      },
      { title: 'Started', field: 'start'},
      { title: 'Duration', field: 'duration', sorting: false },
    ],
    [workflowInstanceLink],
  );
  const [searchText, setSearchText] = React.useState<string>("");
  const [page, setPage] = useState(0); 
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE); 
  const [orderBy, setOrderBy] = useState<number>(columns.findIndex((value) => value.field === "start")); 
  const [orderDirection, setOrderDirection] = useState('desc'); 

  const fetchInstances = React.useCallback(async () => {
    const paginationInfo: PaginationInfoDTO = {
      pageSize, 
      offset: page*pageSize,
      orderBy: columns[orderBy].field, 
      orderDirection: orderDirection === 'asc' ? PaginationInfoDTOOrderDirectionEnum.Asc : PaginationInfoDTOOrderDirectionEnum.Desc
    };
    const instances = await orchestratorApi.listInstances(paginationInfo);
    const clonedData: WorkflowRunDetail[] =
      instances.data.items?.map(mapProcessInstanceToDetails) || [];
    return clonedData;
  }, [orchestratorApi, page, pageSize, orderBy, orderDirection]);

  const { loading, error, value } = usePolling(fetchInstances);

  

  const statuses = React.useMemo(makeSelectItemsFromProcessInstanceValues, []);

  const filteredData = React.useMemo(
    () =>
      (value ?? []).filter(
        (row: WorkflowRunDetail) =>
          statusSelectorValue === Selector.AllItems ||
          row.status?.toLocaleLowerCase('en-US') === statusSelectorValue,
      ),
    [statusSelectorValue, value],
  );

  const selectors = React.useMemo(
    () => (
      <Grid container alignItems="center">
        <Grid item>
          <Selector
            label="Status"
            items={statuses}
            onChange={setStatusSelectorValue}
            selected={statusSelectorValue}
          />
        </Grid>
      </Grid>
    ),
    [statusSelectorValue, statuses],
  );
  const CustomPagination = () => {    

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '10px' 
      }}>
        <button 
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          style={{ margin: '0 10px' }}
        >
          Previous
        </button>
        <span>{`Page ${page}`}</span>
        <button 
          onClick={() => setPage(page + 1)}
          style={{ margin: '0 10px' }}
        >
          Next
        </button>
      </div>
    );
  };
  console.log("data", filteredData.length, "pageSize", pageSize);
  return error ? (
    <ErrorPanel error={error} />
  ) : (
    <InfoCard noPadding title={selectors}>
      <OverrideBackstageTable
        title="Workflow Runs"        
        isLoading={loading}
        columns={columns}
        data={filteredData}
        options={{
          pageSize: pageSize,
        }}
        onSearchChange={(searchText: string) => {
          setSearchText(searchText);
        }}
        onOrderChange={(orderBy: number, orderDirection: "asc" | "desc") => {
          setOrderBy(orderBy); 
          setOrderDirection(orderDirection);
        }}        
        components={{
          Pagination: CustomPagination
        }}
      />
    </InfoCard>
  );
};
