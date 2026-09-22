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

import { lazy, Suspense } from 'react';

const LazyQuickstartDrawerContent = lazy(() =>
  import('./QuickstartDrawerContent').then(m => ({
    default: m.QuickstartDrawerContent,
  })),
);

const LazyQuickstartInit = lazy(() =>
  import('./QuickstartInit').then(m => ({
    default: m.QuickstartInit,
  })),
);

/**
 * Thin sync shells that defer Quickstart UI to async chunks.
 * Keeps drawer content and snackbar init off the NFS sync graph.
 *
 * The help menu item uses a blueprint `loader` in `index.tsx` instead.
 */
export const QuickstartDrawerContentElement = (
  <Suspense fallback={null}>
    <LazyQuickstartDrawerContent />
  </Suspense>
);

export const QuickstartInitElement = (
  <Suspense fallback={null}>
    <LazyQuickstartInit />
  </Suspense>
);
