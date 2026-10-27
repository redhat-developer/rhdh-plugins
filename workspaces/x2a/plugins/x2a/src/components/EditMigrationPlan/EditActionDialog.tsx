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

import { useEffect, useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@material-ui/core';

import { useTranslation } from '../../hooks/useTranslation';

export type EditActionDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** While true, the dialog can not be dismissed and the confirm button spins. */
  isBusy?: boolean;
  /** Adds a required, prefilled commit message field; its value is passed to onConfirm. */
  commitMessage?: { label: string; defaultValue: string };
  onConfirm: (commitMessage: string) => void;
  onClose: () => void;
};

/** Confirmation of one of the editor actions (cancel, reload, save). */
export const EditActionDialog = ({
  open,
  title,
  message,
  confirmLabel,
  isBusy = false,
  commitMessage,
  onConfirm,
  onClose,
}: EditActionDialogProps) => {
  const { t } = useTranslation();
  const [commitText, setCommitText] = useState(
    commitMessage?.defaultValue ?? '',
  );

  useEffect(() => {
    if (open) {
      setCommitText(commitMessage?.defaultValue ?? '');
    }
  }, [open, commitMessage?.defaultValue]);

  const confirmDisabled = isBusy || (!!commitMessage && !commitText.trim());

  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : onClose}
      aria-labelledby="edit-action-dialog-title"
      aria-describedby="edit-action-dialog-message"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="edit-action-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <Typography id="edit-action-dialog-message" variant="body1">
          {message}
        </Typography>
        {commitMessage && (
          <TextField
            label={commitMessage.label}
            value={commitText}
            onChange={e => setCommitText(e.target.value)}
            disabled={isBusy}
            required
            fullWidth
            multiline
            maxRows={6}
            variant="outlined"
            margin="normal"
            inputProps={{ 'data-testid': 'commit-message' }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          disabled={confirmDisabled}
          onClick={() => onConfirm(commitText.trim())}
          startIcon={
            isBusy ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {confirmLabel}
        </Button>
        <Button variant="outlined" onClick={onClose} disabled={isBusy}>
          {t('editMigrationPlan.dialogs.keepEditing')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
