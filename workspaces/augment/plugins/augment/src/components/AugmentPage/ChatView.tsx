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

import { useState, useCallback, useEffect, type Ref } from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { ErrorBoundary } from '@backstage/core-components';
import { useApi, discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { ChatContainer, type ChatContainerRef } from '../ChatContainer';
import { RightPane } from '../RightPane';
import { ChatViewModeProvider } from '../../hooks';
import { SwitchSessionDialog } from './SwitchSessionDialog';
import { ProviderOfflineBanner } from './ProviderOfflineBanner';
import { useAppState } from './AppStateProvider';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { MarketplacePage } from '../Marketplace';
import { AgentCreateIntentDialog } from '../AdminPanels/KagentiPanels/AgentCreateIntentDialog';
import { CreateAgentWizard } from '../AdminPanels/KagentiPanels/CreateAgentWizard';
import { ToolCreateIntentDialog } from '../AdminPanels/KagentiPanels/ToolCreateIntentDialog';
import { CreateToolWizard } from '../AdminPanels/KagentiPanels/CreateToolWizard';
import { AgentLifecycleDetail } from '../AdminPanels/KagentiPanels/AgentLifecycleDetail';
import { WorkflowDashboard } from '../WorkflowBuilder/WorkflowDashboard';
import { WorkflowEditor } from '../WorkflowBuilder/WorkflowEditor';
import type { KagentiAgentSummary, WorkflowDefinition } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { WorkflowErrorBoundary } from '../WorkflowBuilder/WorkflowErrorBoundary';
import type { DeploymentMethod } from '../AdminPanels/KagentiPanels/agentWizardTypes';
import type { AdminTourActions } from './AdminLayout';

interface ChatViewProps {
  onOpenGuidedTours?: () => void;
  marketplaceTourActionsRef?: React.MutableRefObject<AdminTourActions>;
}

/**
 * The Front Door experience.
 *
 * Shows the Agent Marketplace as the landing page. All user journeys
 * (browse, chat, create agent) happen here without entering admin mode.
 * Only the Command Center button (visible to admins) exits to admin mode.
 */
export function ChatView({
  onOpenGuidedTours,
  marketplaceTourActionsRef,
}: ChatViewProps = {}) {
  const {
    isAdmin,
    switchToAdmin,
    providerOffline,
    loadingConversation,
    messagesUnavailable,
    messages,
    activeSessionId,
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
    chatContainerRef,
    branding,
    liveStatus,
    kagentiNamespace,
  } = useAppState();

  const discoveryApi = useApi(discoveryApiRef);
  const { fetch: authFetch } = useApi(fetchApiRef);

  const [rightPaneCollapsed, setRightPaneCollapsed] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<string | undefined>();
  const [showMarketplace, setShowMarketplace] = useState(true);
  const [marketplaceRefreshKey, setMarketplaceRefreshKey] = useState(0);

  // Agent creation state (all dialogs live in the front door)
  const [intentDialogOpen, setIntentDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDeployMethod, setWizardDeployMethod] = useState<
    DeploymentMethod | undefined
  >();
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDefinition | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Tool creation state
  const [toolIntentOpen, setToolIntentOpen] = useState(false);
  const [toolWizardOpen, setToolWizardOpen] = useState(false);

  useEffect(() => {
    if (marketplaceTourActionsRef) {
      marketplaceTourActionsRef.current = {
        openAgentIntent: () => setIntentDialogOpen(true),
        selectAgentIntent: (_cardId: string) => {
          setIntentDialogOpen(false);
          setWizardOpen(true);
        },
        openToolIntent: () => setToolIntentOpen(true),
        selectToolDeploy: () => {
          setToolIntentOpen(false);
          setToolWizardOpen(true);
        },
        closeAllDialogs: () => {
          setIntentDialogOpen(false);
          setWizardOpen(false);
          setWizardDeployMethod(undefined);
          setToolIntentOpen(false);
          setToolWizardOpen(false);
        },
        setWizardStep: () => {},
        setDeployMethod: (method: string) =>
          setWizardDeployMethod(method as DeploymentMethod),
      };
    }
  });

  const handleOpenGuidedTour = useCallback(() => {
    onOpenGuidedTours?.();
  }, [onOpenGuidedTours]);

  // Agent detail state (view draft agent details in front door)
  const [detailAgent, setDetailAgent] = useState<KagentiAgentSummary | null>(
    null,
  );

  const handleCurrentAgentChange = useCallback(
    (agent: string | undefined) => setCurrentAgent(agent),
    [],
  );

  const toggleRightPane = () => setRightPaneCollapsed(prev => !prev);

  const handleSwitchToAdmin = useCallback(() => {
    switchToAdmin(undefined);
  }, [switchToAdmin]);

  const handleChatWithAgent = useCallback(
    (agentId: string) => {
      setShowMarketplace(false);
      setDetailAgent(null);
      chatContainerRef.current?.setSelectedModel(agentId);
    },
    [chatContainerRef],
  );

  const handleBackToMarketplace = useCallback(() => {
    setShowMarketplace(true);
  }, []);

  // --- Agent Creation Flow (stays in front door) ---
  const handleOpenCreateAgent = useCallback(() => {
    setIntentDialogOpen(true);
  }, []);

  const handleCloseIntentDialog = useCallback(() => {
    setIntentDialogOpen(false);
  }, []);

  const handleSelectDeploy = useCallback((method?: DeploymentMethod) => {
    setIntentDialogOpen(false);
    setWizardDeployMethod(method);
    setWizardOpen(true);
  }, []);

  const handleSelectConfigure = useCallback(() => {
    setIntentDialogOpen(false);
    setShowMarketplace(false);
    setShowWorkflowBuilder(true);
  }, []);

  const handleWizardBack = useCallback(() => {
    setWizardOpen(false);
    setWizardDeployMethod(undefined);
    setIntentDialogOpen(true);
  }, []);

  const handleCloseWorkflowBuilder = useCallback(() => {
    setShowWorkflowBuilder(false);
    setActiveWorkflow(null);
    setShowMarketplace(true);
  }, []);

  const handleAgentDetail = useCallback((agentId: string) => {
    const parts = agentId.split('/');
    if (parts.length === 2) {
      setDetailAgent({
        namespace: parts[0],
        name: parts[1],
        description: '',
        status: '',
        labels: {},
      } as KagentiAgentSummary);
      setShowMarketplace(false);
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailAgent(null);
    setShowMarketplace(true);
  }, []);

  const handleAgentCreated = useCallback(() => {
    setWizardOpen(false);
    setWizardDeployMethod(undefined);
    setCreateSuccess(
      'Agent created successfully! It will appear in your agents list.',
    );
    setMarketplaceRefreshKey(k => k + 1);
  }, []);

  // --- Tool Creation Flow ---
  const handleOpenCreateTool = useCallback(() => {
    setToolIntentOpen(true);
  }, []);

  const handleToolSelectDeploy = useCallback(() => {
    setToolIntentOpen(false);
    setToolWizardOpen(true);
  }, []);

  const handleToolWizardBack = useCallback(() => {
    setToolWizardOpen(false);
    setToolIntentOpen(true);
  }, []);

  const handleToolCreated = useCallback(() => {
    setToolWizardOpen(false);
    setCreateSuccess(
      'Tool created successfully! It will appear in your My Tools list.',
    );
    setMarketplaceRefreshKey(k => k + 1);
  }, []);

  // Show marketplace overlay
  const showMarketplaceView = showMarketplace;

  return (
    <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
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
          statusPollError={false}
          appName={branding.appName}
        />

        {/* Marketplace Front Door (overlays chat when active) */}
        {showMarketplaceView && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
            }}
          >
            <MarketplacePage
              onChatWithAgent={handleChatWithAgent}
              onCreateAgent={handleOpenCreateAgent}
              onCreateTool={handleOpenCreateTool}
              onAgentDetail={handleAgentDetail}
              isAdmin={isAdmin}
              onOpenCommandCenter={handleSwitchToAdmin}
              onOpenGuidedTour={handleOpenGuidedTour}
              refreshKey={marketplaceRefreshKey}
            />
          </Box>
        )}

        {/* Visual Workflow Builder (full-page, front door) */}
        {showWorkflowBuilder && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 6,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
            }}
          >
            <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Button
                size="small"
                startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
                onClick={handleCloseWorkflowBuilder}
                sx={{ textTransform: 'none' }}
              >
                Back to Marketplace
              </Button>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <WorkflowErrorBoundary>
                {activeWorkflow ? (
                  <WorkflowEditor
                    workflow={activeWorkflow}
                    onBack={() => setActiveWorkflow(null)}
                    onSave={async (wf) => {
                      setActiveWorkflow(wf);
                      try {
                        const baseUrl = await discoveryApi.getBaseUrl('augment');
                        await authFetch(`${baseUrl}/workflows/${wf.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(wf),
                        });
                      } catch { /* silent -- editor still works locally */ }
                    }}
                    onPublish={async () => {
                      if (!activeWorkflow) return;
                      try {
                        const baseUrl = await discoveryApi.getBaseUrl('augment');
                        // 1. Publish the workflow
                        const resp = await authFetch(`${baseUrl}/workflows/${activeWorkflow.id}/publish`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ changelog: 'Published from Agent Builder' }),
                        });
                        if (resp.ok) {
                          const published = await resp.json();
                          setActiveWorkflow(published);
                        }
                        // 2. Submit the workflow-agent for review (registered lifecycle = review queue)
                        const agentId = activeWorkflow.id;
                        await authFetch(`${baseUrl}/agents/${encodeURIComponent(agentId)}/promote`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ targetStage: 'registered' }),
                        });
                        setCreateSuccess('Workflow submitted for review! It will appear in the marketplace once approved.');
                      } catch { /* silent */ }
                    }}
                  />
                ) : (
                  <WorkflowDashboard
                    onOpenWorkflow={(wf) => setActiveWorkflow(wf)}
                    onCreateWorkflow={async (wf) => {
                      setActiveWorkflow(wf);
                      try {
                        const baseUrl = await discoveryApi.getBaseUrl('augment');
                        await authFetch(`${baseUrl}/workflows`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(wf),
                        });
                      } catch { /* silent -- workflow created locally */ }
                    }}
                  />
                )}
              </WorkflowErrorBoundary>
            </Box>
          </Box>
        )}

        {/* Agent Detail View (front door -- for My Agents) */}
        {detailAgent && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 6,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
              overflowY: 'auto',
              p: 3,
            }}
          >
            <AgentLifecycleDetail
              agent={detailAgent}
              onBack={handleCloseDetail}
              onChatWithAgent={handleChatWithAgent}
            />
          </Box>
        )}

        {/* Agent Creation Dialogs (front door -- no admin required) */}
        <AgentCreateIntentDialog
          open={intentDialogOpen}
          onClose={handleCloseIntentDialog}
          onSelectDeploy={handleSelectDeploy}
          onSelectConfigure={handleSelectConfigure}
        />

        <CreateAgentWizard
          open={wizardOpen}
          namespace={kagentiNamespace || undefined}
          initialDeploymentMethod={wizardDeployMethod}
          onClose={handleWizardBack}
          onCreated={handleAgentCreated}
        />

        {/* Tool Creation Dialogs (front door -- no admin required) */}
        <ToolCreateIntentDialog
          open={toolIntentOpen}
          onClose={() => setToolIntentOpen(false)}
          onSelectDeploy={handleToolSelectDeploy}
        />

        <CreateToolWizard
          open={toolWizardOpen}
          namespace={kagentiNamespace || undefined}
          onClose={handleToolWizardBack}
          onCreated={handleToolCreated}
        />

        {/* Chat Experience (always mounted so ref is available) */}
        <ErrorBoundary>
          <ChatViewModeProvider>
            <ChatContainer
              ref={chatContainerRef as Ref<ChatContainerRef>}
              rightPaneCollapsed={rightPaneCollapsed}
              messages={messages}
              onMessagesChange={handleMessagesChange}
              onNewChat={() => {
                handleNewChat();
                handleBackToMarketplace();
              }}
              onSessionCreated={handleSessionCreated}
              loadingConversation={loadingConversation}
              messagesUnavailable={messagesUnavailable}
              onCurrentAgentChange={handleCurrentAgentChange}
              activeSessionId={activeSessionId ?? undefined}
            />

            {!showMarketplaceView && !showWorkflowBuilder && !detailAgent && (
              <RightPane
                sidebarCollapsed={rightPaneCollapsed}
                onToggleSidebar={toggleRightPane}
                onSelectSession={(id: string) => {
                  setShowMarketplace(false);
                  guardedSelectSession(id);
                }}
                onActiveSessionDeleted={() => {
                  handleNewChat();
                  handleBackToMarketplace();
                }}
                activeSessionId={activeSessionId ?? undefined}
                refreshTrigger={sessionRefreshTrigger}
                isAdmin={isAdmin}
                onAdminClick={handleSwitchToAdmin}
                currentAgent={currentAgent}
                messageCount={messages.length}
                providerId={liveStatus?.providerId}
              />
            )}
          </ChatViewModeProvider>
        </ErrorBoundary>

        {/* Success toast after agent creation */}
        <Snackbar
          open={!!createSuccess}
          autoHideDuration={5000}
          onClose={() => setCreateSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setCreateSuccess(null)}
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {createSuccess}
          </Alert>
        </Snackbar>

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

        <SwitchSessionDialog
          open={switchDialogOpen}
          onConfirm={handleSwitchConfirm}
          onCancel={handleSwitchCancel}
        />
      </Box>
    </Box>
  );
}
