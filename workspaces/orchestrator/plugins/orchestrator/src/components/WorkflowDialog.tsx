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
import React, { forwardRef, ForwardRefRenderFunction } from 'react';

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  makeStyles,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

import { WorkflowEditor } from './WorkflowEditor';
import {
  WorkflowEditorRef,
  WorkflowEditorView,
} from './WorkflowEditor/WorkflowEditor';

export type OrchestratorWorkflowDialogProps = {
  workflowId: string;
  title: string;
  open: boolean;
  close: () => void;
  dialogActions?: React.ReactNode;
} & WorkflowEditorView;

const useStyles = makeStyles(_theme => ({
  editor: {
    height: '600px',
    marginBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
}));

export const RefForwardingWorkflowDialog: ForwardRefRenderFunction<
  WorkflowEditorRef,
  OrchestratorWorkflowDialogProps
> = (props, forwardedRef): JSX.Element | null => {
  const { workflowId, title, open, close } = props;
  const classes = useStyles();

  return (
    <Dialog fullWidth maxWidth="lg" onClose={_ => close()} open={open}>
      <DialogTitle>
        <Box>
          <Typography variant="h5">{title}</Typography>
          <IconButton
            className={classes.closeBtn}
            aria-label="close"
            onClick={close}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box className={classes.editor}>
          <WorkflowEditor
            {...props}
            workflowId={workflowId}
            ref={forwardedRef}
          />
        </Box>
      </DialogContent>
      {props.dialogActions}
    </Dialog>
  );
};

export const WorkflowDialog = forwardRef(RefForwardingWorkflowDialog);
