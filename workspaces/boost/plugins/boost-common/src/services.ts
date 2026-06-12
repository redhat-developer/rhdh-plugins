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

import { createServiceRef } from '@backstage/backend-plugin-api';
import type { AgenticProvider } from './types';

/**
 * Service ref for cross-plugin consumption of the active AI provider.
 *
 * Other Backstage plugins can declare a dependency on this ref to receive
 * the currently active {@link AgenticProvider} instance. The default factory
 * is registered by `boost-backend` and resolves to the ProviderManager's
 * active provider.
 *
 * @public
 */
export const boostAiProviderServiceRef = createServiceRef<AgenticProvider>({
  id: 'boost.ai-provider',
  scope: 'plugin',
});
