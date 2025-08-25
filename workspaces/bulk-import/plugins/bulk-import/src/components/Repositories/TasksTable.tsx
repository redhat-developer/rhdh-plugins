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
import { useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { ScaffolderTask } from '../../types';
import { TaskEvents } from '../Repositories/TaskEvents';

export const TasksTable = ({ tasks }: { tasks: ScaffolderTask[] }) => {
  const [selectedTask, setSelectedTask] = useState('');
  const [open, setOpen] = useState(false);

  const handleGetEvents = (taskId: string) => {
    setSelectedTask(taskId);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTask('');
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Task ID</TableCell>
            <TableCell>Scaffolder Options</TableCell>
            <TableCell>Events</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map(task => (
            <TableRow key={task.taskId}>
              <TableCell>{task.taskId}</TableCell>
              <TableCell>{JSON.stringify(task.scaffolderOptions)}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  onClick={() => handleGetEvents(task.taskId)}
                >
                  Events
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>Task Events</DialogTitle>
        <DialogContent>
          {selectedTask && <TaskEvents taskId={selectedTask} />}
        </DialogContent>
      </Dialog>
    </>
  );
};
