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

import { useState } from 'react';

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
  warningAlert: {
    marginBottom: theme.spacing(2),
    '& .pf-v6-c-alert__title': {
      marginTop: 0,
    },
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    marginBottom: theme.spacing(2),
    '& label': {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      cursor: 'pointer',
      fontSize: '0.875rem',
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
}));

type OverwriteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filesToUpload: File[]) => void;
  onBack: () => void;
  allFiles: File[];
  duplicateFileNames: string[];
};

export const OverwriteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  onBack,
  allFiles,
  duplicateFileNames,
}: OverwriteConfirmModalProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [duplicateAction, setDuplicateAction] = useState<'replace' | 'ignore'>(
    'replace',
  );

  const duplicateSet = new Set(duplicateFileNames);
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

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
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
          onClick={handleClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <Alert
          variant="warning"
          isInline
          title={(t as Function)('notebook.overwrite.modal.description', {
            duplicateCount: duplicateFiles.length,
            newCount: newFiles.length,
          })}
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
            <li key={file.name} className={classes.fileItem}>
              <FileTypeIcon fileName={file.name} />
              <Typography className={classes.fileName}>{file.name}</Typography>
              {duplicateSet.has(file.name) && (
                <ExclamationTriangleIcon className={classes.warningIcon} />
              )}
            </li>
          ))}
        </ul>
      </DialogContent>

      <div className={classes.dialogActions}>
        <Button variant="primary" onClick={handleConfirm}>
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
