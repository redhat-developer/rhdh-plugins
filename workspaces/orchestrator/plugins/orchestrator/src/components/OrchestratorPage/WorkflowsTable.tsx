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

import {
  InfoCard,
  Link,
  TableColumn,
  TableProps,
} from '@backstage/core-components';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';

import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';

import {
  orchestratorWorkflowPermission,
  orchestratorWorkflowSpecificPermission,
  orchestratorWorkflowUsePermission,
  orchestratorWorkflowUseSpecificPermission,
  WorkflowOverviewDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { ENFORCING_UNIQUE_WORKFLOW_IDS_DOC_URL } from '../../constants';
import WorkflowOverviewFormatter, {
  FormattedWorkflowOverview,
} from '../../dataFormatters/WorkflowOverviewFormatter';
import { useTranslation } from '../../hooks/useTranslation';
import { useWorkflowPermissionBatch } from '../../hooks/useWorkflowPermissionBatch';
import {
  entityInstanceRouteRef,
  entityWorkflowRouteRef,
  executeWorkflowRouteRef,
  workflowRouteRef,
  workflowRunsRouteRef,
} from '../../routes';
import { Trans } from '../Trans';
import OverrideBackstageTable from '../ui/OverrideBackstageTable';
import { TableTextFilter } from '../ui/TableTextFilter';
import { WorkflowStatus } from '../ui/WorkflowStatus';
import { WorkflowSuccessRatioCell } from '../ui/WorkflowSuccessRatioCell';

export interface WorkflowsTableProps {
  items: WorkflowOverviewDTO[];
}

export const WorkflowsTable = ({ items }: WorkflowsTableProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const definitionLink = useRouteRef(workflowRouteRef);
  const definitionRunsLink = useRouteRef(workflowRunsRouteRef);
  const executeWorkflowLink = useRouteRef(executeWorkflowRouteRef);
  const entityWorkflowLink = useRouteRef(entityWorkflowRouteRef);

  const { kind, name, namespace } = useRouteRefParams(entityInstanceRouteRef);
  let entityRef: string | undefined = undefined;
  if (kind && namespace && name) {
    entityRef = `${kind}:${namespace}/${name}`;
  }

  const [data, setData] = useState<FormattedWorkflowOverview[]>([]);
  const [search, setSearch] = useState('');

  const { allowed: permittedToUse } = useWorkflowPermissionBatch(
    items,
    orchestratorWorkflowUsePermission,
    orchestratorWorkflowUseSpecificPermission,
  );
  const { allowed: permittedToView } = useWorkflowPermissionBatch(
    items,
    orchestratorWorkflowPermission,
    orchestratorWorkflowSpecificPermission,
  );

  const initialState = useMemo(
    () => items.map(WorkflowOverviewFormatter.format),
    [items],
  );

  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return data;
    }

    return data.filter(
      row =>
        row.name.toLowerCase().includes(query) ||
        row.version.toLowerCase().includes(query) ||
        row.runsLastMonth.toLowerCase().includes(query) ||
        row.successRatioDisplay.toLowerCase().includes(query) ||
        (row.availability?.toLowerCase().includes(query) ?? false),
    );
  }, [data, search]);

  const handleViewVariables = useCallback(
    (rowData: FormattedWorkflowOverview) => {
      navigate(definitionRunsLink({ workflowId: rowData.id }));
    },
    [definitionRunsLink, navigate],
  );

  const buildExecuteUrl = useCallback(
    (workflowId: string) => {
      const baseUrl = executeWorkflowLink({ workflowId });
      const params = new URLSearchParams();
      if (entityRef) {
        params.set('targetEntity', entityRef);
      }
      const query = params.toString();
      return query ? `${baseUrl}?${query}` : baseUrl;
    },
    [executeWorkflowLink, entityRef],
  );
  const handleExecute = useCallback(
    (rowData: FormattedWorkflowOverview) => {
      navigate(buildExecuteUrl(rowData.id));
    },
    [buildExecuteUrl, navigate],
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

  const actions = useMemo(() => {
    const actionItems: TableProps<FormattedWorkflowOverview>['actions'] = [
      rowData => ({
        icon: () => <PlayArrow />,
        tooltip: t('table.actions.run'),
        disabled: !canExecuteWorkflow(rowData.id),
        onClick: () => handleExecute(rowData),
      }),
    ];

    if (!entityRef)
      actionItems.push(rowData => ({
        icon: () => <FormatListBulleted />,
        tooltip: t('table.actions.viewRuns'),
        disabled: !canViewWorkflow(rowData.id),
        onClick: () => handleViewVariables(rowData),
      }));

    return actionItems;
  }, [
    t,
    canExecuteWorkflow,
    canViewWorkflow,
    handleExecute,
    handleViewVariables,
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

  const showDuplicateWorkflowIdAlert = useMemo(() => {
    const ids = items.map(i => i.workflowId);
    return new Set(ids).size < ids.length;
  }, [items]);

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
        title: t('table.headers.version'),
        field: 'version',
      },
      {
        title: t('table.headers.runsLastMonth'),
        field: 'runsLastMonth',
      },
      {
        title: t('table.headers.successRatio'),
        field: 'successRatioDisplay',
        render: rowData => (
          <WorkflowSuccessRatioCell successRatio={rowData.successRatio} />
        ),
      },
    ],
    [t, canViewWorkflow, entityLink],
  );

  const options = useMemo<TableProps['options']>(
    () => ({
      search: false,
      paging: false,
      actionsColumnIndex: columns.length,
    }),
    [columns.length],
  );

  // TODO: use backend pagination only if the generic orchestratorWorkflowPermission is in place
  // use FE pagination otherwise (it means when specific permissions are used)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {showDuplicateWorkflowIdAlert ? (
        <Alert severity="warning">
          {t('alerts.duplicateWorkflowIds.message')}{' '}
          <MuiLink
            href={ENFORCING_UNIQUE_WORKFLOW_IDS_DOC_URL}
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            underline="always"
            variant="body2"
            sx={{ fontWeight: 600 }}
          >
            {t('alerts.duplicateWorkflowIds.learnMore')}
            <OpenInNewIcon
              sx={{ ml: 0.5, fontSize: '1em', verticalAlign: 'text-bottom' }}
              aria-hidden
            />
          </MuiLink>
        </Alert>
      ) : null}
      <InfoCard
        noPadding
        title={
          <Trans
            message="table.title.workflows"
            params={{ count: items.length }}
          />
        }
        action={<TableTextFilter value={search} onChange={setSearch} />}
        headerProps={{ style: { alignItems: 'center' } }}
      >
        <OverrideBackstageTable<FormattedWorkflowOverview>
          removeOutline
          options={options}
          columns={columns}
          data={filteredData}
          actions={actions}
          components={{
            Toolbar: () => null,
          }}
        />
      </InfoCard>
    </Box>
  );
};
