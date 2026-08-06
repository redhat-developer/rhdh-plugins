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
import { getScopedDialogProps } from '../../utils/scoped-dialog-utils';
import { FileTypeIcon } from './FileTypeIcon';

const useStyles = makeStyles(theme => ({
  dialogPaper: {
    borderRadius: 24,
    maxWidth: 578,
  },
  dialogPaperCompact: {
    borderRadius: 12,
    maxWidth: '100%',
  },
  dialogTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 24px 16px',
  },
  dialogTitleCompact: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px !important',
  },
  titleText: {
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: '1.625rem',
    letterSpacing: '-0.25px',
  },
  titleTextCompact: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: '1.375rem',
    letterSpacing: '-0.25px',
  },
  closeButton: {
    color: theme.palette.text.primary,
  },
  dialogContent: {
    padding: '0 24px 24px',
  },
  dialogContentCompact: {
    padding: '0 16px 16px !important',
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
  fileItemCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: `${theme.spacing(1)}px 0`,
    borderBottom:
      '1px solid var(--pf-t--global--border--color--default, #c7c7c7)',
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
  fileNameCompact: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.8125rem',
    lineHeight: '1.125rem',
  },
  dialogActions: {
    justifyContent: 'left',
    padding: theme.spacing(2.5),
    gap: theme.spacing(1),
  },
  dialogActionsCompact: {
    justifyContent: 'flex-start',
    padding: '12px 16px !important',
    gap: theme.spacing(1),
  },
  overwriteButton: {
    textTransform: 'none',
    borderRadius: 999,
  },
  overwriteButtonCompact: {
    textTransform: 'none',
    borderRadius: 999,
    fontSize: '0.8125rem',
    padding: '4px 16px',
  },
  cancelButton: {
    textTransform: 'none',
    borderRadius: 999,
  },
  cancelButtonCompact: {
    textTransform: 'none',
    borderRadius: 999,
    fontSize: '0.8125rem',
    padding: '4px 16px',
  },
  warningAlert: {
    borderRadius: '6px',
  },
  warningAlertCompact: {
    borderRadius: '6px',
    fontSize: '0.8125rem',
    '& .MuiAlert-icon': {
      fontSize: '1.125rem',
    },
  },
}));

type OverwriteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileNames: string[];
  isCompact?: boolean;
};

export const OverwriteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  fileNames,
  isCompact = false,
}: OverwriteConfirmModalProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const scopedProps = getScopedDialogProps(isCompact);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="overwrite-confirm-modal-title"
      {...scopedProps}
      PaperProps={{
        className: isCompact ? classes.dialogPaperCompact : classes.dialogPaper,
        ...scopedProps.PaperProps,
      }}
    >
      <DialogTitle
        className={isCompact ? classes.dialogTitleCompact : classes.dialogTitle}
      >
        <Typography
          component="h2"
          className={isCompact ? classes.titleTextCompact : classes.titleText}
        >
          {t('notebook.overwrite.modal.title')}
        </Typography>
        <IconButton
          aria-label={t('common.close')}
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon fontSize={isCompact ? 'small' : 'medium'} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        className={
          isCompact ? classes.dialogContentCompact : classes.dialogContent
        }
      >
        <Alert
          severity="warning"
          className={
            isCompact ? classes.warningAlertCompact : classes.warningAlert
          }
        >
          {t('notebook.overwrite.modal.description')}
        </Alert>

        <ul className={classes.fileList}>
          {fileNames.map(name => (
            <li
              key={name}
              className={isCompact ? classes.fileItemCompact : classes.fileItem}
            >
              <FileTypeIcon fileName={name} />
              <Typography
                className={
                  isCompact ? classes.fileNameCompact : classes.fileName
                }
              >
                {name}
              </Typography>
            </li>
          ))}
        </ul>
      </DialogContent>

      <DialogActions
        className={
          isCompact ? classes.dialogActionsCompact : classes.dialogActions
        }
      >
        <Button
          variant="contained"
          color="error"
          className={
            isCompact ? classes.overwriteButtonCompact : classes.overwriteButton
          }
          onClick={onConfirm}
          size={isCompact ? 'small' : 'medium'}
        >
          {t('notebook.overwrite.modal.action')}
        </Button>
        <Button
          variant="outlined"
          className={
            isCompact ? classes.cancelButtonCompact : classes.cancelButton
          }
          onClick={onClose}
          size={isCompact ? 'small' : 'medium'}
        >
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
