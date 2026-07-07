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

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { ChatbotDisplayMode } from '@patternfly/chatbot';

import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';

import type { LightspeedEmbeddedNotebooksTarget } from '../components/LightspeedDrawerContext';
import { LIGHTSPEED_APP_DRAWER_ID, LIGHTSPEED_PATH } from '../const';
import { lightspeedDrawerStore } from '../store/lightspeedDrawerStore';
import { useBackstageUserIdentity } from './useBackstageUserIdentity';
import { useDisplayModeSettings } from './useDisplayModeSettings';

function lightspeedRoutePath(conversationId?: string): string {
  return conversationId
    ? `${LIGHTSPEED_PATH}/conversation/${conversationId}`
    : LIGHTSPEED_PATH;
}

/**
 * Shell hook that orchestrates router sync, AppDrawer integration, and
 * registers complex handlers into the lightspeedDrawerStore.
 *
 * @internal
 */
export function useLightspeedShellState(): {
  shouldRenderOverlayModal: boolean;
  closeChatbot: () => void;
} {
  const navigate = useNavigate();
  const location = useLocation();
  const { openDrawer, closeDrawer } = useAppDrawer();
  const user = useBackstageUserIdentity();
  const {
    displayMode: persistedDisplayMode,
    setDisplayMode: setPersistedDisplayMode,
  } = useDisplayModeSettings(user, ChatbotDisplayMode.default);

  const snapshot = useSyncExternalStore(
    lightspeedDrawerStore.subscribe,
    lightspeedDrawerStore.getSnapshot,
  );

  const openedViaFABRef = useRef(false);
  const dockedAfterLeavingFullscreenRef = useRef(false);
  const leavingLightspeedForNonEmbeddedShellRef = useRef(false);
  const lightspeedPathnamePrevRef = useRef<string | null>(null);

  const isLightspeedRoute = location.pathname.startsWith(LIGHTSPEED_PATH);
  const isLightspeedRouteRef = useRef(isLightspeedRoute);
  isLightspeedRouteRef.current = isLightspeedRoute;
  const persistedDisplayModeRef = useRef(persistedDisplayMode);
  persistedDisplayModeRef.current = persistedDisplayMode;

  const conversationMatch = useMatch(
    `${LIGHTSPEED_PATH}/conversation/:conversationId`,
  );
  const conversationId = conversationMatch?.params?.conversationId;

  const syncShellDrawerForMode = useCallback(
    (mode: ChatbotDisplayMode) => {
      if (mode === ChatbotDisplayMode.docked) {
        if (isLightspeedRoute) {
          dockedAfterLeavingFullscreenRef.current = true;
        } else {
          openDrawer(LIGHTSPEED_APP_DRAWER_ID);
        }
      } else {
        dockedAfterLeavingFullscreenRef.current = false;
        closeDrawer(LIGHTSPEED_APP_DRAWER_ID);
      }
    },
    [closeDrawer, isLightspeedRoute, openDrawer],
  );

  const navigateBackOrGoToCatalog = useCallback(() => {
    if (!openedViaFABRef.current) {
      navigate('/catalog');
      openedViaFABRef.current = true;
      return;
    }
    navigate(-1);
  }, [navigate]);

  const leaveLightspeedRouteForShellDisplayMode = useCallback(() => {
    navigate('/catalog', { replace: true });
  }, [navigate]);

  // --- Route → Store sync ---
  useEffect(() => {
    const pathname = location.pathname;
    const prevPathname = lightspeedPathnamePrevRef.current;
    const isUnderLightspeedPath = (p: string | null) =>
      Boolean(p && p.startsWith(LIGHTSPEED_PATH));
    const isInternalLightspeedRouteChange =
      isUnderLightspeedPath(prevPathname) &&
      isUnderLightspeedPath(pathname) &&
      prevPathname !== pathname;

    if (!isLightspeedRoute) {
      leavingLightspeedForNonEmbeddedShellRef.current = false;
    }

    if (conversationId) {
      lightspeedDrawerStore.setConversationIdRaw(conversationId);
    } else if (isLightspeedRoute) {
      lightspeedDrawerStore.setConversationIdRaw(undefined);
    }

    if (isLightspeedRoute) {
      if (!isInternalLightspeedRouteChange) {
        if (
          leavingLightspeedForNonEmbeddedShellRef.current &&
          persistedDisplayMode !== ChatbotDisplayMode.embedded
        ) {
          lightspeedDrawerStore.setDisplayModeRaw(persistedDisplayMode);
        } else {
          lightspeedDrawerStore.setDisplayModeRaw(ChatbotDisplayMode.embedded);
        }
      }
      lightspeedDrawerStore.open();
      if (!dockedAfterLeavingFullscreenRef.current) {
        closeDrawer(LIGHTSPEED_APP_DRAWER_ID);
      }
    } else if (persistedDisplayMode === ChatbotDisplayMode.embedded) {
      lightspeedDrawerStore.setDisplayModeRaw(ChatbotDisplayMode.default);
    } else {
      lightspeedDrawerStore.setDisplayModeRaw(persistedDisplayMode);
    }

    lightspeedPathnamePrevRef.current = pathname;
  }, [
    closeDrawer,
    conversationId,
    isLightspeedRoute,
    location.pathname,
    persistedDisplayMode,
  ]);

  // --- Docked mode → AppDrawer sync ---
  useEffect(() => {
    if (
      !isLightspeedRoute &&
      snapshot.isOpen &&
      snapshot.displayMode === ChatbotDisplayMode.docked
    ) {
      openDrawer(LIGHTSPEED_APP_DRAWER_ID);
      dockedAfterLeavingFullscreenRef.current = false;
    }
  }, [snapshot.displayMode, isLightspeedRoute, snapshot.isOpen, openDrawer]);

  // --- Orchestrated actions ---

  const openChatbot = useCallback(() => {
    openedViaFABRef.current = true;
    const rawMode = persistedDisplayMode || ChatbotDisplayMode.default;
    const currentSnapshot = lightspeedDrawerStore.getSnapshot();

    if (rawMode === ChatbotDisplayMode.embedded) {
      if (!isLightspeedRoute) {
        if (currentSnapshot.shellViewTab === 1) {
          navigate(`${LIGHTSPEED_PATH}/notebooks`);
        } else {
          navigate(lightspeedRoutePath(currentSnapshot.currentConversationId));
        }
      }
      lightspeedDrawerStore.setDisplayMode(ChatbotDisplayMode.embedded);
      closeDrawer(LIGHTSPEED_APP_DRAWER_ID);
      lightspeedDrawerStore.open();
      return;
    }

    lightspeedDrawerStore.setDisplayMode(rawMode);

    if (rawMode === ChatbotDisplayMode.docked) {
      openDrawer(LIGHTSPEED_APP_DRAWER_ID);
    } else {
      closeDrawer(LIGHTSPEED_APP_DRAWER_ID);
    }

    lightspeedDrawerStore.open();
  }, [
    closeDrawer,
    isLightspeedRoute,
    navigate,
    openDrawer,
    persistedDisplayMode,
  ]);

  const closeChatbot = useCallback(() => {
    const currentSnapshot = lightspeedDrawerStore.getSnapshot();
    dockedAfterLeavingFullscreenRef.current = false;
    if (
      currentSnapshot.displayMode === ChatbotDisplayMode.embedded &&
      isLightspeedRoute
    ) {
      navigateBackOrGoToCatalog();
    }
    if (currentSnapshot.displayMode === ChatbotDisplayMode.docked) {
      closeDrawer(LIGHTSPEED_APP_DRAWER_ID);
    }
    lightspeedDrawerStore.close();
  }, [closeDrawer, isLightspeedRoute, navigateBackOrGoToCatalog]);

  const toggleChatbot = useCallback(() => {
    if (snapshot.isOpen) {
      closeChatbot();
    } else {
      openChatbot();
    }
  }, [snapshot.isOpen, openChatbot, closeChatbot]);

  const setCurrentConversationId = useCallback(
    (id: string | undefined) => {
      lightspeedDrawerStore.setConversationIdRaw(id);
      if (
        persistedDisplayModeRef.current === ChatbotDisplayMode.embedded &&
        isLightspeedRouteRef.current
      ) {
        navigate(lightspeedRoutePath(id), { replace: true });
      }
    },
    [navigate],
  );

  const orchestratedSetDisplayMode = useCallback(
    (
      mode: ChatbotDisplayMode,
      conversationIdParam?: string,
      embeddedNotebooks?: LightspeedEmbeddedNotebooksTarget,
    ) => {
      const currentSnapshot = lightspeedDrawerStore.getSnapshot();
      if (mode === currentSnapshot.displayMode) {
        return;
      }
      setPersistedDisplayMode(mode);
      syncShellDrawerForMode(mode);

      if (mode === ChatbotDisplayMode.embedded) {
        if (embeddedNotebooks) {
          const path =
            embeddedNotebooks === 'notebooks'
              ? `${LIGHTSPEED_PATH}/notebooks`
              : `${LIGHTSPEED_PATH}/notebooks/${embeddedNotebooks.notebookSessionId}`;
          navigate(path);
        } else if (currentSnapshot.shellViewTab === 1) {
          navigate(`${LIGHTSPEED_PATH}/notebooks`);
        } else {
          const convId =
            conversationIdParam ?? currentSnapshot.currentConversationId;
          navigate(lightspeedRoutePath(convId));
        }
        lightspeedDrawerStore.open();
      } else {
        lightspeedDrawerStore.setShellViewTab(0);
        if (isLightspeedRoute) {
          leavingLightspeedForNonEmbeddedShellRef.current = true;
          lightspeedDrawerStore.setPendingOverlayThreadHandoff(true);
          leaveLightspeedRouteForShellDisplayMode();
        }
        lightspeedDrawerStore.open();
      }

      lightspeedDrawerStore.setDisplayModeRaw(mode);
    },
    [
      isLightspeedRoute,
      leaveLightspeedRouteForShellDisplayMode,
      navigate,
      setPersistedDisplayMode,
      syncShellDrawerForMode,
    ],
  );

  // --- Register orchestrated handlers ---
  useEffect(() => {
    lightspeedDrawerStore.registerHandlers({
      setDisplayMode: orchestratedSetDisplayMode,
      toggleChatbot,
      setCurrentConversationId,
    });
    return () => {
      lightspeedDrawerStore.unregisterHandlers();
    };
  }, [orchestratedSetDisplayMode, toggleChatbot, setCurrentConversationId]);

  const shouldRenderOverlayModal =
    snapshot.isOpen &&
    snapshot.displayMode === ChatbotDisplayMode.default &&
    !isLightspeedRoute;

  return {
    shouldRenderOverlayModal,
    closeChatbot,
  };
}
