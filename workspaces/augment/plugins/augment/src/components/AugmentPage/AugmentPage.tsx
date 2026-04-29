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
import { typography } from '../../theme/tokens';
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
  ChatViewModeProvider,
  type AdminPanel,
} from '../../hooks';
import { sanitizeBrandingUrl } from '../../theme/branding';
import { AugmentErrorBoundary } from './AugmentErrorBoundary';
import { AdminOnboardingCard } from './AdminOnboardingCard';
import { SwitchSessionDialog } from './SwitchSessionDialog';
import { SecurityGate } from './SecurityGate';
import { CommandCenterHeader } from './CommandCenterHeader';
import { ProviderOfflineBanner } from './ProviderOfflineBanner';
import { AgentConfigPanel, BrandingPanel, AgentsPanel } from '../AdminPanels';
import {
  KagentiAgentsPanel,
  KagentiToolsPanel,
  KagentiAdminPanel,
  KagentiDashboardLinks,
  KagentiHomeDashboard,
  KagentiBuildPipelinePanel,
  KagentiSandboxPanel,
} from '../AdminPanels/KagentiPanels';
import { DocsPanel } from '../AdminPanels/DocsPanel';
import { AgentRegistryPanel } from '../AdminPanels/AgentRegistryPanel';
import { KagentiSidebar } from './KagentiSidebar';
import { TourProvider } from '../AdminPanels/shared/TourProvider';
import {
  TourControllerProvider,
  type TourControllerCallbacks,
} from '../AdminPanels/shared/TourController';
import type { AgentPanelTourControl } from '../AdminPanels/KagentiPanels/KagentiAgentsPanel';
import type { ToolPanelTourControl } from '../AdminPanels/KagentiPanels/KagentiToolsPanel';
import {
  TourLauncherDialog,
  useFirstVisitTourDialog,
} from '../AdminPanels/shared/TourLauncherDialog';

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
  const [kagentiNamespace, setKagentiNamespace] = useState<string>(() => {
    try {
      return sessionStorage.getItem('augment:kagenti-ns') || '';
    } catch {
      return '';
    }
  });
  const handleNamespaceChange = useCallback((ns: string) => {
    setKagentiNamespace(ns);
    try {
      sessionStorage.setItem('augment:kagenti-ns', ns);
    } catch {
      /* noop */
    }
  }, []);

  // Default is "All namespaces" (empty string). Only restore from
  // sessionStorage if the user previously made an explicit choice.
  // We no longer auto-select a single namespace on first load.

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
    refresh: refreshStatus,
  } = useStatus();

  // Immediately refresh status when the provider is switched via ProviderSelector
  useEffect(() => {
    const handler = () => {
      refreshStatus();
    };
    window.addEventListener('augment:provider-switched', handler);
    return () =>
      window.removeEventListener('augment:provider-switched', handler);
  }, [refreshStatus]);

  // Normalize adminPanel when the active provider changes.
  // Maps between Kagenti-specific and generic panel ids so the UI
  // never renders an empty content area after a provider switch.
  const prevProviderRef = useRef(liveStatus?.providerId);
  useEffect(() => {
    const currentProvider = liveStatus?.providerId;
    const prevProvider = prevProviderRef.current;
    prevProviderRef.current = currentProvider;

    if (!currentProvider || currentProvider === prevProvider) return;

    if (currentProvider === 'kagenti') {
      const panelMap: Record<string, AdminPanel> = {
        platform: 'kagenti-platform',
        agents: 'kagenti-agents',
        branding: 'kagenti-branding',
      };
      setAdminPanel(panelMap[adminPanel] ?? 'kagenti-home');
    } else if (prevProvider === 'kagenti') {
      const panelMap: Record<string, AdminPanel> = {
        'kagenti-platform': 'platform',
        'kagenti-agents': 'agents',
        'kagenti-branding': 'branding',
        'kagenti-home': 'platform',
        'kagenti-tools': 'platform',
        'kagenti-builds': 'platform',
        'kagenti-sandbox': 'platform',
        'kagenti-dashboards': 'platform',
        'kagenti-admin': 'platform',
        'kagenti-registry': 'platform',
        'kagenti-docs': 'platform',
      };
      setAdminPanel(panelMap[adminPanel] ?? 'platform');
    }
  }, [liveStatus?.providerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChatWithAgent = useCallback(
    (agentId: string) => {
      switchToChat();
      chatContainerRef.current?.setSelectedModel(agentId);
    },
    [switchToChat],
  );

  const handleSwitchToAdmin = useCallback(() => {
    switchToAdmin(liveStatus?.providerId);
  }, [switchToAdmin, liveStatus?.providerId]);

  const [pendingCreateAgent, setPendingCreateAgent] = useState(false);
  const [focusTarget, setFocusTarget] = useState<string | undefined>();
  const tourDialog = useFirstVisitTourDialog();

  const agentTourRef = useRef<AgentPanelTourControl | null>(null);
  const toolTourRef = useRef<ToolPanelTourControl | null>(null);

  const tourCallbacks = useMemo<TourControllerCallbacks>(
    () => ({
      navigatePanel: (panel: AdminPanel) => {
        setFocusTarget(undefined);
        setAdminPanel(panel);
      },
      openAgentIntent: () => {
        agentTourRef.current?.openIntent();
      },
      selectAgentIntent: (cardId: string) => {
        agentTourRef.current?.selectIntent(cardId);
      },
      openToolIntent: () => {
        toolTourRef.current?.openIntent();
      },
      selectToolDeploy: () => {
        toolTourRef.current?.selectDeploy();
      },
      closeAllDialogs: () => {
        agentTourRef.current?.closeIntent();
        agentTourRef.current?.closeWizard();
        toolTourRef.current?.closeIntent();
        toolTourRef.current?.closeWizard();
      },
      setWizardStep: (step: number) => {
        agentTourRef.current?.setWizardStep(step);
        toolTourRef.current?.setWizardStep(step);
      },
      setDeployMethod: (method: string) => {
        agentTourRef.current?.setDeployMethod(method);
      },
      returnToGuidedExperience: () => {
        setAdminPanel('kagenti-home');
        setTimeout(() => tourDialog.openDialog(), 300);
      },
    }),
    [setAdminPanel, tourDialog],
  );
  const handleCreateAgent = useCallback(() => {
    setFocusTarget(undefined);
    setAdminPanel('kagenti-agents');
    setPendingCreateAgent(true);
  }, [setAdminPanel]);
  const handleIntentOpened = useCallback(() => {
    setPendingCreateAgent(false);
  }, []);
  const handleNavigateWithFocus = useCallback(
    (panel: AdminPanel, name?: string) => {
      setFocusTarget(name);
      setAdminPanel(panel);
    },
    [setAdminPanel],
  );

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
              fontFamily: typography.fontFamily.primary,
              '& *': {
                fontFamily: 'inherit',
              },
              '& code, & pre, & .MuiChip-label': {
                fontFamily: typography.fontFamily.mono,
              },
            }}
          >
            {/* ============================================= */}
            {/* COMMAND CENTER MODE                           */}
            {/* ============================================= */}
            {isAdmin && viewMode === 'admin' && !liveStatus && (
              <Box
                sx={{
                  display: 'flex',
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LinearProgress sx={{ width: 200 }} />
              </Box>
            )}
            {isAdmin &&
              viewMode === 'admin' &&
              liveStatus?.providerId === 'kagenti' && (
                <TourControllerProvider callbacks={tourCallbacks}>
                  <TourProvider>
                    <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
                      <KagentiSidebar
                        adminPanel={adminPanel}
                        onAdminPanelChange={setAdminPanel}
                        onBackToChat={switchToChat}
                        kagentiNamespace={kagentiNamespace}
                        onKagentiNamespaceChange={handleNamespaceChange}
                      />
                      <TourLauncherDialog
                        open={tourDialog.open}
                        onClose={tourDialog.close}
                      />
                      <Box
                        sx={{
                          flex: 1,
                          minHeight: 0,
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            minHeight: 0,
                            position: 'relative',
                          }}
                        >
                          <Box
                            key={adminPanel}
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              overflow: 'auto',
                              p: 3,
                              animation: 'fadeSlideIn 0.2s ease-out',
                              '@keyframes fadeSlideIn': {
                                '0%': {
                                  opacity: 0,
                                  transform: 'translateY(4px)',
                                },
                                '100%': {
                                  opacity: 1,
                                  transform: 'translateY(0)',
                                },
                              },
                              ...adminScrollSx,
                            }}
                          >
                            {adminPanel === 'kagenti-home' && (
                              <KagentiHomeDashboard
                                namespace={kagentiNamespace || undefined}
                                onNavigate={handleNavigateWithFocus}
                                onCreateAgent={handleCreateAgent}
                                onHelpTours={tourDialog.openDialog}
                              />
                            )}
                            {adminPanel === 'kagenti-agents' && (
                              <KagentiAgentsPanel
                                namespace={kagentiNamespace || undefined}
                                onChatWithAgent={handleChatWithAgent}
                                autoOpenIntent={pendingCreateAgent}
                                onIntentOpened={handleIntentOpened}
                                initialAgentName={focusTarget}
                                onFocusConsumed={() =>
                                  setFocusTarget(undefined)
                                }
                                tourControlRef={agentTourRef}
                              />
                            )}
                            {adminPanel === 'kagenti-tools' && (
                              <KagentiToolsPanel
                                namespace={kagentiNamespace || undefined}
                                initialToolName={focusTarget}
                                onFocusConsumed={() =>
                                  setFocusTarget(undefined)
                                }
                                tourControlRef={toolTourRef}
                              />
                            )}
                            {adminPanel === 'kagenti-builds' && (
                              <KagentiBuildPipelinePanel
                                namespace={kagentiNamespace || undefined}
                              />
                            )}
                            {adminPanel === 'kagenti-sandbox' &&
                              kagentiNamespace && (
                                <KagentiSandboxPanel
                                  namespace={kagentiNamespace}
                                />
                              )}
                            {adminPanel === 'kagenti-sandbox' &&
                              !kagentiNamespace && (
                                <Box sx={{ py: 4, maxWidth: 520 }}>
                                  <Alert severity="info" variant="outlined">
                                    <strong>Namespace required</strong> — use
                                    the namespace dropdown at the top of the
                                    sidebar to select a target namespace, then
                                    return here to manage sandbox sessions.
                                  </Alert>
                                </Box>
                              )}
                            {adminPanel === 'kagenti-platform' && (
                              <AgentConfigPanel />
                            )}
                            {adminPanel === 'kagenti-dashboards' && (
                              <KagentiDashboardLinks
                                namespace={kagentiNamespace || undefined}
                              />
                            )}
                            {adminPanel === 'kagenti-admin' && (
                              <KagentiAdminPanel
                                namespace={kagentiNamespace || undefined}
                              />
                            )}
                            {adminPanel === 'kagenti-branding' && (
                              <BrandingPanel />
                            )}
                            {adminPanel === 'kagenti-registry' && (
                              <AgentRegistryPanel />
                            )}
                            {adminPanel === 'kagenti-docs' && <DocsPanel />}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </TourProvider>
                </TourControllerProvider>
              )}

            {isAdmin &&
              viewMode === 'admin' &&
              liveStatus?.providerId !== 'kagenti' && (
                <>
                  <CommandCenterHeader
                    adminPanel={adminPanel}
                    onAdminPanelChange={setAdminPanel}
                    onBackToChat={switchToChat}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      position: 'relative',
                    }}
                  >
                    <Box
                      key={adminPanel}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'auto',
                        animation: 'fadeSlideIn 0.2s ease-out',
                        '@keyframes fadeSlideIn': {
                          '0%': { opacity: 0, transform: 'translateY(4px)' },
                          '100%': { opacity: 1, transform: 'translateY(0)' },
                        },
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
                      <ChatViewModeProvider>
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
                          onAdminClick={handleSwitchToAdmin}
                          currentAgent={currentAgent}
                          messageCount={messages.length}
                          providerId={liveStatus?.providerId}
                        />
                      </ChatViewModeProvider>
                    </ErrorBoundary>

                    {/* First-time admin onboarding card */}
                    {isAdmin && showAdminBanner && (
                      <AdminOnboardingCard
                        branding={branding}
                        onStartChat={dismissAdminBanner}
                        onOpenAdmin={handleSwitchToAdmin}
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
