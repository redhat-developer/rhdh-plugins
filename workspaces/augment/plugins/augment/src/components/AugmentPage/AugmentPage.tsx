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
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useTheme } from '@mui/material/styles';
import { Content, Page, ErrorBoundary } from '@backstage/core-components';
import { createMinimalScrollbarStyles } from '../../theme/styles';
import { useApi } from '@backstage/core-plugin-api';
import { ChatContainer, type ChatContainerRef } from '../ChatContainer';
import { RightPane } from '../RightPane';
import { augmentApiRef } from '../../api';
import {
  useBranding,
  useChatSessions,
  useStatus,
  useBackendStatus,
  useAdminView,
} from '../../hooks';
import { sanitizeBrandingUrl } from '../../theme/branding';
import { AugmentErrorBoundary } from './AugmentErrorBoundary';
import { AdminOnboardingCard } from './AdminOnboardingCard';
import { SwitchSessionDialog } from './SwitchSessionDialog';
import { SecurityGate } from './SecurityGate';
import { CommandCenterHeader } from './CommandCenterHeader';
import { ProviderOfflineBanner } from './ProviderOfflineBanner';
import { AgentConfigPanel, BrandingPanel, AgentsPanel } from '../AdminPanels';

const AugmentPageContent = () => {
  const theme = useTheme();
  const { branding } = useBranding();
  const adminScrollSx = useMemo(
    () => createMinimalScrollbarStyles(theme),
    [theme],
  );

  useEffect(() => {
    const safeFaviconUrl = sanitizeBrandingUrl(branding.faviconUrl);
    if (!safeFaviconUrl) return undefined;

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const originalHref = link?.href;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = safeFaviconUrl;

    return () => {
      const currentLink =
        document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (currentLink && originalHref) {
        currentLink.href = originalHref;
      }
    };
  }, [branding.faviconUrl]);

  const api = useApi(augmentApiRef);
  const [rightPaneCollapsed, setRightPaneCollapsed] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<string | undefined>();
  const chatContainerRef = useRef<ChatContainerRef>(null);

  const handleCurrentAgentChange = useCallback(
    (agent: string | undefined) => setCurrentAgent(agent),
    [],
  );

  const {
    activeSessionId,
    messages,
    loadingConversation,
    messagesUnavailable,
    sessionRefreshTrigger,
    switchDialogOpen,
    error,
    setError,
    handleNewChat,
    handleMessagesChange,
    handleSessionCreated,
    guardedSelectSession,
    handleSwitchConfirm,
    handleSwitchCancel,
  } = useChatSessions({
    api,
    chatContainerRef,
  });

  // Backend status (security mode, readiness, config errors, admin flag)
  const {
    securityMode,
    securityLoading,
    backendReady,
    configurationErrors,
    isAdmin,
  } = useBackendStatus();

  // Admin view state (chat vs admin mode, panel, banner)
  const {
    viewMode,
    adminPanel,
    setAdminPanel,
    showAdminBanner,
    switchToAdmin,
    switchToChat,
    dismissAdminBanner,
  } = useAdminView({ isAdmin });

  // Continuous status polling (30s interval) for detecting model going offline
  const {
    status: liveStatus,
    loading: statusPollLoading,
    error: statusPollError,
  } = useStatus();

  const toggleRightPane = () => {
    setRightPaneCollapsed(!rightPaneCollapsed);
  };

  // After the initial load succeeds, detect if the AI provider goes offline.
  // This triggers a persistent warning banner so the user doesn't discover the
  // problem only when they try to send a message.
  const providerOffline =
    !securityLoading &&
    !statusPollLoading &&
    backendReady !== false &&
    (liveStatus?.provider.connected === false ||
      (statusPollError !== null && !liveStatus));

  return (
    <Page themeId="tool">
      <Content noPadding stretch>
        <SecurityGate
          securityLoading={securityLoading}
          backendReady={backendReady}
          configurationErrors={configurationErrors}
          securityMode={securityMode}
          branding={branding}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              backgroundColor: theme.palette.background.default,
              overflow: 'hidden',
            }}
          >
            {/* ============================================= */}
            {/* COMMAND CENTER MODE                           */}
            {/* ============================================= */}
            {viewMode === 'admin' && (
              <>
                <CommandCenterHeader
                  adminPanel={adminPanel}
                  onAdminPanelChange={setAdminPanel}
                  onBackToChat={switchToChat}
                />

                {/* Admin Panel Content — position-based containment guarantees
                    the scroll region is bounded even if the flex height chain
                    from the host Backstage app is incomplete. */}
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      overflow: 'auto',
                      ...adminScrollSx,
                    }}
                  >
                    {adminPanel === 'platform' && <AgentConfigPanel />}
                    {adminPanel === 'agents' && <AgentsPanel />}
                    {adminPanel === 'branding' && <BrandingPanel />}
                  </Box>
                </Box>
              </>
            )}

            {/* ============================================= */}
            {/* CHAT MODE                                     */}
            {/* ============================================= */}
            {viewMode === 'chat' && (
              <>
                {/* Chat Content Area — position-based containment guarantees
                    ChatContainer's messages scroll area gets a bounded height,
                    even if the flex chain from the host Backstage app is incomplete. */}
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      overflow: 'hidden',
                    }}
                  >
                    {loadingConversation && (
                      <LinearProgress
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          zIndex: 10,
                          height: 2,
                        }}
                      />
                    )}

                    <ProviderOfflineBanner
                      show={providerOffline}
                      loadingConversation={loadingConversation}
                      statusPollError={statusPollError !== null}
                      appName={branding.appName}
                    />

                    <ErrorBoundary>
                      <ChatContainer
                        ref={chatContainerRef}
                        rightPaneCollapsed={rightPaneCollapsed}
                        messages={messages}
                        onMessagesChange={handleMessagesChange}
                        onNewChat={handleNewChat}
                        onSessionCreated={handleSessionCreated}
                        loadingConversation={loadingConversation}
                        messagesUnavailable={messagesUnavailable}
                        onCurrentAgentChange={handleCurrentAgentChange}
                        activeSessionId={activeSessionId}
                      />

                      <RightPane
                        sidebarCollapsed={rightPaneCollapsed}
                        onToggleSidebar={toggleRightPane}
                        onSelectSession={guardedSelectSession}
                        onActiveSessionDeleted={handleNewChat}
                        activeSessionId={activeSessionId}
                        refreshTrigger={sessionRefreshTrigger}
                        isAdmin={isAdmin}
                        onAdminClick={switchToAdmin}
                        currentAgent={currentAgent}
                      />
                    </ErrorBoundary>

                    {/* First-time admin onboarding card */}
                    {isAdmin && showAdminBanner && (
                      <AdminOnboardingCard
                        branding={branding}
                        onStartChat={dismissAdminBanner}
                        onOpenAdmin={switchToAdmin}
                      />
                    )}

                    {/* Error toast */}
                    <Snackbar
                      open={!!error}
                      autoHideDuration={8000}
                      onClose={() => setError(null)}
                      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                      <Alert
                        severity="error"
                        variant="filled"
                        onClose={() => setError(null)}
                        sx={{ width: '100%' }}
                      >
                        {error}
                      </Alert>
                    </Snackbar>

                    {/* Streaming-in-progress switch confirmation */}
                    <SwitchSessionDialog
                      open={switchDialogOpen}
                      onConfirm={handleSwitchConfirm}
                      onCancel={handleSwitchCancel}
                    />
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </SecurityGate>
      </Content>
    </Page>
  );
};

export const AugmentPage = () => (
  <AugmentErrorBoundary>
    <AugmentPageContent />
  </AugmentErrorBoundary>
);
