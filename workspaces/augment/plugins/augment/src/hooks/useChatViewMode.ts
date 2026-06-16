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
  createElement,
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

export type ChatViewMode = 'user' | 'dev';

const STORAGE_KEY = 'augment:chat-view-mode';

function readPersistedMode(): ChatViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dev') return 'dev';
  } catch {
    // localStorage unavailable
  }
  return 'user';
}

interface ChatViewModeContextValue {
  mode: ChatViewMode;
  isDev: boolean;
  toggleMode: () => void;
}

const ChatViewModeContext = createContext<ChatViewModeContextValue>({
  mode: 'user',
  isDev: false,
  toggleMode: () => {},
});

export function ChatViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ChatViewMode>(readPersistedMode);

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'user' ? 'dev' : 'user';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  const value = useMemo<ChatViewModeContextValue>(
    () => ({ mode, isDev: mode === 'dev', toggleMode }),
    [mode, toggleMode],
  );

  return createElement(ChatViewModeContext.Provider, { value }, children);
}

export function useChatViewMode(): ChatViewModeContextValue {
  return useContext(ChatViewModeContext);
}
