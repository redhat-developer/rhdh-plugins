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
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useTranslation } from '../../hooks/useTranslation';
import { FileTypeIcon } from './FileTypeIcon';

const FileList = styled('ul')({
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

const FileItem = styled('li')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: `${theme.spacing(2)} 0`,
  borderBottom:
    '1px solid var(--pf-t--global--border--color--default, #c7c7c7)',
  cursor: 'pointer',
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
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="overwrite-confirm-modal-title"
      PaperProps={{
        sx: { borderRadius: '24px', maxWidth: 578 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 16px',
        }}
      >
        <Typography
          component="h2"
          sx={{
            fontWeight: 500,
            fontSize: '1.25rem',
            lineHeight: '1.625rem',
            letterSpacing: '-0.25px',
          }}
        >
          {t('notebook.overwrite.modal.title')}
        </Typography>
        <IconButton
          aria-label={t('common.close')}
          onClick={onClose}
          sx={{ color: 'text.primary' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: '0 24px 24px' }}>
        <Alert severity="warning" sx={{ borderRadius: '6px' }}>
          {t('notebook.overwrite.modal.description')}
        </Alert>

        <FileList>
          {fileNames.map(name => (
            <FileItem key={name}>
              <FileTypeIcon fileName={name} />
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
                {name}
              </Typography>
            </FileItem>
          ))}
        </FileList>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'left', padding: 2.5, gap: 1 }}>
        <Button
          variant="contained"
          color="error"
          sx={{ textTransform: 'none', borderRadius: 999 }}
          onClick={onConfirm}
        >
          {t('notebook.overwrite.modal.action')}
        </Button>
        <Button
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
