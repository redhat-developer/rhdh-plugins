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

import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import {
  EntityContentBlueprint,
  EntityCardBlueprint,
} from '@backstage/plugin-catalog-react/alpha';

import { rootRouteRef } from './routes';

const konfluxCiContent = EntityContentBlueprint.make({
  name: 'ci',
  params: {
    path: '/konflux-ci',
    title: 'CI/CD',
    routeRef: rootRouteRef,
    filter: entity =>
      entity?.metadata?.annotations?.['konflux-ci.dev/ci'] === 'true',
    loader: () =>
      import('./components/KonfluxCIPage/KonfluxCIPage').then(m => (
        <m.KonfluxCIPageComponent />
      )),
  },
});

const konfluxContent = EntityContentBlueprint.make({
  name: 'overview',
  params: {
    path: '/konflux',
    title: 'Konflux',
    routeRef: rootRouteRef,
    filter: entity =>
      entity?.metadata?.annotations?.['konflux-ci.dev/konflux'] === 'true',
    loader: () =>
      import('./components/KonfluxPage/KonfluxPage').then(m => (
        <m.KonfluxPageComponent />
      )),
  },
});

const latestReleasesCard = EntityCardBlueprint.make({
  name: 'latest-releases',
  params: {
    filter: entity =>
      entity?.metadata?.annotations?.['konflux-ci.dev/overview'] === 'true',
    loader: () =>
      import('./components/LatestReleasesComponent').then(m => (
        <m.LatestReleasesComponent />
      )),
  },
});

const statusCard = EntityCardBlueprint.make({
  name: 'status',
  params: {
    filter: entity =>
      entity?.metadata?.annotations?.['konflux-ci.dev/overview'] === 'true',
    loader: () =>
      import('./components/KonfluxStatusComponent').then(m => (
        <m.KonfluxStatusComponent />
      )),
  },
});

/** @public */
export default createFrontendPlugin({
  pluginId: 'konflux',
  extensions: [
    konfluxCiContent,
    konfluxContent,
    latestReleasesCard,
    statusCard,
  ],
  routes: {
    root: rootRouteRef,
  },
});
