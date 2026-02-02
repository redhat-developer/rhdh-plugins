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

import { TextField } from '@material-ui/core';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
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

import { useConversations } from '../hooks/useConversations';
import { useRenameConversation } from '../hooks/useRenameConversation';
import { useTranslation } from '../hooks/useTranslation';

export const RenameConversationModal = ({
  isOpen,
  onClose,
  conversationId,
}: {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}) => {
  const { t } = useTranslation();
  const {
    mutateAsync: renameConversation,
    isError,
    error,
  } = useRenameConversation();
  const { data: conversations } = useConversations();
  const [chatName, setChatName] = useState<string>('');
  const [originalChatName, setOriginalChatName] = useState<string>('');

  useEffect(() => {
    if (isOpen && conversations) {
      const conversation = conversations.find(
        c => c.conversation_id === conversationId,
      );
      if (conversation) {
        setChatName(conversation.topic_summary);
        setOriginalChatName(conversation.topic_summary);
      } else {
        setChatName('');
        setOriginalChatName('');
      }
    }
  }, [isOpen, conversationId, conversations]);

  const handleChatNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChatName(event.target.value);
  };

  const handleRename = async () => {
    try {
      await renameConversation({
        conversation_id: conversationId,
        newName: chatName,
        invalidateCache: false,
      });
      onClose();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="rename-modal"
      aria-describedby="rename-modal-confirmation"
      fullWidth
    >
      <DialogTitle sx={{ p: '16px 20px', fontStyle: 'inherit' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography component="span" sx={{ fontWeight: 'bold' }}>
            {t('conversation.rename.confirm.title')}
          </Typography>

          <IconButton
            aria-label="close"
            onClick={onClose}
            title={t('common.close')}
            size="large"
            sx={{
              position: 'absolute',
              right: 1,
              top: 1,
              color: 'grey.700',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent id="rename-modal-body-input">
        <TextField
          id="outlined-chat-name-input"
          label={t('conversation.rename.placeholder')}
          onChange={handleChatNameChange}
          fullWidth
          value={chatName}
          style={{ marginTop: '10px' }}
          variant="outlined"
          InputProps={{
            autoFocus: true,
            endAdornment: (
              <IconButton
                aria-label="clear-input"
                onClick={() => setChatName('')}
                edge="end"
              >
                <CancelOutlinedIcon />
              </IconButton>
            ),
          }}
        />
      </DialogContent>
      {isError && (
        <Box maxWidth="650px" marginLeft="20px" marginRight="20px">
          <Alert severity="error">{String(error)}</Alert>
        </Box>
      )}
      <DialogActions style={{ justifyContent: 'left', padding: '20px' }}>
        <Button
          variant="contained"
          sx={{
            textTransform: 'none',
          }}
          disabled={
            chatName.trim() === '' ||
            chatName.trim() === originalChatName.trim()
          }
          onClick={handleRename}
        >
          {t('conversation.rename.confirm.action')}
        </Button>
        <Button
          key="cancel"
          variant="outlined"
          sx={{
            textTransform: 'none',
          }}
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
