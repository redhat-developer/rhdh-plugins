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

import { lazy, Suspense, type ReactNode } from 'react';

import { loadCriticalFabBundle } from '../components/loaders';

const LazyCriticalFabRoot = lazy(async () => {
  const { LightspeedDrawerProvider, LightspeedFABContent } =
    await loadCriticalFabBundle();

  return {
    default: ({ children }: { children: ReactNode }) => (
      <LightspeedDrawerProvider>
        <LightspeedFABContent />
        {children}
      </LightspeedDrawerProvider>
    ),
  };
});

type Props = {
  children: ReactNode;
};

/**
 * App root wrapper that defers FAB + drawer provider off the sync chunk.
 * DrawerProvider and FABContent share one async chunk via loadCriticalFabBundle().
 */
export const LazyLightspeedFabRootWrapper = ({ children }: Props) => (
  <Suspense fallback={children}>
    <LazyCriticalFabRoot>{children}</LazyCriticalFabRoot>
  </Suspense>
);
