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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from './AppStateProvider';
import { AdminLayout, type AdminTourActions } from './AdminLayout';
import { ChatView } from './ChatView';
import { TourProvider } from '../AdminPanels/shared/TourProvider';
import {
  TourControllerProvider,
  type TourControllerCallbacks,
} from '../AdminPanels/shared/TourController';
import { TourLauncherDialog } from '../AdminPanels/shared/TourLauncherDialog';
import { useTours } from '../../hooks';
import type { AdminPanel } from '../../hooks';

interface AppRouterProps {
  adminScrollSx: Record<string, unknown>;
}

const noopAdminActions: AdminTourActions = {
  openAgentIntent: () => {},
  selectAgentIntent: () => {},
  openToolIntent: () => {},
  selectToolDeploy: () => {},
  closeAllDialogs: () => {},
  setWizardStep: () => {},
  setDeployMethod: () => {},
};

/**
 * Top-level content router that delegates to either:
 * - AdminLayout (when viewMode === 'admin' and user has admin access)
 * - ChatView (default experience for all users)
 *
 * Also provides tour infrastructure (TourControllerProvider + TourProvider)
 * at this level so tours work in both marketplace and command center views.
 */
export function AppRouter({ adminScrollSx }: AppRouterProps) {
  const {
    isAdmin,
    viewMode,
    liveStatus,
    adminPanel,
    setAdminPanel,
    switchToAdmin,
    switchToChat,
    refreshStatus,
  } = useAppState();

  const { tours: tourDefinitions } = useTours();
  const adminTourActionsRef = useRef<AdminTourActions>(noopAdminActions);
  const marketplaceTourActionsRef = useRef<AdminTourActions>(noopAdminActions);
  const tourLaunchSourceRef = useRef<'marketplace' | 'command-center'>(
    'marketplace',
  );

  const [tourDialogOpen, setTourDialogOpen] = useState(false);
  const [tourDialogPage, setTourDialogPage] = useState<
    'marketplace' | 'command-center' | undefined
  >();

  const handleOpenGuidedTours = useCallback(
    (source?: 'marketplace' | 'command-center') => {
      const resolved =
        source ?? (viewMode === 'admin' ? 'command-center' : 'marketplace');
      tourLaunchSourceRef.current = resolved;
      setTourDialogPage(resolved);
      setTourDialogOpen(true);
    },
    [viewMode],
  );

  const handleCloseTourDialog = useCallback(() => {
    setTourDialogOpen(false);
  }, []);

  // Refresh status when provider is switched via ProviderSelector
  useEffect(() => {
    const handler = () => refreshStatus();
    window.addEventListener('augment:provider-switched', handler);
    return () =>
      window.removeEventListener('augment:provider-switched', handler);
  }, [refreshStatus]);

  // Listen for the legacy event from older code paths
  useEffect(() => {
    const handler = () => handleOpenGuidedTours();
    window.addEventListener('augment:open-guided-tours', handler);
    return () =>
      window.removeEventListener('augment:open-guided-tours', handler);
  }, [handleOpenGuidedTours]);

  // Normalize adminPanel when the active provider changes
  const prevProviderRef = useRef(liveStatus?.providerId);
  useEffect(() => {
    const currentProvider = liveStatus?.providerId;
    const prevProvider = prevProviderRef.current;
    prevProviderRef.current = currentProvider;

    if (!currentProvider || currentProvider === prevProvider) return;

    if (currentProvider === 'kagenti') {
      const panelMap: Record<string, string> = {
        platform: 'kagenti-platform',
        agents: 'kagenti-agents',
        branding: 'kagenti-branding',
      };
      setAdminPanel(
        (panelMap[adminPanel] ?? 'kagenti-home') as typeof adminPanel,
      );
    } else if (prevProvider === 'kagenti') {
      const panelMap: Record<string, string> = {
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
      setAdminPanel((panelMap[adminPanel] ?? 'platform') as typeof adminPanel);
    }
  }, [liveStatus?.providerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getActiveActions = useCallback(
    () =>
      viewMode === 'admin'
        ? adminTourActionsRef.current
        : marketplaceTourActionsRef.current,
    [viewMode],
  );

  const tourCallbacks = useMemo<TourControllerCallbacks>(
    () => ({
      navigatePanel: (panel: AdminPanel) => {
        if (viewMode !== 'admin') {
          switchToAdmin(undefined);
        }
        setTimeout(() => setAdminPanel(panel), viewMode !== 'admin' ? 200 : 0);
      },
      openAgentIntent: () => getActiveActions().openAgentIntent(),
      selectAgentIntent: (cardId: string) =>
        getActiveActions().selectAgentIntent(cardId),
      openToolIntent: () => getActiveActions().openToolIntent(),
      selectToolDeploy: () => getActiveActions().selectToolDeploy(),
      closeAllDialogs: () => getActiveActions().closeAllDialogs(),
      setWizardStep: (step: number) => getActiveActions().setWizardStep(step),
      setDeployMethod: (method: string) =>
        getActiveActions().setDeployMethod(method),
      returnToGuidedExperience: () => {
        const source = tourLaunchSourceRef.current;
        if (source === 'marketplace') {
          switchToChat();
        } else {
          setAdminPanel('ops-home');
        }
        setTimeout(() => handleOpenGuidedTours(source), 300);
      },
      switchToMarketplace: () => {
        switchToChat();
      },
      switchToCommandCenter: () => {
        switchToAdmin(undefined);
      },
    }),
    [
      setAdminPanel,
      switchToChat,
      switchToAdmin,
      handleOpenGuidedTours,
      viewMode,
      getActiveActions,
    ],
  );

  const showAdmin = isAdmin && viewMode === 'admin' && liveStatus;

  return (
    <TourControllerProvider callbacks={tourCallbacks}>
      <TourProvider tours={tourDefinitions}>
        <TourLauncherDialog
          open={tourDialogOpen}
          onClose={handleCloseTourDialog}
          tours={tourDefinitions}
          page={tourDialogPage}
        />
        {showAdmin ? (
          <AdminLayout
            adminScrollSx={adminScrollSx}
            onOpenGuidedTours={() => handleOpenGuidedTours('command-center')}
            adminTourActionsRef={adminTourActionsRef}
          />
        ) : (
          <ChatView
            onOpenGuidedTours={() => handleOpenGuidedTours('marketplace')}
            marketplaceTourActionsRef={marketplaceTourActionsRef}
          />
        )}
      </TourProvider>
    </TourControllerProvider>
  );
}
