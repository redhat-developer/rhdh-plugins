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
import { makeStyles } from '../../utils/makeStyles';

const useStyles = makeStyles(theme => ({
  dialogPaper: {
    borderRadius: 16,
  },
  dialogTitle: {
    padding: '16px 20px',
    fontStyle: 'inherit',
  },
  dialogContent: {
    paddingTop: 0,
    paddingBottom: theme.spacing(5),
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  titleText: {
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  errorBox: {
    maxWidth: 650,
    marginLeft: theme.spacing(2.5),
    marginRight: theme.spacing(2.5),
  },
  dialogActions: {
    justifyContent: 'left',
    padding: theme.spacing(2.5),
    gap: theme.spacing(1),
  },
  deleteButton: {
    textTransform: 'none',
    borderRadius: 999,
  },
  cancelButton: {
    textTransform: 'none',
    borderRadius: 999,
  },
}));

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
  const classes = useStyles();
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
        className: classes.dialogPaper,
      }}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Box className={classes.titleRow}>
          <Typography component="span" className={classes.titleText}>
            {t('notebooks.delete.title', { name } as any)}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            title={t('common.close')}
            size="large"
            className={classes.closeButton}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        id="delete-notebook-modal-body"
        className={classes.dialogContent}
      >
        <Typography variant="body2">{t('notebooks.delete.message')}</Typography>
      </DialogContent>
      {isError && (
        <Box className={classes.errorBox}>
          <Alert severity="error">{String(error)}</Alert>
        </Box>
      )}
      <DialogActions className={classes.dialogActions}>
        <Button
          variant="contained"
          color="error"
          className={classes.deleteButton}
          onClick={handleDelete}
        >
          {t('notebooks.delete.action')}
        </Button>
        <Button
          key="cancel"
          variant="outlined"
          className={classes.cancelButton}
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
