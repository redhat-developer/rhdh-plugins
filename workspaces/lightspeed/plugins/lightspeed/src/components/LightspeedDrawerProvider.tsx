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

import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { makeStyles } from '@mui/styles';
import { ChatbotDisplayMode, ChatbotModal } from '@patternfly/chatbot';

import { LightspeedChatContainer } from './LightspeedChatContainer';
import { LightspeedDrawerContext } from './LightspeedDrawerContext';

const useStyles = makeStyles(theme => ({
  chatbotModal: {
    boxShadow:
      '0 14px 20px -7px rgba(0, 0, 0, 0.22), 0 32px 50px 6px rgba(0, 0, 0, 0.16), 0 12px 60px 12px rgba(0, 0, 0, 0.14) !important',
    bottom: `calc(${theme?.spacing?.(2) ?? '16px'} + 5em)`,
    right: `calc(${theme?.spacing?.(2) ?? '16px'} + 1.5em)`,
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

  const [displayModeState, setDisplayModeState] = useState<ChatbotDisplayMode>(
    ChatbotDisplayMode.default,
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(400);
  const [currentConversationIdState, setCurrentConversationIdState] = useState<
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
      // Update this to fullscreen only when it is not already in the docked mode
      setDisplayModeState(prev => {
        if (prev === ChatbotDisplayMode.docked) {
          return prev; // Don't override docked mode
        }
        return ChatbotDisplayMode.embedded;
      });
      setIsOpen(true);
    } else {
      // When leaving lightspeed route, update this only when the current mode is fullscreen
      setDisplayModeState(prev => {
        if (prev === ChatbotDisplayMode.embedded) {
          return ChatbotDisplayMode.default;
        }
        return prev;
      });
    }
  }, [isLightspeedRoute, location.pathname]);

  // Open chatbot in overlay mode
  const openChatbot = useCallback(() => {
    setDisplayModeState(ChatbotDisplayMode.default);
    setIsOpen(true);
  }, []);

  // Close chatbot
  const closeChatbot = useCallback(() => {
    // If in embedded mode on the lightspeed route, navigate back
    if (displayModeState === ChatbotDisplayMode.embedded && isLightspeedRoute) {
      navigate(-1);
    }
    setIsOpen(false);
    setDisplayModeState(ChatbotDisplayMode.default);
  }, [displayModeState, isLightspeedRoute, navigate]);

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
      if (
        displayModeState === ChatbotDisplayMode.embedded &&
        isLightspeedRoute
      ) {
        const path = id ? `/lightspeed/conversation/${id}` : '/lightspeed';
        navigate(path, { replace: true });
      }
    },
    [displayModeState, isLightspeedRoute, navigate],
  );

  // Set display mode with route handling for embedded/fullscreen
  const setDisplayMode = useCallback(
    (mode: ChatbotDisplayMode, conversationId?: string) => {
      if (mode === displayModeState) {
        return;
      }

      setDisplayModeState(mode);

      // Navigate to fullscreen route with conversation ID if available
      if (mode === ChatbotDisplayMode.embedded) {
        const convId = conversationId ?? currentConversationIdState;
        const path = convId
          ? `/lightspeed/conversation/${convId}`
          : '/lightspeed';
        navigate(path);
        setIsOpen(true);
      } else {
        if (isLightspeedRoute) {
          navigate(-1);
        }
        setIsOpen(true);
      }
    },
    [navigate, isLightspeedRoute, currentConversationIdState, displayModeState],
  );

  // Only render ChatbotModal for overlay mode
  // Docked mode is handled by ApplicationDrawer in Root
  // Embedded mode is handled by LightspeedPage route
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
    }),
    [
      isOpen,
      toggleChatbot,
      displayModeState,
      setDisplayMode,
      drawerWidth,
      setDrawerWidth,
      currentConversationIdState,
      setCurrentConversationId,
    ],
  );

  return (
    <LightspeedDrawerContext.Provider value={contextValue}>
      {children}
      {shouldRenderOverlayModal && (
        <ChatbotModal
          isOpen
          displayMode={displayModeState}
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
