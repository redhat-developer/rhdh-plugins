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
  configApiRef,
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { AdoptionInsightsApiClient, adoptionInsightsApiRef } from './api';

/**
 * Plugin for Adoption Insights frontend
 * @public
 */
export const adoptionInsightsPlugin = createPlugin({
  id: 'adoption-insights',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: adoptionInsightsApiRef,
      deps: {
        configApi: configApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ configApi, fetchApi }) =>
        new AdoptionInsightsApiClient({ configApi, fetchApi }),
    }),
  ],
});

/**
 * Frontend page for Adoption Insights
 * @public
 */
export const AdoptionInsightsPage = adoptionInsightsPlugin.provide(
  createRoutableExtension({
    name: 'AdoptionInsightsPage',
    component: () =>
      import('./components/AdoptionInsightsPage').then(
        m => m.AdoptionInsightsPage,
      ),
    mountPoint: rootRouteRef,
  }),
);
