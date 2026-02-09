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
import { useCallback, useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@material-ui/core';
import { useTranslation } from '../../hooks/useTranslation';

export type UserPromptDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (userPrompt: string) => void;
  phaseName?: string;
  moduleName?: string;
};

/**
 * Modal dialog that collects an optional text prompt before running the next phase.
 */
export const UserPromptDialog = ({
  open,
  onClose,
  onConfirm,
  phaseName,
  moduleName,
}: UserPromptDialogProps) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');

  const handleConfirm = useCallback(() => {
    onConfirm(prompt.trim());
    setPrompt('');
    onClose();
  }, [onConfirm, onClose, prompt]);

  const handleCancel = useCallback(() => {
    setPrompt('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) setPrompt('');
  }, [open]);

  const title = phaseName
    ? `${t('userPromptDialog.title')}: ${phaseName}`
    : t('userPromptDialog.title');

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle id="user-prompt-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {moduleName && (
          <Typography variant="body1" gutterBottom>
            {t('userPromptDialog.moduleName' as any, { moduleName })}
          </Typography>
        )}
        <TextField
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          margin="dense"
          label={t('userPromptDialog.promptLabel')}
          placeholder={t('userPromptDialog.promptPlaceholder')}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
          variant="outlined"
          inputProps={{ 'data-testid': 'user-prompt-input' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{t('wizard.cancel')}</Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          data-testid="user-prompt-run"
        >
          {t('userPromptDialog.run')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
