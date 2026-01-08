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

import { useCallback, useEffect, useRef } from 'react';

import { ChatbotDisplayMode } from '@patternfly/chatbot';

import { useLightspeedDrawerContext } from '../hooks/useLightspeedDrawerContext';

/**
 * @public
 * Partial Lightspeed drawer state exposed to the ApplicationDrawer
 */
export type DrawerState = {
  id: string;
  isDrawerOpen: boolean;
  drawerWidth: number;
  setDrawerWidth: (width: number) => void;
  closeDrawer: () => void;
};

/**
 * @public
 * Props for drawer state exposer components
 */
export type DrawerStateExposerProps = {
  /**
   * Callback called whenever the drawer state changes
   */
  onStateChange: (state: DrawerState) => void;
};

/**
 *  @public
 * This exposes LightspeedDrawer's partial context to the ApplicationDrawer
 *
 * It reads the LightspeedDrawerContext and calls the onStateChange callback with the
 * partial state (id, isDrawerOpen, drawerWidth, setDrawerWidth).
 
 */
export const LightspeedDrawerStateExposer = ({
  onStateChange,
}: DrawerStateExposerProps) => {
  const { displayMode, drawerWidth, setDrawerWidth, toggleChatbot } =
    useLightspeedDrawerContext();

  const isDrawerOpen = displayMode === ChatbotDisplayMode.docked;

  const toggleChatbotRef = useRef(toggleChatbot);
  toggleChatbotRef.current = toggleChatbot;

  const closeDrawer = useCallback(() => {
    toggleChatbotRef.current();
  }, []);

  useEffect(() => {
    onStateChange({
      id: 'lightspeed',
      isDrawerOpen,
      drawerWidth,
      setDrawerWidth,
      closeDrawer,
    });
  }, [isDrawerOpen, drawerWidth, setDrawerWidth, closeDrawer, onStateChange]);

  return null;
};
