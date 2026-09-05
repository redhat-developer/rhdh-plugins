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
import { getScopedDialogProps } from '../../utils/scoped-dialog-utils';
import { optionalStyle } from './notebookDialogStyles';

const pillButtonSx = { textTransform: 'none', borderRadius: 999 } as const;

export const DeleteNotebookModal = ({
  isOpen,
  onClose,
  onDeleted,
  sessionId,
  name,
  isCompact = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  sessionId: string;
  name: string;
  isCompact?: boolean;
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

  const scopedProps = getScopedDialogProps(isCompact);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="delete-notebook-modal"
      aria-describedby="delete-notebook-modal-body"
      fullWidth
      {...scopedProps}
      PaperProps={{
        ...scopedProps.PaperProps,
        sx: [
          { borderRadius: isCompact ? '12px' : '16px' },
          optionalStyle(scopedProps.PaperProps?.sx),
        ],
      }}
    >
      <DialogTitle
        sx={{
          p: isCompact ? '12px 16px !important' : '16px 20px',
          fontStyle: 'inherit',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>
            {t('notebooks.delete.title', { name } as any)}
          </Typography>
          <IconButton
            aria-label={t('common.close')}
            onClick={onClose}
            title={t('common.close')}
            size={isCompact ? 'small' : 'large'}
            sx={{
              position: 'absolute',
              right: 1,
              top: 1,
              color: 'text.primary',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        id="delete-notebook-modal-body"
        sx={theme => ({
          pt: 0,
          pb: 5,
          ...(isCompact && {
            paddingTop: '0 !important',
            paddingBottom: `${theme.spacing(2)} !important`,
            paddingLeft: `${theme.spacing(2)} !important`,
            paddingRight: `${theme.spacing(2)} !important`,
          }),
        })}
      >
        <Typography variant="body2">{t('notebooks.delete.message')}</Typography>
      </DialogContent>
      {isError && (
        <Box
          sx={{
            maxWidth: isCompact ? '100%' : 650,
            mx: isCompact ? 2 : 2.5,
          }}
        >
          <Alert severity="error">{String(error)}</Alert>
        </Box>
      )}
      <DialogActions
        sx={{
          justifyContent: 'left',
          p: isCompact ? '12px !important' : 2.5,
          gap: 1,
        }}
      >
        <Button
          variant="contained"
          color="error"
          sx={pillButtonSx}
          onClick={handleDelete}
        >
          {t('notebooks.delete.action')}
        </Button>
        <Button
          key="cancel"
          variant="outlined"
          sx={pillButtonSx}
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
