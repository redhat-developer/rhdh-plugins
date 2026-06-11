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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Button } from '@patternfly/react-core';

import { useDeleteConversation } from '../hooks';
import { useTranslation } from '../hooks/useTranslation';

export const DeleteModal = ({
  isOpen,
  conversationId,
  chatName,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  conversationId: string;
  chatName?: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const { t } = useTranslation();
  const {
    mutateAsync: deleteConversation,
    isError,
    error,
    isPending,
  } = useDeleteConversation();

  const handleDeleteConversation = async () => {
    try {
      await deleteConversation({
        conversation_id: conversationId,
        invalidateCache: false,
      });
      onConfirm();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="delete-modal"
      aria-describedby="delete-modal-confiramtion"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4 },
      }}
    >
      <DialogTitle sx={{ p: '16px 20px', fontStyle: 'inherit' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 5 }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>
            {t('conversation.delete.confirm.title' as any, {
              chatName: chatName || '',
            })}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            title={t('common.close')}
            size="large"
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.primary',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent id="delete-modal-body-confirmation">
        {t('conversation.delete.confirm.message')}
      </DialogContent>
      {isError && (
        <Box sx={{ maxWidth: 650, mx: 2.5 }}>
          <Alert severity="error">{String(error)}</Alert>
        </Box>
      )}
      <DialogActions sx={{ justifyContent: 'left', p: 2.5, gap: 1 }}>
        <Button
          variant="danger"
          onClick={handleDeleteConversation}
          isDisabled={isPending}
        >
          {t('conversation.delete.confirm.action')}
        </Button>
        <Button variant="link" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
