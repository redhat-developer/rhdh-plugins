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

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { animations as tokenAnimations } from '../../theme/tokens';
import { useAppState } from './AppStateProvider';
import { CommandCenterHeader } from './CommandCenterHeader';
import { CommandBar, ReviewQueue, ToolReviewQueue } from '../CommandCenter';
import { NamespacePicker } from '../AdminPanels/KagentiPanels';
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
import { OpsOverview } from '../CommandCenter';
import type { AgentPanelTourControl } from '../AdminPanels/KagentiPanels/KagentiAgentsPanel';
import type { ToolPanelTourControl } from '../AdminPanels/KagentiPanels/KagentiToolsPanel';
import type { AdminPanel } from '../../hooks';

export interface AdminTourActions {
  openAgentIntent: () => void;
  selectAgentIntent: (cardId: string) => void;
  openToolIntent: () => void;
  selectToolDeploy: () => void;
  closeAllDialogs: () => void;
  setWizardStep: (step: number) => void;
  setDeployMethod: (method: string) => void;
}

interface AdminLayoutProps {
  adminScrollSx: Record<string, unknown>;
  onOpenGuidedTours: () => void;
  adminTourActionsRef: React.MutableRefObject<AdminTourActions>;
}

const AGENTS_PANELS: AdminPanel[] = [
  'ops-review-queue',
  'ops-registry',
  'kagenti-builds',
];
const PLATFORM_PANELS: AdminPanel[] = [
  'kagenti-tools',
  'ops-tool-review',
  'ops-platform',
  'ops-observability',
];
const SETTINGS_PANELS: AdminPanel[] = ['ops-branding', 'ops-admin', 'ops-docs'];

/**
 * Admin layout with sidebar + content area.
 * Renders the appropriate sidebar (provider-aware) and panel content
 * based on the current adminPanel state.
 */
export function AdminLayout({
  adminScrollSx,
  onOpenGuidedTours,
  adminTourActionsRef,
}: AdminLayoutProps) {
  const {
    liveStatus,
    adminPanel,
    setAdminPanel,
    switchToChat,
    kagentiNamespace,
    handleNamespaceChange,
    chatContainerRef,
  } = useAppState();

  const isFullProvider = liveStatus?.providerId === 'kagenti';

  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [pendingCreateAgent, setPendingCreateAgent] = useState(false);
  const [focusTarget, setFocusTarget] = useState<string | undefined>();

  const agentTourRef = useRef<AgentPanelTourControl | null>(null);
  const toolTourRef = useRef<ToolPanelTourControl | null>(null);

  useEffect(() => {
    adminTourActionsRef.current = {
      openAgentIntent: () => agentTourRef.current?.openIntent(),
      selectAgentIntent: (cardId: string) =>
        agentTourRef.current?.selectIntent(cardId),
      openToolIntent: () => toolTourRef.current?.openIntent(),
      selectToolDeploy: () => toolTourRef.current?.selectDeploy(),
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
      setDeployMethod: (method: string) =>
        agentTourRef.current?.setDeployMethod(method),
    };
  });

  const handleFullScreenChange = useCallback((fullScreen: boolean) => {
    setSidebarHidden(fullScreen);
  }, []);

  const handleNavigateWithFocus = useCallback(
    (panel: AdminPanel, name?: string) => {
      setFocusTarget(name);
      setAdminPanel(panel);
    },
    [setAdminPanel],
  );

  const handleCreateAgent = useCallback(() => {
    setFocusTarget(undefined);
    setAdminPanel('kagenti-agents');
    setPendingCreateAgent(true);
  }, [setAdminPanel]);

  const handleIntentOpened = useCallback(() => {
    setPendingCreateAgent(false);
  }, []);

  const handleChatWithAgent = useCallback(
    (agentId: string) => {
      switchToChat();
      chatContainerRef.current?.setSelectedModel(agentId);
    },
    [switchToChat, chatContainerRef],
  );

  const handleOpenTours = useCallback(() => {
    onOpenGuidedTours();
  }, [onOpenGuidedTours]);

  const namespacePicker = handleNamespaceChange ? (
    <NamespacePicker
      value={kagentiNamespace || ''}
      onChange={handleNamespaceChange}
      size="small"
      fullWidth
      variant="minimal"
    />
  ) : undefined;

  // 4 grouped command bar tabs
  const commandBarItems = useMemo(
    () => [
      { id: 'ops-home' as AdminPanel, label: 'Overview' },
      { id: 'ops-review-queue' as AdminPanel, label: 'Agents' },
      { id: 'ops-platform' as AdminPanel, label: 'Platform' },
      { id: 'ops-branding' as AdminPanel, label: 'Settings' },
    ],
    [],
  );

  // Determine which top-level tab is active based on current panel
  const activeTopTab = useMemo(() => {
    if (adminPanel === 'ops-home' || adminPanel === 'kagenti-home')
      return 'ops-home';
    if (AGENTS_PANELS.includes(adminPanel)) return 'ops-review-queue';
    if (PLATFORM_PANELS.includes(adminPanel)) return 'ops-platform';
    if (SETTINGS_PANELS.includes(adminPanel)) return 'ops-branding';
    return 'ops-home';
  }, [adminPanel]);

  const handleTopTabChange = useCallback(
    (panel: AdminPanel) => {
      // When switching top tabs, go to the first sub-panel of that group
      if (panel === 'ops-review-queue' && !AGENTS_PANELS.includes(adminPanel))
        setAdminPanel('ops-review-queue');
      else if (
        panel === 'ops-platform' &&
        !PLATFORM_PANELS.includes(adminPanel)
      )
        setAdminPanel('ops-platform');
      else if (
        panel === 'ops-branding' &&
        !SETTINGS_PANELS.includes(adminPanel)
      )
        setAdminPanel('ops-branding');
      else setAdminPanel(panel);
    },
    [adminPanel, setAdminPanel],
  );

  // Full provider with command bar navigation
  if (isFullProvider) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {!sidebarHidden && (
          <CommandBar
            items={commandBarItems}
            activePanel={activeTopTab as AdminPanel}
            onNavigate={handleTopTabChange}
            onBackToMarketplace={switchToChat}
            onOpenGuidedTours={handleOpenTours}
          />
        )}
        {/* Scrollable content area -- ONE centering container for sub-tabs + content */}
        <Box
          key={adminPanel}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: sidebarHidden ? 'hidden' : 'auto',
            overflowX: 'hidden',
            ...tokenAnimations.fadeSlideIn,
            ...(sidebarHidden ? {} : adminScrollSx),
          }}
        >
          <Box
            sx={{
              maxWidth: 960,
              width: '100%',
              minWidth: 0,
              px: { xs: 2, sm: 4, md: 5 },
              py: 3,
            }}
          >
            {/* Sub-tabs -- same container as content, same left edge */}
            {AGENTS_PANELS.includes(adminPanel) && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  mb: 2.5,
                  pb: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                  alignItems: 'center',
                }}
              >
                {[
                  {
                    id: 'ops-review-queue' as AdminPanel,
                    label: 'Review Queue',
                    tour: 'subtab-review-queue',
                  },
                  {
                    id: 'ops-registry' as AdminPanel,
                    label: 'Registry',
                    tour: 'subtab-registry',
                  },
                  {
                    id: 'kagenti-builds' as AdminPanel,
                    label: 'Builds',
                    tour: 'subtab-builds',
                  },
                ].map(t => (
                  <Box
                    key={t.id}
                    data-tour={t.tour}
                    onClick={() => setAdminPanel(t.id)}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: adminPanel === t.id ? 700 : 500,
                      color:
                        adminPanel === t.id ? 'primary.main' : 'text.secondary',
                      bgcolor:
                        adminPanel === t.id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {t.label}
                  </Box>
                ))}
                {namespacePicker && (
                  <Box sx={{ ml: 'auto', maxWidth: 180 }}>
                    {namespacePicker}
                  </Box>
                )}
              </Box>
            )}
            {PLATFORM_PANELS.includes(adminPanel) && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  mb: 2.5,
                  pb: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                  alignItems: 'center',
                }}
              >
                {[
                  {
                    id: 'kagenti-tools' as AdminPanel,
                    label: 'Tools',
                    tour: 'subtab-tools',
                  },
                  {
                    id: 'ops-tool-review' as AdminPanel,
                    label: 'Tool Review',
                    tour: 'subtab-tool-review',
                  },
                  {
                    id: 'ops-platform' as AdminPanel,
                    label: 'Config',
                    tour: 'subtab-config',
                  },
                  {
                    id: 'ops-observability' as AdminPanel,
                    label: 'Observability',
                    tour: 'subtab-observability',
                  },
                ].map(t => (
                  <Box
                    key={t.id}
                    data-tour={t.tour}
                    onClick={() => setAdminPanel(t.id)}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: adminPanel === t.id ? 700 : 500,
                      color:
                        adminPanel === t.id ? 'primary.main' : 'text.secondary',
                      bgcolor:
                        adminPanel === t.id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {t.label}
                  </Box>
                ))}
                {namespacePicker && (
                  <Box sx={{ ml: 'auto', maxWidth: 180 }}>
                    {namespacePicker}
                  </Box>
                )}
              </Box>
            )}
            {SETTINGS_PANELS.includes(adminPanel) && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  mb: 2.5,
                  pb: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                {[
                  {
                    id: 'ops-branding' as AdminPanel,
                    label: 'Branding',
                    tour: 'subtab-branding',
                  },
                  {
                    id: 'ops-admin' as AdminPanel,
                    label: 'Administration',
                    tour: 'subtab-admin',
                  },
                  {
                    id: 'ops-docs' as AdminPanel,
                    label: 'Documentation',
                    tour: 'subtab-docs',
                  },
                ].map(t => (
                  <Box
                    key={t.id}
                    data-tour={t.tour}
                    onClick={() => setAdminPanel(t.id)}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: adminPanel === t.id ? 700 : 500,
                      color:
                        adminPanel === t.id ? 'primary.main' : 'text.secondary',
                      bgcolor:
                        adminPanel === t.id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {t.label}
                  </Box>
                ))}
              </Box>
            )}

            {/* Panel content -- same centering container */}
            <AdminPanelContent
              panel={adminPanel}
              namespace={kagentiNamespace}
              onNavigate={handleNavigateWithFocus}
              onCreateAgent={handleCreateAgent}
              onHelpTours={handleOpenTours}
              onChatWithAgent={handleChatWithAgent}
              onFullScreenChange={handleFullScreenChange}
              pendingCreateAgent={pendingCreateAgent}
              onIntentOpened={handleIntentOpened}
              focusTarget={focusTarget}
              onFocusConsumed={() => setFocusTarget(undefined)}
              agentTourRef={agentTourRef}
              toolTourRef={toolTourRef}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // Simple provider with tab-based header
  return (
    <>
      <CommandCenterHeader
        adminPanel={adminPanel}
        onAdminPanelChange={setAdminPanel}
        onBackToChat={switchToChat}
      />
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Box
          key={adminPanel}
          sx={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            ...tokenAnimations.fadeSlideIn,
            ...adminScrollSx,
          }}
        >
          {adminPanel === 'platform' && <AgentConfigPanel />}
          {adminPanel === 'agents' && <AgentsPanel />}
          {adminPanel === 'branding' && <BrandingPanel />}
        </Box>
      </Box>
    </>
  );
}

// ---------------------------------------------------------------------------
// Panel content renderer (keeps AdminLayout focused on layout)
// ---------------------------------------------------------------------------

interface AdminPanelContentProps {
  panel: AdminPanel;
  namespace: string;
  onNavigate: (panel: AdminPanel, name?: string) => void;
  onCreateAgent: () => void;
  onHelpTours: () => void;
  onChatWithAgent: (agentId: string) => void;
  onFullScreenChange: (fs: boolean) => void;
  pendingCreateAgent: boolean;
  onIntentOpened: () => void;
  focusTarget: string | undefined;
  onFocusConsumed: () => void;
  agentTourRef: React.MutableRefObject<AgentPanelTourControl | null>;
  toolTourRef: React.MutableRefObject<ToolPanelTourControl | null>;
}

function AdminPanelContent({
  panel,
  namespace,
  onNavigate,
  onCreateAgent,
  onHelpTours,
  onChatWithAgent,
  onFullScreenChange,
  pendingCreateAgent,
  onIntentOpened,
  focusTarget,
  onFocusConsumed,
  agentTourRef,
  toolTourRef,
}: AdminPanelContentProps) {
  switch (panel) {
    // ── Agent Development (accessible when admin navigates here via Create Agent flow) ──
    case 'kagenti-agents':
      return (
        <KagentiAgentsPanel
          namespace={namespace || undefined}
          onChatWithAgent={onChatWithAgent}
          autoOpenIntent={pendingCreateAgent}
          onIntentOpened={onIntentOpened}
          onFullScreenChange={onFullScreenChange}
          initialAgentName={focusTarget}
          onFocusConsumed={onFocusConsumed}
          tourControlRef={agentTourRef}
        />
      );
    case 'kagenti-sandbox':
      return namespace ? (
        <KagentiSandboxPanel namespace={namespace} />
      ) : (
        <Box sx={{ py: 4, maxWidth: 520 }}>
          <Alert severity="info" variant="outlined">
            <strong>Namespace required</strong> — use the namespace dropdown at
            the top of the sidebar to select a target namespace, then return
            here to test your agents.
          </Alert>
        </Box>
      );
    case 'kagenti-tools':
      return (
        <KagentiToolsPanel
          namespace={namespace || undefined}
          initialToolName={focusTarget}
          onFocusConsumed={onFocusConsumed}
          tourControlRef={toolTourRef}
        />
      );
    case 'kagenti-builds':
      return <KagentiBuildPipelinePanel namespace={namespace || undefined} />;

    // ── Command Center (Ops) ──
    case 'ops-home':
      return (
        <OpsOverview
          namespace={namespace || undefined}
          onNavigate={onNavigate}
        />
      );
    case 'kagenti-home':
      return (
        <KagentiHomeDashboard
          namespace={namespace || undefined}
          onNavigate={onNavigate}
          onCreateAgent={onCreateAgent}
          onHelpTours={onHelpTours}
        />
      );
    case 'ops-review-queue':
      return <ReviewQueue />;
    case 'ops-tool-review':
      return <ToolReviewQueue />;
    case 'ops-registry':
    case 'kagenti-registry':
      return <AgentRegistryPanel />;
    case 'ops-platform':
    case 'kagenti-platform':
    case 'platform':
      return <AgentConfigPanel />;
    case 'ops-observability':
    case 'kagenti-dashboards':
      return <KagentiDashboardLinks namespace={namespace || undefined} />;
    case 'ops-branding':
    case 'kagenti-branding':
    case 'branding':
      return <BrandingPanel />;
    case 'ops-admin':
    case 'kagenti-admin':
      return <KagentiAdminPanel namespace={namespace || undefined} />;
    case 'ops-docs':
    case 'kagenti-docs':
      return <DocsPanel />;
    case 'agents':
      return <AgentsPanel />;
    default:
      return null;
  }
}
