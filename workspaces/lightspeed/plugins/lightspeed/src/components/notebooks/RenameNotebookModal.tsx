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

import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useRenameNotebook } from '../../hooks/notebooks/useRenameNotebook';
import { useTranslation } from '../../hooks/useTranslation';

const SubmitButton = styled(Button)({
  textTransform: 'none',
  borderRadius: 999,
  backgroundColor: 'var(--pf-t--global--color--brand--default)',
  '&:hover': {
    backgroundColor: 'var(--pf-t--global--color--brand--default)',
  },
});

export const RenameNotebookModal = ({
  isOpen,
  onClose,
  sessionId,
  currentName,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  currentName: string;
}) => {
  const { t } = useTranslation();
  const { mutateAsync: renameNotebook, isError, error } = useRenameNotebook();
  const [name, setName] = useState<string>('');
  const [originalName, setOriginalName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setOriginalName(currentName);
    }
  }, [isOpen, currentName]);

  const handleRename = async () => {
    try {
      await renameNotebook({ sessionId, name });
      onClose();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="rename-notebook-modal"
      aria-describedby="rename-notebook-modal-body"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4 },
      }}
    >
      <DialogTitle sx={{ padding: '16px 20px', fontStyle: 'inherit' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>
            {t('notebooks.rename.title').replace('{{name}}', currentName)}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            title={t('common.close')}
            size="large"
            sx={{
              position: 'absolute',
              right: theme => theme.spacing(1),
              top: theme => theme.spacing(1),
              color: 'text.primary',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        id="rename-notebook-modal-body"
        sx={{ paddingTop: 0, paddingLeft: 2.5 }}
      >
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          {t('notebooks.rename.description')}
        </Typography>
        <TextField
          id="outlined-notebook-name-input"
          label={t('notebooks.rename.label')}
          onChange={event => setName(event.target.value)}
          fullWidth
          value={name}
          sx={{ marginTop: 0 }}
          variant="outlined"
          placeholder={t('notebooks.rename.placeholder')}
          inputProps={{
            autoFocus: true,
          }}
        />
      </DialogContent>
      {isError && (
        <Box sx={{ maxWidth: 650, mx: 2.5 }}>
          <Alert severity="error">{String(error)}</Alert>
        </Box>
      )}
      <DialogActions sx={{ justifyContent: 'left', padding: 2.5, gap: 1 }}>
        <SubmitButton
          variant="contained"
          disabled={name.trim() === '' || name.trim() === originalName.trim()}
          onClick={handleRename}
        >
          {t('notebooks.rename.action')}
        </SubmitButton>
        <Button
          key="cancel"
          variant="outlined"
          sx={{ textTransform: 'none', borderRadius: 999 }}
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
