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
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';

import {
  createNotebookStreamStore,
  NotebookSendParams,
  NotebookStreamSnapshot,
  NotebookStreamStore,
} from './notebookStreamStore';

const NotebookStreamContext = createContext<NotebookStreamStore | null>(null);

/**
 * Owns the notebook stream store above the display-mode remount boundary.
 * Must be mounted where it is a common ancestor of every `LightSpeedChat`
 * mount point (overlay/docked/fullscreen) — i.e. inside `LightspeedDrawerProvider`.
 */
export const NotebookStreamProvider = ({ children }: PropsWithChildren) => {
  const storeRef = useRef<NotebookStreamStore>();
  if (!storeRef.current) {
    storeRef.current = createNotebookStreamStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    // Abort every in-flight stream only when the whole assistant unmounts.
    return () => store?.clearAll();
  }, []);

  return (
    <NotebookStreamContext.Provider value={storeRef.current}>
      {children}
    </NotebookStreamContext.Provider>
  );
};

export function useNotebookStreamStore(): NotebookStreamStore {
  const store = useContext(NotebookStreamContext);
  if (!store) {
    throw new Error(
      'useNotebookStreamStore must be used within a NotebookStreamProvider',
    );
  }
  return store;
}

export interface UseNotebookStreamResult extends NotebookStreamSnapshot {
  send: (params: NotebookSendParams) => void;
  stop: () => void;
  clear: () => void;
}

/**
 * Subscribe a component to a notebook session's stream. The returned snapshot
 * survives remounts because the store lives above the unmount boundary.
 */
export function useNotebookStream(sessionId: string): UseNotebookStreamResult {
  const store = useNotebookStreamStore();

  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(sessionId, listener),
    [store, sessionId],
  );
  const getSnapshot = useCallback(
    () => store.getSnapshot(sessionId),
    [store, sessionId],
  );

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const send = useCallback(
    (params: NotebookSendParams) => store.send(sessionId, params),
    [store, sessionId],
  );
  const stop = useCallback(() => store.stop(sessionId), [store, sessionId]);
  const clear = useCallback(() => store.clear(sessionId), [store, sessionId]);

  return { ...snapshot, send, stop, clear };
}
