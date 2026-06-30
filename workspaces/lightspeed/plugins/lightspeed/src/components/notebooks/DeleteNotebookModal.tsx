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

import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useDeleteNotebook } from '../../hooks/notebooks/useDeleteNotebook';
import { useTranslation } from '../../hooks/useTranslation';

export const DeleteNotebookModal = ({
  isOpen,
  onClose,
  onDeleted,
  sessionId,
  name,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  sessionId: string;
  name: string;
}) => {
  const { t } = useTranslation();
  const { mutateAsync: deleteNotebook, isError, error } = useDeleteNotebook();

  const handleDelete = async () => {
    try {
      await deleteNotebook(sessionId);
      onDeleted();
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
      aria-labelledby="delete-notebook-modal"
      aria-describedby="delete-notebook-modal-body"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4 },
      }}
    >
      <DialogTitle sx={{ padding: '16px 20px', fontStyle: 'inherit' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>
            {t('notebooks.delete.title', { name } as any)}
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
        id="delete-notebook-modal-body"
        sx={{ paddingTop: 0, paddingBottom: theme => theme.spacing(5) }}
      >
        <Typography variant="body2">{t('notebooks.delete.message')}</Typography>
      </DialogContent>
      {isError && (
        <Box sx={{ maxWidth: 650, mx: 2.5 }}>
          <Alert severity="error">{String(error)}</Alert>
        </Box>
      )}
      <DialogActions sx={{ justifyContent: 'left', padding: 2.5, gap: 1 }}>
        <Button
          variant="contained"
          color="error"
          sx={{ textTransform: 'none', borderRadius: 999 }}
          onClick={handleDelete}
        >
          {t('notebooks.delete.action')}
        </Button>
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
