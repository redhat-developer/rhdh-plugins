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

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CircularProgress,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import { useTranslation } from '../hooks/useTranslation';

export type RetriggerInitConfirmDialogProps = {
  open: boolean;
  projectName: string;
  isRunning: boolean;
  onConfirm: (userPrompt: string) => void;
  onClose: () => void;
};

export const RetriggerInitConfirmDialog = ({
  open,
  projectName,
  isRunning,
  onConfirm,
  onClose,
}: RetriggerInitConfirmDialogProps) => {
  const { t } = useTranslation();
  const [userPrompt, setUserPrompt] = useState('');
  const confirmingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      confirmingRef.current = false;
      setUserPrompt('');
    } else if (!isRunning) {
      confirmingRef.current = false;
    }
  }, [open, isRunning]);

  const handleConfirm = useCallback(() => {
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    onConfirm(userPrompt);
  }, [onConfirm, userPrompt]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="retrigger-init-modal-title"
      aria-describedby="retrigger-init-modal-description"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="retrigger-init-modal-title">
        {t('retriggerInit.confirm.title' as any, { name: projectName })}
      </DialogTitle>
      <DialogContent>
        <Typography
          id="retrigger-init-modal-description"
          variant="body1"
          gutterBottom
        >
          {t('retriggerInit.confirm.message')}
        </Typography>
        <TextField
          label={t('retriggerInit.confirm.userPromptLabel')}
          placeholder={t('retriggerInit.confirm.userPromptPlaceholder')}
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          variant="outlined"
          margin="normal"
          value={userPrompt}
          onChange={e => setUserPrompt(e.target.value)}
          disabled={isRunning}
          inputProps={{ 'data-testid': 'retrigger-init-user-prompt' }}
        />
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          disabled={isRunning}
          startIcon={
            isRunning ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {t('retriggerInit.confirm.confirmButton')}
        </Button>
        <Button variant="outlined" onClick={onClose} disabled={isRunning}>
          {t('bulkRun.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
