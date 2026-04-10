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
import { useState, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';
import { useApi } from '@backstage/core-plugin-api';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { ConversationHistory } from '../ConversationHistory';
import { RightPaneHeader } from './RightPaneHeader';
import { CollapsedSidebar } from './CollapsedSidebar';
import { useStatus } from '../../hooks';
import { augmentApiRef } from '../../api';
import { AgentInfoSection } from './AgentInfoSection';
import { SessionStateInspector } from '../SessionStateInspector';

interface RightPaneProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSelectSession?: (
    sessionId: string,
    adminView?: boolean,
    sessionModel?: string,
  ) => void;
  onActiveSessionDeleted?: () => void;
  activeSessionId?: string;
  refreshTrigger?: number;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  currentAgent?: string;
  messageCount?: number;
  providerId?: string;
}

export const RightPane = ({
  sidebarCollapsed,
  onToggleSidebar,
  onSelectSession,
  onActiveSessionDeleted,
  activeSessionId,
  refreshTrigger,
  isAdmin = false,
  onAdminClick,
  currentAgent,
  messageCount,
  providerId,
}: RightPaneProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { status, loading } = useStatus();
  const isDark = theme.palette.mode === 'dark';
  const [agentExpanded, setAgentExpanded] = useState(false);
  const api = useApi(augmentApiRef);
  const [sessionState, setSessionState] = useState<
    Record<string, unknown> | undefined
  >();

  const handleRefreshState = useCallback(() => {
    if (!activeSessionId) return;
    api.getSessionState(activeSessionId).then(
      state => setSessionState(state),
      () => setSessionState(undefined),
    );
  }, [api, activeSessionId]);

  const providerConnected = status?.provider.connected ?? false;
  const overallReady = !loading && providerConnected;

  // Drag-resizable width
  const MIN_WIDTH = 280;
  const MAX_WIDTH = 600;
  const DEFAULT_WIDTH = 340;
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || sidebarCollapsed) return;
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = panelWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [isMobile, sidebarCollapsed, panelWidth],
  );

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, startWidth.current + delta),
      );
      setPanelWidth(newWidth);
    }
    function handleMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleSelectSession = useCallback(
    (sessionId: string, adminView?: boolean, sessionModel?: string) => {
      onSelectSession?.(sessionId, adminView, sessionModel);
      if (isMobile) {
        onToggleSidebar();
      }
    },
    [onSelectSession, isMobile, onToggleSidebar],
  );

  const shadowAlpha = isDark ? 0.2 : 0.05;
  const boxShadow = isMobile
    ? 'none'
    : `-2px 0 8px ${alpha(theme.palette.common.black, shadowAlpha)}`;

  const expandedWidth = isMobile ? '300px' : `${panelWidth}px`;

  const panelContent = (
    <Box
      sx={{
        width: sidebarCollapsed ? '56px' : expandedWidth,
        backgroundColor: theme.palette.background.default,
        borderLeft: isMobile
          ? 'none'
          : `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        display: 'flex',
        flexDirection: 'column',
        // eslint-disable-next-line no-nested-ternary
        transition: isDragging.current
          ? 'none'
          : isMobile
            ? 'none'
            : 'width 0.3s ease',
        ...(!isMobile && {
          position: 'absolute' as const,
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
        }),
        height: isMobile ? '100%' : undefined,
        overflow: 'hidden',
        boxShadow,
      }}
    >
      {/* Drag handle (left edge) */}
      {!isMobile && !sidebarCollapsed && (
        <Box
          onMouseDown={handleDragStart}
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            cursor: 'col-resize',
            zIndex: 20,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.25),
            },
            '&:active': {
              bgcolor: alpha(theme.palette.primary.main, 0.4),
            },
            transition: 'background-color 0.15s ease',
          }}
        />
      )}

      {/* Header */}
      <RightPaneHeader
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        theme={theme}
      />

      {/* Expanded Content */}
      {!sidebarCollapsed && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Conversation History -- single scroll owner is inside ConversationHistory */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              p: 2,
            }}
          >
            <ConversationHistory
              onSelectSession={handleSelectSession}
              onActiveSessionDeleted={onActiveSessionDeleted}
              activeSessionId={activeSessionId}
              refreshTrigger={refreshTrigger}
              isAdmin={isAdmin}
              providerId={providerId}
            />
          </Box>

          {/* Admin Command Center — sidebar footer */}
          {isAdmin && onAdminClick && (
            <Box
              onClick={onAdminClick}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (e.key === ' ') e.preventDefault();
                  onAdminClick();
                }
              }}
              aria-label="Open Command Center"
              sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mx: 1.5,
                mb: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: 1.5,
                cursor: 'pointer',
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                transition: 'all 0.15s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  borderColor: alpha(theme.palette.primary.main, 0.25),
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <AdminPanelSettingsIcon
                sx={{
                  fontSize: 17,
                  color: theme.palette.primary.main,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  lineHeight: 1,
                  flex: 1,
                }}
              >
                Command Center
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.625rem',
                  color: alpha(theme.palette.primary.main, 0.6),
                  lineHeight: 1,
                }}
              >
                Admin
              </Typography>
            </Box>
          )}

          {/* Agent Info — flat status list */}
          <AgentInfoSection
            expanded={agentExpanded}
            onToggleExpanded={() => setAgentExpanded(prev => !prev)}
            currentAgent={currentAgent}
          />

          {/* Session State Inspector — debug info */}
          <SessionStateInspector
            activeSessionId={activeSessionId}
            messageCount={messageCount}
            currentAgent={currentAgent}
            sessionState={sessionState}
            onRefreshState={activeSessionId ? handleRefreshState : undefined}
          />
        </Box>
      )}

      {/* Collapsed State */}
      {sidebarCollapsed && (
        <CollapsedSidebar
          overallReady={overallReady}
          loading={loading}
          theme={theme}
          isAdmin={isAdmin}
          onAdminClick={onAdminClick}
        />
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="right"
        open={!sidebarCollapsed}
        onClose={onToggleSidebar}
        PaperProps={{
          sx: {
            width: 300,
            backgroundColor: theme.palette.background.default,
          },
        }}
      >
        {panelContent}
      </Drawer>
    );
  }

  return panelContent;
};
