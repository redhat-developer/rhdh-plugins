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

import { LightspeedChatModelsLoading } from './LightspeedChatModelsState';

const LazyLightspeedChatContainer = lazy(() =>
  import('./LightspeedChatContainer').then(m => ({
    default: m.LightspeedChatContainer,
  })),
);

/**
 * Lazy wrapper around LightspeedChatContainer that defers loading of
 * PatternFly CSS until the component is actually rendered, preventing
 * global :root variable overrides from leaking into the host app theme.
 *
 * @public
 */
export const LightspeedChatContainer = () => (
  <Suspense fallback={<LightspeedChatModelsLoading />}>
    <LazyLightspeedChatContainer />
  </Suspense>
);
