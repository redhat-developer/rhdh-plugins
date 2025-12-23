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

import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { makeStyles } from '@mui/styles';
import { ChatbotDisplayMode, ChatbotModal } from '@patternfly/chatbot';

import { LightspeedChatContainer } from './LightspeedChatContainer';
import { LightspeedDrawerContext } from './LightspeedDrawerContext';

const useStyles = makeStyles(() => ({
  chatbotModal: {
    // When docked drawer is open, adjust modal position
    'body.docked-drawer-open &': {
      transition: 'margin-right 0.3s ease',
      marginRight: 'var(--docked-drawer-width, 500px)',
    },
  },
}));

/**
 * @public
 */
export const LightspeedDrawerProvider = ({ children }: PropsWithChildren) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const [displayMode, setDisplayModeState] = useState<ChatbotDisplayMode>(
    ChatbotDisplayMode.default,
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(400);
  const [currentConversationId, setCurrentConversationIdState] = useState<
    string | undefined
  >(undefined);

  const isLightspeedRoute = location.pathname.startsWith('/lightspeed');

  useEffect(() => {
    if (isLightspeedRoute) {
      const match = location.pathname.match(/\/lightspeed\/conversation\/(.+)/);
      if (match) {
        setCurrentConversationIdState(match[1]);
      } else {
        setCurrentConversationIdState(undefined);
      }
      setDisplayModeState(ChatbotDisplayMode.embedded);
      setIsOpen(true);
    } else if (displayMode === ChatbotDisplayMode.embedded) {
      setDisplayModeState(ChatbotDisplayMode.default);
    }
  }, [isLightspeedRoute, location.pathname, displayMode]);

  // Open chatbot in overlay mode
  const openChatbot = useCallback(() => {
    setDisplayModeState(ChatbotDisplayMode.default);
    setIsOpen(true);
  }, []);

  // Close chatbot
  const closeChatbot = useCallback(() => {
    // If in embedded mode on the lightspeed route, navigate back
    if (displayMode === ChatbotDisplayMode.embedded && isLightspeedRoute) {
      navigate(-1);
    }
    setIsOpen(false);
    setDisplayModeState(ChatbotDisplayMode.default);
  }, [displayMode, isLightspeedRoute, navigate]);

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

      // Update route if in embedded mode
      if (displayMode === ChatbotDisplayMode.embedded && isLightspeedRoute) {
        const path = id ? `/lightspeed/conversation/${id}` : '/lightspeed';
        navigate(path, { replace: true });
      }
    },
    [displayMode, isLightspeedRoute, navigate],
  );

  // Set display mode with route handling for embedded/fullscreen
  const setDisplayMode = useCallback(
    (mode: ChatbotDisplayMode, conversationId?: string) => {
      setDisplayModeState(mode);

      // Navigate to fullscreen route with conversation ID if available
      if (mode === ChatbotDisplayMode.embedded) {
        const convId = conversationId ?? currentConversationId;
        const path = convId
          ? `/lightspeed/conversation/${convId}`
          : '/lightspeed';
        navigate(path);
        setIsOpen(true);
      } else if (mode === ChatbotDisplayMode.docked) {
        // If we were on the lightspeed route, navigate back
        if (isLightspeedRoute) {
          navigate(-1);
        }
        setIsOpen(true);
      } else {
        // Default Overlay mode
        // If we were on the lightspeed route, navigate back
        if (isLightspeedRoute) {
          navigate(-1);
        }
        setIsOpen(true);
      }
    },
    [navigate, isLightspeedRoute, currentConversationId],
  );

  // Only render ChatbotModal for overlay mode
  // Docked mode is handled by ApplicationDrawer in Root
  // Embedded mode is handled by LightspeedPage route
  const shouldRenderOverlayModal =
    isOpen && displayMode === ChatbotDisplayMode.default && !isLightspeedRoute;

  return (
    <LightspeedDrawerContext.Provider
      value={{
        isChatbotActive: isOpen,
        toggleChatbot,
        displayMode,
        setDisplayMode,
        drawerWidth,
        setDrawerWidth,
        currentConversationId,
        setCurrentConversationId,
      }}
    >
      {children}
      {shouldRenderOverlayModal && (
        <ChatbotModal
          isOpen
          displayMode={displayMode}
          onClose={closeChatbot}
          ouiaId="LightspeedChatbotModal"
          aria-labelledby="lightspeed-chatpopup-modal"
          className={classes.chatbotModal}
        >
          <LightspeedChatContainer />
        </ChatbotModal>
      )}
    </LightspeedDrawerContext.Provider>
  );
};
