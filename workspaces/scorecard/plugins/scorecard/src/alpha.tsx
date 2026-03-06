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
  createApiFactory,
  createFrontendPlugin,
  createFrontendModule,
  discoveryApiRef,
  fetchApiRef,
  ApiBlueprint,
} from '@backstage/frontend-plugin-api';
import type { ExtensionDefinition } from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { rootRouteRef } from './routes';
import { ScorecardApiClient, scorecardApiRef } from './api';
import { scorecardTranslations } from './translations';

/** Scorecard API extension */
const scorecardApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: scorecardApiRef,
        deps: { fetchApi: fetchApiRef, discoveryApi: discoveryApiRef },
        factory: ({ fetchApi, discoveryApi }) =>
          new ScorecardApiClient({ fetchApi, discoveryApi }),
      }),
    ),
});

/**
 * Options for when to show the Scorecard tab on catalog entity pages.
 * Pass these from the app (e.g. app-next App.tsx) to control visibility.
 * @public
 */
export interface ScorecardEntityContentOptions {
  /**
   * Entity kinds that show the Scorecard tab (e.g. ['component', 'service', 'template']).
   * If omitted or empty, the tab is shown for all entity kinds.
   */
  entityKinds?: string[];
}

const defaultScorecardEntityContentParams = {
  path: '/scorecard',
  title: 'Scorecard',
  routeRef: rootRouteRef,
  loader: () =>
    import('./components/Scorecard').then(m => <m.EntityScorecardContent />),
};

/**
 * Creates the Scorecard entity tab extension with optional filter.
 * Use this when the app wants to control which entity kinds show the Scorecard tab.
 * @public
 */
export function createScorecardEntityContent(
  options?: ScorecardEntityContentOptions,
): ExtensionDefinition {
  const filter =
    options?.entityKinds?.length &&
    `kind:${options.entityKinds.map(k => k.toLowerCase()).join(',')}`;
  return EntityContentBlueprint.make({
    name: 'scorecard',
    params: {
      ...defaultScorecardEntityContentParams,
      ...(filter && { filter }),
    },
  });
}

/** Scorecard translation resources */
const scorecardTranslation = TranslationBlueprint.make({
  params: {
    resource: scorecardTranslations,
  },
});

/** Main Scorecard frontend plugin */
export default createFrontendPlugin({
  pluginId: 'scorecard',
  extensions: [scorecardApi],
  routes: { root: rootRouteRef },
});

/**
 * Creates a module that registers the Scorecard entity tab with the given options.
 * Pass entity kinds from the app (e.g. in app-next App.tsx) to control which entities show the tab.
 * @public
 */
export function createScorecardCatalogModule(
  options?: ScorecardEntityContentOptions,
) {
  return createFrontendModule({
    pluginId: 'catalog',
    extensions: [createScorecardEntityContent(options)],
  });
}

/** Module registering Scorecard translations in app */
export const scorecardTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [scorecardTranslation],
});

export * from './translations';
