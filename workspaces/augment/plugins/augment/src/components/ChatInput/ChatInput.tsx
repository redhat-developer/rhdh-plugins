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

import {
  useMemo,
  useRef,
  useCallback,
  type FC,
  type Ref,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { createChatInputStyles } from './styles';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Props for the ChatInput component
 */
export interface ChatInputProps {
  /** Current input value */
  value: string;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Callback when send button is clicked or Enter is pressed */
  onSend: () => void;
  /** Callback when stop button is clicked */
  onStop: () => void;
  /** Callback when new chat button is clicked */
  onNewChat?: () => void;
  /** Callback when a file is selected for upload */
  onFileSelect?: (file: File) => void;
  /** Currently attached file (pending upload) */
  attachedFile?: File | null;
  /** Callback to clear the attached file */
  onClearFile?: () => void;
  /** Placeholder text for the input */
  placeholder: string;
  /** Whether the AI is currently generating a response */
  isTyping: boolean;
  /** Whether to show the new chat button */
  showNewChatButton?: boolean;
  /** Whether file upload is enabled */
  enableFileUpload?: boolean;
  /** Ref to the underlying textarea for programmatic focus */
  inputRef?: Ref<HTMLTextAreaElement>;
  /** Name of the currently active agent (multi-agent conversations) */
  activeAgentName?: string;
  /** The selected model/agent ID (e.g. namespace/name) */
  selectedModel?: string;
  /** Whether this is a Kagenti provider */
  isKagenti?: boolean;
  /** Called when user clears the agent selection */
  onClearAgent?: () => void;
  /** When true, sending is blocked until the user selects an agent */
  requireAgent?: boolean;
}

/**
 * ChatInput - Input component for the chat interface
 * Handles text input, send/stop buttons, and new chat button
 */
export const ChatInput: FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  onNewChat,
  onFileSelect,
  attachedFile,
  onClearFile,
  placeholder,
  isTyping,
  showNewChatButton = false,
  enableFileUpload = false,
  inputRef,
  activeAgentName,
  selectedModel,
  isKagenti = false,
  onClearAgent,
  requireAgent = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles = useMemo(
    () => createChatInputStyles(theme, isTyping, requireAgent),
    [theme, isTyping, requireAgent],
  );

  const hasValue = value.trim().length > 0;
  const canSend = hasValue && !requireAgent;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onFileSelect) {
        onFileSelect(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFileSelect],
  );

  return (
    <Box sx={styles.container}>
      <Box sx={styles.centeredWrapper}>
        <Box sx={styles.inputRow}>
          {/* New Chat Button */}
          {onNewChat && showNewChatButton && (
            <Tooltip
              title={t('chatInput.newConversationShortcut')}
              placement="top"
            >
              <Box component="span">
                <IconButton
                  onClick={onNewChat}
                  disabled={isTyping}
                  aria-label={t('chatInput.startNewConversation')}
                  sx={styles.newChatButton}
                >
                  <AddIcon sx={styles.newChatIcon} />
                </IconButton>
              </Box>
            </Tooltip>
          )}

          {/* Input Pill */}
          <Box sx={styles.inputPill}>
            {/* Hidden file input */}
            {enableFileUpload && onFileSelect && (
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.pdf,.json,.yaml,.yml"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
            )}

            {/* File attachment button */}
            {enableFileUpload && onFileSelect && !isTyping && (
              <Tooltip title={t('chatInput.attachFile')} placement="top">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={t('chatInput.attachFile')}
                  sx={{
                    p: 0.5,
                    color: theme.palette.text.secondary,
                    flexShrink: 0,
                    '&:hover': { color: theme.palette.text.primary },
                  }}
                >
                  <AttachFileIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}

            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
              }}
            >
              {/* Active agent indicator */}
              {(activeAgentName || selectedModel) && (
                <Chip
                  icon={
                    <Box
                      component="span"
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: theme.palette.success.main,
                        ml: 0.5,
                      }}
                    />
                  }
                  label={
                    activeAgentName ||
                    (selectedModel?.includes('/')
                      ? selectedModel.split('/').pop()
                      : selectedModel)
                  }
                  size="small"
                  variant="outlined"
                  onDelete={onClearAgent}
                  sx={{
                    alignSelf: 'flex-start',
                    mb: 0.5,
                    maxWidth: '100%',
                    fontSize: '0.7rem',
                    height: 24,
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    '& .MuiChip-deleteIcon': {
                      fontSize: 14,
                      color: theme.palette.text.secondary,
                      '&:hover': { color: theme.palette.text.primary },
                    },
                  }}
                />
              )}
              {/* Prompt to select agent when none chosen */}
              {isKagenti && !activeAgentName && !selectedModel && !isTyping && (
                <Typography
                  variant="caption"
                  sx={{
                    alignSelf: 'flex-start',
                    mb: 0.5,
                    fontSize: '0.7rem',
                    color: theme.palette.text.disabled,
                    fontStyle: 'italic',
                  }}
                >
                  {t('chatInput.selectAgentPrompt')}
                </Typography>
              )}
              {/* Attached file indicator */}
              {attachedFile && (
                <Chip
                  label={attachedFile.name}
                  size="small"
                  onDelete={onClearFile}
                  sx={{
                    alignSelf: 'flex-start',
                    mb: 0.5,
                    maxWidth: '100%',
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              )}
              <TextField
                sx={styles.textField}
                placeholder={placeholder}
                variant="outlined"
                multiline
                minRows={1}
                maxRows={8}
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                fullWidth
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                inputRef={inputRef}
                inputProps={{
                  'aria-label': t('chatInput.chatMessageInput'),
                }}
              />
            </Box>

            {isTyping ? (
              <IconButton
                sx={styles.stopButton}
                onClick={onStop}
                title={t('chatInput.stopGeneration')}
                aria-label={t('chatInput.stopMessageGeneration')}
              >
                <StopIcon sx={{ fontSize: 18 }} />
              </IconButton>
            ) : (
              <Tooltip
                title={requireAgent ? t('chatInput.selectAgentPrompt') : ''}
                placement="top"
              >
                <Box component="span">
                  <IconButton
                    sx={styles.createSendButton(canSend)}
                    onClick={onSend}
                    disabled={!canSend}
                    aria-label={t('chatInput.sendMessage')}
                  >
                    <SendIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
