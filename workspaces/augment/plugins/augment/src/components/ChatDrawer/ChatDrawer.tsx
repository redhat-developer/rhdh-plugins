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

import { type Ref } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { useTheme, alpha } from '@mui/material/styles';
import { ErrorBoundary } from '@backstage/core-components';
import { ChatContainer, type ChatContainerRef } from '../ChatContainer';
import { ChatViewModeProvider } from '../../hooks';
import { glassSurface, typeScale } from '../../theme/tokens';
import { useAppState } from '../AugmentPage/AppStateProvider';

const DRAWER_WIDTH = 420;

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  onExpandFullPage: () => void;
}

/**
 * A persistent slide-out chat drawer accessible from any admin view.
 * Uses the shared ChatContainer in a compact layout.
 */
export function ChatDrawer({ open, onClose, onExpandFullPage }: ChatDrawerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const {
    chatContainerRef,
    messages,
    handleMessagesChange,
    handleNewChat,
    handleSessionCreated,
    loadingConversation,
    messagesUnavailable,
    activeSessionId,
  } = useAppState();

  const glass = glassSurface(theme, 12, isDark ? 0.85 : 0.92);

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          ...glass,
          borderLeft: `1px solid ${alpha(theme.palette.divider, isDark ? 0.2 : 0.12)}`,
          position: 'relative',
        },
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.15 : 0.08)}`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            fontSize: typeScale.body.fontSize,
            color: theme.palette.text.primary,
          }}
        >
          Chat
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Expand to full page">
            <IconButton size="small" onClick={onExpandFullPage}>
              <OpenInFullIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close chat">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Chat Content */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <ErrorBoundary>
          <ChatViewModeProvider>
            <ChatContainer
              ref={chatContainerRef as Ref<ChatContainerRef>}
              rightPaneCollapsed
              messages={messages}
              onMessagesChange={handleMessagesChange}
              onNewChat={handleNewChat}
              onSessionCreated={handleSessionCreated}
              loadingConversation={loadingConversation}
              messagesUnavailable={messagesUnavailable}
              activeSessionId={activeSessionId ?? undefined}
            />
          </ChatViewModeProvider>
        </ErrorBoundary>
      </Box>
    </Drawer>
  );
}
