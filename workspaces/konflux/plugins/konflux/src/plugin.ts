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
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const konfluxPlugin = createPlugin({
  id: 'konflux',
  routes: {
    root: rootRouteRef,
  },
});

/** @public */
export const KonfluxCIPage = konfluxPlugin.provide(
  createRoutableExtension({
    name: 'KonfluxCIPage',
    component: () =>
      import('./components/KonfluxCIPage/KonfluxCIPage').then(
        m => m.KonfluxCIPageComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);

/** @public */
export const KonfluxPage = konfluxPlugin.provide(
  createRoutableExtension({
    name: 'KonfluxPage',
    component: () =>
      import('./components/KonfluxPage/KonfluxPage').then(
        m => m.KonfluxPageComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);

/** @public */
export const KonfluxLatestReleases = konfluxPlugin.provide(
  createComponentExtension({
    name: 'KonfluxLatestReleases',
    component: {
      lazy: () =>
        import('./components/LatestReleasesComponent').then(
          m => m.LatestReleasesComponent,
        ),
    },
  }),
);

/** @public */
export const KonfluxStatus = konfluxPlugin.provide(
  createComponentExtension({
    name: 'KonfluxStatus',
    component: {
      lazy: () =>
        import('./components/KonfluxStatusComponent').then(
          m => m.KonfluxStatusComponent,
        ),
    },
  }),
);
