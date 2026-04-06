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
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import {
  MultipleFileUpload,
  MultipleFileUploadMain,
} from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';

import { NOTEBOOK_MAX_FILES } from '../../const';
import { useUploadDocument } from '../../hooks/notebooks/useUploadDocument';
import { useTranslation } from '../../hooks/useTranslation';
import {
  getNotebookAcceptedFileTypes,
  validateFiles,
} from '../../utils/notebook-upload-utils';

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
    color: theme.palette.grey[700],
  },
  dialogContent: {
    padding: '0 24px 24px',
  },
  errorAlert: {
    marginBottom: theme.spacing(2),
  },
}));

type AddDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  existingDocumentCount: number;
  onFilesUploading?: (files: File[]) => void;
  onUploadStarted?: (info: { fileName: string; documentId: string }) => void;
  onUploadFailed?: (fileName: string) => void;
};

export const AddDocumentModal = ({
  isOpen,
  onClose,
  sessionId,
  existingDocumentCount,
  onFilesUploading,
  onUploadStarted,
  onUploadFailed,
}: AddDocumentModalProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const uploadMutation = useUploadDocument();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileDrop = (_event: unknown, files: File[]) => {
    setValidationErrors([]);

    const { valid, errors } = validateFiles(files, existingDocumentCount);

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (valid.length > 0) {
      onFilesUploading?.(valid);
      for (const file of valid) {
        uploadMutation
          .mutateAsync({ sessionId, file })
          .then(data => {
            onUploadStarted?.({
              fileName: file.name,
              documentId: data.document_id,
            });
          })
          .catch(() => {
            onUploadFailed?.(file.name);
          });
      }
      setValidationErrors([]);
      onClose();
    }
  };

  const handleClose = () => {
    setValidationErrors([]);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="add-document-modal-title"
      PaperProps={{
        className: classes.dialogPaper,
      }}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography component="h2" className={classes.titleText}>
          {t('notebook.upload.modal.title')}
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
        {validationErrors.length > 0 && (
          <Alert severity="error" className={classes.errorAlert}>
            {validationErrors
              .map(errorKey => {
                const message = (t as Function)(errorKey) as string;
                return errorKey === 'notebook.upload.error.tooManyFiles'
                  ? message.replace('{{max}}', String(NOTEBOOK_MAX_FILES))
                  : message;
              })
              .join('\n')}
          </Alert>
        )}

        <MultipleFileUpload
          dropzoneProps={{
            accept: getNotebookAcceptedFileTypes(),
          }}
          onFileDrop={handleFileDrop}
        >
          <MultipleFileUploadMain
            titleIcon={<UploadIcon />}
            titleText={t('notebook.upload.modal.dragDropTitle')}
            titleTextSeparator="or"
            infoText={t('notebook.upload.modal.infoText')}
            browseButtonText={t('notebook.upload.modal.browseButton')}
          />
        </MultipleFileUpload>
      </DialogContent>
    </Dialog>
  );
};
