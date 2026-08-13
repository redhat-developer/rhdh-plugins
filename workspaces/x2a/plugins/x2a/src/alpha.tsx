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

/**
 * @packageDocumentation
 *
 * Alpha exports for the X2Ansible plugin (Backstage new frontend system).
 * Provides the plugin instance, page, and translation module.
 */

import {
  createFrontendModule,
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import {
  FormFieldBlueprint,
  createFormField,
} from '@backstage/plugin-scaffolder-react/alpha';

import { X2AIcon } from './components/x2aIcon';
import { rootRouteRef } from './routes';
import { x2aPluginTranslations } from './translations';

const x2aPage = PageBlueprint.make({
  params: {
    path: '/x2a',
    routeRef: rootRouteRef,
    title: 'X2Ansible',
    icon: <X2AIcon />,
    noHeader: true,
    loader: () => import('./components/Router').then(m => <m.Router />),
  },
});

const x2aTranslation = TranslationBlueprint.make({
  params: {
    resource: x2aPluginTranslations,
  },
});

const repoAuthField = FormFieldBlueprint.make({
  name: 'RepoAuthentication',
  params: {
    field: () =>
      import('./scaffolder').then(m =>
        createFormField({
          name: 'RepoAuthentication',
          component: m.RepoAuthentication,
          validation: m.repoAuthenticationValidation,
        }),
      ),
  },
});

const rulesAcceptanceField = FormFieldBlueprint.make({
  name: 'RulesAcceptance',
  params: {
    field: () =>
      import('./scaffolder').then(m =>
        createFormField({
          name: 'RulesAcceptance',
          component: m.RulesAcceptance,
          validation: m.rulesAcceptanceValidation,
        }),
      ),
  },
});

/**
 * The X2Ansible plugin for the new frontend system.
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'x2a',
  extensions: [x2aPage, repoAuthField, rulesAcceptanceField],
  routes: {
    root: rootRouteRef,
  },
  info: {
    packageJson: () => import('../package.json'),
  },
});

/**
 * A frontend module that registers X2Ansible translations.
 * Must be installed separately in the app's features since TranslationBlueprint
 * is restricted to the app plugin (pluginId: 'app').
 * @alpha
 */
export const x2aTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [x2aTranslation],
});

export { x2aPluginTranslationRef, x2aPluginTranslations } from './translations';
