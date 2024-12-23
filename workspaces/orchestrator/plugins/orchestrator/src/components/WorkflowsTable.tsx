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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Link, TableColumn, TableProps } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import PlayArrow from '@material-ui/icons/PlayArrow';

import {
  capitalize,
  orchestratorWorkflowPermission,
  orchestratorWorkflowSpecificPermission,
  orchestratorWorkflowUsePermission,
  orchestratorWorkflowUseSpecificPermission,
  ProcessInstanceStatusDTO,
  WorkflowOverviewDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../constants';
import WorkflowOverviewFormatter, {
  FormattedWorkflowOverview,
} from '../dataFormatters/WorkflowOverviewFormatter';
import { usePermissionArray } from '../hooks/usePermissionArray';
import {
  executeWorkflowRouteRef,
  workflowRouteRef,
  workflowRunsRouteRef,
} from '../routes';
import OverrideBackstageTable from './ui/OverrideBackstageTable';
import { WorkflowInstanceStatusIndicator } from './WorkflowInstanceStatusIndicator';

export interface WorkflowsTableProps {
  items: WorkflowOverviewDTO[];
}

const usePermittedToUseBatch = (
  items: WorkflowOverviewDTO[],
): { allowed: boolean[] } => {
  const generic = usePermission({
    permission: orchestratorWorkflowUsePermission,
  });

  let workflowIds: string[] = [];
  if (!generic.loading && !generic.allowed) {
    // This will effectively skip the requests if the generic permission grants the access
    workflowIds = items.map(i => i.workflowId);
  }

  const specific = usePermissionArray(
    workflowIds.map(workflowId =>
      orchestratorWorkflowUseSpecificPermission(workflowId),
    ),
  );
  return {
    allowed: items.map((_, idx) => generic.allowed || specific.allowed[idx]),
  };
};

const usePermittedToViewBatch = (
  items: WorkflowOverviewDTO[],
): { allowed: boolean[] } => {
  const generic = usePermission({
    permission: orchestratorWorkflowPermission,
  });

  let workflowIds: string[] = [];
  if (!generic.loading && !generic.allowed) {
    // This will effectively skip the subsequent "specific" requests if the generic permission is granted
    workflowIds = items.map(i => i.workflowId);
  }

  const specific = usePermissionArray(
    workflowIds.map(workflowId =>
      orchestratorWorkflowSpecificPermission(workflowId),
    ),
  );

  return {
    allowed: items.map((_, idx) => generic.allowed || specific.allowed[idx]),
  };
};

export const WorkflowsTable = ({ items }: WorkflowsTableProps) => {
  const navigate = useNavigate();
  const definitionLink = useRouteRef(workflowRouteRef);
  const definitionRunsLink = useRouteRef(workflowRunsRouteRef);
  const executeWorkflowLink = useRouteRef(executeWorkflowRouteRef);
  const [data, setData] = useState<FormattedWorkflowOverview[]>([]);

  const { allowed: permittedToUse } = usePermittedToUseBatch(items);
  const { allowed: permittedToView } = usePermittedToViewBatch(items);

  const initialState = useMemo(
    () => items.map(WorkflowOverviewFormatter.format),
    [items],
  );

  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const handleView = useCallback(
    (rowData: FormattedWorkflowOverview) => {
      navigate(definitionRunsLink({ workflowId: rowData.id }));
    },
    [definitionRunsLink, navigate],
  );

  const handleExecute = useCallback(
    (rowData: FormattedWorkflowOverview) => {
      navigate(executeWorkflowLink({ workflowId: rowData.id }));
    },
    [executeWorkflowLink, navigate],
  );

  const canExecuteWorkflow = useCallback(
    (workflowId: string) => {
      const idx = items?.findIndex(i => workflowId === i.workflowId);
      if (idx < 0) {
        return false;
      }
      return permittedToUse[idx];
    },
    [items, permittedToUse],
  );

  const canViewWorkflow = useCallback(
    (workflowId: string) => {
      const idx = items?.findIndex(i => workflowId === i.workflowId);
      if (idx < 0) {
        return false;
      }
      return permittedToView[idx];
    },
    [items, permittedToView],
  );

  const canViewInstance = useCallback(
    (workflowId: string) => {
      const idx = items?.findIndex(i => workflowId === i.workflowId);
      if (idx < 0) {
        return false;
      }
      return permittedToView[idx];
    },
    [items, permittedToView],
  );

  const actions = useMemo(() => {
    const actionItems: TableProps<FormattedWorkflowOverview>['actions'] = [
      rowData => ({
        icon: PlayArrow,
        tooltip: 'Run',
        disabled: !canExecuteWorkflow(rowData.id),
        onClick: () => handleExecute(rowData),
      }),
      rowData => ({
        icon: FormatListBulleted,
        tooltip: 'View runs',
        disabled: !canViewWorkflow(rowData.id),
        onClick: () => handleView(rowData),
      }),
    ];

    return actionItems;
  }, [canExecuteWorkflow, canViewWorkflow, handleExecute, handleView]);

  const columns = useMemo<TableColumn<FormattedWorkflowOverview>[]>(
    () => [
      {
        title: 'Name',
        field: 'name',
        render: rowData =>
          canViewWorkflow(rowData.id) ? (
            <Link
              to={definitionLink({
                workflowId: rowData.id,
              })}
            >
              {rowData.name}
            </Link>
          ) : (
            rowData.name
          ),
      },
      {
        title: 'Category',
        field: 'category',
        render: rowData => capitalize(rowData.category),
      },
      { title: 'Last run', field: 'lastTriggered' },
      {
        title: 'Last run status',
        field: 'lastRunStatus',
        render: rowData =>
          rowData.lastRunStatus !== VALUE_UNAVAILABLE &&
          rowData.lastRunId !== VALUE_UNAVAILABLE ? (
            <WorkflowInstanceStatusIndicator
              status={rowData.lastRunStatus as ProcessInstanceStatusDTO}
              lastRunId={
                canViewInstance(rowData.id) ? rowData.lastRunId : undefined
              }
            />
          ) : (
            VALUE_UNAVAILABLE
          ),
      },
      { title: 'Description', field: 'description', minWidth: '25vw' },
    ],
    [canViewInstance, canViewWorkflow, definitionLink],
  );

  const options = useMemo<TableProps['options']>(
    () => ({
      search: true,
      paging: false,
      actionsColumnIndex: columns.length,
    }),
    [columns.length],
  );

  // TODO: use backend pagination only if the generic orchestratorWorkflowPermission is in place
  // use FE pagination otherwise (it means when specific permissions are used)
  return (
    <OverrideBackstageTable<FormattedWorkflowOverview>
      title="Workflows"
      options={options}
      columns={columns}
      data={data}
      actions={actions}
    />
  );
};
