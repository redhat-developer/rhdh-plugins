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
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
  type RefObject,
} from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import {
  useBranding,
  useChatSessions,
  useStatus,
  useBackendStatus,
  useAdminView,
  type AdminPanel,
} from '../../hooks';
import type { ChatContainerRef } from '../ChatContainer';
import type { SecurityMode, Message } from '../../types';

export type UserPersona = 'developer' | 'ops' | 'super-admin';

export interface AppState {
  // Persona & access
  persona: UserPersona;
  isAdmin: boolean;

  // Backend
  securityMode: SecurityMode | null;
  securityLoading: boolean;
  backendReady: boolean | null;
  configurationErrors: string[];
  providerId: string | undefined;
  providerOffline: boolean;

  // Navigation
  viewMode: 'chat' | 'admin';
  adminPanel: AdminPanel;
  setAdminPanel: (panel: AdminPanel) => void;
  switchToAdmin: (targetPanel?: AdminPanel) => void;
  switchToChat: () => void;
  showAdminBanner: boolean;
  dismissAdminBanner: () => void;

  // Chat session
  activeSessionId: string | undefined;
  messages: Message[];
  loadingConversation: boolean;
  messagesUnavailable: boolean;
  sessionRefreshTrigger: number;
  switchDialogOpen: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  handleNewChat: () => void;
  handleMessagesChange: (msgs: Message[]) => void;
  handleSessionCreated: (id: string) => void;
  guardedSelectSession: (id: string) => void;
  handleSwitchConfirm: () => void;
  handleSwitchCancel: () => void;
  chatContainerRef: RefObject<ChatContainerRef | null>;

  // Namespace (provider-specific workspace context)
  kagentiNamespace: string;
  handleNamespaceChange: (ns: string) => void;

  // Status
  liveStatus: ReturnType<typeof useStatus>['status'];
  refreshStatus: () => void;

  // Branding
  branding: ReturnType<typeof useBranding>['branding'];
}

const AppStateContext = createContext<AppState | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}

interface Props {
  children: ReactNode;
}

export function AppStateProvider({ children }: Props) {
  const api = useApi(augmentApiRef);
  const { branding } = useBranding();
  const chatContainerRef = useRef<ChatContainerRef | null>(null);

  const [kagentiNamespace, setKagentiNamespace] = useState<string>(() => {
    try {
      return sessionStorage.getItem('augment:kagenti-ns') || '';
    } catch {
      return '';
    }
  });

  const handleNamespaceChange = useCallback((ns: string) => {
    setKagentiNamespace(ns);
    try {
      sessionStorage.setItem('augment:kagenti-ns', ns);
    } catch {
      /* noop */
    }
  }, []);

  const chatSessions = useChatSessions({ api, chatContainerRef });

  const {
    securityMode,
    securityLoading,
    backendReady,
    configurationErrors,
    isAdmin,
  } = useBackendStatus();

  const adminView = useAdminView({ isAdmin });

  const {
    status: liveStatus,
    loading: statusPollLoading,
    error: statusPollError,
    refresh: refreshStatus,
  } = useStatus();

  const providerOffline =
    !securityLoading &&
    !statusPollLoading &&
    backendReady !== false &&
    (liveStatus?.provider.connected === false ||
      (statusPollError !== null && !liveStatus));

  const persona: UserPersona = useMemo(() => {
    if (!isAdmin) return 'developer';
    return 'super-admin';
  }, [isAdmin]);

  const switchToAdmin = useCallback((targetPanel?: AdminPanel) => {
    adminView.switchToAdmin(liveStatus?.providerId, targetPanel);
  }, [adminView, liveStatus?.providerId]);

  const value: AppState = useMemo(
    () => ({
      persona,
      isAdmin,
      securityMode,
      securityLoading,
      backendReady,
      configurationErrors,
      providerId: liveStatus?.providerId,
      providerOffline,
      viewMode: adminView.viewMode,
      adminPanel: adminView.adminPanel,
      setAdminPanel: adminView.setAdminPanel,
      switchToAdmin,
      switchToChat: adminView.switchToChat,
      showAdminBanner: adminView.showAdminBanner,
      dismissAdminBanner: adminView.dismissAdminBanner,
      activeSessionId: chatSessions.activeSessionId,
      messages: chatSessions.messages,
      loadingConversation: chatSessions.loadingConversation,
      messagesUnavailable: chatSessions.messagesUnavailable,
      sessionRefreshTrigger: chatSessions.sessionRefreshTrigger,
      switchDialogOpen: chatSessions.switchDialogOpen,
      error: chatSessions.error,
      setError: chatSessions.setError,
      handleNewChat: chatSessions.handleNewChat,
      handleMessagesChange: chatSessions.handleMessagesChange,
      handleSessionCreated: chatSessions.handleSessionCreated,
      guardedSelectSession: chatSessions.guardedSelectSession,
      handleSwitchConfirm: chatSessions.handleSwitchConfirm,
      handleSwitchCancel: chatSessions.handleSwitchCancel,
      chatContainerRef,
      kagentiNamespace,
      handleNamespaceChange,
      liveStatus,
      refreshStatus,
      branding,
    }),
    [
      persona,
      isAdmin,
      securityMode,
      securityLoading,
      backendReady,
      configurationErrors,
      liveStatus,
      providerOffline,
      adminView,
      switchToAdmin,
      chatSessions,
      kagentiNamespace,
      handleNamespaceChange,
      refreshStatus,
      branding,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}
