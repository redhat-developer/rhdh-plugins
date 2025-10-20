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

import Grid from '@mui/material/Grid';
import TablePagination from '@mui/material/TablePagination';

import {
  FieldFilter,
  Filter,
  NestedFilter,
  PaginationInfoDTO,
  PaginationInfoDTOOrderDirectionEnum,
  ProcessInstanceStatusDTO,
} from '@redhat/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { DEFAULT_TABLE_PAGE_SIZE } from '../../constants';
import usePolling from '../../hooks/usePolling';
import { useTranslation } from '../../hooks/useTranslation';
import {
  entityInstanceRouteRef,
  entityWorkflowRouteRef,
  workflowInstanceRouteRef,
  workflowRouteRef,
} from '../../routes';
import { Trans } from '../Trans';
import { WorkflowRunDetail } from '../types/WorkflowRunDetail';
import OverrideBackstageTable from '../ui/OverrideBackstageTable';
import { Selector } from '../ui/Selector';
import { WorkflowInstanceStatusIndicator } from '../ui/WorkflowInstanceStatusIndicator';
import { mapProcessInstanceToDetails } from '../WorkflowInstancePage/WorkflowInstancePageContent';

const makeSelectItemsFromProcessInstanceValues = (t: any): SelectItem[] => [
  { label: t('table.status.running'), value: ProcessInstanceStatusDTO.Active },
  { label: t('table.status.failed'), value: ProcessInstanceStatusDTO.Error },
  {
    label: t('table.status.completed'),
    value: ProcessInstanceStatusDTO.Completed,
  },
  { label: t('table.status.aborted'), value: ProcessInstanceStatusDTO.Aborted },
  {
    label: t('table.status.pending'),
    value: ProcessInstanceStatusDTO.Suspended,
  },
];

export const WorkflowRunsTabContent = () => {
  const { t } = useTranslation();

  const statuses = makeSelectItemsFromProcessInstanceValues(t);
  const started = [
    t('table.filters.startedOptions.today'),
    t('table.filters.startedOptions.yesterday'),
    t('table.filters.startedOptions.last7days'),
    t('table.filters.startedOptions.thisMonth'),
  ].map(
    (time): SelectItem => ({
      label: time,
      value: time,
    }),
  );
  const entityInstanceLink = useRouteRef(entityInstanceRouteRef);
  const { workflowId, kind, name, namespace } = useRouteRefParams(
    entityWorkflowRouteRef,
  );
  let entityRef: string | undefined = undefined;
  if (kind && namespace && name) {
    entityRef = `${kind}:${namespace}/${name}`;
  }
  const orchestratorApi = useApi(orchestratorApiRef);
  const workflowInstanceLink = useRouteRef(workflowInstanceRouteRef);
  const workflowPageLink = useRouteRef(workflowRouteRef);

  // selectors
  const [statusSelectorValue, setStatusSelectorValue] = useState<string>(
    Selector.AllItems,
  );
  const [startedSelectorValue, setStartedSelectorValue] = useState<string>(
    Selector.AllItems,
  );

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [orderByField, setOrderByField] = useState<string>('start');
  const [orderDirection, setOrderDirection] = useState('desc');

  const getFilter = useCallback((): Filter | undefined => {
    // runs for specific WF
    const workflowIdFilter: FieldFilter | undefined = workflowId
      ? {
          operator: 'EQ',
          value: workflowId,
          field: 'processId',
        }
      : undefined;

    const statusFilter: FieldFilter | undefined =
      statusSelectorValue !== Selector.AllItems
        ? {
            operator: 'EQ',
            value: statusSelectorValue,
            field: 'state',
          }
        : undefined;

    let startedFilter: FieldFilter | undefined = undefined;

    if (startedSelectorValue !== Selector.AllItems) {
      let dateRange: [string, string] | undefined = undefined;

      const currentDate = new Date();
      const endOfToday = new Date(currentDate);
      endOfToday.setHours(23, 59, 59, 999);

      switch (startedSelectorValue) {
        case 'Today': {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          dateRange = [startOfToday.toISOString(), endOfToday.toISOString()];
          break;
        }
        case 'Yesterday': {
          const startOfYesterday = new Date();
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          startOfYesterday.setHours(0, 0, 0, 0);

          const endOfYesterday = new Date(startOfYesterday);
          endOfYesterday.setHours(23, 59, 59, 999);

          dateRange = [
            startOfYesterday.toISOString(),
            endOfYesterday.toISOString(),
          ];
          break;
        }
        case 'Last 7 days': {
          const startOfLast7Days = new Date();
          startOfLast7Days.setDate(startOfLast7Days.getDate() - 7);
          startOfLast7Days.setHours(0, 0, 0, 0);

          dateRange = [
            startOfLast7Days.toISOString(),
            endOfToday.toISOString(),
          ];
          break;
        }
        case 'This month': {
          const startOfCurrentMonth = new Date();
          startOfCurrentMonth.setDate(1);
          startOfCurrentMonth.setHours(0, 0, 0, 0);

          dateRange = [
            startOfCurrentMonth.toISOString(),
            endOfToday.toISOString(),
          ];
          break;
        }
        default:
          dateRange = undefined;
      }

      startedFilter =
        startedSelectorValue !== Selector.AllItems
          ? {
              operator: 'BETWEEN',
              value: dateRange,
              field: 'start',
            }
          : undefined;
    }

    const nestedVariablesFilter: NestedFilter | undefined = entityRef
      ? {
          field: 'variables',
          nested: {
            operator: 'EQ',
            value: entityRef,
            field: 'targetEntity',
          },
        }
      : undefined;

    const filters = [
      statusFilter,
      workflowIdFilter,
      startedFilter,
      nestedVariablesFilter,
    ].filter(Boolean) as FieldFilter[]; // removes undefined filters

    if (filters.length > 1) {
      return {
        operator: 'AND',
        filters,
      };
    }
    return filters[0] || undefined;
  }, [workflowId, statusSelectorValue, startedSelectorValue, entityRef]);

  const fetchInstances = useCallback(async () => {
    const paginationInfo: PaginationInfoDTO = {
      pageSize: pageSize + 1, // add one more to know if this is the last page or there are more instances. If there are no more instances, next button is disabled.
      offset: page * pageSize,
      orderBy: orderByField,
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
    orderByField,
    orderDirection,
    getFilter,
  ]);

  const { loading, error, value } = usePolling(fetchInstances);

  const applyBackendSort = useCallback(
    (item1: WorkflowRunDetail, item2: WorkflowRunDetail): number => {
      // Workaround for material-table applying sorting on top of backend sorting. The version we are using is too old to request a fix.
      // Should be resolved when upgrading backstage and all plugins to material6
      // The workaround is to configure the FE sorting material-table applies to be according to order received from backend
      // TODO: resolve when upgrading to material 6
      if (!value) {
        return 0;
      }
      const item1Index = value?.findIndex(curItem => curItem.id === item1.id);
      const item2Index = value?.findIndex(curItem => curItem.id === item2.id);
      return orderDirection === 'asc'
        ? item1Index - item2Index
        : item2Index - item1Index;
    },
    [value, orderDirection],
  );

  const columns = useMemo(
    (): TableColumn<WorkflowRunDetail>[] => [
      {
        title: 'ID',
        field: 'id',
        render: data =>
          entityRef ? (
            <Link
              to={entityInstanceLink({
                namespace,
                kind,
                name,
                workflowId,
                instanceId: data.id,
              })}
            >
              {data.id}
            </Link>
          ) : (
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
              title: t('table.headers.workflowName'),
              field: 'processName',
              customSort: applyBackendSort,
              render: (data: WorkflowRunDetail) => (
                <Link to={workflowPageLink({ workflowId: data.workflowId })}>
                  {data.processName}
                </Link>
              ),
            },
          ]),
      {
        title: t('table.headers.runStatus'),
        field: 'state',
        render: (data: WorkflowRunDetail) => (
          <WorkflowInstanceStatusIndicator
            status={data.state as ProcessInstanceStatusDTO}
          />
        ),
      },
      {
        title: t('table.headers.started'),
        field: 'start',
        customSort: applyBackendSort,
      },
      { title: t('table.headers.duration'), field: 'duration', sorting: false },
    ],
    [
      t,
      workflowInstanceLink,
      workflowId,
      workflowPageLink,
      applyBackendSort,
      entityInstanceLink,
      name,
      kind,
      namespace,
      entityRef,
    ],
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
    <Grid container item xs={12} spacing={2}>
      <Grid item>
        <Selector
          label={t('table.filters.status')}
          items={statuses}
          onChange={value_ => {
            setStatusSelectorValue(value_);
            setPage(0);
          }}
          selected={statusSelectorValue}
        />
        <Selector
          label={t('table.filters.started')}
          items={started}
          onChange={value_ => {
            setStartedSelectorValue(value_);
            setPage(0);
          }}
          selected={startedSelectorValue}
        />
      </Grid>
      <Grid item xs style={{ flexGrow: 1 }}>
        <InfoCard
          noPadding
          title={
            workflowId ? (
              <Trans
                message="table.title.allWorkflowRuns"
                params={{ count: data.length }}
              />
            ) : (
              <Trans
                message="table.title.allRuns"
                params={{ count: data.length }}
              />
            )
          }
        >
          <OverrideBackstageTable
            removeOutline
            isLoading={loading}
            columns={columns}
            data={data}
            options={{
              paging: false,
            }}
            onOrderChange={(
              orderBy_: number,
              orderDirection_: 'asc' | 'desc',
            ) => {
              const field = columns[orderBy_].field;
              if (!field) {
                throw new Error(`Failed to find column number ${orderBy_}`);
              }
              setOrderByField(field);
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
      </Grid>
    </Grid>
  );
};
