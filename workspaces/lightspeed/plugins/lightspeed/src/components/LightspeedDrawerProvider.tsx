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

import { identityApiRef, useApi } from '@backstage/core-plugin-api';

import { ChatbotDisplayMode } from '@patternfly/chatbot';

import { LightspeedChatContainer } from './LightspeedChatContainer';
import { LightspeedDrawerContext } from './LightspeedDrawerContext';

/**
 * @public
 */
export const LightspeedDrawerProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [displayMode, setDisplayModeState] = useState<ChatbotDisplayMode>(
    ChatbotDisplayMode.default,
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(400);
  const [userKey, setUserKey] = useState<string>('guest');
  const [currentConversationId, setCurrentConversationIdState] = useState<
    string | undefined
  >(undefined);

  const identityApi = useApi(identityApiRef);

  const isLightspeedRoute = location.pathname.startsWith('/lightspeed');

  // Resolve the current user's identity to scope localStorage keys per user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const identity = await identityApi.getBackstageIdentity();
        const ref = identity?.userEntityRef?.toLowerCase() || 'guest';
        if (!cancelled) setUserKey(ref);
      } catch (e) {
        if (!cancelled) setUserKey('guest');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [identityApi]);

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
    }
  }, [isLightspeedRoute, location.pathname]);

  // Load drawer width from localStorage on mount
  useEffect(() => {
    if (!userKey) return;

    const drawerWidthKey = `lightspeed-drawer-width:${userKey}`;
    const savedDrawerWidth = localStorage.getItem(drawerWidthKey);

    if (savedDrawerWidth) {
      const width = parseInt(savedDrawerWidth, 10);
      if (!Number.isNaN(width) && width > 0) {
        setDrawerWidth(width);
      }
    }
  }, [userKey]);

  // Save drawer width to localStorage
  useEffect(() => {
    if (!userKey) return;

    const drawerWidthKey = `lightspeed-drawer-width:${userKey}`;
    localStorage.setItem(drawerWidthKey, drawerWidth.toString());
  }, [drawerWidth, userKey]);

  // Set CSS variables for drawer width when drawer is open in docked mode
  useEffect(() => {
    if (isOpen && displayMode === ChatbotDisplayMode.docked) {
      document.body.classList.add('lightspeed-drawer-open');
      document.body.style.setProperty(
        '--lightspeed-drawer-width',
        `${drawerWidth}px`,
      );
    } else {
      document.body.classList.remove('lightspeed-drawer-open');
      document.body.style.removeProperty('--lightspeed-drawer-width');
    }

    return () => {
      document.body.classList.remove('lightspeed-drawer-open');
      document.body.style.removeProperty('--lightspeed-drawer-width');
    };
  }, [isOpen, drawerWidth, displayMode]);

  // Open chatbot in overlay mode (no route change)
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

  // Only render for overlay and docked modes (embedded is handled by the route)
  const shouldRenderChat =
    isOpen && displayMode !== ChatbotDisplayMode.embedded && !isLightspeedRoute;

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
      {shouldRenderChat && <LightspeedChatContainer />}
    </LightspeedDrawerContext.Provider>
  );
};
