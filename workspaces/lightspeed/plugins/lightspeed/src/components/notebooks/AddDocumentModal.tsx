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
import { FileRejection } from 'react-dropzone';

import { makeStyles } from '@material-ui/core/styles';
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
import { FileListItem } from './FileListItem';

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
  dropzone: {
    '& .pf-v6-c-multiple-file-upload__main': {
      borderColor: 'var(--pf-t--global--border--color--brand--default)',
      transition: 'background-color 0.2s ease',
      cursor: 'pointer',
    },
    '& .pf-v6-c-multiple-file-upload__main:hover': {
      backgroundColor:
        'color-mix(in srgb, var(--pf-t--global--color--brand--default) 10%, transparent)',
    },
  },
  fileListContainer: {
    marginTop: theme.spacing(2),
    maxHeight: 200,
    overflowY: 'auto',
  },
  fileListHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
  },
  fileCount: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
  dialogActions: {
    padding: '16px 24px',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
  },
  addButton: {
    textTransform: 'none',
  },
  cancelButton: {
    textTransform: 'none',
  },
}));

type AddDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  existingDocumentNames: string[];
  onFilesUploading?: (files: File[]) => void;
  onUploadStarted?: (info: { fileName: string; documentId: string }) => void;
  onUploadFailed?: (fileName: string) => void;
  onDuplicatesFound?: (files: File[]) => void;
  filesToAdd?: File[];
  onFilesAdded?: () => void;
};

export const AddDocumentModal = ({
  isOpen,
  onClose,
  sessionId,
  existingDocumentNames,
  onFilesUploading,
  onUploadStarted,
  onUploadFailed,
  onDuplicatesFound,
  filesToAdd,
  onFilesAdded,
}: AddDocumentModalProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const uploadMutation = useUploadDocument();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const totalExistingAndSelected =
    existingDocumentNames.length + selectedFiles.length;
  const remainingSlots = NOTEBOOK_MAX_FILES - totalExistingAndSelected;

  useEffect(() => {
    if (filesToAdd && filesToAdd.length > 0) {
      setSelectedFiles(prev => [...prev, ...filesToAdd]);
      onFilesAdded?.();
    }
  }, [filesToAdd, onFilesAdded]);

  const handleFileDrop = (_event: unknown, files: File[]) => {
    setValidationErrors([]);

    const { valid, errors } = validateFiles(files, totalExistingAndSelected);

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (valid.length === 0) return;

    const existingNamesSet = new Set([
      ...existingDocumentNames,
      ...selectedFiles.map(f => f.name),
    ]);
    const newFiles = valid.filter(f => !existingNamesSet.has(f.name));
    const duplicateFiles = valid.filter(f =>
      existingDocumentNames.includes(f.name),
    );

    if (duplicateFiles.length > 0) {
      onDuplicatesFound?.(duplicateFiles);
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFiles = () => {
    if (selectedFiles.length === 0) return;

    onFilesUploading?.(selectedFiles);
    for (const file of selectedFiles) {
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

    setSelectedFiles([]);
    setValidationErrors([]);
    onClose();
  };

  const handleDropRejected = (rejections: FileRejection[]) => {
    const hasInvalidType = rejections.some(r =>
      r.errors.some(e => e.code === 'file-invalid-type'),
    );
    if (hasInvalidType) {
      setValidationErrors(['notebook.upload.error.unsupportedType']);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
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
          {selectedFiles.length > 0 &&
            ` (${selectedFiles.length}/${NOTEBOOK_MAX_FILES - existingDocumentNames.length})`}
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

        {remainingSlots > 0 && (
          <MultipleFileUpload
            className={classes.dropzone}
            dropzoneProps={{
              accept: getNotebookAcceptedFileTypes(),
              onDropRejected: handleDropRejected,
            }}
            onFileDrop={handleFileDrop}
          >
            <MultipleFileUploadMain
              titleIcon={<UploadIcon />}
              titleText={t('notebook.upload.modal.dragDropTitle')}
              titleTextSeparator={t('notebook.upload.modal.separator')}
              infoText={t('notebook.upload.modal.infoText')}
              browseButtonText={t('notebook.upload.modal.browseButton')}
            />
          </MultipleFileUpload>
        )}

        {selectedFiles.length > 0 && (
          <Box className={classes.fileListContainer}>
            <Box className={classes.fileListHeader}>
              <Typography className={classes.fileCount}>
                {(t as Function)('notebook.upload.modal.selectedFiles', {
                  count: selectedFiles.length,
                  max: NOTEBOOK_MAX_FILES - existingDocumentNames.length,
                })}
              </Typography>
            </Box>
            {selectedFiles.map((file, index) => (
              <FileListItem
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => handleRemoveFile(index)}
                removeAriaLabel={(t as Function)(
                  'notebook.upload.modal.removeFile',
                  {
                    fileName: file.name,
                  },
                )}
              />
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button
          onClick={handleClose}
          className={classes.cancelButton}
          color="inherit"
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleAddFiles}
          className={classes.addButton}
          variant="contained"
          color="primary"
          disabled={selectedFiles.length === 0}
        >
          {(t as Function)('notebook.upload.modal.addButton', {
            count: selectedFiles.length,
          })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
