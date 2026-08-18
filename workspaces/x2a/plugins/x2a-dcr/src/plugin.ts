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
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

/**
 * Legacy-frontend plugin providing the OAuth2 DCR consent page.
 * Temporary replacement for the NFS-only \@backstage/plugin-auth
 * until RHDH 1.10 adopts the new frontend system.
 *
 * @public
 */
export const x2aDcrPlugin = createPlugin({
  id: 'x2a-dcr',
  routes: {
    root: rootRouteRef,
  },
});

/** @public */
export const DcrConsentPage = x2aDcrPlugin.provide(
  createRoutableExtension({
    name: 'DcrConsentPage',
    component: () => import('./components/Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);
