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
import { useMemo, type ReactNode } from 'react';

import {
  CellText,
  ColumnConfig,
  Table,
  TableItem,
  useTable,
} from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import { OrchestratorWorkflow, ScaffolderTask } from '../../types';
import { TaskLink, WorkflowLink } from '../../utils/repository-utils';

interface HistoryTableRow extends TableItem {
  displayId: string;
  link: ReactNode;
}

export const ImportHistoryTable = ({
  tasks,
  workflows,
}: {
  tasks: ScaffolderTask[];
  workflows: OrchestratorWorkflow[];
}) => {
  const { t } = useTranslation();
  const isWorkflow = workflows.length > 0;

  const rows = useMemo<HistoryTableRow[]>(
    () =>
      isWorkflow
        ? workflows.map(w => ({
            id: w.workflowId,
            displayId: w.workflowId,
            link: <WorkflowLink workflowId={w.workflowId} t={t} />,
          }))
        : tasks.map(task => ({
            id: task.taskId,
            displayId: task.taskId,
            link: <TaskLink taskId={task.taskId} t={t} />,
          })),
    [isWorkflow, tasks, workflows, t],
  );

  const columnConfig = useMemo<ColumnConfig<HistoryTableRow>[]>(
    () => [
      {
        id: 'displayId',
        label: isWorkflow ? t('workflows.workflowId') : t('tasks.taskId'),
        cell: item => <CellText title={item.displayId} />,
        isRowHeader: true,
      },
      {
        id: 'link',
        label: isWorkflow ? t('workflows.workflowLink') : t('tasks.taskLink'),
        cell: item => <>{item.link}</>,
      },
    ],
    [isWorkflow, t],
  );

  const { tableProps } = useTable({
    mode: 'complete',
    data: rows,
    paginationOptions: { type: 'none' },
  });

  return <Table columnConfig={columnConfig} {...tableProps} />;
};
