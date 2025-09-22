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
import { useNavigate } from 'react-router-dom';

import { Link, TableColumn, TableProps } from '@backstage/core-components';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

// Workaround since we use the newer @mui library but Backstage still uses deprecated @material-ui
import { SvgIcon } from '@material-ui/core';
import DeveloperModeOutlinedMui from '@mui/icons-material/DeveloperModeOutlined';
import FormatListBulletedMui from '@mui/icons-material/FormatListBulleted';
import PlayArrowMui from '@mui/icons-material/PlayArrow';

import {
  orchestratorWorkflowPermission,
  orchestratorWorkflowSpecificPermission,
  orchestratorWorkflowUsePermission,
  orchestratorWorkflowUseSpecificPermission,
  ProcessInstanceStatusDTO,
  WorkflowOverviewDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import WorkflowOverviewFormatter, {
  FormattedWorkflowOverview,
} from '../../dataFormatters/WorkflowOverviewFormatter';
import { usePermissionArray } from '../../hooks/usePermissionArray';
import { useTranslation } from '../../hooks/useTranslation';
import {
  entityInstanceRouteRef,
  entityWorkflowRouteRef,
  executeWorkflowRouteRef,
  workflowInstanceRouteRef,
  workflowRouteRef,
  workflowRunsRouteRef,
} from '../../routes';
import OverrideBackstageTable from '../ui/OverrideBackstageTable';
import { WorkflowInstanceStatusIndicator } from '../ui/WorkflowInstanceStatusIndicator';
import { WorkflowStatus } from '../ui/WorkflowStatus';
import { InputSchemaDialog } from './InputSchemaDialog';

export interface WorkflowsTableProps {
  items: WorkflowOverviewDTO[];
}

// Workaround
type SvgIconComponent = typeof SvgIcon;
const PlayArrow = PlayArrowMui as unknown as SvgIconComponent;
const FormatListBulleted = FormatListBulletedMui as unknown as SvgIconComponent;
const DeveloperModeOutlined =
  DeveloperModeOutlinedMui as unknown as SvgIconComponent;

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const definitionLink = useRouteRef(workflowRouteRef);
  const definitionRunsLink = useRouteRef(workflowRunsRouteRef);
  const executeWorkflowLink = useRouteRef(executeWorkflowRouteRef);
  const entityWorkflowLink = useRouteRef(entityWorkflowRouteRef);
  const entityInstanceLink = useRouteRef(entityInstanceRouteRef);
  const workflowInstanceLink = useRouteRef(workflowInstanceRouteRef);

  const { kind, name, namespace } = useRouteRefParams(entityInstanceRouteRef);
  let entityRef: string | undefined = undefined;
  if (kind && namespace && name) {
    entityRef = `${kind}:${namespace}/${name}`;
  }

  const [data, setData] = useState<FormattedWorkflowOverview[]>([]);

  const { allowed: permittedToUse } = usePermittedToUseBatch(items);
  const { allowed: permittedToView } = usePermittedToViewBatch(items);

  const [isInputSchemaDialogOpen, setIsInputSchemaDialogOpen] = useState(false);
  const [dataForDialog, setDataForDialog] = useState<
    FormattedWorkflowOverview | undefined
  >(undefined);

  const toggleInputSchemaDialog = useCallback(() => {
    setIsInputSchemaDialogOpen(prev => !prev);
  }, []);

  const handleViewInputSchema = useCallback(
    (rowData: FormattedWorkflowOverview) => {
      setDataForDialog(rowData);
      toggleInputSchemaDialog();
    },
    [toggleInputSchemaDialog],
  );
  const initialState = useMemo(
    () => items.map(WorkflowOverviewFormatter.format),
    [items],
  );

  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const handleViewVariables = useCallback(
    (rowData: FormattedWorkflowOverview) => {
      navigate(definitionRunsLink({ workflowId: rowData.id }));
    },
    [definitionRunsLink, navigate],
  );

  const handleExecute = useCallback(
    (rowData: FormattedWorkflowOverview) => {
      if (entityRef) {
        navigate(
          `${executeWorkflowLink({ workflowId: rowData.id })}?targetEntity=${entityRef}`,
        );
      } else {
        navigate(executeWorkflowLink({ workflowId: rowData.id }));
      }
    },
    [executeWorkflowLink, navigate, entityRef],
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
        tooltip: t('table.actions.run'),
        disabled: !canExecuteWorkflow(rowData.id),
        onClick: () => handleExecute(rowData),
      }),
    ];

    if (!entityRef)
      actionItems.push(
        rowData => ({
          icon: FormatListBulleted,
          tooltip: t('table.actions.viewRuns'),
          disabled: !canViewWorkflow(rowData.id),
          onClick: () => handleViewVariables(rowData),
        }),
        rowData => ({
          icon: DeveloperModeOutlined,
          tooltip: t('table.actions.viewInputSchema'),
          disabled: !canViewWorkflow(rowData.id),
          onClick: () => handleViewInputSchema(rowData),
        }),
      );

    return actionItems;
  }, [
    t,
    canExecuteWorkflow,
    canViewWorkflow,
    handleExecute,
    handleViewVariables,
    handleViewInputSchema,
    entityRef,
  ]);

  const entityLink = useCallback(
    (workflowId: string) => {
      return entityRef
        ? entityWorkflowLink({
            namespace,
            kind,
            name,
            workflowId,
          })
        : definitionLink({
            workflowId,
          });
    },
    [entityRef, entityWorkflowLink, definitionLink, kind, name, namespace],
  );

  const instanceLink = useCallback(
    (rowData: FormattedWorkflowOverview) => {
      if (canViewInstance(rowData.id)) {
        return entityRef
          ? entityInstanceLink({
              namespace,
              kind,
              name,
              workflowId: rowData.id,
              instanceId: rowData.lastRunId,
            })
          : workflowInstanceLink({ instanceId: rowData.lastRunId });
      }
      return undefined;
    },
    [
      canViewInstance,
      entityInstanceLink,
      workflowInstanceLink,
      entityRef,
      namespace,
      kind,
      name,
    ],
  );

  const columns = useMemo<TableColumn<FormattedWorkflowOverview>[]>(
    () => [
      {
        title: t('table.headers.name'),
        field: 'name',
        render: rowData =>
          canViewWorkflow(rowData.id) ? (
            <Link to={entityLink(rowData.id)}>{rowData.name}</Link>
          ) : (
            rowData.name
          ),
      },
      {
        title: t('table.headers.workflowStatus'),
        field: 'availability',
        render: rowData => (
          <WorkflowStatus availability={rowData.availability} />
        ),
      },
      {
        title: t('table.headers.lastRun'),
        field: 'lastTriggered',
      },
      {
        title: t('table.headers.lastRunStatus'),
        field: 'lastRunStatus',
        render: rowData => {
          const originalRawData = items.find(
            item => item.workflowId === rowData.id,
          );
          return (
            <WorkflowInstanceStatusIndicator
              status={
                originalRawData?.lastRunStatus as ProcessInstanceStatusDTO
              }
              instanceLink={instanceLink(rowData)}
            />
          );
        },
      },
      {
        title: t('table.headers.description'),
        field: 'description',
        minWidth: '25vw',
      },
    ],
    [t, canViewWorkflow, entityLink, items, instanceLink],
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
    <>
      {dataForDialog && (
        <InputSchemaDialog
          rowData={dataForDialog}
          isInputSchemaDialogOpen={isInputSchemaDialogOpen}
          toggleInputSchemaDialog={toggleInputSchemaDialog}
        />
      )}
      <OverrideBackstageTable<FormattedWorkflowOverview>
        title={t('table.title.workflows')}
        options={options}
        columns={columns}
        data={data}
        actions={actions}
      />
    </>
  );
};
