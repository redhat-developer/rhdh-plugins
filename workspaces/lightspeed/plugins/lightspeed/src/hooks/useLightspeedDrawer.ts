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

import { useSyncExternalStore } from 'react';

import { ChatbotDisplayMode } from '@patternfly/chatbot';

import type { LightspeedDrawerContextType } from '../components/LightspeedDrawerContext';
import {
  DEFAULT_DRAWER_WIDTH,
  lightspeedDrawerStore,
  type LightspeedDrawerState,
} from '../store/lightspeedDrawerStore';

const SERVER_SNAPSHOT: LightspeedDrawerState = {
  isOpen: false,
  displayMode: ChatbotDisplayMode.default,
  drawerWidth: DEFAULT_DRAWER_WIDTH,
  currentConversationId: undefined,
  draftMessage: '',
  draftFileContents: [],
  shellViewTab: 0,
  pendingOverlayThreadHandoff: false,
};

const getServerSnapshot = () => SERVER_SNAPSHOT;

/**
 * Hook to access Lightspeed drawer state and actions.
 * Backed by a global singleton store — works from any position in the
 * React tree without a wrapping Provider.
 *
 * @internal
 */
export function useLightspeedDrawer(): LightspeedDrawerContextType {
  const snapshot = useSyncExternalStore(
    lightspeedDrawerStore.subscribe,
    lightspeedDrawerStore.getSnapshot,
    getServerSnapshot,
  );

  return {
    isChatbotActive: snapshot.isOpen,
    toggleChatbot: lightspeedDrawerStore.toggle,
    displayMode: snapshot.displayMode,
    setDisplayMode: lightspeedDrawerStore.setDisplayMode,
    drawerWidth: snapshot.drawerWidth,
    setDrawerWidth: lightspeedDrawerStore.setDrawerWidth,
    currentConversationId: snapshot.currentConversationId,
    setCurrentConversationId: lightspeedDrawerStore.setConversationId,
    draftMessage: snapshot.draftMessage,
    setDraftMessage: lightspeedDrawerStore.setDraftMessage,
    draftFileContents: snapshot.draftFileContents,
    setDraftFileContents: lightspeedDrawerStore.setDraftFileContents,
    consumePendingOverlayThreadHandoff:
      lightspeedDrawerStore.consumeThreadHandoff,
    shellViewTab: snapshot.shellViewTab,
    setShellViewTab: lightspeedDrawerStore.setShellViewTab,
  };
}
