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
  createApiFactory,
  fetchApiRef,
  discoveryApiRef,
  createComponentExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { scorecardApiRef, ScorecardApiClient } from './api';
import { scorecardTranslationRef } from './translations';

/**
 * Plugin for the Scorecard Frontend.
 * @public
 */
export const scorecardPlugin = createPlugin({
  id: 'scorecard',
  routes: {
    root: rootRouteRef,
  },
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'es', 'fr', 'it', 'ja'],
    resources: [scorecardTranslationRef],
  },
  apis: [
    createApiFactory({
      api: scorecardApiRef,
      deps: {
        fetchApi: fetchApiRef,
        discoveryApi: discoveryApiRef,
      },
      factory: ({ fetchApi, discoveryApi }) =>
        new ScorecardApiClient({ fetchApi, discoveryApi }),
    }),
  ],
} as any);

/**
 * Frontend page for the Scorecard.
 * @public
 */
export const EntityScorecardContent = scorecardPlugin.provide(
  createRoutableExtension({
    name: 'EntityScorecardContent',
    component: () =>
      import('./components/Scorecard').then(m => m.EntityScorecardContent),
    mountPoint: rootRouteRef,
  }),
);

/**
 * Scorecard homepage card.
 * @public
 */
export const ScorecardHomepageCard = scorecardPlugin.provide(
  createComponentExtension({
    name: 'ScorecardHomepageCard',
    component: {
      lazy: () =>
        import('./components/ScorecardHomepageSection').then(
          m => m.ScorecardHomepageCard,
        ),
    },
  }),
);
