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

import { forwardRef, ForwardRefRenderFunction } from 'react';
import { useNavigate } from 'react-router-dom';

import { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { Close } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { useTranslation } from '../../hooks/useTranslation';
import { orchestratorTranslationRef } from '../../translations';

export type WorkflowDescriptionModalProps = {
  workflow: WorkflowOverviewDTO;
  workflowError?: {
    itemId: string;
    error: any;
  };
  runWorkflowLink: string;
  open: boolean;
  onClose?: () => void;
};

export type ParentComponentRef = HTMLDivElement;

const useStyles = makeStyles()(() => ({
  closeBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
}));

// hack
type LocalTranslationFunction =
  | TranslationFunction<typeof orchestratorTranslationRef.T>
  | ((key: string, params?: Record<string, string>) => string);

export const RefForwardingWorkflowDescriptionModal: ForwardRefRenderFunction<
  ParentComponentRef,
  WorkflowDescriptionModalProps
> = (props, forwardedRef): JSX.Element | null => {
  const { t } = useTranslation() as { t: LocalTranslationFunction };

  const {
    workflow,
    open = false,
    onClose,
    runWorkflowLink,
    workflowError,
  } = props;
  const { classes } = useStyles();
  const navigate = useNavigate();

  const handleRunWorkflow = () => {
    if (runWorkflowLink) {
      navigate(runWorkflowLink);
    }
  };

  let content;
  if (workflowError) {
    content = (
      <Box>
        <Typography paragraph>
          {t('workflow.errors.failedToLoadDetails', {
            id: workflowError.itemId,
          })}
        </Typography>
        {workflowError.error.message && (
          <Typography paragraph>{workflowError.error.message}</Typography>
        )}
      </Box>
    );
  } else if (workflow.description) {
    content = <Box>{workflow.description}</Box>;
  } else {
    content = (
      <Box>
        <Typography paragraph>
          {t('workflow.messages.areYouSureYouWantToRunThisWorkflow')}
        </Typography>
      </Box>
    );
  }

  return (
    <Dialog
      onClose={_ => onClose}
      open={open}
      ref={forwardedRef}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box>
          <Typography variant="h5">{workflow.name}</Typography>
          <IconButton
            className={classes.closeBtn}
            aria-label="close"
            onClick={onClose}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button
          onClick={handleRunWorkflow}
          color="primary"
          variant="contained"
          disabled={!!workflowError}
        >
          {t('workflow.buttons.runWorkflow')}
        </Button>
        <Button onClick={onClose} color="primary" variant="outlined">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const WorkflowDescriptionModal = forwardRef(
  RefForwardingWorkflowDescriptionModal,
);
