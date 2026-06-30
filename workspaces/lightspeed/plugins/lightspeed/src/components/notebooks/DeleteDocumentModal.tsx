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
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslation } from '../../hooks/useTranslation';
import { Trans } from '../Trans';

type DeleteDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentName: string;
};

export const DeleteDocumentModal = ({
  isOpen,
  onClose,
  onConfirm,
  documentName,
}: DeleteDocumentModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="delete-document-modal"
      aria-describedby="delete-document-modal-body"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4 },
      }}
    >
      <DialogTitle sx={{ padding: '16px 20px', fontStyle: 'inherit' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>
            {t('notebook.document.delete.title')}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            title={t('common.close')}
            size="large"
            sx={{
              position: 'absolute',
              right: theme => theme.spacing(1),
              top: theme => theme.spacing(1),
              color: 'text.primary',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent id="delete-document-modal-body" sx={{ paddingTop: 0 }}>
        <Typography variant="body2">
          <Trans
            message="notebook.document.delete.description"
            components={{
              '<documentName/>': <strong>{documentName}</strong>,
            }}
          />
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'left', padding: 2.5, gap: 1 }}>
        <Button
          variant="contained"
          color="error"
          sx={{ textTransform: 'none', borderRadius: 999 }}
          onClick={onConfirm}
        >
          {t('notebook.document.delete.action')}
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
