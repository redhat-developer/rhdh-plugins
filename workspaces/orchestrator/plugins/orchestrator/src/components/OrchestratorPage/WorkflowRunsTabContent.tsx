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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  ErrorPanel,
  InfoCard,
  Link,
  SelectItem,
  TableColumn,
  TableProps,
} from '@backstage/core-components';
import {
  useApi,
  useRouteRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import {
  entityPresentationSnapshot,
  EntityRefLink,
} from '@backstage/plugin-catalog-react';
import { usePermission } from '@backstage/plugin-permission-react';

import DescriptionIcon from '@mui/icons-material/Description';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import TablePagination from '@mui/material/TablePagination';

import {
  FieldFilter,
  Filter,
  NestedFilter,
  orchestratorAdminViewPermission,
  orchestratorInstanceAdminViewPermission,
  PaginationInfoDTO,
  PaginationInfoDTOOrderDirectionEnum,
  ProcessInstanceStatusDTO,
  WorkflowDataDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import {
  DEFAULT_TABLE_PAGE_SIZE,
  RUN_WORKFLOW_SCAFFOLDER_URL,
  VALUE_UNAVAILABLE,
} from '../../constants';
import { useEntityFilterItems } from '../../hooks/useEntityFilterItems';
import { useLogsEnabled } from '../../hooks/useLogsEnabled';
import usePolling from '../../hooks/usePolling';
import { useRunByFilterItems } from '../../hooks/useRunByFilterItems';
import { useTranslation } from '../../hooks/useTranslation';
import {
  entityInstanceRouteRef,
  entityWorkflowRouteRef,
  executeWorkflowRouteRef,
  workflowInstanceRouteRef,
  workflowRouteRef,
  workflowRunsRouteRef,
} from '../../routes';
import {
  getInstanceVariables,
  hasInstanceVariables,
} from '../../utils/instanceVariables';
import { Trans } from '../Trans';
import { WorkflowRunDetail } from '../types/WorkflowRunDetail';
import { OrchestratorEmptyState } from '../ui/OrchestratorEmptyState';
import OverrideBackstageTable from '../ui/OverrideBackstageTable';
import { Selector } from '../ui/Selector';
import { TableTextFilter } from '../ui/TableTextFilter';
import { WorkflowInstanceStatusIndicator } from '../ui/WorkflowInstanceStatusIndicator';
import { VariablesDialog } from '../WorkflowInstancePage/VariablesDialog';
import { mapProcessInstanceToDetails } from '../WorkflowInstancePage/WorkflowInstancePageContent';
import { WorkflowLogsDialog } from '../WorkflowInstancePage/WorkflowLogsDialog';
import {
  buildStartedDateRange,
  combineFilters,
  filterWorkflowRunsBySearch,
  formatStartedRelative,
  hasNextPageFromFetch,
  trimOverflowPage,
} from './WorkflowRunsTabContent.helpers';

type WorkflowRunsFetchResult = {
  items: WorkflowRunDetail[];
  totalCount?: number;
};

const EntityRefTableCell = ({
  entityRef,
  defaultKind,
}: {
  entityRef?: string;
  defaultKind: 'component' | 'user';
}) => {
  if (!entityRef) {
    return <>{VALUE_UNAVAILABLE}</>;
  }

  return <EntityRefLink entityRef={entityRef} defaultKind={defaultKind} />;
};

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

const ENTITY_FILTER_KINDS = ['Component', 'System'];

export const WorkflowRunsTabContent = ({
  showRunsEmptyState = true,
}: {
  showRunsEmptyState?: boolean;
} = {}) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventTriggered = searchParams.get('eventTriggered') === 'true';
  const [showEventAlert, setShowEventAlert] = useState(eventTriggered);

  useEffect(() => {
    setShowEventAlert(eventTriggered);
  }, [eventTriggered]);

  const handleCloseEventAlert = () => {
    setShowEventAlert(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('eventTriggered');
    setSearchParams(nextParams, { replace: true });
  };

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
  const {
    workflowId: entityWorkflowId,
    kind,
    name,
    namespace,
  } = useRouteRefParams(entityWorkflowRouteRef);
  const { workflowId: scopedWorkflowId } =
    useRouteRefParams(workflowRunsRouteRef);
  const workflowId = entityWorkflowId ?? scopedWorkflowId;
  const executeWorkflowLink = useRouteRef(executeWorkflowRouteRef);
  let entityRef: string | undefined = undefined;
  if (kind && namespace && name) {
    entityRef = `${kind}:${namespace}/${name}`;
  }
  const orchestratorApi = useApi(orchestratorApiRef);
  const workflowInstanceLink = useRouteRef(workflowInstanceRouteRef);
  const workflowPageLink = useRouteRef(workflowRouteRef);
  const adminView = usePermission({
    permission: orchestratorAdminViewPermission,
  });
  const instanceAdminView = usePermission({
    permission: orchestratorInstanceAdminViewPermission,
  });
  const canViewRunVariables = adminView.allowed || instanceAdminView.allowed;
  const showEntityFilter = !entityRef;
  const showRunByFilter =
    !instanceAdminView.loading && instanceAdminView.allowed;
  const logsEnabled = useLogsEnabled();

  const { items: entityFilterItems } = useEntityFilterItems({
    kinds: ENTITY_FILTER_KINDS,
    defaultKind: 'component',
    enabled: showEntityFilter,
  });

  const [isVariablesDialogOpen, setIsVariablesDialogOpen] = useState(false);
  const [instanceVariables, setInstanceVariables] = useState<WorkflowDataDTO>(
    {},
  );
  const [variablesLoading, setVariablesLoading] = useState(false);
  const [variablesError, setVariablesError] = useState<Error | undefined>();

  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [logsInstanceId, setLogsInstanceId] = useState('');
  const [logsProcessName, setLogsProcessName] = useState('');

  const handleCloseLogsDialog = useCallback(() => {
    setIsLogsDialogOpen(false);
    setLogsInstanceId('');
    setLogsProcessName('');
  }, []);

  const handleViewLogs = useCallback(
    (instanceId: string, processName: string) => {
      setLogsInstanceId(instanceId);
      setLogsProcessName(processName);
      setIsLogsDialogOpen(true);
    },
    [],
  );

  const handleCloseVariablesDialog = useCallback(() => {
    setIsVariablesDialogOpen(false);
    setInstanceVariables({});
    setVariablesError(undefined);
    setVariablesLoading(false);
  }, []);

  const handleViewRunVariables = useCallback(
    async (instanceId: string) => {
      setVariablesLoading(true);
      setVariablesError(undefined);
      setInstanceVariables({});

      try {
        const response = await orchestratorApi.getInstance(instanceId);
        const variables = getInstanceVariables(response.data.workflowdata);
        if (!hasInstanceVariables(response.data.workflowdata)) {
          return;
        }
        setInstanceVariables(variables);
        setIsVariablesDialogOpen(true);
      } catch (err) {
        setVariablesError(err as Error);
        setIsVariablesDialogOpen(true);
      } finally {
        setVariablesLoading(false);
      }
    },
    [orchestratorApi],
  );

  // selectors
  const [statusSelectorValue, setStatusSelectorValue] = useState<string>(
    Selector.AllItems,
  );
  const [startedSelectorValue, setStartedSelectorValue] = useState<string>(
    Selector.AllItems,
  );
  const [entitySelectorValue, setEntitySelectorValue] = useState<string>(
    Selector.AllItems,
  );
  const [runBySelectorValue, setRunBySelectorValue] = useState<string>(
    Selector.AllItems,
  );
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [orderByField, setOrderByField] = useState<string>('start');
  const [orderDirection, setOrderDirection] = useState('desc');

  const getFilter = useCallback(
    (options?: { includeRunByFilter?: boolean }): Filter | undefined => {
      const includeRunByFilter = options?.includeRunByFilter ?? true;
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
        const dateRange = buildStartedDateRange(startedSelectorValue);
        startedFilter = {
          operator: 'BETWEEN',
          value: dateRange,
          field: 'start',
        };
      }

      let targetEntityFilter: NestedFilter | undefined;
      if (entityRef) {
        targetEntityFilter = {
          field: 'variables',
          nested: {
            operator: 'EQ',
            value: entityRef.toLowerCase(),
            field: 'targetEntity',
          },
        };
      } else if (
        showEntityFilter &&
        entitySelectorValue !== Selector.AllItems
      ) {
        targetEntityFilter = {
          field: 'variables',
          nested: {
            operator: 'EQ',
            value: entitySelectorValue,
            field: 'targetEntity',
          },
        };
      }

      const initiatorEntityFilter: NestedFilter | undefined =
        includeRunByFilter &&
        showRunByFilter &&
        runBySelectorValue !== Selector.AllItems
          ? {
              field: 'variables',
              nested: {
                operator: 'EQ',
                value: runBySelectorValue,
                field: 'initiatorEntity',
              },
            }
          : undefined;

      return combineFilters([
        statusFilter,
        workflowIdFilter,
        startedFilter,
        targetEntityFilter,
        initiatorEntityFilter,
      ]);
    },
    [
      workflowId,
      statusSelectorValue,
      startedSelectorValue,
      entityRef,
      showEntityFilter,
      entitySelectorValue,
      showRunByFilter,
      runBySelectorValue,
    ],
  );

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

    const items: WorkflowRunDetail[] =
      instances.data.items?.map(instance =>
        mapProcessInstanceToDetails(instance, t),
      ) || [];
    return {
      items,
      totalCount: instances.data.totalCount,
    };
  }, [
    orchestratorApi,
    page,
    pageSize,
    orderByField,
    orderDirection,
    getFilter,
    t,
  ]);

  const pollingCacheKey = useMemo(
    () =>
      [
        workflowId,
        statusSelectorValue,
        startedSelectorValue,
        entitySelectorValue,
        runBySelectorValue,
        page,
        pageSize,
        orderByField,
        orderDirection,
      ].join(':'),
    [
      workflowId,
      statusSelectorValue,
      startedSelectorValue,
      entitySelectorValue,
      runBySelectorValue,
      page,
      pageSize,
      orderByField,
      orderDirection,
    ],
  );

  const { loading, error, value } = usePolling<WorkflowRunsFetchResult>(
    fetchInstances,
    {
      cacheKey: pollingCacheKey,
    },
  );

  const runItems = value?.items;

  const filterForRunByOptions = useMemo(
    () => getFilter({ includeRunByFilter: false }),
    [getFilter],
  );

  const additionalInitiators = useMemo(
    () =>
      (runItems ?? [])
        .map(run => run.initiatorEntity)
        .filter((initiator): initiator is string => Boolean(initiator)),
    [runItems],
  );

  const { items: runByFilterItems } = useRunByFilterItems({
    enabled: showRunByFilter,
    filters: filterForRunByOptions,
    additionalInitiators,
  });

  const runByFilterItemsWithSelection = useMemo(() => {
    if (runBySelectorValue === Selector.AllItems) {
      return runByFilterItems;
    }

    if (runByFilterItems.some(item => item.value === runBySelectorValue)) {
      return runByFilterItems;
    }

    return [
      ...runByFilterItems,
      {
        label:
          entityPresentationSnapshot(runBySelectorValue, {
            defaultKind: 'user',
          }).primaryTitle ?? runBySelectorValue,
        value: runBySelectorValue,
      },
    ];
  }, [runByFilterItems, runBySelectorValue]);

  const applyBackendSort = useCallback(
    (item1: WorkflowRunDetail, item2: WorkflowRunDetail): number => {
      // Workaround for material-table applying sorting on top of backend sorting. The version we are using is too old to request a fix.
      // Should be resolved when upgrading backstage and all plugins to material6
      // The workaround is to configure the FE sorting material-table applies to be according to order received from backend
      // TODO: resolve when upgrading to material 6
      if (!runItems) {
        return 0;
      }
      const item1Index = runItems.findIndex(curItem => curItem.id === item1.id);
      const item2Index = runItems.findIndex(curItem => curItem.id === item2.id);
      return orderDirection === 'asc'
        ? item1Index - item2Index
        : item2Index - item1Index;
    },
    [runItems, orderDirection],
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
        title: t('table.headers.version'),
        field: 'version',
        sorting: false,
        render: (data: WorkflowRunDetail) => data.version ?? VALUE_UNAVAILABLE,
      },
      {
        title: t('table.headers.entity'),
        field: 'targetEntity',
        sorting: false,
        render: (data: WorkflowRunDetail) => (
          <EntityRefTableCell
            entityRef={data.targetEntity}
            defaultKind="component"
          />
        ),
      },
      {
        title: t('table.headers.status'),
        field: 'state',
        render: (data: WorkflowRunDetail) => (
          <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
            <WorkflowInstanceStatusIndicator
              status={data.state as ProcessInstanceStatusDTO}
            />
            {logsEnabled && data.state === ProcessInstanceStatusDTO.Error ? (
              <MuiLink
                component="button"
                variant="body2"
                onClick={() => handleViewLogs(data.id, data.processName)}
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'none' },
                }}
              >
                {t('run.logs.viewLogs')}
              </MuiLink>
            ) : null}
          </Box>
        ),
      },
      {
        title: t('table.headers.started'),
        field: 'start',
        customSort: applyBackendSort,
        render: (data: WorkflowRunDetail) =>
          formatStartedRelative(data.startIso),
      },
      {
        title: t('table.headers.runBy'),
        field: 'initiatorEntity',
        sorting: false,
        render: (data: WorkflowRunDetail) => (
          <EntityRefTableCell
            entityRef={data.initiatorEntity}
            defaultKind="user"
          />
        ),
      },
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
      logsEnabled,
      handleViewLogs,
    ],
  );

  const actions = useMemo((): TableProps<WorkflowRunDetail>['actions'] => {
    if (!canViewRunVariables) {
      return undefined;
    }

    return [
      rowData => ({
        icon: () => <DescriptionIcon />,
        tooltip: rowData.hasVariables
          ? t('table.actions.viewRunVariables')
          : t('messages.noVariablesFound'),
        disabled: !rowData.hasVariables,
        onClick: () => handleViewRunVariables(rowData.id),
      }),
    ];
  }, [canViewRunVariables, handleViewRunVariables, t]);

  const data = useMemo(
    () => trimOverflowPage(runItems ?? [], pageSize),
    [runItems, pageSize],
  );
  const hasNextPage = hasNextPageFromFetch(runItems?.length ?? 0, pageSize);
  const filteredData = useMemo(
    () => filterWorkflowRunsBySearch(data, search),
    [data, search],
  );
  const displayedRunCount = useMemo(() => {
    if (search.trim()) {
      return filteredData.length;
    }
    return value?.totalCount ?? data.length;
  }, [search, filteredData.length, value?.totalCount, data.length]);
  const enablePaging = page > 0 || hasNextPage;
  const isDefaultFilters =
    statusSelectorValue === Selector.AllItems &&
    startedSelectorValue === Selector.AllItems &&
    entitySelectorValue === Selector.AllItems &&
    runBySelectorValue === Selector.AllItems &&
    !search.trim();
  const showEmptyState =
    showRunsEmptyState &&
    !loading &&
    !error &&
    filteredData.length === 0 &&
    page === 0 &&
    isDefaultFilters;

  const runWorkflowUrl = useMemo(() => {
    if (!workflowId) {
      return RUN_WORKFLOW_SCAFFOLDER_URL;
    }
    const baseUrl = executeWorkflowLink({ workflowId });
    if (!entityRef) {
      return baseUrl;
    }
    const params = new URLSearchParams({ targetEntity: entityRef });
    return `${baseUrl}?${params.toString()}`;
  }, [workflowId, executeWorkflowLink, entityRef]);

  const runListDialogs = (
    <>
      <VariablesDialog
        open={isVariablesDialogOpen}
        onClose={handleCloseVariablesDialog}
        instanceVariables={instanceVariables}
        loading={variablesLoading}
        error={variablesError}
      />
      <WorkflowLogsDialog
        open={isLogsDialogOpen}
        onClose={handleCloseLogsDialog}
        instanceId={logsInstanceId}
        processName={logsProcessName}
      />
    </>
  );

  if (showEmptyState) {
    return (
      <>
        {runListDialogs}
        {showEventAlert && (
          <Alert
            severity="info"
            onClose={handleCloseEventAlert}
            sx={{ width: '100%', boxSizing: 'border-box', mb: 2 }}
          >
            {t('run.messages.eventTriggered')}
          </Alert>
        )}
        <OrchestratorEmptyState
          variant="runs"
          runWorkflowUrl={runWorkflowUrl}
        />
      </>
    );
  }

  return error ? (
    <ErrorPanel error={error} />
  ) : (
    <>
      {runListDialogs}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {showEventAlert && (
          <Alert
            severity="info"
            onClose={handleCloseEventAlert}
            sx={{ width: '100%', boxSizing: 'border-box' }}
          >
            {t('run.messages.eventTriggered')}
          </Alert>
        )}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'flex-start',
            gap: 2,
            width: '100%',
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
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
            {showEntityFilter ? (
              <Selector
                label={t('table.filters.entity')}
                items={entityFilterItems}
                onChange={value_ => {
                  setEntitySelectorValue(value_);
                  setPage(0);
                }}
                selected={entitySelectorValue}
              />
            ) : null}
            {showRunByFilter ? (
              <Selector
                label={t('table.filters.runBy')}
                items={runByFilterItemsWithSelection}
                onChange={value_ => {
                  setRunBySelectorValue(value_);
                  setPage(0);
                }}
                selected={runBySelectorValue}
              />
            ) : null}
          </Box>
          <Box
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <InfoCard
              noPadding
              title={
                workflowId ? (
                  <Trans
                    message="table.title.allWorkflowRuns"
                    params={{ count: displayedRunCount }}
                  />
                ) : (
                  <Trans
                    message="table.title.allRuns"
                    params={{ count: displayedRunCount }}
                  />
                )
              }
              action={<TableTextFilter value={search} onChange={setSearch} />}
              headerProps={{ style: { alignItems: 'center' } }}
            >
              <OverrideBackstageTable
                removeOutline
                isLoading={loading}
                columns={columns}
                data={filteredData}
                actions={actions}
                options={{
                  paging: false,
                  actionsColumnIndex: columns.length,
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
                  count={value?.totalCount ?? -1}
                  page={page}
                  onPageChange={(_, page_) => setPage(page_)}
                  onRowsPerPageChange={e => {
                    setPageSize(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPage={pageSize}
                  labelDisplayedRows={({ from }) => {
                    return `${from}-${from + filteredData.length - 1}`;
                  }}
                  rowsPerPageOptions={[5, 10, 20]}
                  nextIconButtonProps={{ disabled: !hasNextPage }}
                />
              )}
            </InfoCard>
          </Box>
        </Box>
      </Box>
    </>
  );
};
