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

import { useEffect, useMemo, useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Alert, Button } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

import { useTranslation } from '../../hooks/useTranslation';
import { getScopedDialogProps } from '../../utils/scoped-dialog-utils';
import { FileTypeIcon } from './FileTypeIcon';
import { notebookDialogStyles } from './notebookDialogStyles';

const useStyles = makeStyles(theme => ({
  ...notebookDialogStyles(theme),
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
    padding: '0 16px 16px',
  },
  warningAlert: {
    '--pf-v6-c-alert--PaddingBlockEnd': '0',
    marginBottom: theme.spacing(2),
    '& .pf-v6-c-alert__title': {
      marginTop: 0,
    },
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    '& label': {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
    '& input[type="radio"]': {
      cursor: 'pointer',
    },
  },
  fileList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    maxHeight: 300,
    overflowY: 'auto',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: `${theme.spacing(1.5)}px ${theme.spacing(1.5)}px`,
    border: '1px solid var(--pf-t--global--border--color--default)',
    borderRadius: 8,
    marginBottom: theme.spacing(1),
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
  warningIcon: {
    color: 'var(--pf-t--global--color--status--warning--default)',
    fontSize: '1rem',
    flexShrink: 0,
  },
  dialogActions: {
    display: 'flex',
    justifyContent: 'flex-start',
    padding: '16px 24px',
    gap: theme.spacing(1),
  },
  dialogActionsCompact: {
    justifyContent: 'flex-start',
    padding: '12px 16px !important',
    gap: theme.spacing(1),
  },
}));

type OverwriteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filesToUpload: File[]) => void;
  onBack: () => void;
  allFiles: File[];
  duplicateFileNames: string[];
  isCompact?: boolean;
};

export const OverwriteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  onBack,
  allFiles,
  duplicateFileNames,
  isCompact = false,
}: OverwriteConfirmModalProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [duplicateAction, setDuplicateAction] = useState<'replace' | 'ignore'>(
    'replace',
  );

  useEffect(() => {
    if (isOpen) setDuplicateAction('replace');
  }, [isOpen]);

  const duplicateSet = useMemo(
    () => new Set(duplicateFileNames),
    [duplicateFileNames],
  );
  const newFiles = allFiles.filter(f => !duplicateSet.has(f.name));
  const duplicateFiles = allFiles.filter(f => duplicateSet.has(f.name));

  const filesToUpload = duplicateAction === 'replace' ? allFiles : newFiles;

  const handleConfirm = () => {
    onConfirm(filesToUpload);
    setDuplicateAction('replace');
  };

  const handleClose = () => {
    setDuplicateAction('replace');
    onClose();
  };

  const scopedProps = getScopedDialogProps(isCompact);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
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
          {(t as Function)(
            duplicateFiles.length === 1
              ? 'notebook.overwrite.modal.title.one'
              : 'notebook.overwrite.modal.title.other',
          )}
        </Typography>
        <IconButton
          aria-label={t('common.close')}
          onClick={handleClose}
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
          variant="warning"
          isInline
          title={(t as Function)(
            duplicateFiles.length === 1
              ? 'notebook.overwrite.modal.description.one'
              : 'notebook.overwrite.modal.description.other',
            {
              duplicateCount: duplicateFiles.length,
              newCount: newFiles.length,
            },
          )}
          className={classes.warningAlert}
        />

        <div className={classes.radioGroup}>
          <label>
            <input
              type="radio"
              name="duplicate-action"
              checked={duplicateAction === 'replace'}
              onChange={() => setDuplicateAction('replace')}
            />
            {t('notebook.overwrite.modal.replace')}
          </label>
          <label>
            <input
              type="radio"
              name="duplicate-action"
              checked={duplicateAction === 'ignore'}
              onChange={() => setDuplicateAction('ignore')}
            />
            {t('notebook.overwrite.modal.ignore')}
          </label>
        </div>

        <ul className={classes.fileList}>
          {allFiles.map(file => (
            <li
              key={file.name}
              className={isCompact ? classes.fileItemCompact : classes.fileItem}
            >
              <FileTypeIcon fileName={file.name} />
              <Typography className={classes.fileName}>{file.name}</Typography>
              {duplicateSet.has(file.name) && (
                <ExclamationTriangleIcon className={classes.warningIcon} />
              )}
            </li>
          ))}
        </ul>
      </DialogContent>

      <div
        className={
          isCompact ? classes.dialogActionsCompact : classes.dialogActions
        }
      >
        <Button
          variant="primary"
          onClick={handleConfirm}
          isDisabled={filesToUpload.length === 0}
        >
          {(t as Function)('notebook.overwrite.modal.action', {
            count: filesToUpload.length,
          })}
        </Button>
        <Button variant="link" onClick={onBack}>
          {t('notebook.overwrite.modal.back')}
        </Button>
      </div>
    </Dialog>
  );
};
