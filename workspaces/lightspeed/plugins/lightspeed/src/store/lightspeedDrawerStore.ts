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

import { getOrCreateGlobalSingleton } from '@backstage/version-bridge';

import { ChatbotDisplayMode } from '@patternfly/chatbot';

import type { LightspeedEmbeddedNotebooksTarget } from '../components/LightspeedDrawerContext';
import type { FileContent } from '../types';

/** @internal */
export const DEFAULT_DRAWER_WIDTH = 400;

/** @internal */
export interface LightspeedDrawerState {
  isOpen: boolean;
  displayMode: ChatbotDisplayMode;
  drawerWidth: number;
  currentConversationId: string | undefined;
  draftMessage: string;
  draftFileContents: FileContent[];
  shellViewTab: number;
  pendingOverlayThreadHandoff: boolean;
}

/**
 * Orchestrated handlers registered by the router-bridge shell.
 * These contain navigation logic that requires React Router hooks.
 * @internal
 */
export interface LightspeedDrawerHandlers {
  setDisplayMode: (
    mode: ChatbotDisplayMode,
    conversationIdParam?: string,
    embeddedNotebooks?: LightspeedEmbeddedNotebooksTarget,
  ) => void;
  toggleChatbot: () => void;
  setCurrentConversationId: (id: string | undefined) => void;
}

function getInitialState(): LightspeedDrawerState {
  return {
    isOpen: false,
    displayMode: ChatbotDisplayMode.default,
    drawerWidth: DEFAULT_DRAWER_WIDTH,
    currentConversationId: undefined,
    draftMessage: '',
    draftFileContents: [],
    shellViewTab: 0,
    pendingOverlayThreadHandoff: false,
  };
}

function createLightspeedDrawerStore() {
  let state: LightspeedDrawerState = getInitialState();
  const listeners = new Set<() => void>();
  let handlers: LightspeedDrawerHandlers | null = null;

  function emit() {
    listeners.forEach(l => l());
  }

  function update(fn: (prev: LightspeedDrawerState) => LightspeedDrawerState) {
    state = fn(state);
    emit();
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot() {
      return state;
    },

    // --- Orchestration handler registration (called by the shell) ---

    registerHandlers(h: LightspeedDrawerHandlers) {
      handlers = h;
    },

    unregisterHandlers() {
      handlers = null;
    },

    getHandlers() {
      return handlers;
    },

    // --- Simple state setters (always available) ---

    open() {
      update(s => ({ ...s, isOpen: true }));
    },

    close() {
      update(s => ({ ...s, isOpen: false }));
    },

    toggle() {
      if (handlers) {
        handlers.toggleChatbot();
      } else {
        update(s => ({ ...s, isOpen: !s.isOpen }));
      }
    },

    /** Raw setter — updates state without routing side effects. Used by the shell internally. */
    setDisplayModeRaw(mode: ChatbotDisplayMode) {
      update(s => ({ ...s, displayMode: mode }));
    },

    setDisplayMode(
      mode: ChatbotDisplayMode,
      conversationIdParam?: string,
      embeddedNotebooks?: LightspeedEmbeddedNotebooksTarget,
    ) {
      if (handlers) {
        handlers.setDisplayMode(mode, conversationIdParam, embeddedNotebooks);
      } else {
        update(s => ({ ...s, displayMode: mode }));
      }
    },

    setDrawerWidth(width: number) {
      update(s => ({ ...s, drawerWidth: width }));
    },

    /** Raw setter — updates state without routing side effects. Used by the shell internally. */
    setConversationIdRaw(id: string | undefined) {
      update(s => ({ ...s, currentConversationId: id }));
    },

    setConversationId(id: string | undefined) {
      if (handlers) {
        handlers.setCurrentConversationId(id);
      } else {
        update(s => ({ ...s, currentConversationId: id }));
      }
    },

    setDraftMessage(msg: string) {
      update(s => ({ ...s, draftMessage: msg }));
    },

    setDraftFileContents(files: FileContent[]) {
      update(s => ({ ...s, draftFileContents: files }));
    },

    setShellViewTab(tab: number) {
      const next = tab === 1 ? 1 : 0;
      update(s => ({ ...s, shellViewTab: next }));
    },

    setPendingOverlayThreadHandoff(pending: boolean) {
      update(s => ({ ...s, pendingOverlayThreadHandoff: pending }));
    },

    consumeThreadHandoff(): boolean {
      if (!state.pendingOverlayThreadHandoff) {
        return false;
      }
      update(s => ({ ...s, pendingOverlayThreadHandoff: false }));
      return true;
    },

    /** @internal — test helper */
    reset() {
      state = getInitialState();
      handlers = null;
      emit();
    },
  };
}

/**
 * Global Lightspeed drawer store backed by `@backstage/version-bridge` singleton.
 * Enables `useLightspeedDrawer()` to work from any position in the React tree
 * without requiring a wrapping Provider.
 *
 * @internal
 */
export const lightspeedDrawerStore = getOrCreateGlobalSingleton(
  'rhdh-lightspeed-drawer',
  createLightspeedDrawerStore,
);

export type LightspeedDrawerStore = ReturnType<
  typeof createLightspeedDrawerStore
>;
