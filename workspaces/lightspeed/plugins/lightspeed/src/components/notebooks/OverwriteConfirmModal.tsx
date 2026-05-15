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

import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslation } from '../../hooks/useTranslation';
import { FileTypeIcon } from './FileTypeIcon';

const useStyles = makeStyles(theme => ({
  dialogPaper: {
    borderRadius: 24,
    maxWidth: 578,
  },
  dialogTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 24px 16px',
  },
  titleText: {
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: '1.625rem',
    letterSpacing: '-0.25px',
  },
  closeButton: {
    color: theme.palette.text.primary,
  },
  dialogContent: {
    padding: '0 24px 24px',
  },
  fileList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: `${theme.spacing(2)}px 0`,
    borderBottom:
      '1px solid var(--pf-t--global--border--color--default, #c7c7c7)',
    cursor: 'pointer',
  },
  fileName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  dialogActions: {
    justifyContent: 'left',
    padding: theme.spacing(2.5),
    gap: theme.spacing(1),
  },
  overwriteButton: {
    textTransform: 'none',
    borderRadius: 999,
  },
  cancelButton: {
    textTransform: 'none',
    borderRadius: 999,
  },
  warningAlert: {
    borderRadius: '6px',
  },
}));

type OverwriteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileNames: string[];
};

export const OverwriteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  fileNames,
}: OverwriteConfirmModalProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="overwrite-confirm-modal-title"
      PaperProps={{
        className: classes.dialogPaper,
      }}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography component="h2" className={classes.titleText}>
          {t('notebook.overwrite.modal.title')}
        </Typography>
        <IconButton
          aria-label={t('common.close')}
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <Alert severity="warning" className={classes.warningAlert}>
          {t('notebook.overwrite.modal.description')}
        </Alert>

        <ul className={classes.fileList}>
          {fileNames.map(name => (
            <li key={name} className={classes.fileItem}>
              <FileTypeIcon fileName={name} />
              <Typography className={classes.fileName}>{name}</Typography>
            </li>
          ))}
        </ul>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button
          variant="contained"
          color="error"
          className={classes.overwriteButton}
          onClick={onConfirm}
        >
          {t('notebook.overwrite.modal.action')}
        </Button>
        <Button
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
