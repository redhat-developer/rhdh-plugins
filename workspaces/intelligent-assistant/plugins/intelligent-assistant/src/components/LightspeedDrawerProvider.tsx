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

import { lazy, PropsWithChildren, Suspense } from 'react';

import { useLightspeedProviderState } from '../hooks/useLightspeedProviderState';
import { ChatLoadingFallback } from './ChatLoadingFallback';
import { LightspeedDrawerContext } from './LightspeedDrawerContext';
import { NotebookStreamProvider } from './notebooks/NotebookStreamProvider';

const LazyLightspeedOverlayChat = lazy(() =>
  import('./LightspeedOverlayChat').then(m => ({
    default: m.LightspeedOverlayChat,
  })),
);

/**
 * @public
 */
export const LightspeedDrawerProvider = ({ children }: PropsWithChildren) => {
  const { contextValue, shouldRenderOverlayModal, closeChatbot } =
    useLightspeedProviderState();

  return (
    <LightspeedDrawerContext.Provider value={contextValue}>
      <NotebookStreamProvider>
        {children}
        {shouldRenderOverlayModal && (
          <Suspense fallback={<ChatLoadingFallback variant="overlay" />}>
            <LazyLightspeedOverlayChat
              displayMode={contextValue.displayMode}
              onEscapePress={() => closeChatbot()}
            />
          </Suspense>
        )}
      </NotebookStreamProvider>
    </LightspeedDrawerContext.Provider>
  );
};
