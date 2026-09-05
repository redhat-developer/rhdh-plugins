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

import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Alert, Button } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

import { useTranslation } from '../../hooks/useTranslation';
import { getScopedDialogProps } from '../../utils/scoped-dialog-utils';
import { FileTypeIcon } from './FileTypeIcon';
import {
  notebookDialogActionsSx,
  notebookDialogCloseButtonSx,
  notebookDialogContentSx,
  notebookDialogPaperSx,
  notebookDialogTitleSx,
  notebookDialogTitleTextSx,
  optionalStyle,
} from './notebookDialogStyles';

const WarningAlert = styled(Alert)(({ theme }) => ({
  '--pf-v6-c-alert--PaddingBlockEnd': '0',
  marginBottom: theme.spacing(2),
  '& .pf-v6-c-alert__title': {
    marginTop: 0,
  },
}));

const RadioGroup = styled('div')(({ theme }) => ({
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
}));

const FileList = styled('ul')({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  maxHeight: 300,
  overflowY: 'auto',
});

const FileItem = styled('li', {
  shouldForwardProp: prop => prop !== 'isCompact',
})<{ isCompact?: boolean }>(({ theme, isCompact }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  ...(isCompact
    ? {
        padding: `${theme.spacing(1)} 0`,
        borderBottom:
          '1px solid var(--pf-t--global--border--color--default, #c7c7c7)',
      }
    : {
        padding: theme.spacing(1.5),
        border: '1px solid var(--pf-t--global--border--color--default)',
        borderRadius: 8,
        marginBottom: theme.spacing(1),
      }),
}));

const WarningIcon = styled(ExclamationTriangleIcon)({
  color: 'var(--pf-t--global--color--status--warning--default)',
  fontSize: '1rem',
  flexShrink: 0,
});

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
        ...scopedProps.PaperProps,
        sx: [
          notebookDialogPaperSx(isCompact),
          optionalStyle(scopedProps.PaperProps?.sx),
        ],
      }}
    >
      <DialogTitle sx={notebookDialogTitleSx(isCompact)}>
        <Typography
          component="h2"
          sx={
            isCompact
              ? {
                  fontWeight: 600,
                  fontSize: '1rem',
                  lineHeight: '1.375rem',
                  letterSpacing: '-0.25px',
                }
              : notebookDialogTitleTextSx(false)
          }
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
          sx={notebookDialogCloseButtonSx}
          size="small"
        >
          <CloseIcon fontSize={isCompact ? 'small' : 'medium'} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={notebookDialogContentSx(isCompact)}>
        <WarningAlert
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
        />

        <RadioGroup>
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
        </RadioGroup>

        <FileList>
          {allFiles.map(file => (
            <FileItem key={file.name} isCompact={isCompact}>
              <FileTypeIcon fileName={file.name} />
              <Typography
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                }}
              >
                {file.name}
              </Typography>
              {duplicateSet.has(file.name) && <WarningIcon />}
            </FileItem>
          ))}
        </FileList>
      </DialogContent>

      <Box sx={[notebookDialogActionsSx(isCompact), { display: 'flex' }]}>
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
      </Box>
    </Dialog>
  );
};
