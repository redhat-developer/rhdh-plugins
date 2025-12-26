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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { useTranslation } from '../../hooks/useTranslation';
import { OrchestratorWorkflow, ScaffolderTask } from '../../types';
import { TaskLink, WorkflowLink } from '../../utils/repository-utils';

export const ImportHistoryTable = ({
  tasks,
  workflows,
}: {
  tasks: ScaffolderTask[];
  workflows: OrchestratorWorkflow[];
}) => {
  const { t } = useTranslation();
  const isWorkflow = workflows.length > 0;

  const rows = isWorkflow
    ? workflows.map(w => ({
        id: w.workflowId,
        link: <WorkflowLink workflowId={w.workflowId} t={t} />,
      }))
    : tasks.map(tk => ({
        id: tk.taskId,
        link: <TaskLink taskId={tk.taskId} t={t} />,
      }));

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            {isWorkflow ? t('workflows.workflowId') : t('tasks.taskId')}
          </TableCell>
          <TableCell>
            {isWorkflow ? t('workflows.workflowLink') : t('tasks.taskLink')}
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.map(row => (
          <TableRow key={row.id}>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.link}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
