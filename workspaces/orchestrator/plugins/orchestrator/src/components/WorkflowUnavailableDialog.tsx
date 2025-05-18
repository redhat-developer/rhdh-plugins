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
import React from 'react';

import { IconButton } from '@material-ui/core';
import Snackbar from '@material-ui/core/Snackbar';
import CloseIcon from '@material-ui/icons/Close';
import Alert from '@material-ui/lab/Alert';

export const WorkflowUnavailableDialog = ({
  workflowId,
  isBarOpen,
  setIsBarOpen,
}: {
  workflowId: string;
  isBarOpen: boolean;
  setIsBarOpen: any;
}) => {
  return (
    <Snackbar
      open={isBarOpen}
      onClose={() => setIsBarOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="error"
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setIsBarOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        Workflow service "${workflowId}" not available at the moment.
      </Alert>
    </Snackbar>
  );
};
