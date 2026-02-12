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
  createFrontendPlugin,
  createFrontendModule,
  PageBlueprint,
  NavItemBlueprint,
  ApiBlueprint,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import {
  createApiFactory,
  configApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import MUIAdoptionInsightsIcon from '@mui/icons-material/QueryStatsOutlined';
import { rootRouteRef } from './routes';
import { AdoptionInsightsApiClient, adoptionInsightsApiRef } from './api';
import { adoptionInsightsTranslations } from './translations';

const adoptionInsightsPage = PageBlueprint.make({
  params: {
    path: '/adoption-insights',
    routeRef: rootRouteRef,
    loader: () =>
      import('./components/AdoptionInsightsPage').then(m => (
        <m.AdoptionInsightsPage />
      )),
  },
});

const adoptionInsightsNavItem = NavItemBlueprint.make({
  params: {
    routeRef: rootRouteRef,
    title: 'Adoption Insights',
    icon: MUIAdoptionInsightsIcon,
  },
});

const adoptionInsightsApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: adoptionInsightsApiRef,
        deps: { configApi: configApiRef, fetchApi: fetchApiRef },
        factory: ({ configApi, fetchApi }) =>
          new AdoptionInsightsApiClient({ configApi, fetchApi }),
      }),
    ),
});

const adoptionInsightsTranslation = TranslationBlueprint.make({
  params: {
    resource: adoptionInsightsTranslations,
  },
});

/**
 * The Adoption Insights plugin for the new frontend system.
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'adoption-insights',
  extensions: [
    adoptionInsightsPage,
    adoptionInsightsNavItem,
    adoptionInsightsApi,
  ],
  routes: { root: rootRouteRef },
});

/**
 * A frontend module that registers Adoption Insights translations.
 * Must be installed separately in the app's features since TranslationBlueprint
 * is restricted to the app plugin (pluginId: 'app').
 * @alpha
 */
export const adoptionInsightsTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [adoptionInsightsTranslation],
});

export * from './translations';
