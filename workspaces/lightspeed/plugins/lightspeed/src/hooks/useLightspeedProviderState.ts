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
import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { ChatbotDisplayMode } from '@patternfly/chatbot';

import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';

import type { LightspeedDrawerContextType } from '../components/LightspeedDrawerContext';
import { LIGHTSPEED_APP_DRAWER_ID } from '../const';
import type { FileContent } from '../types';
import { useBackstageUserIdentity } from './useBackstageUserIdentity';
import { useDisplayModeSettings } from './useDisplayModeSettings';

const LIGHTSPEED_PATH = '/lightspeed';

function lightspeedRoutePath(conversationId?: string): string {
  return conversationId
    ? `${LIGHTSPEED_PATH}/conversation/${conversationId}`
    : LIGHTSPEED_PATH;
}

/**
 * Encapsulates LightspeedDrawerProvider state, routing, and ApplicationDrawer sync.
 *
 * @internal
 */
export function useLightspeedProviderState(): {
  contextValue: LightspeedDrawerContextType;
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

  const [displayModeState, setDisplayModeState] =
    useState<ChatbotDisplayMode>(persistedDisplayMode);
  const [isOpen, setIsOpen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(400);
  const [currentConversationIdState, setCurrentConversationIdState] = useState<
    string | undefined
  >(undefined);
  const [draftMessage, setDraftMessageState] = useState('');
  const [draftFileContents, setDraftFileContentsState] = useState<
    FileContent[]
  >([]);
  const openedViaFABRef = useRef(false);
  const dockedAfterLeavingFullscreenRef = useRef(false);

  const isLightspeedRoute = location.pathname.startsWith(LIGHTSPEED_PATH);
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

  useEffect(() => {
    if (conversationId) {
      setCurrentConversationIdState(conversationId);
    } else {
      setCurrentConversationIdState(undefined);
    }

    if (isLightspeedRoute) {
      setDisplayModeState(ChatbotDisplayMode.embedded);
      setIsOpen(true);
      if (!dockedAfterLeavingFullscreenRef.current) {
        closeDrawer(LIGHTSPEED_APP_DRAWER_ID);
      }
    } else if (
      persistedDisplayMode === ChatbotDisplayMode.embedded &&
      !isOpen
    ) {
      setDisplayModeState(ChatbotDisplayMode.default);
    } else {
      setDisplayModeState(persistedDisplayMode);
    }
  }, [
    closeDrawer,
    conversationId,
    isLightspeedRoute,
    isOpen,
    persistedDisplayMode,
  ]);

  useEffect(() => {
    if (
      !isLightspeedRoute &&
      isOpen &&
      displayModeState === ChatbotDisplayMode.docked
    ) {
      openDrawer(LIGHTSPEED_APP_DRAWER_ID);
      dockedAfterLeavingFullscreenRef.current = false;
    }
  }, [displayModeState, isLightspeedRoute, isOpen, openDrawer]);

  const openChatbot = useCallback(() => {
    openedViaFABRef.current = true;
    const rawMode = persistedDisplayMode || ChatbotDisplayMode.default;

    if (rawMode === ChatbotDisplayMode.embedded) {
      if (!isLightspeedRoute) {
        navigate(lightspeedRoutePath(currentConversationIdState));
      }
      setDisplayModeState(ChatbotDisplayMode.embedded);
      closeDrawer(LIGHTSPEED_APP_DRAWER_ID);
      setIsOpen(true);
      return;
    }

    setDisplayModeState(rawMode);

    if (rawMode === ChatbotDisplayMode.docked) {
      openDrawer(LIGHTSPEED_APP_DRAWER_ID);
    } else {
      closeDrawer(LIGHTSPEED_APP_DRAWER_ID);
    }

    setIsOpen(true);
  }, [
    closeDrawer,
    currentConversationIdState,
    isLightspeedRoute,
    navigate,
    openDrawer,
    persistedDisplayMode,
  ]);

  const closeChatbot = useCallback(() => {
    dockedAfterLeavingFullscreenRef.current = false;
    if (displayModeState === ChatbotDisplayMode.embedded && isLightspeedRoute) {
      navigateBackOrGoToCatalog();
    }
    if (displayModeState === ChatbotDisplayMode.docked) {
      closeDrawer(LIGHTSPEED_APP_DRAWER_ID);
    }
    setIsOpen(false);
  }, [
    closeDrawer,
    displayModeState,
    isLightspeedRoute,
    navigateBackOrGoToCatalog,
  ]);

  const toggleChatbot = useCallback(() => {
    if (isOpen) {
      closeChatbot();
    } else {
      openChatbot();
    }
  }, [isOpen, openChatbot, closeChatbot]);

  const setCurrentConversationId = useCallback(
    (id: string | undefined) => {
      setCurrentConversationIdState(id);
      if (
        displayModeState === ChatbotDisplayMode.embedded &&
        isLightspeedRoute
      ) {
        navigate(lightspeedRoutePath(id), { replace: true });
      }
    },
    [displayModeState, isLightspeedRoute, navigate],
  );

  const setDraftMessage = useCallback((message: string) => {
    setDraftMessageState(message);
  }, []);

  const setDraftFileContents = useCallback((files: FileContent[]) => {
    setDraftFileContentsState(files);
  }, []);

  const setDisplayMode = useCallback(
    (mode: ChatbotDisplayMode, conversationIdParam?: string) => {
      if (mode === displayModeState) {
        return;
      }
      setPersistedDisplayMode(mode);
      syncShellDrawerForMode(mode);

      if (mode === ChatbotDisplayMode.embedded) {
        const convId = conversationIdParam ?? currentConversationIdState;
        navigate(lightspeedRoutePath(convId));
        setIsOpen(true);
      } else {
        if (isLightspeedRoute) {
          navigateBackOrGoToCatalog();
        }
        setIsOpen(true);
      }
    },
    [
      currentConversationIdState,
      displayModeState,
      isLightspeedRoute,
      navigate,
      navigateBackOrGoToCatalog,
      setPersistedDisplayMode,
      syncShellDrawerForMode,
    ],
  );

  const shouldRenderOverlayModal =
    isOpen &&
    displayModeState === ChatbotDisplayMode.default &&
    !isLightspeedRoute;

  const contextValue = useMemo(
    () => ({
      isChatbotActive: isOpen,
      toggleChatbot,
      displayMode: displayModeState,
      setDisplayMode,
      drawerWidth,
      setDrawerWidth,
      currentConversationId: currentConversationIdState,
      setCurrentConversationId,
      draftMessage,
      setDraftMessage,
      draftFileContents,
      setDraftFileContents,
    }),
    [
      isOpen,
      toggleChatbot,
      displayModeState,
      setDisplayMode,
      drawerWidth,
      currentConversationIdState,
      setCurrentConversationId,
      draftMessage,
      setDraftMessage,
      draftFileContents,
      setDraftFileContents,
    ],
  );

  return {
    contextValue,
    shouldRenderOverlayModal,
    closeChatbot,
  };
}
